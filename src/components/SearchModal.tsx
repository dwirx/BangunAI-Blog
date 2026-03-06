import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, BookOpen, ArrowRight, NotebookPen } from "lucide-react";
import { posts, readItems, dailyNotes } from "@/data/posts";
import TypeBadge from "@/components/TypeBadge";
import { searchContent, type SearchResult } from "@/lib/search";
import { splitHighlightSegments } from "@/lib/search-highlight";
import { buildSearchExcerpt } from "@/lib/search-preview";

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const nextResults = searchContent(q, {
      posts,
      readItems,
      dailyNotes,
      limit: 12,
    });
    setResults(nextResults);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      search(query);
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) {
      const r = results[selectedIndex];
      if (r.navigateInternal) { navigate(r.url); onClose(); }
      else window.open(r.url, "_blank");
    }
    if (e.key === "Escape") onClose();
  };

  const handleSelect = (r: SearchResult) => {
    if (r.navigateInternal) { navigate(r.url); onClose(); }
    else window.open(r.url, "_blank");
  };

  const renderHighlighted = (text: string, keyPrefix: string) => {
    const parts = splitHighlightSegments(text, query);
    return parts.map((part, index) =>
      part.match ? (
        <mark
          key={`${keyPrefix}-match-${index}`}
          className="rounded-sm bg-accent/25 px-0.5 text-foreground/95"
        >
          {part.text}
        </mark>
      ) : (
        <span key={`${keyPrefix}-plain-${index}`}>{part.text}</span>
      )
    );
  };

  const resultExcerpt = (r: SearchResult) => buildSearchExcerpt(r.summary, query, 120);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-xl mx-auto mt-[15vh] px-4">
        <div className="glass-card p-0 overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari tulisan, daily note, atau bacaan..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
            <kbd className="hidden md:inline-flex text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          {results.length > 0 && (
            <div className="max-h-[54vh] overflow-y-auto p-2.5">
              {results.map((r, i) => (
                <button
                  key={`${r.url}-${i}`}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left grid grid-cols-[1.6rem_minmax(0,1fr)_0.9rem] items-start gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                    i === selectedIndex
                      ? "bg-secondary border-border/70 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.18)]"
                      : "hover:bg-secondary/45 border-transparent"
                  }`}
                >
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-secondary/50">
                    {r.type === "post" && <FileText size={14} className="text-muted-foreground" />}
                    {r.type === "daily" && <NotebookPen size={14} className="text-primary" />}
                    {r.type === "read" && <BookOpen size={14} className="text-accent" />}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-sm leading-5 font-semibold text-foreground break-words">
                        {renderHighlighted(r.title, `${r.url}-title`)}
                      </span>
                      {r.postType && <TypeBadge type={r.postType} className="!px-2 !py-0.5 !text-[10px]" />}
                      {r.type === "daily" && (
                        <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Daily
                        </span>
                      )}
                      {r.type === "read" && r.source && (
                        <span className="inline-flex rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {r.source}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground line-clamp-2 text-balance">
                      {renderHighlighted(resultExcerpt(r), `${r.url}-summary`)}
                    </p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground/70 mt-1.5 justify-self-end" />
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Tidak ditemukan hasil untuk "{query}"
            </div>
          )}

          {!query && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Ketik untuk mulai mencari...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
