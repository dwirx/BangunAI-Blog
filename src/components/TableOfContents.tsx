import { useState, useEffect, useCallback } from "react";
import { List, ChevronRight, X, ChevronDown } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false); // collapsed by default on mobile
  const [desktopOpen, setDesktopOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const elements = container.querySelectorAll("h2, h3, h4");
      const items: TocItem[] = [];

      elements.forEach((el, i) => {
        if (!el.id) {
          el.id = el.textContent
            ?.toLowerCase()
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

      setHeadings(items);
    }, 600);

    return () => clearTimeout(timer);
  }, [containerSelector]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
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

            {/* Progress indicator */}
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
                    className={`group/item flex items-start gap-1.5 w-full text-left text-[11px] leading-snug py-1.5 rounded-md transition-all duration-200 ${
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
          className="hidden xl:flex fixed top-24 right-6 z-30 items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-card/80 backdrop-blur-lg text-[11px] text-muted-foreground hover:text-foreground shadow-md transition-all hover:shadow-lg"
          aria-label="Show TOC"
        >
          <List size={13} />
          <span className="font-medium">TOC</span>
        </button>
      )}

      {/* ====== MOBILE/TABLET: Collapsible bottom bar ====== */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* Toggle bar - always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-5 py-3 bg-card/95 backdrop-blur-xl border-t border-border/50 text-xs"
        >
          <span className="flex items-center gap-2 text-muted-foreground font-medium">
            <List size={14} />
            Daftar Isi
            <span className="text-muted-foreground/40">({headings.length})</span>
          </span>
          <ChevronDown
            size={14}
            className={`text-muted-foreground/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Expandable content */}
        <div
          className={`bg-card/95 backdrop-blur-xl border-t border-border/30 overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? "max-h-[45vh] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="p-4 space-y-0.5 overflow-y-auto max-h-[38vh]">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              const indent = (h.level - minLevel) * 12 + 12;
              return (
                <button
                  key={h.id}
                  onClick={() => {
                    scrollTo(h.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left text-[13px] leading-relaxed py-2 px-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  style={{ paddingLeft: `${indent}px` }}
                >
                  <ChevronRight
                    size={11}
                    className={`shrink-0 ${isActive ? "text-primary" : "opacity-30"}`}
                  />
                  <span className="line-clamp-1">{h.text}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
