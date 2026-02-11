import { PostType } from "@/data/posts";

interface TypeBadgeProps {
  type: PostType;
  className?: string;
}

export default function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const styles: Record<PostType, string> = {
    note: "badge-note",
    essay: "badge-essay",
    article: "badge-article",
  };

  const labels: Record<PostType, string> = {
    note: "Note",
    essay: "Essay",
    article: "Article",
  };

  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${styles[type]} ${className}`}>
      {labels[type]}
    </span>
  );
}
