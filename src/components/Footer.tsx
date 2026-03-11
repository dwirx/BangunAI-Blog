import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 pb-8 pt-6">
      <div className="container mx-auto px-6">
        <div className="glass-card flex flex-col gap-5 rounded-[28px] px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/58">
              BangunAI
            </p>
            <p className="mt-3 font-heading text-xl font-bold tracking-tight">
              Tempat untuk menyimpan ide sebelum hilang.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Writing, artikel, bacaan, dan daily notes disusun supaya lebih enak dibuka lagi di lain waktu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Link to="/writing" className="rounded-full border border-border/60 px-3 py-1.5 transition-colors hover:text-foreground">
              Writing
            </Link>
            <Link to="/read" className="rounded-full border border-border/60 px-3 py-1.5 transition-colors hover:text-foreground">
              Read
            </Link>
            <Link to="/daily" className="rounded-full border border-border/60 px-3 py-1.5 transition-colors hover:text-foreground">
              Daily
            </Link>
            <Link to="/about" className="rounded-full border border-border/60 px-3 py-1.5 transition-colors hover:text-foreground">
              About
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40">
          © 2026 BangunAI
        </p>
      </div>
    </footer>
  );
}
