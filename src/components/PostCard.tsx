import { Link } from "react-router-dom";
import { Post } from "@/data/posts";
import TypeBadge from "./TypeBadge";

export function FeaturedCard({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;
  return (
    <Link to={link} className="glass-card group transition-all hover:bg-[hsl(var(--glass-bg-hover))] block">
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type={post.type} />
        <span className="text-xs text-muted-foreground">{post.category}</span>
      </div>
      <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-accent transition-colors">
        {post.title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">{post.summary}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{new Date(post.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>·</span>
        <span>{post.readingTime} min read</span>
      </div>
    </Link>
  );
}

export function ListCard({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;
  return (
    <Link to={link} className="group block py-5 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeBadge type={post.type} />
            <span className="text-xs text-muted-foreground">{post.category}</span>
          </div>
          <h3 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors mb-1">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-1">{post.summary}</p>
        </div>
        <div className="flex-shrink-0 text-right text-xs text-muted-foreground pt-6">
          <span>{new Date(post.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
          <span className="ml-2">{post.readingTime}m</span>
        </div>
      </div>
    </Link>
  );
}

export function CompactRow({ post }: { post: Post }) {
  const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;
  return (
    <Link to={link} className="group flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <TypeBadge type={post.type} />
        <span className="text-sm font-medium group-hover:text-accent transition-colors truncate">
          {post.title}
        </span>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
        {new Date(post.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
      </span>
    </Link>
  );
}
