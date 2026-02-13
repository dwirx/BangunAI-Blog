import { Link } from "react-router-dom";
import { useMemo } from "react";
import { allPosts } from "@/content";
import { buildHybridGraph } from "@/lib/graph-engine";
import { ArrowUpRight } from "lucide-react";

interface BacklinksProps {
  slug: string;
}

export default function Backlinks({ slug }: BacklinksProps) {
  const backlinks = useMemo(() => {
    const graph = buildHybridGraph(allPosts);
    const connected = graph.neighbors.get(slug);
    if (!connected) return [];

    const edgeWeightByNode = new Map<string, number>();
    graph.edges.forEach((edge) => {
      if (edge.source === slug) edgeWeightByNode.set(edge.target, edge.weight);
      if (edge.target === slug) edgeWeightByNode.set(edge.source, edge.weight);
    });

    return allPosts
      .filter((p) => p.slug !== slug && connected.has(p.slug))
      .sort((a, b) => (edgeWeightByNode.get(b.slug) ?? 0) - (edgeWeightByNode.get(a.slug) ?? 0));
  }, [slug]);

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
