import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";
import { createRafThrottle } from "@/lib/raf-throttle";
import SearchModal from "./SearchModal";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Writing", to: "/writing" },
  { label: "Artikel", to: "/artikel" },
  { label: "Read", to: "/read" },
  { label: "Daily", to: "/daily" },
  { label: "Now", to: "/now" },
  { label: "Tags", to: "/tags" },
  { label: "Graph", to: "/graph" },
  { label: "About", to: "/about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isActiveLink = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  useEffect(() => {
    const onScroll = createRafThrottle(() => {
      const nextScrolled = window.scrollY > 10;
      setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
    });

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      onScroll.cancel();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-2"
            : "py-2.5 sm:py-3"
        }`}
      >
        <div className="mx-auto w-full max-w-[1080px] flex items-center justify-between px-3 sm:px-5 lg:px-6">
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-[1.6rem] border border-border/65 bg-background/55 px-2.5 py-1.5 text-base font-semibold tracking-tight text-foreground shadow-[0_18px_44px_-34px_rgba(15,23,42,0.72)] backdrop-blur-xl transition-all duration-300 hover:border-primary/35 hover:bg-background/72 sm:gap-2.5 sm:px-3"
          >
            <img src="/favicon.png" alt="BangunAI" className="h-7 w-7 rounded-full ring-1 ring-border/60" />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-sm sm:text-[15px]">BangunAI</span>
              <span className="hidden text-[9px] uppercase tracking-[0.22em] text-muted-foreground/65 transition-colors group-hover:text-muted-foreground sm:block">
                Notes and ideas
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="glass-nav hidden items-center gap-0.5 rounded-full border border-border/65 px-1.5 py-1 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.82)] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-all ${
                  isActiveLink(link.to)
                    ? "bg-primary/16 text-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                    : "text-muted-foreground/72 hover:bg-secondary/72 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="ml-0.5 rounded-full border border-transparent p-1.5 text-muted-foreground/72 transition-all hover:border-border/70 hover:bg-secondary/72 hover:text-foreground"
              aria-label="Search"
            >
              <Search size={13} />
            </button>
            <ThemeToggle />
          </div>

          {/* Mobile */}
          <div className="glass-nav flex items-center gap-0.5 rounded-full border border-border/65 px-1 py-1 shadow-[0_18px_44px_-32px_rgba(15,23,42,0.72)] md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={15} />
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mx-3 mt-2.5 space-y-1 rounded-[26px] border border-border/65 bg-background/88 p-1.5 shadow-[0_28px_80px_-50px_rgba(15,23,42,0.8)] backdrop-blur-xl sm:mx-5 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-2xl px-3 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-colors ${
                  isActiveLink(link.to)
                    ? "bg-primary/16 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/72 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
