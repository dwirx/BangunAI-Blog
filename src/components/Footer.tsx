import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 py-6 border-t border-border/40">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/60">© 2026</p>
        <div className="flex items-center gap-5">
          <Link to="/writing" className="text-[11px] uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">Writing</Link>
          <Link to="/artikel" className="text-[11px] uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">Artikel</Link>
          <Link to="/read" className="text-[11px] uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">Read</Link>
          <Link to="/about" className="text-[11px] uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">About</Link>
        </div>
      </div>
    </footer>
  );
}
