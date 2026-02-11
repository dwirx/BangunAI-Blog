import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, BookOpen, ArrowRight } from "lucide-react";
import { posts, readItems } from "@/data/posts";
import TypeBadge from "@/components/TypeBadge";

interface SearchResult {
  type: "post" | "read";
  title: string;
  summary: string;
  url: string;
  postType?: "note" | "essay" | "article";
  source?: string;
  hasContent?: boolean;
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();

    const postResults: SearchResult[] = posts
      .filter((p) => p.title.toLowerCase().includes(lower) || p.summary.toLowerCase().includes(lower) || p.tags.some((t) => t.includes(lower)))
      .map((p) => ({
        type: "post" as const,
        title: p.title,
        summary: p.summary,
        url: p.type === "article" ? `/artikel/${p.slug}` : `/writing/${p.slug}`,
        postType: p.type,
      }));

    const readResults: SearchResult[] = readItems
      .filter((r) => r.title.toLowerCase().includes(lower) || r.snippet.toLowerCase().includes(lower) || r.tags.some((t) => t.includes(lower)))
      .map((r) => ({
        type: "read" as const,
        title: r.title,
        summary: r.snippet,
        url: r.content ? `/read/${r.slug}` : r.url,
        source: r.source,
        hasContent: !!r.content,
      }));

    setResults([...postResults, ...readResults].slice(0, 10));
    setSelectedIndex(0);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) {
      const r = results[selectedIndex];
      if (r.type === "read" && !r.hasContent) window.open(r.url, "_blank");
      else { navigate(r.url); onClose(); }
    }
    if (e.key === "Escape") onClose();
  };

  const handleSelect = (r: SearchResult) => {
    if (r.type === "read" && !r.hasContent) window.open(r.url, "_blank");
    else { navigate(r.url); onClose(); }
  };

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
              placeholder="Cari tulisan, artikel, atau bacaan..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
            <kbd className="hidden md:inline-flex text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          {results.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.map((r, i) => (
                <button
                  key={`${r.url}-${i}`}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl transition-colors ${
                    i === selectedIndex ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {r.type === "post" ? <FileText size={16} className="text-muted-foreground" /> : <BookOpen size={16} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{r.title}</span>
                      {r.postType && <TypeBadge type={r.postType} className="scale-90" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.summary}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground mt-1 flex-shrink-0" />
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
