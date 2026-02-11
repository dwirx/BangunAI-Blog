import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { posts, readItems } from "@/data/posts";
import { ListCard } from "@/components/PostCard";
import { Tag, Hash } from "lucide-react";

export default function Tags() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag");

  // Collect all tags with counts
  const tagData = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    readItems.forEach((r) => r.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, []);

  // Filter posts by active tag
  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts;
    return posts.filter((p) => p.tags.includes(activeTag));
  }, [activeTag]);

  const filteredReads = useMemo(() => {
    if (!activeTag) return [];
    return readItems.filter((r) => r.tags.includes(activeTag));
  }, [activeTag]);

  const handleTagClick = (tag: string) => {
    if (tag === activeTag) {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
          <Tag size={28} />
          Tags
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {activeTag
            ? `Menampilkan konten dengan tag "${activeTag}"`
            : `${tagData.length} tag dari semua konten.`}
        </p>
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            !activeTag
              ? "bg-primary text-primary-foreground"
              : "glass glass-hover text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua
        </button>
        {tagData.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all inline-flex items-center gap-1.5 ${
              tag === activeTag
                ? "bg-primary text-primary-foreground"
                : "glass glass-hover text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hash size={12} />
            {tag}
            <span className={`text-[10px] ml-0.5 ${tag === activeTag ? "opacity-80" : "opacity-50"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div>
        {filteredPosts.length === 0 && filteredReads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Tidak ada konten dengan tag ini.</p>
          </div>
        ) : (
          <>
            {filteredPosts.map((post) => (
              <ListCard key={post.slug} post={post} />
            ))}
            {filteredReads.length > 0 && (
              <div className="mt-8">
                <h2 className="font-heading text-lg font-semibold text-muted-foreground mb-4">Bacaan</h2>
                {filteredReads.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/read/${item.slug}`}
                    className="group flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium group-hover:text-accent transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {item.source}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
