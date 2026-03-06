import type { DailyNote, Post } from "@/data/types";

export interface DailyMonthOption {
  value: string;
  label: string;
  count: number;
}

export interface DailyHeatmapCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  weekday: number;
  weekIndex: number;
  entries: ContributionEntry[];
  breakdown: DailyHeatmapBreakdown;
}

export interface DailyStreakStats {
  current: number;
  longest: number;
  activeDays: number;
  lastEntryDate: string | null;
}

export type ContributionKind = "daily" | "writing" | "artikel";
export type ContributionRange = "3m" | "6m" | "1y";

export interface ContributionEntry {
  id: string;
  title: string;
  date: string;
  url: string;
  kind: ContributionKind;
}

export interface DailyHeatmapBreakdown {
  daily: number;
  writing: number;
  artikel: number;
}

export interface ContributionStats {
  totalContributions: number;
  totalDaily: number;
  totalWriting: number;
  totalArtikel: number;
  totalTulisan: number;
  activeDays: number;
  averagePerActiveDay: number;
  mostActiveDate: string | null;
  mostActiveCount: number;
  thisYearContributions: number;
  thisYearDaily: number;
  thisYearWriting: number;
  thisYearArtikel: number;
  thisYearActiveDays: number;
  thisYearAveragePerActiveDay: number;
}

interface HeatmapRangeConfig {
  startDate: string | Date;
  endDate: string | Date;
  referenceDate?: Date;
  alignToWeeks?: boolean;
}

function toDateKey(value: string | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return toDateKey(date);
}

function toMonthKey(dateStr: string): string {
  const key = toDateKey(dateStr);
  return key.slice(0, 7);
}

function buildBreakdown(entries: ContributionEntry[]): DailyHeatmapBreakdown {
  return entries.reduce<DailyHeatmapBreakdown>(
    (acc, entry) => {
      acc[entry.kind] += 1;
      return acc;
    },
    { daily: 0, writing: 0, artikel: 0 }
  );
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function endOfWeek(date: Date) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  return value;
}

export function buildDailyActivityMap(notes: DailyNote[]) {
  const map = new Map<string, number>();
  notes.forEach((note) => {
    const key = toDateKey(note.date);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
}

export function getDailyStreakStats(notes: DailyNote[]): DailyStreakStats {
  const activityMap = buildDailyActivityMap(notes);
  const sortedKeys = [...activityMap.keys()].sort((a, b) => b.localeCompare(a));
  if (sortedKeys.length === 0) {
    return {
      current: 0,
      longest: 0,
      activeDays: 0,
      lastEntryDate: null,
    };
  }

  const lastEntryDate = sortedKeys[0];

  let current = 1;
  let cursor = lastEntryDate;
  while (activityMap.has(shiftDateKey(cursor, -1))) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const ascending = [...activityMap.keys()].sort((a, b) => a.localeCompare(b));
  let longest = 1;
  let run = 1;
  for (let i = 1; i < ascending.length; i++) {
    if (ascending[i] === shiftDateKey(ascending[i - 1], 1)) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return {
    current,
    longest,
    activeDays: sortedKeys.length,
    lastEntryDate,
  };
}

export function getDailyMonthOptions(notes: DailyNote[]): DailyMonthOption[] {
  const countByMonth = new Map<string, number>();
  notes.forEach((note) => {
    const month = toMonthKey(note.date);
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  });

  return [...countByMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([value, count]) => {
      const [year, month] = value.split("-");
      const date = new Date(`${value}-01T00:00:00`);
      const monthLabel = date.toLocaleDateString("id-ID", { month: "long" });
      return {
        value,
        label: `${monthLabel} ${year}`,
        count,
      };
    });
}

export function filterDailyNotes(
  notes: DailyNote[],
  filters: { month?: string | null; tag?: string | null }
) {
  const { month, tag } = filters;
  return notes.filter((note) => {
    if (month && toMonthKey(note.date) !== month) return false;
    if (tag && !note.tags.includes(tag)) return false;
    return true;
  });
}

export function findClosestDailyNote(notes: DailyNote[], targetDate: string) {
  if (!targetDate || notes.length === 0) return null;
  const target = new Date(`${targetDate}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;

  let winner: DailyNote | null = null;
  let winnerDiff = Number.POSITIVE_INFINITY;

  notes.forEach((note) => {
    const ts = new Date(`${toDateKey(note.date)}T00:00:00`).getTime();
    const diff = Math.abs(ts - target);
    if (diff < winnerDiff) {
      winner = note;
      winnerDiff = diff;
      return;
    }
    if (diff === winnerDiff && winner) {
      const winnerTs = new Date(`${toDateKey(winner.date)}T00:00:00`).getTime();
      if (ts > winnerTs) winner = note;
    }
  });

  if (!winner) return null;
  return {
    note: winner,
    exact: toDateKey(winner.date) === targetDate,
  };
}

export function buildDailyHeatmap(
  notes: DailyNote[],
  config: { days?: number; referenceDate?: Date } = {}
): DailyHeatmapCell[] {
  const entries: ContributionEntry[] = notes.map((note) => ({
    id: `daily:${note.slug}`,
    title: note.title,
    date: note.date,
    url: `/daily/${note.slug}`,
    kind: "daily",
  }));

  return buildContributionHeatmap(entries, config);
}

export function buildContributionEntries(
  notes: DailyNote[],
  posts: Post[]
): ContributionEntry[] {
  const dailyEntries: ContributionEntry[] = notes.map((note) => ({
    id: `daily:${note.slug}`,
    title: note.title,
    date: note.date,
    url: `/daily/${note.slug}`,
    kind: "daily",
  }));

  const postEntries: ContributionEntry[] = posts.map((post) => {
    const isArticle = post.type === "article";
    return {
      id: `post:${post.slug}`,
      title: post.title,
      date: post.date,
      url: isArticle ? `/artikel/${post.slug}` : `/writing/${post.slug}`,
      kind: isArticle ? "artikel" : "writing",
    };
  });

  return [...dailyEntries, ...postEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getContributionStats(
  entries: ContributionEntry[],
  referenceDate: Date = new Date()
): ContributionStats {
  const currentYear = referenceDate.getFullYear();
  const allDateCounter = new Map<string, number>();
  const thisYearDateCounter = new Map<string, number>();
  const stats: ContributionStats = {
    totalContributions: entries.length,
    totalDaily: 0,
    totalWriting: 0,
    totalArtikel: 0,
    totalTulisan: 0,
    activeDays: 0,
    averagePerActiveDay: 0,
    mostActiveDate: null,
    mostActiveCount: 0,
    thisYearContributions: 0,
    thisYearDaily: 0,
    thisYearWriting: 0,
    thisYearArtikel: 0,
    thisYearActiveDays: 0,
    thisYearAveragePerActiveDay: 0,
  };

  entries.forEach((entry) => {
    if (entry.kind === "daily") stats.totalDaily += 1;
    if (entry.kind === "writing") stats.totalWriting += 1;
    if (entry.kind === "artikel") stats.totalArtikel += 1;

    const entryDate = new Date(entry.date);
    const entryYear = entryDate.getFullYear();
    if (!Number.isNaN(entryDate.getTime())) {
      const dateKey = toDateKey(entryDate);
      allDateCounter.set(dateKey, (allDateCounter.get(dateKey) ?? 0) + 1);
    }

    if (!Number.isNaN(entryYear) && entryYear === currentYear) {
      stats.thisYearContributions += 1;
      if (entry.kind === "daily") stats.thisYearDaily += 1;
      if (entry.kind === "writing") stats.thisYearWriting += 1;
      if (entry.kind === "artikel") stats.thisYearArtikel += 1;

      if (!Number.isNaN(entryDate.getTime())) {
        const dateKey = toDateKey(entryDate);
        thisYearDateCounter.set(dateKey, (thisYearDateCounter.get(dateKey) ?? 0) + 1);
      }
    }
  });

  stats.totalTulisan = stats.totalWriting + stats.totalArtikel;
  stats.activeDays = allDateCounter.size;
  stats.thisYearActiveDays = thisYearDateCounter.size;
  stats.averagePerActiveDay =
    stats.activeDays > 0 ? Number((stats.totalContributions / stats.activeDays).toFixed(2)) : 0;
  stats.thisYearAveragePerActiveDay =
    stats.thisYearActiveDays > 0
      ? Number((stats.thisYearContributions / stats.thisYearActiveDays).toFixed(2))
      : 0;

  allDateCounter.forEach((count, date) => {
    if (count > stats.mostActiveCount) {
      stats.mostActiveCount = count;
      stats.mostActiveDate = date;
      return;
    }

    if (count === stats.mostActiveCount && stats.mostActiveDate && date > stats.mostActiveDate) {
      stats.mostActiveDate = date;
    }
  });

  return stats;
}

export function buildContributionHeatmap(
  entries: ContributionEntry[],
  config: { days?: number; referenceDate?: Date; alignToWeeks?: boolean } = {}
): DailyHeatmapCell[] {
  const days = config.days ?? 90;
  const referenceDate = config.referenceDate ?? new Date();
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - (days - 1));

  return buildContributionHeatmapByDateRange(entries, {
    startDate: start,
    endDate: referenceDate,
    referenceDate,
    alignToWeeks: config.alignToWeeks,
  });
}

export function buildContributionHeatmapByDateRange(
  entries: ContributionEntry[],
  config: HeatmapRangeConfig
): DailyHeatmapCell[] {
  const referenceDate = config.referenceDate ?? new Date();
  const alignToWeeks = config.alignToWeeks ?? false;
  const todayKey = toDateKey(referenceDate);

  let start = new Date(config.startDate);
  let end = new Date(config.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  if (start > end) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  if (alignToWeeks) {
    start = startOfWeek(start);
    end = endOfWeek(end);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
  }

  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  const totalDays =
    Math.floor((new Date(`${endKey}T00:00:00`).getTime() - new Date(`${startKey}T00:00:00`).getTime()) / 86400000) + 1;

  const entriesByDate = new Map<string, ContributionEntry[]>();
  entries.forEach((entry) => {
    const key = toDateKey(entry.date);
    const list = entriesByDate.get(key) ?? [];
    list.push(entry);
    entriesByDate.set(key, list);
  });

  const maxCount = Math.max(1, ...[...entriesByDate.values()].map((list) => list.length));
  const cells: DailyHeatmapCell[] = [];

  let cursorKey = startKey;
  for (let i = 0; i < totalDays; i++) {
    const dayEntries = entriesByDate.get(cursorKey) ?? [];
    const count = dayEntries.length;
    const weekday = new Date(`${cursorKey}T00:00:00`).getDay();
    const intensity =
      count === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4))) as 1 | 2 | 3 | 4);
    cells.push({
      date: cursorKey,
      count,
      intensity,
      isToday: cursorKey === todayKey,
      weekday,
      weekIndex: Math.floor(i / 7),
      entries: dayEntries,
      breakdown: buildBreakdown(dayEntries),
    });
    cursorKey = shiftDateKey(cursorKey, 1);
  }

  return cells;
}

export function buildContributionHeatmapForYear(
  entries: ContributionEntry[],
  year: number,
  config: { referenceDate?: Date; alignToWeeks?: boolean } = {}
) {
  const yearPrefix = `${year}-`;
  const yearEntries = entries.filter((entry) => toDateKey(entry.date).startsWith(yearPrefix));

  return buildContributionHeatmapByDateRange(yearEntries, {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    referenceDate: config.referenceDate,
    alignToWeeks: config.alignToWeeks,
  });
}

export function getContributionYears(entries: ContributionEntry[]) {
  const years = new Set<number>();
  entries.forEach((entry) => {
    const year = new Date(entry.date).getFullYear();
    if (!Number.isNaN(year)) years.add(year);
  });
  return [...years].sort((a, b) => b - a);
}

export function getContributionRangeDays(range: ContributionRange) {
  if (range === "3m") return 84;
  if (range === "6m") return 168;
  return 364;
}

export function compressHeatmapByActivity(
  cells: DailyHeatmapCell[],
  options: { leadingContextWeeks?: number; trailingContextWeeks?: number; minWeeks?: number } = {}
) {
  if (cells.length === 0) return [];

  const leadingContextWeeks = options.leadingContextWeeks ?? 2;
  const trailingContextWeeks = options.trailingContextWeeks ?? 1;
  const minWeeks = options.minWeeks ?? 12;
  const maxWeek = Math.max(...cells.map((cell) => cell.weekIndex));
  const weekHasActivity = new Map<number, boolean>();

  cells.forEach((cell) => {
    if (cell.count > 0) weekHasActivity.set(cell.weekIndex, true);
  });

  const activeWeeks = [...weekHasActivity.keys()].sort((a, b) => a - b);
  if (activeWeeks.length === 0) {
    const startWeek = Math.max(0, maxWeek - (minWeeks - 1));
    return cells
      .filter((cell) => cell.weekIndex >= startWeek)
      .map((cell) => ({ ...cell, weekIndex: cell.weekIndex - startWeek }));
  }

  let startWeek = Math.max(0, activeWeeks[0] - leadingContextWeeks);
  let endWeek = Math.min(maxWeek, activeWeeks[activeWeeks.length - 1] + trailingContextWeeks);

  const windowSize = endWeek - startWeek + 1;
  if (windowSize < minWeeks) {
    const shortage = minWeeks - windowSize;
    const extraBefore = Math.min(startWeek, Math.ceil(shortage / 2));
    startWeek -= extraBefore;
    const remaining = shortage - extraBefore;
    const extraAfter = Math.min(maxWeek - endWeek, remaining);
    endWeek += extraAfter;
    const stillMissing = minWeeks - (endWeek - startWeek + 1);
    if (stillMissing > 0) {
      startWeek = Math.max(0, startWeek - stillMissing);
    }
  }

  return cells
    .filter((cell) => cell.weekIndex >= startWeek && cell.weekIndex <= endWeek)
    .map((cell) => ({ ...cell, weekIndex: cell.weekIndex - startWeek }));
}
