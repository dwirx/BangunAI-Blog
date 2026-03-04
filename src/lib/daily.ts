import type { DailyNote } from "@/data/types";

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
}

export interface DailyStreakStats {
  current: number;
  longest: number;
  activeDays: number;
  lastEntryDate: string | null;
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
  const days = config.days ?? 90;
  const referenceDate = config.referenceDate ?? new Date();
  const todayKey = toDateKey(referenceDate);
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - (days - 1));
  const startKey = toDateKey(start);

  const activityMap = buildDailyActivityMap(notes);
  const maxCount = Math.max(1, ...activityMap.values());
  const cells: DailyHeatmapCell[] = [];

  let cursorKey = startKey;
  for (let i = 0; i < days; i++) {
    const count = activityMap.get(cursorKey) ?? 0;
    const intensity =
      count === 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4))) as 1 | 2 | 3 | 4);
    cells.push({
      date: cursorKey,
      count,
      intensity,
      isToday: cursorKey === todayKey,
    });
    cursorKey = shiftDateKey(cursorKey, 1);
  }

  return cells;
}
