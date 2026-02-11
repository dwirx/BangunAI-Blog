import { Link } from "react-router-dom";
import { allPosts } from "@/content";

interface WikiLinkProps {
  to: string;
  label?: string;
}

export default function WikiLink({ to, label }: WikiLinkProps) {
  const slug = to.toLowerCase().replace(/\s+/g, "-");
  const post = allPosts.find((p) => p.slug === slug);
  const displayText = label || to;

  if (post) {
    const href = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;
    return (
      <Link
        to={href}
        className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-all inline-flex items-center gap-0.5"
        title={post.title}
      >
        {displayText}
      </Link>
    );
  }

  return (
    <span className="text-muted-foreground/50 line-through cursor-not-allowed" title="Page not found">
      {displayText}
    </span>
  );
}
