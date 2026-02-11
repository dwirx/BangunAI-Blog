import { useState, useEffect, useCallback } from "react";
import { List, ChevronRight, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(true);

  // Extract headings from rendered MDX
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const elements = container.querySelectorAll("h1, h2, h3, h4");
      const items: TocItem[] = [];

      elements.forEach((el, i) => {
        // Ensure each heading has an id
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
    }, 500); // wait for MDX to render

    return () => clearTimeout(timer);
  }, [containerSelector]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting heading
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
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Offset for fixed navbar
      setTimeout(() => {
        window.scrollBy({ top: -80, behavior: "smooth" });
      }, 100);
    }
  }, []);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <>
      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 lg:hidden p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
          aria-label="Open table of contents"
        >
          <List size={20} />
        </button>
      )}

      {/* Desktop sidebar TOC */}
      <div
        className={`hidden xl:block fixed top-28 right-[max(1rem,calc((100vw-68ch)/2-18rem))] w-56 z-30 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
        }`}
      >
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
              Daftar Isi
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Hide TOC"
            >
              <X size={12} />
            </button>
          </div>
          <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`block w-full text-left text-[11px] leading-relaxed py-1 px-2 rounded-md transition-all duration-200 ${
                  activeId === h.id
                    ? "text-primary bg-primary/10 font-medium"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
                }`}
                style={{ paddingLeft: `${(h.level - minLevel) * 12 + 8}px` }}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </div>

        {/* Show button when hidden on desktop */}
        {!isOpen && null}
      </div>

      {/* Desktop show button when hidden */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden xl:flex fixed top-28 right-4 z-30 items-center gap-1.5 px-3 py-2 rounded-lg glass text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
          aria-label="Show TOC"
        >
          <List size={13} />
          <span>TOC</span>
        </button>
      )}

      {/* Mobile/Tablet bottom sheet style */}
      {isOpen && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
          <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 rounded-t-2xl max-h-[50vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                Daftar Isi
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <nav className="p-4 space-y-0.5 overflow-y-auto max-h-[40vh]">
              {headings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    scrollTo(h.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left text-xs leading-relaxed py-1.5 px-3 rounded-md transition-all duration-200 ${
                    activeId === h.id
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
                  }`}
                  style={{ paddingLeft: `${(h.level - minLevel) * 12 + 12}px` }}
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight size={10} className={activeId === h.id ? "text-primary" : "opacity-30"} />
                    {h.text}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
