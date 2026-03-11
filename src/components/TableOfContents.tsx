import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronUp, List, X } from "lucide-react";
import { createRafThrottle } from "@/lib/raf-throttle";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  containerSelector?: string;
}

export default function TableOfContents({
  containerSelector = ".prose-article",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const tocRef = useRef<HTMLDivElement>(null);
  const headingElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const extract = () => {
      const container = document.querySelector(containerSelector);
      if (!(container instanceof HTMLElement)) return false;

      const elements = Array.from(container.querySelectorAll<HTMLElement>("h2, h3, h4"));
      if (elements.length === 0) return false;

      const items = elements.map((el, index) => {
        if (!el.id) {
          el.id =
            (el.textContent || "")
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .slice(0, 60) || `heading-${index}`;
        }

        return {
          id: el.id,
          text: el.textContent || "",
          level: Number.parseInt(el.tagName[1], 10),
        };
      });

      headingElementsRef.current = elements;
      setHeadings(items);
      return true;
    };

    let attempts = 0;
    let retryId: number | undefined;

    const retryExtract = () => {
      if (extract()) return;
      if (attempts >= 24) return;
      attempts += 1;
      retryId = window.setTimeout(retryExtract, 125);
    };

    retryExtract();

    return () => {
      if (retryId) {
        window.clearTimeout(retryId);
      }
    };
  }, [containerSelector]);

  useEffect(() => {
    if (headings.length === 0) return;

    const updateActiveHeading = () => {
      const scrollY = window.scrollY + 132;
      let current = headingElementsRef.current[0]?.id ?? "";

      for (const heading of headingElementsRef.current) {
        if (heading.offsetTop <= scrollY) {
          current = heading.id;
        } else {
          break;
        }
      }

      if (current) {
        setActiveId((prev) => (prev === current ? prev : current));
      }
    };

    const throttledUpdate = createRafThrottle(updateActiveHeading);
    updateActiveHeading();

    window.addEventListener("scroll", throttledUpdate, { passive: true });
    window.addEventListener("resize", throttledUpdate);

    return () => {
      throttledUpdate.cancel();
      window.removeEventListener("scroll", throttledUpdate);
      window.removeEventListener("resize", throttledUpdate);
    };
  }, [headings]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleClickOutside = (event: PointerEvent) => {
      if (tocRef.current && !tocRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [mobileOpen]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((heading) => heading.level));

  return (
    <>
      {desktopOpen ? (
        <div className="fixed right-[max(1rem,calc((100vw-68ch)/2-18.5rem))] top-28 z-30 hidden w-56 xl:block">
          <div className="rounded-[22px] border border-border/60 bg-card/78 p-4 shadow-[0_24px_65px_-40px_rgba(15,23,42,0.7)] backdrop-blur-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <List size={11} />
                Daftar Isi
              </span>
              <button
                onClick={() => setDesktopOpen(false)}
                className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-secondary/60 hover:text-foreground"
                aria-label="Hide TOC"
              >
                <X size={12} />
              </button>
            </div>

            <div className="mb-3 h-px w-full bg-border/40">
              <div
                className="h-px bg-primary transition-all duration-300"
                style={{
                  width: activeId
                    ? `${((headings.findIndex((heading) => heading.id === activeId) + 1) / headings.length) * 100}%`
                    : "0%",
                }}
              />
            </div>

            <nav className="scrollbar-thin max-h-[55vh] space-y-0.5 overflow-y-auto pr-1">
              {headings.map((heading) => {
                const isActive = activeId === heading.id;
                const indent = (heading.level - minLevel) * 14 + 8;

                return (
                  <button
                    key={heading.id}
                    onClick={() => scrollTo(heading.id)}
                    className={`group/item flex w-full items-start gap-1.5 rounded-md py-1.5 text-left text-[11px] leading-snug transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                    style={{ paddingLeft: `${indent}px`, paddingRight: "8px" }}
                  >
                    <ChevronRight
                      size={10}
                      className={`mt-[3px] shrink-0 transition-all duration-200 ${
                        isActive ? "text-primary opacity-100" : "opacity-0 group-hover/item:opacity-40"
                      }`}
                    />
                    <span className="line-clamp-2">{heading.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDesktopOpen(true)}
          className="fixed right-6 top-28 z-30 hidden cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-card/82 px-3 py-2 text-[11px] text-muted-foreground shadow-md transition-all hover:text-foreground hover:shadow-lg xl:flex"
          aria-label="Show TOC"
        >
          <List size={13} />
          <span className="font-medium">TOC</span>
        </button>
      )}

      <div
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 z-50 xl:hidden"
        ref={tocRef}
      >
        {mobileOpen ? (
          <div
            id="mobile-toc"
            className="mb-3 w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] border border-border/60 bg-card/92 p-3 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Daftar Isi
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1 text-muted-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
                aria-label="Tutup daftar isi"
              >
                <X size={14} />
              </button>
            </div>

            <nav className="max-h-[52vh] space-y-1 overflow-y-auto">
              {headings.map((heading) => {
                const isActive = activeId === heading.id;
                const indent = (heading.level - minLevel) * 12 + 10;

                return (
                  <button
                    key={heading.id}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      scrollTo(heading.id);
                      setMobileOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] leading-relaxed transition-all duration-150 active:scale-[0.98] ${
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground/70 active:bg-secondary/60"
                    }`}
                    style={{ paddingLeft: `${indent}px` }}
                  >
                    <ChevronRight
                      size={12}
                      className={`shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    <span className="line-clamp-1">{heading.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ) : null}

        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMobileOpen((current) => !current);
          }}
          className="flex items-center gap-2 rounded-full border border-border/65 bg-card/88 px-4 py-3 text-sm font-medium text-foreground shadow-[0_22px_55px_-32px_rgba(15,23,42,0.8)] backdrop-blur-xl"
          aria-expanded={mobileOpen}
          aria-controls="mobile-toc"
        >
          <List size={16} />
          <span>Daftar Isi</span>
          <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">
            {headings.length}
          </span>
          <ChevronUp
            size={16}
            className={`transition-transform duration-200 ${mobileOpen ? "rotate-0" : "rotate-180"}`}
          />
        </button>
      </div>
    </>
  );
}
