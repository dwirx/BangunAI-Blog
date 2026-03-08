import { useState, useMemo } from "react";
import { getWritingPosts, getWritingTags, categories } from "@/data/posts";
import { ListCard } from "@/components/PostCard";
import FilterChips from "@/components/FilterChips";

const typeOptions = ["Notes", "Essays"];

export default function Writing() {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allWriting = getWritingPosts();
  const allTags = useMemo(() => getWritingTags(), []);

  const filtered = useMemo(() => {
    let result = allWriting;
    if (typeFilter === "Notes") result = result.filter((p) => p.type === "note");
    if (typeFilter === "Essays") result = result.filter((p) => p.type === "essay");
    if (catFilter) result = result.filter((p) => p.category === catFilter);
    if (tagFilter) result = result.filter((p) => p.tags.includes(tagFilter));
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [typeFilter, catFilter, tagFilter, allWriting]);

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Writing</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Catatan pendek dan essay — pikiran yang sedang diproses.
        </p>
      </div>

      <div className="space-y-3 mb-10">
        <FilterChips options={typeOptions} selected={typeFilter} onSelect={setTypeFilter} />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips options={categories} selected={catFilter} onSelect={setCatFilter} />
          {allTags.length > 0 && (
            <select
              value={tagFilter ?? ""}
              onChange={(e) => setTagFilter(e.target.value || null)}
              className="px-3 py-2 text-sm rounded-full glass text-muted-foreground focus:outline-none focus:border-primary/50 bg-transparent"
            >
              <option value="">Semua Tag</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Tidak ada tulisan dengan filter ini.</p>
            <button
              onClick={() => { setTypeFilter(null); setCatFilter(null); setTagFilter(null); }}
              className="text-sm text-accent hover:opacity-80"
            >
              Reset filter
            </button>
          </div>
        ) : (
          filtered.map((post) => <ListCard key={post.slug} post={post} />)
        )}
      </div>
    </div>
  );
}
