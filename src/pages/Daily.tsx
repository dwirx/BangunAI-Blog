import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { dailyNotes, posts } from "@/data/posts";
import { CalendarDays, NotebookPen, Hash, Flame, ArrowUpRight, BookOpen } from "lucide-react";
import FilterChips from "@/components/FilterChips";
import {
  buildContributionEntries,
  buildContributionHeatmap,
  buildContributionHeatmapForYear,
  compressHeatmapByActivity,
  getContributionYears,
  getContributionRangeDays,
  type ContributionKind,
  type ContributionRange,
  type DailyHeatmapCell,
  filterDailyNotes,
  findClosestDailyNote,
  getDailyMonthOptions,
  getContributionStats,
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

const heatmapRangeOptions: Array<{ value: ContributionRange; label: string }> = [
  { value: "3m", label: "3 Bulan" },
  { value: "6m", label: "6 Bulan" },
  { value: "1y", label: "1 Tahun" },
];

type HeatmapViewMode = "rolling" | "year" | "all";

const heatmapViewModeOptions: Array<{ value: HeatmapViewMode; label: string }> = [
  { value: "rolling", label: "Rentang" },
  { value: "year", label: "Tahun" },
  { value: "all", label: "Semua" },
];

const contributionSourceOptions: Array<{ value: ContributionKind; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "writing", label: "Writing" },
  { value: "artikel", label: "Artikel" },
];

function getWeekCount(cells: DailyHeatmapCell[]) {
  return Math.max(1, Math.max(0, ...cells.map((cell) => cell.weekIndex)) + 1);
}

function getMonthMarkers(cells: DailyHeatmapCell[]) {
  const seen = new Set<string>();
  return cells.flatMap((cell) => {
    const monthKey = cell.date.slice(0, 7);
    if (seen.has(monthKey)) return [];
    seen.add(monthKey);
    return [
      {
        weekIndex: cell.weekIndex,
        label: new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short" }),
        monthKey,
      },
    ];
  });
}

export default function Daily() {
  const navigate = useNavigate();
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [jumpDate, setJumpDate] = useState("");
  const [heatmapRange, setHeatmapRange] = useState<ContributionRange>("6m");
  const [heatmapViewMode, setHeatmapViewMode] = useState<HeatmapViewMode>("rolling");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedSources, setSelectedSources] = useState<ContributionKind[]>([
    "daily",
    "writing",
    "artikel",
  ]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [selectedHeatDate, setSelectedHeatDate] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const streak = useMemo(() => getDailyStreakStats(dailyNotes), []);
  const contributionEntries = useMemo(() => buildContributionEntries(dailyNotes, posts), []);
  const contributionStats = useMemo(
    () => getContributionStats(contributionEntries),
    [contributionEntries]
  );
  const filteredContributionEntries = useMemo(
    () => contributionEntries.filter((entry) => selectedSources.includes(entry.kind)),
    [contributionEntries, selectedSources]
  );
  const filteredContributionStats = useMemo(
    () => getContributionStats(filteredContributionEntries),
    [filteredContributionEntries]
  );
  const availableYears = useMemo(
    () => getContributionYears(filteredContributionEntries),
    [filteredContributionEntries]
  );
  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);
  useEffect(() => {
    if (expandedYear === null) return;
    if (!availableYears.includes(expandedYear)) {
      setExpandedYear(null);
    }
  }, [availableYears, expandedYear]);
  const heatmapDays = useMemo(() => getContributionRangeDays(heatmapRange), [heatmapRange]);
  const rollingHeatmap = useMemo(
    () =>
      buildContributionHeatmap(filteredContributionEntries, {
        days: heatmapDays,
        alignToWeeks: true,
      }),
    [filteredContributionEntries, heatmapDays]
  );
  const compactHeatmap = useMemo(
    () =>
      compressHeatmapByActivity(rollingHeatmap, {
        leadingContextWeeks: 2,
        trailingContextWeeks: 1,
        minWeeks: 10,
      }),
    [rollingHeatmap]
  );
  const yearHeatmap = useMemo(() => {
    if (availableYears.length === 0) return [];
    return buildContributionHeatmapForYear(filteredContributionEntries, selectedYear, {
      alignToWeeks: true,
    });
  }, [availableYears.length, filteredContributionEntries, selectedYear]);
  const allYearHeatmaps = useMemo(
    () =>
      availableYears.map((year) => ({
        year,
        cells: buildContributionHeatmapForYear(filteredContributionEntries, year, {
          alignToWeeks: true,
        }),
      })),
    [availableYears, filteredContributionEntries]
  );
  const displayHeatmap = useMemo(
    () =>
      heatmapViewMode === "rolling"
        ? heatmapRange === "1y"
          ? rollingHeatmap
          : compactHeatmap
        : yearHeatmap,
    [compactHeatmap, heatmapRange, heatmapViewMode, rollingHeatmap, yearHeatmap]
  );
  const isFullWidthHeatmap = heatmapViewMode !== "rolling" || heatmapRange === "1y";
  const activeSourceLabel = useMemo(
    () =>
      contributionSourceOptions
        .filter((option) => selectedSources.includes(option.value))
        .map((option) => option.label)
        .join(" + "),
    [selectedSources]
  );
  const allSourcesEnabled = selectedSources.length === contributionSourceOptions.length;
  const activeDayCount = useMemo(() => {
    if (heatmapViewMode === "all") {
      const activeDays = new Set<string>();
      allYearHeatmaps.forEach((section) => {
        section.cells.forEach((cell) => {
          if (cell.count > 0) activeDays.add(cell.date);
        });
      });
      return activeDays.size;
    }
    return displayHeatmap.filter((cell) => cell.count > 0).length;
  }, [allYearHeatmaps, displayHeatmap, heatmapViewMode]);
  useEffect(() => {
    if (heatmapViewMode !== "all" && expandedYear !== null) {
      setExpandedYear(null);
    }
  }, [expandedYear, heatmapViewMode]);
  const selectedHeatCell = useMemo(
    () => {
      const source =
        heatmapViewMode === "all"
          ? allYearHeatmaps.flatMap((section) => section.cells)
          : displayHeatmap;
      return source.find((cell) => cell.date === selectedHeatDate) ?? null;
    },
    [allYearHeatmaps, displayHeatmap, heatmapViewMode, selectedHeatDate]
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

  const totalTags = new Set(dailyNotes.flatMap((note) => note.tags)).size;
  const averageContribPerActiveDay = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(contributionStats.averagePerActiveDay),
    [contributionStats.averagePerActiveDay]
  );

  const openJumpTarget = () => {
    if (!jumpTarget) return;
    navigate(`/daily/${jumpTarget.note.slug}`);
  };

  const jumpHint = (() => {
    if (!jumpDate || !jumpTarget) return null;
    if (jumpTarget.exact) return `Tanggal ${jumpDate} tersedia.`;
    return `Tidak ada catatan pada ${jumpDate}. Terdekat: ${jumpTarget.note.date}.`;
  })();

  const toggleSource = (source: ContributionKind) => {
    setSelectedSources((current) => {
      if (current.includes(source)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== source);
      }
      return [...current, source];
    });
    setSelectedHeatDate(null);
  };

  const renderHeatmapGrid = (
    cells: DailyHeatmapCell[],
    options: {
      fullWidth?: boolean;
      minWidthClass?: string;
      compact?: boolean;
      showWeekdayLabels?: boolean;
      showMonthLabels?: boolean;
      disableHorizontalScroll?: boolean;
    } = {}
  ) => {
    const fullWidth = options.fullWidth ?? false;
    const compact = options.compact ?? false;
    const showWeekdayLabels = options.showWeekdayLabels ?? true;
    const showMonthLabels = options.showMonthLabels ?? true;
    const disableHorizontalScroll = options.disableHorizontalScroll ?? false;
    const weekCount = getWeekCount(cells);
    const monthMarkers = getMonthMarkers(cells);

    return (
      <div className={cn("pb-1", disableHorizontalScroll ? "overflow-hidden" : "overflow-x-auto")}>
        <div
          className={cn(
            "grid",
            compact ? "gap-1" : "gap-2",
            showWeekdayLabels
              ? fullWidth
                ? "grid-cols-[16px_minmax(0,1fr)] w-full"
                : "grid-cols-[16px_auto] w-max"
              : fullWidth
                ? "grid-cols-[minmax(0,1fr)] w-full"
                : "grid-cols-[auto] w-max"
          )}
        >
          {showWeekdayLabels && (
            <div className={cn("grid grid-rows-7", compact ? "gap-0.5 pt-[12px]" : "gap-1 pt-[18px]")}>
              {["", "M", "", "W", "", "F", ""].map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className={cn(
                    "text-[10px] text-muted-foreground/65",
                    fullWidth ? "min-h-[12px] flex items-center" : "h-[13px] leading-[13px]"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className={fullWidth ? cn("w-full", options.minWidthClass ?? "min-w-[720px]") : "w-max"}>
            {showMonthLabels && (
              <div
                className={cn("relative", compact ? "mb-1 h-3" : "mb-2 h-4")}
                style={{
                  width: fullWidth ? "100%" : `${weekCount * 16}px`,
                }}
              >
                {monthMarkers.map((marker) => (
                  <span
                    key={marker.monthKey}
                    className="absolute top-0 text-[10px] text-muted-foreground/70"
                    style={{
                      left: fullWidth
                        ? `${(marker.weekIndex / Math.max(1, weekCount - 1)) * 100}%`
                        : `${marker.weekIndex * 16}px`,
                    }}
                  >
                    {marker.label}
                  </span>
                ))}
              </div>
            )}
            <div
              className={cn(
                "grid grid-rows-7",
                compact ? "gap-0.5" : "gap-1",
                fullWidth ? "w-full" : "grid-flow-col auto-cols-[12px] w-max"
              )}
              style={
                fullWidth
                  ? { gridAutoFlow: "column", gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }
                  : undefined
              }
            >
              {cells.map((cell) => {
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
                      compact
                        ? "aspect-square w-full rounded-[2px] border border-border/20 transition-colors"
                        : fullWidth
                          ? "aspect-square w-full rounded-[3px] border border-border/20 transition-transform hover:scale-105"
                          : "h-3 w-3 rounded-[3px] border border-border/20 transition-transform hover:scale-110",
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
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Daily</h1>
        <p className="text-muted-foreground text-lg">
          Catatan harian singkat untuk melacak progres, ide, dan hal penting setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <NotebookPen size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{contributionStats.totalDaily}</p>
            <p className="text-xs text-muted-foreground">Total catatan</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{contributionStats.totalContributions}</p>
            <p className="text-xs text-muted-foreground">Total kontribusi</p>
            <p className="text-[10px] text-muted-foreground/75">Hari aktif: {contributionStats.activeDays}</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-400/15 text-sky-300">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{contributionStats.totalTulisan}</p>
            <p className="text-xs text-muted-foreground">Total tulisan</p>
            <p className="text-[10px] text-muted-foreground/75">
              Writing {contributionStats.totalWriting} • Artikel {contributionStats.totalArtikel}
            </p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-highlight/15 text-highlight">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{contributionStats.thisYearContributions}</p>
            <p className="text-xs text-muted-foreground">Kontribusi tahun {currentYear}</p>
            <p className="text-[10px] text-muted-foreground/75">
              Daily {contributionStats.thisYearDaily} • Writing {contributionStats.thisYearWriting} • Artikel {contributionStats.thisYearArtikel}
            </p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-secondary/70 text-muted-foreground">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{averageContribPerActiveDay}</p>
            <p className="text-xs text-muted-foreground">Rata-rata kontribusi/hari aktif</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Contribution Heatmap</h2>
            <p className="text-xs text-muted-foreground/65 mt-1">
              Sumber aktif: {activeSourceLabel}
            </p>
            {!allSourcesEnabled && (
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Menampilkan {filteredContributionStats.totalContributions} dari {contributionStats.totalContributions} kontribusi.
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <span className="text-xs text-muted-foreground/65 sm:text-right">
              Hari aktif: {activeDayCount}
            </span>
            <div className="grid w-full grid-cols-3 rounded-lg border border-border/45 bg-secondary/30 p-0.5 sm:inline-flex sm:w-auto sm:grid-cols-none">
              {heatmapViewModeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHeatmapViewMode(option.value)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px]",
                    heatmapViewMode === option.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {heatmapViewMode === "rolling" && (
              <div className="grid w-full grid-cols-3 rounded-lg border border-border/45 bg-secondary/30 p-0.5 sm:inline-flex sm:w-auto sm:grid-cols-none">
                {heatmapRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setHeatmapRange(option.value)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px]",
                      heatmapRange === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {heatmapViewMode === "year" && availableYears.length > 0 && (
              <select
                value={String(selectedYear)}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="w-full rounded-lg border border-border/45 bg-secondary/30 px-2.5 py-1 text-[11px] text-foreground outline-none focus:ring-2 focus:ring-primary/40 sm:min-w-[112px] sm:w-auto"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    Tahun {year}
                  </option>
                ))}
              </select>
            )}
            <div className="flex w-full flex-wrap gap-1 sm:max-w-[300px] sm:justify-end">
              {contributionSourceOptions.map((option) => {
                const active = selectedSources.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSource(option.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                      active
                        ? "border-primary/60 bg-primary/20 text-primary"
                        : "border-border/45 bg-secondary/20 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {heatmapViewMode === "all" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {allYearHeatmaps.map((section) => {
              const yearlyActiveDays = section.cells.filter((cell) => cell.count > 0).length;
              const yearlyContributionCount = section.cells.reduce((sum, cell) => sum + cell.count, 0);
              const isExpanded = expandedYear === section.year;
              return (
                <div
                  key={section.year}
                  className={cn(
                    "rounded-xl border border-border/40 bg-secondary/20 p-2.5 transition-colors",
                    isExpanded && "lg:col-span-2 p-3 border-primary/25"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-sm font-semibold">Tahun {section.year}</h3>
                      <p className="text-[10px] text-muted-foreground/70">
                        {yearlyActiveDays} hari aktif • {yearlyContributionCount} kontribusi
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedYear((current) => (current === section.year ? null : section.year))
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                        isExpanded
                          ? "border-primary/60 bg-primary/20 text-primary"
                          : "border-border/45 bg-secondary/25 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isExpanded ? "Ringkas" : "Detail"}
                    </button>
                  </div>
                  {renderHeatmapGrid(section.cells, {
                    fullWidth: true,
                    minWidthClass: isExpanded ? "min-w-[560px] md:min-w-0" : "min-w-[380px] md:min-w-0",
                    compact: !isExpanded,
                    showWeekdayLabels: isExpanded,
                    showMonthLabels: isExpanded,
                    disableHorizontalScroll: false,
                  })}
                  {!isExpanded && (
                    <p className="mt-1 text-[10px] text-muted-foreground/65">
                      Klik detail untuk melihat label bulan dan hari pada tahun ini.
                    </p>
                  )}
                </div>
              );
            })}
            {allYearHeatmaps.length === 0 && (
              <p className="text-sm text-muted-foreground/70">Belum ada data kontribusi untuk ditampilkan.</p>
            )}
          </div>
        ) : (
          renderHeatmapGrid(displayHeatmap, {
            fullWidth: isFullWidthHeatmap,
            minWidthClass: isFullWidthHeatmap ? "min-w-[560px] md:min-w-0" : undefined,
            disableHorizontalScroll: false,
          })
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/65">
          <span>Rendah</span>
          <div className="h-2.5 w-2.5 rounded-[3px] bg-secondary/45 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-primary/25 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-primary/45 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-accent/55 border border-border/20" />
          <div className="h-2.5 w-2.5 rounded-[3px] bg-highlight/65 border border-border/20" />
          <span>Tinggi</span>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          {heatmapViewMode === "all"
            ? "Mode semua menampilkan heatmap ringkas per tahun; gunakan tombol detail untuk membuka tahun tertentu."
            : heatmapViewMode === "year"
              ? `Mode tahun menampilkan timeline penuh Januari-Desember ${selectedYear}.`
              : heatmapRange === "1y"
                ? "Mode 1 tahun menampilkan semua bulan agar timeline penuh terlihat."
                : "Rentang kosong di awal disembunyikan otomatis agar heatmap lebih padat."}
        </p>
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
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          sourceStyle
                        )}
                      >
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
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
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-border/60 px-3 py-2 text-sm text-muted-foreground enabled:hover:text-foreground enabled:hover:bg-secondary/40 disabled:opacity-50"
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
