import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "light"}
      className="group relative inline-flex h-9 w-[4.5rem] items-center rounded-full border border-border/70 bg-card/75 px-1 text-muted-foreground shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-primary/45 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="pointer-events-none absolute inset-[3px] rounded-full bg-gradient-to-r from-primary/12 via-transparent to-accent/10 opacity-90" />
      <span
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-[0_10px_20px_-12px_rgba(0,0,0,0.55)] transition-transform duration-500 ${
          theme === "light" ? "translate-x-[2.2rem]" : "translate-x-0"
        }`}
      >
        <Sun
          size={14}
          className={`absolute transition-all duration-300 ${
            theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
          }`}
        />
        <Moon
          size={14}
          className={`absolute transition-all duration-300 ${
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-75 opacity-0"
          }`}
        />
      </span>
      <span className="relative z-[1] ml-1 flex w-full items-center justify-between px-1 text-[10px] uppercase tracking-[0.22em]">
        <Sun size={11} className={`transition-colors ${theme === "light" ? "text-primary" : "text-muted-foreground/45"}`} />
        <Moon size={11} className={`transition-colors ${theme === "dark" ? "text-primary" : "text-muted-foreground/45"}`} />
      </span>
    </button>
  );
}
