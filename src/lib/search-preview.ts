function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function queryTerms(query: string) {
  return Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length >= 2)
        .filter((part) => !/^[a-z]+:.+$/i.test(part))
        .map(normalizeText)
    )
  ).sort((a, b) => b.length - a.length);
}

export function buildSearchExcerpt(text: string, query: string, maxLength = 130) {
  if (!text) return "";

  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";
  if (cleanText.length <= maxLength) return cleanText;

  const normalized = normalizeText(cleanText);
  const terms = queryTerms(query);

  let focusIndex = -1;
  for (const term of terms) {
    const idx = normalized.indexOf(term);
    if (idx >= 0) {
      focusIndex = idx;
      break;
    }
  }

  if (focusIndex < 0) {
    return `${cleanText.slice(0, maxLength).trimEnd()}...`;
  }

  const half = Math.floor(maxLength / 2);
  let start = Math.max(0, focusIndex - half);
  const end = Math.min(cleanText.length, start + maxLength);

  if (end - start < maxLength) {
    start = Math.max(0, end - maxLength);
  }

  const slice = cleanText.slice(start, end).trim();
  const prefix = start > 0 ? "... " : "";
  const suffix = end < cleanText.length ? " ..." : "";

  return `${prefix}${slice}${suffix}`.trim();
}
