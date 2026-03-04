import { describe, expect, it } from "vitest";
import type { DailyNote } from "@/data/types";
import {
  buildDailyActivityMap,
  buildDailyHeatmap,
  filterDailyNotes,
  findClosestDailyNote,
  getDailyMonthOptions,
  getDailyStreakStats,
} from "@/lib/daily";

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
});
