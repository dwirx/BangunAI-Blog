import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Post } from "@/data/posts";
import TypeBadge from "./TypeBadge";
import { formatDateMedium, formatDateShort } from "@/lib/date";

export function FeaturedCard({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;

  return (
    <Link
      to={link}
      className="glass-card group relative block overflow-hidden rounded-[28px] border border-border/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-[hsl(var(--glass-bg-hover))]"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/18 via-transparent to-accent/12 opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <TypeBadge type={post.type} />
              <span className="truncate text-xs text-muted-foreground">{post.category}</span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
              {formatDateShort(post.date)}
            </p>
          </div>
          <span className="rounded-full border border-border/55 bg-background/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/68">
            {post.readingTime} min
          </span>
        </div>

        <h3 className="font-heading text-[1.35rem] font-bold leading-tight transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {post.summary}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground/72">
          <span>{formatDateMedium(post.date)}</span>
          <span className="inline-flex items-center gap-1.5 text-accent transition-transform duration-300 group-hover:translate-x-0.5">
            Buka
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListCard({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;

  return (
    <Link to={link} className="group block border-b border-border last:border-0 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <TypeBadge type={post.type} />
            <span className="text-xs text-muted-foreground">{post.category}</span>
          </div>
          <h3 className="mb-1 font-heading text-lg font-semibold transition-colors group-hover:text-accent">
            {post.title}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">{post.summary}</p>
        </div>
        <div className="flex-shrink-0 pt-6 text-right text-xs text-muted-foreground">
          <span>{formatDateShort(post.date)}</span>
          <span className="ml-2">{post.readingTime}m</span>
        </div>
      </div>
    </Link>
  );
}

export function CompactRow({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;

  return (
    <Link
      to={link}
      className="group flex items-center justify-between gap-4 rounded-[20px] px-3 py-3 transition-colors hover:bg-[hsl(var(--glass-bg-hover))]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <TypeBadge type={post.type} className="shrink-0" />
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium transition-colors group-hover:text-accent sm:text-[15px]">
            {post.title}
          </span>
          <span className="text-xs text-muted-foreground/62">{post.category}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <span className="hidden sm:inline">{formatDateShort(post.date)}</span>
        <ArrowRight
          size={14}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
