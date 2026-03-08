import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, BookOpen, NotebookPen, Clock, X } from "lucide-react";
import { posts, readItems, dailyNotes } from "@/data/posts";
import TypeBadge from "@/components/TypeBadge";
import { getSearchSuggestion, searchContent, type SearchResult } from "@/lib/search";
import { splitHighlightSegments } from "@/lib/search-highlight";
import { buildSearchExcerpt } from "@/lib/search-preview";
import { formatDateShort } from "@/lib/date";

type FilterTab = "all" | "post" | "daily" | "read";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "post", label: "Tulisan" },
  { value: "daily", label: "Daily" },
  { value: "read", label: "Bacaan" },
];

const RECENT_KEY = "search_recent";
const MAX_RECENT = 6;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(q: string) {
  const prev = getRecent().filter((r) => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(q: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter((r) => r !== q)));
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setSuggestion(null); return; }
    const next = searchContent(q, { posts, readItems, dailyNotes, limit: 20 });
    setResults(next);
    setSuggestion(next.length === 0 ? getSearchSuggestion(q, { posts, readItems, dailyNotes, limit: 20 }) : null);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => search(query), 100);
    return () => window.clearTimeout(id);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSuggestion(null);
      setActiveTab("all");
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filteredResults = activeTab === "all" ? results : results.filter((r) => r.type === activeTab);

  const handleSelect = useCallback((r: SearchResult) => {
    if (query.trim()) saveRecent(query.trim());
    if (r.navigateInternal) { navigate(r.url); onClose(); }
    else window.open(r.url, "_blank");
  }, [query, navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filteredResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filteredResults[selectedIndex]) { handleSelect(filteredResults[selectedIndex]); }
    if (e.key === "Enter" && filteredResults.length === 0 && suggestion) { e.preventDefault(); setQuery(suggestion); }
    if (e.key === "Escape") onClose();
  };

  const renderHighlighted = (text: string, key: string) =>
    splitHighlightSegments(text, query).map((part, i) =>
      part.match
        ? <mark key={`${key}-${i}`} className="rounded-sm bg-accent/25 px-0.5 text-foreground/95">{part.text}</mark>
        : <span key={`${key}-${i}`}>{part.text}</span>
    );

  const excerpt = (r: SearchResult) => buildSearchExcerpt(r.preview || r.summary, query, 110);

  const countByType = (type: SearchResult["type"]) => results.filter((r) => r.type === type).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-2xl mx-auto mt-[12vh] px-4">
        <div className="glass-card p-0 overflow-hidden shadow-2xl border border-border/60">

          {/* Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
            <Search size={17} className="text-muted-foreground/60 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari tulisan, daily note, bacaan..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                <X size={15} />
              </button>
            )}
            <kbd className="hidden md:inline-flex text-[10px] text-muted-foreground/40 bg-secondary/60 px-1.5 py-0.5 rounded border border-border/30">ESC</kbd>
          </div>

          {/* Filter tabs — hanya muncul kalau ada hasil */}
          {results.length > 0 && (
            <div className="flex items-center gap-1 px-3 pt-2.5 pb-0">
              {FILTER_TABS.map((tab) => {
                const count = tab.value === "all" ? results.length : countByType(tab.value);
                if (tab.value !== "all" && count === 0) return null;
                return (
                  <button
                    key={tab.value}
                    onClick={() => { setActiveTab(tab.value); setSelectedIndex(0); }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      activeTab === tab.value
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] tabular-nums ${activeTab === tab.value ? "text-primary/70" : "text-muted-foreground/40"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Results */}
          {filteredResults.length > 0 && (
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2.5 pt-2">
              {filteredResults.map((r, i) => (
                <button
                  key={`${r.url}-${i}`}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left flex items-start gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                    i === selectedIndex
                      ? "bg-secondary border-border/60 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.15)]"
                      : "hover:bg-secondary/40 border-transparent"
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-secondary/60">
                    {r.type === "post" && <FileText size={13} className="text-muted-foreground" />}
                    {r.type === "daily" && <NotebookPen size={13} className="text-primary" />}
                    {r.type === "read" && <BookOpen size={13} className="text-accent" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-foreground leading-5">
                        {renderHighlighted(r.title, `${r.url}-title`)}
                      </span>
                      {r.postType && <TypeBadge type={r.postType} className="!px-1.5 !py-0.5 !text-[9px]" />}
                      {r.type === "daily" && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">Daily</span>
                      )}
                      {r.type === "read" && r.source && (
                        <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">{r.source}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/65 line-clamp-1">
                      {renderHighlighted(excerpt(r), `${r.url}-summary`)}
                    </p>
                  </div>

                  {/* Date */}
                  <span className="flex-shrink-0 text-[10px] text-muted-foreground/35 mt-0.5 tabular-nums">
                    {formatDateShort(r.date)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query && results.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground px-4">
              <p>Tidak ada hasil untuk "<span className="text-foreground/80">{query}</span>"</p>
              {suggestion && (
                <button
                  onClick={() => setQuery(suggestion)}
                  className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Mungkin maksudmu: <span className="underline underline-offset-2 text-accent">{suggestion}</span>
                </button>
              )}
            </div>
          )}

          {/* Empty state — recent + tips */}
          {!query && (
            <div className="pb-4">
              {recent.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40">Pencarian terakhir</p>
                    <button
                      onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                      className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      Hapus semua
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <div key={r} className="flex items-center gap-1 rounded-lg bg-secondary/40 border border-border/30 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground group transition-colors">
                        <button onClick={() => setQuery(r)} className="flex items-center gap-1.5">
                          <Clock size={11} className="text-muted-foreground/40" />
                          {r}
                        </button>
                        <button
                          onClick={() => { removeRecent(r); setRecent(getRecent()); }}
                          className="ml-1 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-4 pt-3 text-center">
                <p className="text-xs text-muted-foreground/50 mb-2">Tips pencarian lanjutan:</p>
                <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
                  {["type:daily", "type:article", "tag:ai", "source:youtube", "cat:Tech"].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setQuery(tip + " ")}
                      className="rounded bg-secondary/60 px-2 py-1 font-mono text-muted-foreground/70 hover:text-foreground hover:bg-secondary transition-colors border border-border/20"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border/30 px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground/35">
            <span><kbd className="font-sans">↑↓</kbd> navigasi</span>
            <span><kbd className="font-sans">↵</kbd> buka</span>
            <span><kbd className="font-sans">ESC</kbd> tutup</span>
            {results.length > 0 && (
              <span className="ml-auto">{filteredResults.length} hasil</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
