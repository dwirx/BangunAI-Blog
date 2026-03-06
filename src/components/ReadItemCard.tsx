import { useNavigate } from "react-router-dom";
import { ReadItem } from "@/data/types";
import { ExternalLink } from "lucide-react";
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
      className={`glass-card group transition-all hover:bg-[hsl(var(--glass-bg-hover))] ${hasContent ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}`}
      role={hasContent ? "link" : undefined}
      tabIndex={hasContent ? 0 : undefined}
      aria-label={hasContent ? `Buka catatan ${item.title}` : undefined}
      onClick={hasContent ? handleCardActivate : undefined}
      onKeyDown={hasContent ? handleCardKeyDown : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold mb-1 group-hover:text-accent transition-colors">
            {item.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{item.snippet}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDateMedium(item.date)}</span>
            <span>·</span>
            <span>{item.source}</span>
            {hasContent && (
              <>
                <span>·</span>
                <span className="text-accent">Ada catatan</span>
              </>
            )}
          </div>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buka sumber eksternal ${item.title}`}
          className="flex-shrink-0 p-2.5 rounded-xl glass glass-hover text-muted-foreground hover:text-accent transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={16} />
        </a>
      </div>
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
