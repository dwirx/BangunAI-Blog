import { useNavigate } from "react-router-dom";
import { ReadItem } from "@/data/types";
import { ArrowRight, ExternalLink } from "lucide-react";
import { formatDateMedium } from "@/lib/date";

export default function ReadItemCard({ item }: { item: ReadItem }) {
  const hasContent = !!item.hasBody;
  const navigate = useNavigate();

  const handleCardActivate = () => {
    if (hasContent) {
      navigate(`/read/${item.slug}`);
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasContent) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/read/${item.slug}`);
    }
  };

  return (
    <div
      className={`glass-card group relative overflow-hidden rounded-[28px] border border-border/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-[hsl(var(--glass-bg-hover))] ${hasContent ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}`}
      role={hasContent ? "link" : undefined}
      tabIndex={hasContent ? 0 : undefined}
      aria-label={hasContent ? `Buka catatan ${item.title}` : undefined}
      onClick={hasContent ? handleCardActivate : undefined}
      onKeyDown={hasContent ? handleCardKeyDown : undefined}
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-accent/14 via-transparent to-primary/10 opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/55 bg-background/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/68">
              {item.source}
            </span>
            {hasContent ? (
              <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
                Ada catatan
              </span>
            ) : null}
          </div>
          <h3 className="mb-1 font-heading text-lg font-semibold transition-colors group-hover:text-accent">
            {item.title}
          </h3>
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.snippet}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDateMedium(item.date)}</span>
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buka sumber eksternal ${item.title}`}
          className="relative shrink-0 rounded-xl border border-border/60 bg-background/50 p-2.5 text-muted-foreground transition-colors hover:text-accent"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={16} />
        </a>
      </div>
      {hasContent ? (
        <div className="relative mt-5 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground/72">
          <span>Ringkasan tersimpan di dalam blog</span>
          <span className="inline-flex items-center gap-1.5 text-accent">
            Buka
            <ArrowRight size={13} />
          </span>
        </div>
      ) : null}
      {item.tags.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
