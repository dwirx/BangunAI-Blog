import type { DailyNote, Post, ReadItem } from "@/data/types";

export interface SearchResult {
  type: "post" | "read" | "daily";
  title: string;
  summary: string;
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
}

interface IndexedField {
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
  const text = normalizeText(value);
  return {
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

function scoreIndexedField(field: IndexedField, normalizedQuery: string, queryTokens: string[], weights: MatchWeights) {
  if (!field.text) return 0;

  let score = 0;
  if (field.text === normalizedQuery) {
    score += weights.exact;
  } else if (field.text.startsWith(normalizedQuery)) {
    score += weights.startsWith;
  } else if (field.text.includes(normalizedQuery)) {
    score += weights.includes;
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

export function searchContent(query: string, input: SearchContentInput): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(normalizedQuery);
  const nowTimestamp = Date.now();
  const limit = input.limit ?? 12;

  const postResults = getPostIndex(input.posts)
    .map(({ post, title, summary, slug, category, content, tags, dateTimestamp }): SearchResult | null => {
      const lexicalScore =
        scoreIndexedField(title, normalizedQuery, queryTokens, {
          exact: 145,
          startsWith: 108,
          includes: 78,
          tokenExact: 25,
          tokenPrefix: 16,
          tokenIncludes: 10,
        }) +
        scoreIndexedField(summary, normalizedQuery, queryTokens, {
          exact: 58,
          startsWith: 39,
          includes: 24,
          tokenExact: 9,
          tokenPrefix: 6,
          tokenIncludes: 4,
        }) +
        scoreIndexedField(slug, normalizedQuery, queryTokens, {
          exact: 88,
          startsWith: 66,
          includes: 40,
          tokenExact: 12,
          tokenPrefix: 8,
          tokenIncludes: 5,
        }) +
        scoreIndexedField(category, normalizedQuery, queryTokens, {
          exact: 28,
          startsWith: 16,
          includes: 9,
          tokenExact: 4,
          tokenPrefix: 3,
          tokenIncludes: 2,
        }) +
        scoreIndexedTags(tags, normalizedQuery, queryTokens) +
        scoreIndexedField(content, normalizedQuery, queryTokens, {
          exact: 24,
          startsWith: 16,
          includes: 12,
          tokenExact: 6,
          tokenPrefix: 4,
          tokenIncludes: 2,
        });

      if (lexicalScore <= 0) return null;

      return {
        type: "post",
        title: post.title,
        summary: post.summary,
        url: post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`,
        postType: post.type,
        navigateInternal: true,
        score: lexicalScore + recencyBoost(dateTimestamp, nowTimestamp) + 6,
        date: post.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  const dailyResults = getDailyIndex(input.dailyNotes)
    .map(({ note, title, summary, slug, content, tags, dateTimestamp }): SearchResult | null => {
      const lexicalScore =
        scoreIndexedField(title, normalizedQuery, queryTokens, {
          exact: 118,
          startsWith: 90,
          includes: 62,
          tokenExact: 18,
          tokenPrefix: 12,
          tokenIncludes: 8,
        }) +
        scoreIndexedField(summary, normalizedQuery, queryTokens, {
          exact: 55,
          startsWith: 35,
          includes: 22,
          tokenExact: 8,
          tokenPrefix: 6,
          tokenIncludes: 4,
        }) +
        scoreIndexedField(slug, normalizedQuery, queryTokens, {
          exact: 34,
          startsWith: 25,
          includes: 14,
          tokenExact: 4,
          tokenPrefix: 3,
          tokenIncludes: 2,
        }) +
        scoreIndexedTags(tags, normalizedQuery, queryTokens) +
        scoreIndexedField(content, normalizedQuery, queryTokens, {
          exact: 22,
          startsWith: 14,
          includes: 10,
          tokenExact: 5,
          tokenPrefix: 4,
          tokenIncludes: 2,
        });

      if (lexicalScore <= 0) return null;

      return {
        type: "daily",
        title: note.title,
        summary: note.summary,
        url: `/daily/${note.slug}`,
        navigateInternal: true,
        score: lexicalScore + recencyBoost(dateTimestamp, nowTimestamp) + 3,
        date: note.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  const readResults = getReadIndex(input.readItems)
    .map(({ item, title, snippet, source, slug, content, tags, dateTimestamp }): SearchResult | null => {
      const lexicalScore =
        scoreIndexedField(title, normalizedQuery, queryTokens, {
          exact: 112,
          startsWith: 84,
          includes: 56,
          tokenExact: 16,
          tokenPrefix: 11,
          tokenIncludes: 7,
        }) +
        scoreIndexedField(snippet, normalizedQuery, queryTokens, {
          exact: 48,
          startsWith: 30,
          includes: 20,
          tokenExact: 7,
          tokenPrefix: 5,
          tokenIncludes: 3,
        }) +
        scoreIndexedField(source, normalizedQuery, queryTokens, {
          exact: 20,
          startsWith: 14,
          includes: 8,
          tokenExact: 4,
          tokenPrefix: 3,
          tokenIncludes: 2,
        }) +
        scoreIndexedField(slug, normalizedQuery, queryTokens, {
          exact: 24,
          startsWith: 17,
          includes: 10,
          tokenExact: 3,
          tokenPrefix: 2,
          tokenIncludes: 1,
        }) +
        scoreIndexedTags(tags, normalizedQuery, queryTokens) +
        scoreIndexedField(content, normalizedQuery, queryTokens, {
          exact: 20,
          startsWith: 12,
          includes: 8,
          tokenExact: 4,
          tokenPrefix: 3,
          tokenIncludes: 2,
        });

      if (lexicalScore <= 0) return null;

      return {
        type: "read",
        title: item.title,
        summary: item.snippet,
        url: item.hasBody ? `/read/${item.slug}` : item.url,
        source: item.source,
        navigateInternal: !!item.hasBody,
        score: lexicalScore + recencyBoost(dateTimestamp, nowTimestamp) + 1,
        date: item.date,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  return [...postResults, ...dailyResults, ...readResults]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const dateDiff = parseDate(b.date) - parseDate(a.date);
      if (dateDiff !== 0) return dateDiff;

      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
