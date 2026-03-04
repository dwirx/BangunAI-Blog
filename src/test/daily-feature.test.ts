import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/content", () => ({
  allPosts: [],
  allReadItems: [],
  allDailyNotes: [
    {
      slug: "2026-02-12",
      title: "Daily Note: 2026-02-12",
      summary: "Catatan harian 12 Februari 2026",
      date: "2026-02-12",
      tags: ["daily"],
    },
    {
      slug: "2026-02-10",
      title: "Daily Note: 2026-02-10",
      summary: "Catatan harian 10 Februari 2026",
      date: "2026-02-10",
      tags: ["daily"],
    },
  ],
}));

describe("Daily feature data", () => {
  it("loads daily notes and keeps them sorted by latest date", async () => {
    const { dailyNotes } = await import("@/data/posts");
    expect(dailyNotes.length).toBeGreaterThan(0);

    const sorted = [...dailyNotes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    expect(dailyNotes).toEqual(sorted);
  });

  it("provides helper for latest notes and slug lookup", async () => {
    const { dailyNotes, getDailyNoteBySlug, getLatestDailyNotes } = await import("@/data/posts");
    const latest = getLatestDailyNotes(1);
    expect(latest).toHaveLength(Math.min(1, dailyNotes.length));

    const first = dailyNotes[0];
    expect(first).toBeDefined();
    if (!first) return;

    const found = getDailyNoteBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found?.slug).toBe(first.slug);
    expect(found?.title).toBe(first.title);
  });
});

describe("Daily routing", () => {
  it("registers list and detail daily routes", () => {
    const appPath = path.resolve(process.cwd(), "src/App.tsx");
    const source = readFileSync(appPath, "utf8");

    expect(source).toContain('path="/daily"');
    expect(source).toContain('path="/daily/:slug"');
  });
});
