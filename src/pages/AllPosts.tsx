import { useState, useMemo } from "react";
import { posts, categories } from "@/data/posts";
import { ListCard } from "@/components/PostCard";
import TagSelect from "@/components/TagSelect";
import { ArrowUpDown } from "lucide-react";

type SortOrder = "newest" | "oldest";

const SECTION_FILTERS = [
  { label: "Semua", value: null },
  { label: "Writing", value: "writing" },
  { label: "Artikel", value: "artikel" },
];

const TYPE_MAP: Record<string, string[]> = {
  writing: ["note", "essay"],
  artikel: ["article"],
};

export default function AllPosts() {
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const allTags = useMemo(
    () => [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    []
  );

  const filtered = useMemo(() => {
    let result = [...posts];
    if (sectionFilter) {
      const types = TYPE_MAP[sectionFilter];
      result = result.filter((p) => types.includes(p.type));
    }
    if (catFilter) result = result.filter((p) => p.category === catFilter);
    if (tagFilter) result = result.filter((p) => p.tags.includes(tagFilter));
    return result.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
  }, [sectionFilter, catFilter, tagFilter, sortOrder]);

  const grouped = useMemo(() => {
    if (sortOrder === "oldest") {
      const map = new Map<number, typeof filtered>();
      filtered.forEach((post) => {
        const year = new Date(post.date).getFullYear();
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push(post);
      });
      return [...map.entries()].sort(([a], [b]) => a - b);
    }
    const map = new Map<number, typeof filtered>();
    filtered.forEach((post) => {
      const year = new Date(post.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(post);
    });
    return [...map.entries()].sort(([a], [b]) => b - a);
  }, [filtered, sortOrder]);

  const activeCount = (sectionFilter ? 1 : 0) + (catFilter ? 1 : 0) + (tagFilter ? 1 : 0);

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Semua Tulisan</h1>
        <p className="text-muted-foreground text-lg">
          Arsip lengkap — artikel, essay, dan catatan.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 space-y-3">
        {/* Section tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/30 border border-border/30 w-fit">
          {SECTION_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => setSectionFilter(f.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                sectionFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Secondary filters + sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  catFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "glass glass-hover text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <TagSelect tags={allTags} selected={tagFilter} onSelect={setTagFilter} placeholder="Tag" />

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder((v) => v === "newest" ? "oldest" : "newest")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full glass glass-hover text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowUpDown size={12} />
            {sortOrder === "newest" ? "Terbaru" : "Terlama"}
          </button>

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => { setSectionFilter(null); setCatFilter(null); setTagFilter(null); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground/50 mb-6">
        {filtered.length} tulisan ditemukan
      </p>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Tidak ada tulisan dengan filter ini.</p>
          <button
            onClick={() => { setSectionFilter(null); setCatFilter(null); setTagFilter(null); }}
            className="text-sm text-accent hover:opacity-80"
          >
            Reset filter
          </button>
        </div>
      ) : (
        grouped.map(([year, yearPosts]) => (
          <div key={year} className="mb-12">
            <div className="flex items-center gap-3 mb-2">
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
