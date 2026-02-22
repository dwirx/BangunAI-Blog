import { describe, expect, it } from "vitest";
import { buildTagStats, filterTagStatsByQuery, getTagDensity } from "@/lib/tags";
import type { Post, ReadItem } from "@/data/types";

const basePost: Omit<Post, "slug" | "title" | "summary" | "tags"> = {
  type: "essay",
  category: "Tech",
  date: "2026-01-01",
  readingTime: 5,
};

const posts: Post[] = [
  {
    ...basePost,
    slug: "p-1",
    title: "Post 1",
    summary: "Summary",
    tags: ["AI", "Rust", "Linux"],
  },
  {
    ...basePost,
    slug: "p-2",
    title: "Post 2",
    summary: "Summary",
    tags: ["AI", "TypeScript"],
  },
];

const reads: ReadItem[] = [
  {
    slug: "r-1",
    title: "Read 1",
    date: "2026-01-01",
    snippet: "",
    source: "Source",
    url: "https://example.com",
    tags: ["AI", "Rust"],
  },
];

describe("buildTagStats", () => {
  it("combines tags from posts and read items with source counts", () => {
    const stats = buildTagStats(posts, reads);

    expect(stats[0]).toMatchObject({
      tag: "AI",
      count: 3,
      postCount: 2,
      readCount: 1,
    });

    const rust = stats.find((item) => item.tag === "Rust");
    expect(rust).toMatchObject({ count: 2, postCount: 1, readCount: 1 });
  });

  it("sorts by count descending and then alphabetically", () => {
    const stats = buildTagStats(posts, reads);
    expect(stats.map((item) => item.tag)).toEqual(["AI", "Rust", "Linux", "TypeScript"]);
  });
});

describe("filterTagStatsByQuery", () => {
  it("filters tags case-insensitively", () => {
    const stats = buildTagStats(posts, reads);
    expect(filterTagStatsByQuery(stats, "ru").map((item) => item.tag)).toEqual(["Rust"]);
  });

  it("returns all tags when query is blank", () => {
    const stats = buildTagStats(posts, reads);
    expect(filterTagStatsByQuery(stats, "  ")).toHaveLength(stats.length);
  });
});

describe("getTagDensity", () => {
  it("returns normalized density between 0.4 and 1", () => {
    expect(getTagDensity(10, 10, 10)).toBe(1);
    expect(getTagDensity(1, 1, 10)).toBe(0.4);
    expect(getTagDensity(5, 1, 10)).toBeGreaterThan(0.4);
  });
});
