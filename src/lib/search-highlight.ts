export interface HighlightSegment {
  text: string;
  match: boolean;
}

const STOP_WORDS = new Set([
  "dan",
  "yang",
  "untuk",
  "dengan",
  "dari",
  "pada",
  "atau",
  "itu",
  "ini",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "of",
]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function queryTerms(query: string) {
  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length >= 2)
    .filter((term) => !STOP_WORDS.has(term));

  const unique = Array.from(new Set(terms));
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, 8);
}

export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!text) return [{ text: "", match: false }];

  const terms = queryTerms(query);
  if (terms.length === 0) return [{ text, match: false }];

  const regex = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const value = match[0];
    const end = start + value.length;

    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), match: false });
    }

    segments.push({ text: text.slice(start, end), match: true });
    lastIndex = end;

    if (regex.lastIndex === start) {
      regex.lastIndex += 1;
    }
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), match: false });
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}
