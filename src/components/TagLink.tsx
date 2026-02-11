import { Link } from "react-router-dom";
import { Hash } from "lucide-react";

interface TagLinkProps {
  tag: string;
  size?: "sm" | "md";
}

export default function TagLink({ tag, size = "sm" }: TagLinkProps) {
  return (
    <Link
      to={`/tags?tag=${encodeURIComponent(tag)}`}
      className={`inline-flex items-center gap-1 rounded-full bg-secondary/60 text-muted-foreground hover:bg-primary/15 hover:text-primary transition-all ${
        size === "sm"
          ? "text-[10px] uppercase tracking-wider px-2.5 py-1"
          : "text-xs px-3 py-1.5"
      }`}
    >
      <Hash size={size === "sm" ? 9 : 11} />
      {tag}
    </Link>
  );
}
