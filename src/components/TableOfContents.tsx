import { useState, useEffect, useCallback, useRef } from "react";
import { List, ChevronRight, X, ChevronUp } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  containerSelector?: string;
}

export default function TableOfContents({ containerSelector = ".prose-article" }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const tocRef = useRef<HTMLDivElement>(null);

  // Extract headings after MDX renders
  useEffect(() => {
    const extract = () => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const elements = container.querySelectorAll("h2, h3, h4");
      const items: TocItem[] = [];

      elements.forEach((el, i) => {
        if (!el.id) {
          el.id = (el.textContent || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60) || `heading-${i}`;
        }
        items.push({
          id: el.id,
          text: el.textContent || "",
          level: parseInt(el.tagName[1]),
        });
      });

      if (items.length > 0) setHeadings(items);
    };

    // Try multiple times since MDX content loads async
    const t1 = setTimeout(extract, 300);
    const t2 = setTimeout(extract, 800);
    const t3 = setTimeout(extract, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [containerSelector]);

  // Track active heading
  useEffect(() => {
    if (headings.length === 0) return;

    const callback = () => {
      const scrollY = window.scrollY + 100;
      let current = "";

      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= scrollY) {
          current = h.id;
        }
      }

      if (current) setActiveId(current);
    };

    window.addEventListener("scroll", callback, { passive: true });
    callback(); // initial check

    return () => window.removeEventListener("scroll", callback);
  }, [headings]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <>
      {/* ====== DESKTOP: Fixed sidebar TOC ====== */}
      {desktopOpen ? (
        <div className="hidden xl:block fixed top-24 right-[max(1.5rem,calc((100vw-68ch)/2-20rem))] w-60 z-30">
          <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <List size={11} />
                Daftar Isi
              </span>
              <button
                onClick={() => setDesktopOpen(false)}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/60 transition-colors"
                aria-label="Hide TOC"
              >
                <X size={12} />
              </button>
            </div>

            {/* Progress */}
            <div className="h-px w-full bg-border/40 mb-3">
              <div
                className="h-px bg-primary transition-all duration-300"
                style={{
                  width: activeId
                    ? `${((headings.findIndex((h) => h.id === activeId) + 1) / headings.length) * 100}%`
                    : "0%",
                }}
              />
            </div>

            <nav className="space-y-0.5 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                const indent = (h.level - minLevel) * 14 + 8;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollTo(h.id)}
                    className={`group/item flex items-start gap-1.5 w-full text-left text-[11px] leading-snug py-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                    style={{ paddingLeft: `${indent}px`, paddingRight: "8px" }}
                  >
                    <ChevronRight
                      size={10}
                      className={`mt-[3px] shrink-0 transition-all duration-200 ${
                        isActive ? "text-primary opacity-100" : "opacity-0 group-hover/item:opacity-40"
                      }`}
                    />
                    <span className="line-clamp-2">{h.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDesktopOpen(true)}
          className="hidden xl:flex fixed top-24 right-6 z-30 items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur-lg text-[11px] text-muted-foreground hover:text-foreground shadow-md cursor-pointer transition-all hover:shadow-lg"
          aria-label="Show TOC"
        >
          <List size={13} />
          <span className="font-medium">TOC</span>
        </button>
      )}

      {/* ====== MOBILE/TABLET: Fixed bottom TOC ====== */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50" ref={tocRef}>
        {/* Expandable content (above the toggle bar) */}
        {mobileOpen && (
          <div className="bg-card border-t border-border/40 shadow-2xl">
            <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[45vh]">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                const indent = (h.level - minLevel) * 12 + 12;
                return (
                  <button
                    key={h.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      scrollTo(h.id);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left text-[13px] leading-relaxed py-2.5 px-3 rounded-lg cursor-pointer active:scale-[0.98] transition-all duration-150 ${
                      isActive
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-foreground/70 active:bg-secondary/60"
                    }`}
                    style={{ paddingLeft: `${indent}px` }}
                  >
                    <ChevronRight
                      size={12}
                      className={`shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    <span className="line-clamp-1">{h.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Toggle bar - always visible at bottom */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMobileOpen(!mobileOpen);
          }}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-card border-t border-border/50 cursor-pointer active:bg-secondary/40"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <span className="flex items-center gap-2 text-foreground/80 text-xs font-medium">
            <List size={15} />
            Daftar Isi
            <span className="text-muted-foreground/50 font-normal">· {headings.length} bagian</span>
          </span>
          <ChevronUp
            size={16}
            className={`text-muted-foreground/60 transition-transform duration-300 ${mobileOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </>
  );
}
