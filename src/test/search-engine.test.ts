import { describe, expect, it } from "vitest";
import { searchContent } from "@/lib/search";
import type { DailyNote, Post, ReadItem } from "@/data/types";

const posts: Post[] = [
  {
    slug: "1984-george-orwell",
    title: "1984 George Orwell",
    summary: "Analisis totalitarianisme dan cinta.",
    type: "essay",
    category: "Refleksi",
    tags: ["1984", "orwell", "totalitarianisme"],
    date: "2026-03-06T14:00:00",
    readingTime: 20,
    content: "Winston bekerja di Ministry of Truth yang memalsukan sejarah dan mengontrol kebenaran.",
  },
  {
    slug: "catatan-ai",
    title: "Catatan AI",
    summary: "Membahas LLM dan tool AI untuk produktivitas.",
    type: "note",
    category: "Tech",
    tags: ["ai", "llm"],
    date: "2026-03-01T10:00:00",
    readingTime: 10,
    content: "Catatan eksperimen harian tentang model bahasa.",
  },
];

const readItems: ReadItem[] = [
  {
    slug: "orwell-review",
    title: "Review Orwell",
    snippet: "Ringkasan buku 1984.",
    source: "YouTube",
    url: "https://example.com/orwell",
    tags: ["1984", "book"],
    date: "2026-03-02T10:00:00",
    hasBody: false,
  },
  {
    slug: "cafe-thoughts",
    title: "Cafe Thoughts",
    snippet: "Refleksi harian di cafe.",
    source: "Blog",
    url: "https://example.com/cafe",
    tags: ["daily"],
    date: "2026-03-03T10:00:00",
    hasBody: true,
  },
];

const dailyNotes: DailyNote[] = [
  {
    slug: "2026-03-06",
    title: "Daily: Fokus Menulis",
    summary: "Belajar menulis dan refleksi 1984.",
    tags: ["daily", "refleksi"],
    date: "2026-03-06",
  },
];

describe("searchContent", () => {
  it("prioritizes exact title matches over weaker matches", () => {
    const results = searchContent("1984 george orwell", { posts, readItems, dailyNotes });
    expect(results[0]?.title).toBe("1984 George Orwell");
  });

  it("handles case-insensitive and diacritic-insensitive queries", () => {
    const withCase = searchContent("ORWELL", { posts, readItems, dailyNotes });
    expect(withCase.some((item) => item.title === "1984 George Orwell")).toBe(true);

    const withDiacritic = searchContent("CAFÉ", { posts, readItems, dailyNotes });
    expect(withDiacritic.some((item) => item.title === "Cafe Thoughts")).toBe(true);
  });

  it("supports tokenized matching across title, summary, and tags", () => {
    const results = searchContent("totalitarianisme cinta", { posts, readItems, dailyNotes });
    expect(results.some((item) => item.title === "1984 George Orwell")).toBe(true);
  });

  it("returns deterministic ordering and respects limits", () => {
    const results = searchContent("1984", { posts, readItems, dailyNotes, limit: 2 });
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("1984 George Orwell");
  });

  it("finds matches from MDX body content", () => {
    const results = searchContent("memalsukan sejarah", { posts, readItems, dailyNotes });
    expect(results[0]?.title).toBe("1984 George Orwell");
  });

  it("returns empty results for unrelated query", () => {
    const results = searchContent("zzzxxyyqqq", { posts, readItems, dailyNotes });
    expect(results).toHaveLength(0);
  });

  it("supports query filters by type", () => {
    const results = searchContent("type:daily 1984", { posts, readItems, dailyNotes });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.type === "daily")).toBe(true);
  });

  it("supports filter-only query", () => {
    const results = searchContent("type:daily", { posts, readItems, dailyNotes });
    expect(results.length).toBe(1);
    expect(results[0]?.type).toBe("daily");
  });

  it("supports query filters by tag and source", () => {
    const tagResults = searchContent("tag:book orwell", { posts, readItems, dailyNotes });
    expect(tagResults.length).toBeGreaterThan(0);
    expect(tagResults.every((item) => item.title.toLowerCase().includes("orwell"))).toBe(true);

    const sourceResults = searchContent("source:youtube review", { posts, readItems, dailyNotes });
    expect(sourceResults.length).toBeGreaterThan(0);
    expect(sourceResults.every((item) => item.type === "read")).toBe(true);
    expect(sourceResults.every((item) => item.source?.toLowerCase() === "youtube")).toBe(true);
  });

  it("supports query filters by category", () => {
    const results = searchContent("category:tech ai", { posts, readItems, dailyNotes });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.type === "post")).toBe(true);
    expect(results[0]?.title).toBe("Catatan AI");
  });

  it("handles minor typo in query terms", () => {
    const results = searchContent("orwlel", { posts, readItems, dailyNotes });
    expect(results.some((item) => item.title === "1984 George Orwell")).toBe(true);
  });

  it("builds preview from matched body content when available", () => {
    const results = searchContent("memalsukan sejarah", { posts, readItems, dailyNotes });
    expect(results[0]?.preview.toLowerCase()).toContain("memalsukan sejarah");
  });

  it("can match MDX body via Component fallback when content field is empty", () => {
    const postWithoutContent = Object.assign(
      {
        slug: "fallback-body",
        title: "Fallback Body",
        summary: "Ringkasan singkat.",
        type: "essay" as const,
        category: "Refleksi" as const,
        tags: ["catatan"],
        date: "2026-03-06T10:00:00",
        readingTime: 5,
      },
      {
        Component: function MockMdxBody() {
          return "Kata kunci tersembunyi dari isi artikel.";
        },
      }
    ) as Post;

    const results = searchContent("tersembunyi artikel", {
      posts: [postWithoutContent],
      readItems: [],
      dailyNotes: [],
    });
    expect(results[0]?.title).toBe("Fallback Body");
  });
});
