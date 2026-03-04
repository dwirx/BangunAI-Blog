import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { allPosts } from "@/content";
import { buildHybridGraph } from "@/lib/graph-engine";
import { ArrowUpRight } from "lucide-react";

interface BacklinksProps {
  slug: string;
}

const DEFAULT_VISIBLE_BACKLINKS = 6;

function getRelevanceTier(relevance: number): {
  label: "Tinggi" | "Sedang" | "Rendah";
  className: string;
} {
  if (relevance >= 7) {
    return {
      label: "Tinggi",
      className: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
    };
  }

  if (relevance >= 5) {
    return {
      label: "Sedang",
      className: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    };
  }

  return {
    label: "Rendah",
    className: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };
}

export default function Backlinks({ slug }: BacklinksProps) {
  const [showAll, setShowAll] = useState(false);

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
      .map((p) => ({
        ...p,
        relevance: edgeWeightByNode.get(p.slug) ?? 0,
      }))
      .sort((a, b) => (edgeWeightByNode.get(b.slug) ?? 0) - (edgeWeightByNode.get(a.slug) ?? 0));
  }, [slug]);

  if (backlinks.length === 0) return null;

  const visibleBacklinks = showAll ? backlinks : backlinks.slice(0, DEFAULT_VISIBLE_BACKLINKS);
  const articleBacklinks = visibleBacklinks.filter((item) => item.type === "article");
  const writingBacklinks = visibleBacklinks.filter((item) => item.type !== "article");
  const hasHiddenItems = backlinks.length > DEFAULT_VISIBLE_BACKLINKS;

  const renderGroup = (
    label: string,
    items: typeof visibleBacklinks
  ) => {
    if (items.length === 0) return null;

    return (
      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground/55">{label}</h4>
          <span className="text-[11px] text-muted-foreground/45">{items.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {items.map((p) => {
            const href = p.type === "article" ? `/artikel/${p.slug}` : `/writing/${p.slug}`;
            const tier = getRelevanceTier(p.relevance);
            return (
              <Link
                key={p.slug}
                to={href}
                className="group min-w-0 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <span className="min-w-0 flex items-center gap-2">
                  <ArrowUpRight
                    size={13}
                    className="shrink-0 text-accent opacity-50 group-hover:opacity-100"
                  />
                  <span className="truncate">{p.title}</span>
                </span>
                <span className="shrink-0 flex items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${tier.className}`}
                  >
                    {tier.label}
                  </span>
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent leading-none">
                    R{p.relevance.toFixed(1)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-[68ch] mx-auto mt-10 p-5 rounded-xl border border-border/40 bg-secondary/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground/50 font-heading">
          Backlinks
        </h3>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/45">
          {backlinks.length} tulisan
        </span>
      </div>

      <div className="relative">
        <div
          data-testid="backlinks-list"
          className={`overflow-y-auto pr-1 transition-[max-height] duration-300 ease-out ${showAll ? "max-h-[28rem]" : "max-h-56"}`}
        >
          <div className="space-y-3">
            {renderGroup("Artikel", articleBacklinks)}
            {renderGroup("Writing", writingBacklinks)}
          </div>
        </div>
        {!showAll && hasHiddenItems && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-secondary/90 to-transparent rounded-b-md" />
        )}
      </div>

      {hasHiddenItems && (
        <div className="mt-3 border-t border-border/35 pt-3">
          <button
            type="button"
          onClick={() => setShowAll((current) => !current)}
          aria-expanded={showAll}
          className="w-full rounded-md border border-border/45 px-3 py-1.5 text-xs text-muted-foreground/75 hover:text-foreground hover:bg-secondary/40 transition-colors"
        >
            {showAll ? `Tampilkan ringkas (${DEFAULT_VISIBLE_BACKLINKS})` : `Lihat semua (${backlinks.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
