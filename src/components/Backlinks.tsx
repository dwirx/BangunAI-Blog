import { Link } from "react-router-dom";
import { allPosts } from "@/content";
import { ArrowUpRight } from "lucide-react";

interface BacklinksProps {
  slug: string;
}

export default function Backlinks({ slug }: BacklinksProps) {
  // Find posts whose content/tags reference this slug
  const backlinks = allPosts.filter(
    (p) =>
      p.slug !== slug &&
      (p.tags.some((t) => t.toLowerCase() === slug.toLowerCase()) ||
        p.summary.toLowerCase().includes(slug.replace(/-/g, " ")))
  );

  if (backlinks.length === 0) return null;

  return (
    <div className="max-w-[68ch] mx-auto mt-10 p-5 rounded-xl border border-border/40 bg-secondary/20">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-3 font-heading">
        Backlinks
      </h3>
      <div className="space-y-2">
        {backlinks.map((p) => {
          const href = p.type === "article" ? `/artikel/${p.slug}` : `/writing/${p.slug}`;
          return (
            <Link
              key={p.slug}
              to={href}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowUpRight size={13} className="text-accent opacity-50 group-hover:opacity-100" />
              {p.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
