import { describe, expect, it } from "vitest";
import type { DailyNote } from "@/data/types";
import {
  buildContributionEntries,
  buildContributionHeatmap,
  buildContributionHeatmapByDateRange,
  buildContributionHeatmapForYear,
  buildDailyActivityMap,
  buildDailyHeatmap,
  compressHeatmapByActivity,
  filterDailyNotes,
  findClosestDailyNote,
  getContributionYears,
  getContributionRangeDays,
  getDailyMonthOptions,
  getDailyStreakStats,
} from "@/lib/daily";
import type { Post } from "@/data/types";

const notes: DailyNote[] = [
  {
    slug: "2026-03-10",
    title: "Daily 10",
    date: "2026-03-10",
    summary: "s1",
    tags: ["ai", "ekonomi"],
  },
  {
    slug: "2026-03-09",
    title: "Daily 9",
    date: "2026-03-09",
    summary: "s2",
    tags: ["geopolitik"],
  },
  {
    slug: "2026-03-08",
    title: "Daily 8",
    date: "2026-03-08",
    summary: "s3",
    tags: ["ai"],
  },
  {
    slug: "2026-03-06",
    title: "Daily 6",
    date: "2026-03-06",
    summary: "s4",
    tags: ["ekonomi"],
  },
  {
    slug: "2026-02-28",
    title: "Daily 28",
    date: "2026-02-28",
    summary: "s5",
    tags: ["geopolitik"],
  },
  {
    slug: "2026-02-28-alt",
    title: "Daily 28-alt",
    date: "2026-02-28",
    summary: "s6",
    tags: ["ai"],
  },
];

const posts: Post[] = [
  {
    slug: "post-article",
    title: "Artikel A",
    summary: "artikel",
    type: "article",
    category: "Tech",
    tags: ["ai"],
    date: "2026-03-10",
    readingTime: 6,
  },
  {
    slug: "post-writing",
    title: "Writing A",
    summary: "writing",
    type: "essay",
    category: "Tech",
    tags: ["daily"],
    date: "2026-03-09",
    readingTime: 4,
  },
];

describe("daily utils", () => {
  it("builds activity map and counts same-day notes", () => {
    const map = buildDailyActivityMap(notes);
    expect(map.get("2026-02-28")).toBe(2);
    expect(map.get("2026-03-10")).toBe(1);
  });

  it("calculates current and longest streak correctly", () => {
    const stats = getDailyStreakStats(notes);
    expect(stats.current).toBe(3);
    expect(stats.longest).toBe(3);
    expect(stats.activeDays).toBe(5);
    expect(stats.lastEntryDate).toBe("2026-03-10");
  });

  it("builds month options with descending order and counts", () => {
    const options = getDailyMonthOptions(notes);
    expect(options[0]).toMatchObject({ value: "2026-03", count: 4 });
    expect(options[1]).toMatchObject({ value: "2026-02", count: 2 });
  });

  it("filters notes by month and tag", () => {
    const filtered = filterDailyNotes(notes, { month: "2026-03", tag: "ai" });
    expect(filtered.map((item) => item.slug)).toEqual(["2026-03-10", "2026-03-08"]);
  });

  it("finds exact and nearest daily notes by date", () => {
    const exact = findClosestDailyNote(notes, "2026-03-09");
    expect(exact?.exact).toBe(true);
    expect(exact?.note.slug).toBe("2026-03-09");

    const nearest = findClosestDailyNote(notes, "2026-03-07");
    expect(nearest?.exact).toBe(false);
    expect(nearest?.note.slug).toBe("2026-03-08");
  });

  it("builds heatmap cells with intensity and today marker", () => {
    const heatmap = buildDailyHeatmap(notes, {
      days: 5,
      referenceDate: new Date("2026-03-10T08:00:00"),
    });

    expect(heatmap).toHaveLength(5);
    expect(heatmap[0].date).toBe("2026-03-06");
    expect(heatmap[4].date).toBe("2026-03-10");
    expect(heatmap[4].isToday).toBe(true);
    expect(heatmap.find((cell) => cell.date === "2026-03-07")?.intensity).toBe(0);
    expect(heatmap.find((cell) => cell.date === "2026-03-08")?.intensity).toBeGreaterThan(0);
  });

  it("builds contribution entries across daily, writing, and article", () => {
    const entries = buildContributionEntries(notes, posts);
    expect(entries.find((entry) => entry.kind === "daily")).toBeDefined();
    expect(entries.find((entry) => entry.kind === "writing")?.url).toBe("/writing/post-writing");
    expect(entries.find((entry) => entry.kind === "artikel")?.url).toBe("/artikel/post-article");
  });

  it("builds contribution heatmap cells with clickable date breakdown", () => {
    const entries = buildContributionEntries(notes, posts);
    const heatmap = buildContributionHeatmap(entries, {
      days: 3,
      referenceDate: new Date("2026-03-10T09:00:00"),
    });

    const today = heatmap[2];
    expect(today.date).toBe("2026-03-10");
    expect(today.count).toBe(2);
    expect(today.breakdown.daily).toBe(1);
    expect(today.breakdown.artikel).toBe(1);
    expect(today.entries.some((entry) => entry.title === "Artikel A")).toBe(true);
  });

  it("maps contribution range to expected day windows", () => {
    expect(getContributionRangeDays("3m")).toBe(84);
    expect(getContributionRangeDays("6m")).toBe(168);
    expect(getContributionRangeDays("1y")).toBe(364);
  });

  it("can align heatmap output into full week columns", () => {
    const entries = buildContributionEntries(notes, posts);
    const heatmap = buildContributionHeatmap(entries, {
      days: 10,
      referenceDate: new Date("2026-03-10T09:00:00"),
      alignToWeeks: true,
    });

    expect(heatmap.length % 7).toBe(0);
    expect(heatmap[0].date).toBe("2026-03-01");
    expect(heatmap[0].weekday).toBe(0);
    expect(heatmap[1].weekday).toBe(1);
    expect(heatmap.at(-1)?.date).toBe("2026-03-14");
  });

  it("compresses leading empty weeks while preserving active period context", () => {
    const entries = buildContributionEntries(notes, posts);
    const heatmap = buildContributionHeatmap(entries, {
      days: 56,
      referenceDate: new Date("2026-03-10T09:00:00"),
      alignToWeeks: true,
    });

    const compact = compressHeatmapByActivity(heatmap, { minWeeks: 8 });
    const rawWeeks = Math.max(...heatmap.map((cell) => cell.weekIndex)) + 1;
    const compactWeeks = Math.max(...compact.map((cell) => cell.weekIndex)) + 1;

    expect(compactWeeks).toBeLessThan(rawWeeks);
    expect(compact.length % 7).toBe(0);
    expect(compact.some((cell) => cell.count > 0)).toBe(true);
  });

  it("builds contribution heatmap for exact date range", () => {
    const entries = buildContributionEntries(notes, posts);
    const heatmap = buildContributionHeatmapByDateRange(entries, {
      startDate: "2026-02-27",
      endDate: "2026-03-02",
      alignToWeeks: false,
      referenceDate: new Date("2026-03-10T09:00:00"),
    });

    expect(heatmap.map((cell) => cell.date)).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
    expect(heatmap.find((cell) => cell.date === "2026-02-28")?.count).toBe(2);
  });

  it("builds full-year heatmap and derives available years", () => {
    const entries = buildContributionEntries(notes, posts);
    const years = getContributionYears(entries);
    expect(years).toEqual([2026]);

    const heatmap = buildContributionHeatmapForYear(entries, 2026, {
      alignToWeeks: true,
      referenceDate: new Date("2026-03-10T09:00:00"),
    });
    expect(heatmap.length % 7).toBe(0);
    expect(heatmap[0].date).toBe("2025-12-28");
    expect(heatmap.at(-1)?.date).toBe("2027-01-02");
  });

  it("keeps padded boundary days empty for selected year", () => {
    const entries = buildContributionEntries(notes, posts);
    const extraBoundaryEntries = [
      ...entries,
      {
        id: "daily:outside-year",
        title: "Outside Year",
        date: "2025-12-31",
        url: "/daily/outside-year",
        kind: "daily" as const,
      },
    ];

    const heatmap = buildContributionHeatmapForYear(extraBoundaryEntries, 2026, {
      alignToWeeks: true,
      referenceDate: new Date("2026-03-10T09:00:00"),
    });

    expect(heatmap.find((cell) => cell.date === "2025-12-31")?.count).toBe(0);
    expect(heatmap.find((cell) => cell.date === "2026-03-10")?.count).toBeGreaterThan(0);
  });
});
