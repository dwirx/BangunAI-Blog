import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { dailyNotes, posts } from "@/data/posts";
import { CalendarDays, NotebookPen, Hash, Flame, ArrowUpRight } from "lucide-react";
import FilterChips from "@/components/FilterChips";
import {
  buildContributionEntries,
  buildContributionHeatmap,
  filterDailyNotes,
  findClosestDailyNote,
  getDailyMonthOptions,
  getDailyStreakStats,
} from "@/lib/daily";
import { cn } from "@/lib/utils";

function formatDailyDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Daily() {
  const navigate = useNavigate();
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [jumpDate, setJumpDate] = useState("");
  const [selectedHeatDate, setSelectedHeatDate] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const streak = useMemo(() => getDailyStreakStats(dailyNotes), []);
  const contributionEntries = useMemo(() => buildContributionEntries(dailyNotes, posts), []);
  const heatmap = useMemo(() => buildContributionHeatmap(contributionEntries, { days: 112 }), [contributionEntries]);
  const monthMarkers = useMemo(() => {
    const seen = new Set<string>();
    return heatmap.flatMap((cell, index) => {
      const monthKey = cell.date.slice(0, 7);
      if (seen.has(monthKey)) return [];
      seen.add(monthKey);
      return [
        {
          weekIndex: Math.floor(index / 7),
          label: new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short" }),
          monthKey,
        },
      ];
    });
  }, [heatmap]);
  const selectedHeatCell = useMemo(
    () => heatmap.find((cell) => cell.date === selectedHeatDate) ?? null,
    [heatmap, selectedHeatDate]
  );
  const monthOptions = useMemo(() => getDailyMonthOptions(dailyNotes), []);
  const allTags = useMemo(
    () => [...new Set(dailyNotes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b)),
    []
  );
  const filteredNotes = useMemo(
    () => filterDailyNotes(dailyNotes, { month: monthFilter, tag: tagFilter }),
    [monthFilter, tagFilter]
  );
  const jumpTarget = useMemo(
    () => (jumpDate ? findClosestDailyNote(dailyNotes, jumpDate) : null),
    [jumpDate]
  );

  const thisYearCount = dailyNotes.filter(
    (note) => new Date(note.date).getFullYear() === currentYear
  ).length;
  const totalTags = new Set(dailyNotes.flatMap((note) => note.tags)).size;

  const openJumpTarget = () => {
    if (!jumpTarget) return;
    navigate(`/daily/${jumpTarget.note.slug}`);
  };

  const jumpHint = (() => {
    if (!jumpDate || !jumpTarget) return null;
    if (jumpTarget.exact) return `Tanggal ${jumpDate} tersedia.`;
    return `Tidak ada catatan pada ${jumpDate}. Terdekat: ${jumpTarget.note.date}.`;
  })();

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Daily</h1>
        <p className="text-muted-foreground text-lg">
          Catatan harian singkat untuk melacak progres, ide, dan hal penting setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <NotebookPen size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{dailyNotes.length}</p>
            <p className="text-xs text-muted-foreground">Total catatan</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{thisYearCount}</p>
            <p className="text-xs text-muted-foreground">Tahun ini</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-highlight/15 text-highlight">
            <Hash size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{totalTags}</p>
            <p className="text-xs text-muted-foreground">Tag aktif</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-400/15 text-emerald-300">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{streak.current}</p>
            <p className="text-xs text-muted-foreground">
              Streak aktif (terpanjang: {streak.longest})
            </p>
          </div>
        </div>
      </div>

      <section className="mb-10 glass-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Aktivitas 16 Minggu</h2>
          <span className="text-xs text-muted-foreground/65">
            Hari aktif: {heatmap.filter((cell) => cell.count > 0).length}
          </span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="w-max">
            <div className="relative mb-2 h-4" style={{ width: `${Math.ceil(heatmap.length / 7) * 16}px` }}>
              {monthMarkers.map((marker) => (
                <span
                  key={marker.monthKey}
                  className="absolute top-0 text-[10px] text-muted-foreground/70"
                  style={{ left: `${marker.weekIndex * 16}px` }}
                >
                  {marker.label}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col auto-cols-[12px] grid-rows-7 gap-1 w-max">
            {heatmap.map((cell) => {
              const intensityClass = {
                0: "bg-secondary/45",
                1: "bg-primary/25",
                2: "bg-primary/45",
                3: "bg-accent/55",
                4: "bg-highlight/65",
              }[cell.intensity];
              const tooltipParts = [
                cell.date,
                `${cell.count} kontribusi`,
                cell.breakdown.daily > 0 ? `Daily ${cell.breakdown.daily}` : "",
                cell.breakdown.writing > 0 ? `Writing ${cell.breakdown.writing}` : "",
                cell.breakdown.artikel > 0 ? `Artikel ${cell.breakdown.artikel}` : "",
              ].filter(Boolean);

              return (
                <button
                  type="button"
                  key={cell.date}
                  title={tooltipParts.join(" • ")}
                  aria-label={`Aktivitas ${cell.date}`}
                  onClick={() =>
                    setSelectedHeatDate((current) => (current === cell.date ? null : cell.date))
                  }
                  className={cn(
                    "h-3 w-3 rounded-[3px] border border-border/20",
                    intensityClass,
                    cell.isToday && "ring-1 ring-primary/90",
                    selectedHeatDate === cell.date && "ring-2 ring-accent/90"
                  )}
                />
              );
            })}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/65">
          <span>Rendah</span>
          <div className="h-2.5 w-2.5 rounded-[3px] bg-secondary/45 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-primary/25 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-primary/45 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-accent/55 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-highlight/65 border border-border/20" />
          <span>Tinggi</span>
        </div>

        {selectedHeatCell && (
          <div className="mt-4 rounded-xl border border-border/40 bg-secondary/25 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold">
                Aktivitas {formatDailyDate(selectedHeatCell.date)}
              </h3>
              <span className="text-xs text-muted-foreground/70">
                {selectedHeatCell.count} kontribusi
              </span>
            </div>
            {selectedHeatCell.entries.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">Tidak ada publikasi pada tanggal ini.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedHeatCell.entries.map((entry) => {
                  const sourceStyle = {
                    daily: "bg-primary/15 text-primary",
                    writing: "bg-accent/15 text-accent",
                    artikel: "bg-highlight/15 text-highlight",
                  }[entry.kind];
                  const sourceLabel = {
                    daily: "Daily",
                    writing: "Writing",
                    artikel: "Artikel",
                  }[entry.kind];

                  return (
                    <Link
                      key={entry.id}
                      to={entry.url}
                      className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/45 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm group-hover:text-foreground">{entry.title}</p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", sourceStyle)}>
                        {sourceLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mb-8 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="daily-month-filter" className="block text-xs uppercase tracking-wide text-muted-foreground/70 mb-2">
              Filter Bulan
            </label>
            <select
              id="daily-month-filter"
              value={monthFilter ?? ""}
              onChange={(e) => setMonthFilter(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Semua bulan</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="date"
              value={jumpDate}
              onChange={(e) => setJumpDate(e.target.value)}
              className="rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={openJumpTarget}
              disabled={!jumpTarget}
              className="inline-flex items-center gap-1 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground enabled:hover:text-foreground enabled:hover:bg-secondary/40 disabled:opacity-50"
            >
              Buka
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        {jumpHint && (
          <p className="text-xs text-muted-foreground/75">{jumpHint}</p>
        )}

        <FilterChips
          options={allTags}
          selected={tagFilter}
          onSelect={setTagFilter}
          allLabel="Semua Tag"
        />
      </section>

      {filteredNotes.length === 0 ? (
        <div className="glass-card text-center py-14">
          <p className="text-muted-foreground">Belum ada daily note untuk filter ini.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border/40">
          {filteredNotes.map((note) => (
            <Link
              key={note.slug}
              to={`/daily/${note.slug}`}
              className="group block py-4 first:pt-1 last:pb-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      Daily
                    </span>
                    <span className="text-xs text-muted-foreground/65">
                      {formatDailyDate(note.date)}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors">
                    {note.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {note.summary}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-xs text-muted-foreground/55">Buka</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
