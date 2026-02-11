import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="font-heading text-lg font-bold text-foreground">
            aurora<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/writing" className="hover:text-foreground transition-colors">Writing</Link>
            <Link to="/artikel" className="hover:text-foreground transition-colors">Artikel</Link>
            <Link to="/read" className="hover:text-foreground transition-colors">Read</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026</p>
        </div>
      </div>
    </footer>
  );
}
