import { useState, useMemo } from "react";
import { posts, categories } from "@/data/posts";
import { ListCard } from "@/components/PostCard";
import FilterChips from "@/components/FilterChips";
import TagSelect from "@/components/TagSelect";

const typeOptions = ["Article", "Essay", "Note"];

export default function AllPosts() {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(
    () => [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    []
  );

  const filtered = useMemo(() => {
    let result = [...posts];
    if (typeFilter === "Article") result = result.filter((p) => p.type === "article");
    else if (typeFilter === "Essay") result = result.filter((p) => p.type === "essay");
    else if (typeFilter === "Note") result = result.filter((p) => p.type === "note");
    if (catFilter) result = result.filter((p) => p.category === catFilter);
    if (tagFilter) result = result.filter((p) => p.tags.includes(tagFilter));
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [typeFilter, catFilter, tagFilter]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    filtered.forEach((post) => {
      const year = new Date(post.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(post);
    });
    return [...map.entries()].sort(([a], [b]) => b - a);
  }, [filtered]);

  const activeCount = (typeFilter ? 1 : 0) + (catFilter ? 1 : 0) + (tagFilter ? 1 : 0);

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Semua Tulisan</h1>
        <p className="text-muted-foreground text-lg">
          Arsip lengkap — artikel, essay, dan catatan.{" "}
          <span className="text-sm text-muted-foreground/60">{filtered.length} tulisan</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-10">
        <FilterChips options={typeOptions} selected={typeFilter} onSelect={setTypeFilter} />
        <FilterChips options={categories} selected={catFilter} onSelect={setCatFilter} />
        <TagSelect tags={allTags} selected={tagFilter} onSelect={setTagFilter} placeholder="Tag" />
        {activeCount > 0 && (
          <button
            onClick={() => { setTypeFilter(null); setCatFilter(null); setTagFilter(null); }}
            className="px-4 py-2 text-sm font-medium rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Tidak ada tulisan dengan filter ini.</p>
          <button
            onClick={() => { setTypeFilter(null); setCatFilter(null); setTagFilter(null); }}
            className="text-sm text-accent hover:opacity-80"
          >
            Reset filter
          </button>
        </div>
      ) : (
        grouped.map(([year, yearPosts]) => (
          <div key={year} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-heading text-xl font-bold text-muted-foreground">{year}</h2>
              <span className="text-xs text-muted-foreground/40">{yearPosts.length} tulisan</span>
            </div>
            {yearPosts.map((post) => (
              <ListCard key={post.slug} post={post} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
