import type { DailyNote, Post, ReadItem } from "@/data/types";

export interface SearchResult {
  type: "post" | "read" | "daily";
  title: string;
  summary: string;
  preview: string;
  url: string;
  postType?: Post["type"];
  source?: string;
  navigateInternal?: boolean;
  score: number;
  date: string;
}

interface SearchContentInput {
  posts: Post[];
  readItems: ReadItem[];
  dailyNotes: DailyNote[];
  limit?: number;
}

interface MatchWeights {
  exact: number;
  startsWith: number;
  includes: number;
  tokenExact: number;
  tokenPrefix: number;
  tokenIncludes: number;
  fuzzyToken: number;
}

interface IndexedField {
  raw: string;
  text: string;
  words: string[];
}

interface IndexedPost {
  post: Post;
  title: IndexedField;
  summary: IndexedField;
  slug: IndexedField;
  category: IndexedField;
  content: IndexedField;
  tags: IndexedField[];
  dateTimestamp: number;
}

interface IndexedReadItem {
  item: ReadItem;
  title: IndexedField;
  snippet: IndexedField;
  source: IndexedField;
  slug: IndexedField;
  content: IndexedField;
  tags: IndexedField[];
  dateTimestamp: number;
}

interface IndexedDailyNote {
  note: DailyNote;
  title: IndexedField;
  summary: IndexedField;
  slug: IndexedField;
  content: IndexedField;
  tags: IndexedField[];
  dateTimestamp: number;
}

interface SearchFilters {
  resultTypes: Set<SearchResult["type"]>;
  postTypes: Set<Post["type"]>;
  categories: string[];
  tags: string[];
  sources: string[];
}

interface ParsedQuery {
  normalizedQuery: string;
  queryTokens: string[];
  filters: SearchFilters;
  hasTextQuery: boolean;
  hasFilters: boolean;
}

type SearchableEntity = {
  content?: string;
  Component?: unknown;
};

const STOP_WORDS = new Set([
  "dan", "yang", "untuk", "dengan", "dari", "pada", "atau", "itu", "ini", "the", "and", "for", "with", "from", "that", "this", "of",
]);

const postIndexCache = new WeakMap<Post[], IndexedPost[]>();
const readIndexCache = new WeakMap<ReadItem[], IndexedReadItem[]>();
const dailyIndexCache = new WeakMap<DailyNote[], IndexedDailyNote[]>();

let cachedPostsRef: Post[] | null = null;
let cachedReadItemsRef: ReadItem[] | null = null;
let cachedDailyNotesRef: DailyNote[] | null = null;
const queryResultsCache = new Map<string, SearchResult[]>();

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s/_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

function splitWords(value: string) {
  return tokenize(value).flatMap((token) => token.split(/[_/-]+/g)).filter(Boolean);
}

function parseDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function recencyBoost(timestamp: number, nowTimestamp: number) {
  if (!timestamp) return 0;
  const ageDays = Math.max(0, (nowTimestamp - timestamp) / 86_400_000);
  return Math.max(0, 7 - ageDays / 30);
}

function indexField(value: unknown): IndexedField {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  const text = normalizeText(raw);
  return {
    raw,
    text,
    words: splitWords(text),
  };
}

function extractSearchBody(entity: SearchableEntity) {
  if (typeof entity.content === "string" && entity.content.trim().length > 0) {
    return entity.content;
  }

  if (typeof entity.Component !== "function") {
    return "";
  }

  const source = entity.Component.toString();
  const quotedTextRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
  const chunks: string[] = [];
  let totalLength = 0;
  let match: RegExpExecArray | null;

  while ((match = quotedTextRegex.exec(source)) !== null) {
    const candidate = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (!candidate) continue;
    if (/^[a-z0-9_-]{1,18}$/i.test(candidate)) continue;

    chunks.push(candidate);
    totalLength += candidate.length;
    if (totalLength > 30_000) break;
  }

  return chunks.join(" ");
}

function parseSearchQuery(query: string): ParsedQuery {
  const filters: SearchFilters = {
    resultTypes: new Set(),
    postTypes: new Set(),
    categories: [],
    tags: [],
    sources: [],
  };

  const freeTextParts: string[] = [];
  const parts = query.trim().split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const filterMatch = part.match(/^([a-z]+):(.*)$/i);
    if (!filterMatch) {
      freeTextParts.push(part);
      continue;
    }

    const key = filterMatch[1].toLowerCase();
    const value = normalizeText(filterMatch[2]);
    if (!value) {
      freeTextParts.push(part);
      continue;
    }

    if (key === "type" || key === "is") {
      if (value === "post" || value === "writing") filters.resultTypes.add("post");
      if (value === "read" || value === "bacaan") filters.resultTypes.add("read");
      if (value === "daily" || value === "journal") filters.resultTypes.add("daily");
      if (value === "note" || value === "essay" || value === "article") {
        filters.resultTypes.add("post");
        filters.postTypes.add(value as Post["type"]);
      }
      continue;
    }

    if (key === "category" || key === "cat") {
      filters.categories.push(value);
      continue;
    }

    if (key === "tag" || key === "tags") {
      filters.tags.push(value);
      continue;
    }

    if (key === "source" || key === "src") {
      filters.sources.push(value);
      continue;
    }

    freeTextParts.push(part);
  }

  const normalizedQuery = normalizeText(freeTextParts.join(" "));
  const queryTokens = tokenize(normalizedQuery);

  return {
    normalizedQuery,
    queryTokens,
    filters,
    hasTextQuery: normalizedQuery.length > 0,
    hasFilters:
      filters.resultTypes.size > 0 ||
      filters.postTypes.size > 0 ||
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.sources.length > 0,
  };
}

function isOneEditOrTranspositionAway(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  if (a.length === b.length) {
    const mismatchPositions: number[] = [];
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) mismatchPositions.push(i);
      if (mismatchPositions.length > 2) return false;
    }

    if (mismatchPositions.length === 1) return true;
    if (mismatchPositions.length === 2) {
      const [i, j] = mismatchPositions;
      return a[i] === b[j] && a[j] === b[i];
    }
    return false;
  }

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let shortIndex = 0;
  let longIndex = 0;
  let skipped = false;

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }

    if (skipped) return false;
    skipped = true;
    longIndex += 1;
  }

  return true;
}

function hasFuzzyTokenMatch(token: string, words: string[]) {
  if (token.length < 4) return false;
  return words.some((word) => {
    if (word.length < 4) return false;
    if (Math.abs(token.length - word.length) > 1) return false;
    if (token[0] !== word[0]) return false;
    return isOneEditOrTranspositionAway(token, word);
  });
}

function scoreIndexedField(field: IndexedField, normalizedQuery: string, queryTokens: string[], weights: MatchWeights) {
  if (!field.text) return 0;

  let score = 0;
  if (normalizedQuery) {
    if (field.text === normalizedQuery) {
      score += weights.exact;
    } else if (field.text.startsWith(normalizedQuery)) {
      score += weights.startsWith;
    } else if (field.text.includes(normalizedQuery)) {
      score += weights.includes;
    }
  }

  for (const token of queryTokens) {
    if (token.length < 2) continue;

    if (field.words.includes(token)) {
      score += weights.tokenExact;
      continue;
    }

    if (token.length >= 3 && field.words.some((word) => word.startsWith(token))) {
      score += weights.tokenPrefix;
      continue;
    }

    if (token.length >= 4 && field.text.includes(token)) {
      score += weights.tokenIncludes;
      continue;
    }

    if (hasFuzzyTokenMatch(token, field.words)) {
      score += weights.fuzzyToken;
    }
  }

  return score;
}

function scoreIndexedTags(tags: IndexedField[], normalizedQuery: string, queryTokens: string[]) {
  let score = 0;
  for (const tag of tags) {
    score += scoreIndexedField(tag, normalizedQuery, queryTokens, {
      exact: 70,
      startsWith: 52,
      includes: 30,
      tokenExact: 16,
      tokenPrefix: 10,
      tokenIncludes: 7,
      fuzzyToken: 5,
    });
  }
  return score;
}

function getPostIndex(posts: Post[]) {
  const cached = postIndexCache.get(posts);
  if (cached) return cached;

  const index = posts.map((post) => ({
    post,
    title: indexField(post.title),
    summary: indexField(post.summary),
    slug: indexField(post.slug),
    category: indexField(post.category),
    content: indexField(extractSearchBody(post as Post & SearchableEntity)),
    tags: post.tags.map((tag) => indexField(tag)),
    dateTimestamp: parseDate(post.date),
  }));

  postIndexCache.set(posts, index);
  return index;
}

function getReadIndex(readItems: ReadItem[]) {
  const cached = readIndexCache.get(readItems);
  if (cached) return cached;

  const index = readItems.map((item) => ({
    item,
    title: indexField(item.title),
    snippet: indexField(item.snippet),
    source: indexField(item.source),
    slug: indexField(item.slug),
    content: indexField(extractSearchBody(item as ReadItem & SearchableEntity)),
    tags: item.tags.map((tag) => indexField(tag)),
    dateTimestamp: parseDate(item.date),
  }));

  readIndexCache.set(readItems, index);
  return index;
}

function getDailyIndex(dailyNotes: DailyNote[]) {
  const cached = dailyIndexCache.get(dailyNotes);
  if (cached) return cached;

  const index = dailyNotes.map((note) => ({
    note,
    title: indexField(note.title),
    summary: indexField(note.summary),
    slug: indexField(note.slug),
    content: indexField(extractSearchBody(note as DailyNote & SearchableEntity)),
    tags: note.tags.map((tag) => indexField(tag)),
    dateTimestamp: parseDate(note.date),
  }));

  dailyIndexCache.set(dailyNotes, index);
  return index;
}

function tagsContainAllTerms(tags: IndexedField[], terms: string[]) {
  return terms.every((term) => tags.some((tag) => tag.text.includes(term)));
}

function containsAllTerms(field: IndexedField, terms: string[]) {
  return terms.every((term) => field.text.includes(term));
}

function pickPreviewText(primary: IndexedField, fallback: IndexedField) {
  const candidate = primary.raw || fallback.raw || "";
  const normalized = candidate.replace(/\s+/g, " ").trim();
  if (normalized.length <= 1_600) return normalized;
  return `${normalized.slice(0, 1_600).trimEnd()}...`;
}

function resetQueryCacheIfNeeded(input: SearchContentInput) {
  if (cachedPostsRef === input.posts && cachedReadItemsRef === input.readItems && cachedDailyNotesRef === input.dailyNotes) {
    return;
  }

  cachedPostsRef = input.posts;
  cachedReadItemsRef = input.readItems;
  cachedDailyNotesRef = input.dailyNotes;
  queryResultsCache.clear();
}

export function searchContent(query: string, input: SearchContentInput): SearchResult[] {
  const parsed = parseSearchQuery(query);
  if (!parsed.hasTextQuery && !parsed.hasFilters) return [];

  const limit = input.limit ?? 12;
  resetQueryCacheIfNeeded(input);

  const cacheKey = `${query.trim().toLowerCase()}::${limit}`;
  const cached = queryResultsCache.get(cacheKey);
  if (cached) return cached;

  const nowTimestamp = Date.now();

  const postResults = getPostIndex(input.posts)
    .map(({ post, title, summary, slug, category, content, tags, dateTimestamp }): SearchResult | null => {
      if (parsed.filters.resultTypes.size > 0 && !parsed.filters.resultTypes.has("post")) return null;
      if (parsed.filters.postTypes.size > 0 && !parsed.filters.postTypes.has(post.type)) return null;
      if (parsed.filters.sources.length > 0) return null;
      if (parsed.filters.categories.length > 0 && !containsAllTerms(category, parsed.filters.categories)) return null;
      if (parsed.filters.tags.length > 0 && !tagsContainAllTerms(tags, parsed.filters.tags)) return null;

      const titleScore = scoreIndexedField(title, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 145,
        startsWith: 108,
        includes: 78,
        tokenExact: 25,
        tokenPrefix: 16,
        tokenIncludes: 10,
        fuzzyToken: 8,
      });
      const summaryScore = scoreIndexedField(summary, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 58,
        startsWith: 39,
        includes: 24,
        tokenExact: 9,
        tokenPrefix: 6,
        tokenIncludes: 4,
        fuzzyToken: 3,
      });
      const slugScore = scoreIndexedField(slug, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 88,
        startsWith: 66,
        includes: 40,
        tokenExact: 12,
        tokenPrefix: 8,
        tokenIncludes: 5,
        fuzzyToken: 3,
      });
      const categoryScore = scoreIndexedField(category, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 28,
        startsWith: 16,
        includes: 9,
        tokenExact: 4,
        tokenPrefix: 3,
        tokenIncludes: 2,
        fuzzyToken: 1,
      });
      const tagScore = scoreIndexedTags(tags, parsed.normalizedQuery, parsed.queryTokens);
      const contentScore = scoreIndexedField(content, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 24,
        startsWith: 16,
        includes: 12,
        tokenExact: 6,
        tokenPrefix: 4,
        tokenIncludes: 2,
        fuzzyToken: 2,
      });
      const lexicalScore = titleScore + summaryScore + slugScore + categoryScore + tagScore + contentScore;

      if (parsed.hasTextQuery && lexicalScore <= 0) return null;

      return {
        type: "post",
        title: post.title,
        summary: post.summary,
        preview: pickPreviewText(contentScore > summaryScore ? content : summary, summary),
        url: post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`,
        postType: post.type,
        navigateInternal: true,
        score: (parsed.hasTextQuery ? lexicalScore : 1) + recencyBoost(dateTimestamp, nowTimestamp) + 6,
        date: post.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  const dailyResults = getDailyIndex(input.dailyNotes)
    .map(({ note, title, summary, slug, content, tags, dateTimestamp }): SearchResult | null => {
      if (parsed.filters.resultTypes.size > 0 && !parsed.filters.resultTypes.has("daily")) return null;
      if (parsed.filters.postTypes.size > 0) return null;
      if (parsed.filters.categories.length > 0) return null;
      if (parsed.filters.sources.length > 0) return null;
      if (parsed.filters.tags.length > 0 && !tagsContainAllTerms(tags, parsed.filters.tags)) return null;

      const titleScore = scoreIndexedField(title, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 118,
        startsWith: 90,
        includes: 62,
        tokenExact: 18,
        tokenPrefix: 12,
        tokenIncludes: 8,
        fuzzyToken: 7,
      });
      const summaryScore = scoreIndexedField(summary, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 55,
        startsWith: 35,
        includes: 22,
        tokenExact: 8,
        tokenPrefix: 6,
        tokenIncludes: 4,
        fuzzyToken: 3,
      });
      const slugScore = scoreIndexedField(slug, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 34,
        startsWith: 25,
        includes: 14,
        tokenExact: 4,
        tokenPrefix: 3,
        tokenIncludes: 2,
        fuzzyToken: 1,
      });
      const tagScore = scoreIndexedTags(tags, parsed.normalizedQuery, parsed.queryTokens);
      const contentScore = scoreIndexedField(content, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 22,
        startsWith: 14,
        includes: 10,
        tokenExact: 5,
        tokenPrefix: 4,
        tokenIncludes: 2,
        fuzzyToken: 2,
      });
      const lexicalScore = titleScore + summaryScore + slugScore + tagScore + contentScore;

      if (parsed.hasTextQuery && lexicalScore <= 0) return null;

      return {
        type: "daily",
        title: note.title,
        summary: note.summary,
        preview: pickPreviewText(contentScore > summaryScore ? content : summary, summary),
        url: `/daily/${note.slug}`,
        navigateInternal: true,
        score: (parsed.hasTextQuery ? lexicalScore : 1) + recencyBoost(dateTimestamp, nowTimestamp) + 3,
        date: note.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  const readResults = getReadIndex(input.readItems)
    .map(({ item, title, snippet, source, slug, content, tags, dateTimestamp }): SearchResult | null => {
      if (parsed.filters.resultTypes.size > 0 && !parsed.filters.resultTypes.has("read")) return null;
      if (parsed.filters.postTypes.size > 0) return null;
      if (parsed.filters.categories.length > 0) return null;
      if (parsed.filters.sources.length > 0 && !containsAllTerms(source, parsed.filters.sources)) return null;
      if (parsed.filters.tags.length > 0 && !tagsContainAllTerms(tags, parsed.filters.tags)) return null;

      const titleScore = scoreIndexedField(title, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 112,
        startsWith: 84,
        includes: 56,
        tokenExact: 16,
        tokenPrefix: 11,
        tokenIncludes: 7,
        fuzzyToken: 6,
      });
      const snippetScore = scoreIndexedField(snippet, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 48,
        startsWith: 30,
        includes: 20,
        tokenExact: 7,
        tokenPrefix: 5,
        tokenIncludes: 3,
        fuzzyToken: 2,
      });
      const sourceScore = scoreIndexedField(source, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 20,
        startsWith: 14,
        includes: 8,
        tokenExact: 4,
        tokenPrefix: 3,
        tokenIncludes: 2,
        fuzzyToken: 1,
      });
      const slugScore = scoreIndexedField(slug, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 24,
        startsWith: 17,
        includes: 10,
        tokenExact: 3,
        tokenPrefix: 2,
        tokenIncludes: 1,
        fuzzyToken: 1,
      });
      const tagScore = scoreIndexedTags(tags, parsed.normalizedQuery, parsed.queryTokens);
      const contentScore = scoreIndexedField(content, parsed.normalizedQuery, parsed.queryTokens, {
        exact: 20,
        startsWith: 12,
        includes: 8,
        tokenExact: 4,
        tokenPrefix: 3,
        tokenIncludes: 2,
        fuzzyToken: 2,
      });
      const lexicalScore = titleScore + snippetScore + sourceScore + slugScore + tagScore + contentScore;

      if (parsed.hasTextQuery && lexicalScore <= 0) return null;

      return {
        type: "read",
        title: item.title,
        summary: item.snippet,
        preview: pickPreviewText(contentScore > snippetScore ? content : snippet, snippet),
        url: item.hasBody ? `/read/${item.slug}` : item.url,
        source: item.source,
        navigateInternal: !!item.hasBody,
        score: (parsed.hasTextQuery ? lexicalScore : 1) + recencyBoost(dateTimestamp, nowTimestamp) + 1,
        date: item.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  const results = [...postResults, ...dailyResults, ...readResults]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const dateDiff = parseDate(b.date) - parseDate(a.date);
      if (dateDiff !== 0) return dateDiff;

      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);

  queryResultsCache.set(cacheKey, results);
  return results;
}
