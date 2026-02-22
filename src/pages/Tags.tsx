import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { posts, readItems } from "@/data/posts";
import { Hash, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildTagStats, filterTagStatsByQuery, getTagDensity } from "@/lib/tags";
import TypeBadge from "@/components/TypeBadge";
import { formatDateShort } from "@/lib/date";

export default function Tags() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagQuery, setTagQuery] = useState("");
  const [showAllTagsMobile, setShowAllTagsMobile] = useState(false);
  const [showTagPanelMobile, setShowTagPanelMobile] = useState(false);
  const [resultView, setResultView] = useState<"all" | "posts" | "reads">("all");
  const [postLimit, setPostLimit] = useState(14);
  const [readLimit, setReadLimit] = useState(10);
  const activeTag = searchParams.get("tag");

  const tagData = useMemo(() => {
    return buildTagStats(posts, readItems);
  }, []);

  const allPostsSorted = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const allReadsSorted = useMemo(() => {
    return [...readItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return allPostsSorted;
    return allPostsSorted.filter((p) => p.tags.includes(activeTag));
  }, [activeTag, allPostsSorted]);

  const filteredReads = useMemo(() => {
    if (!activeTag) return allReadsSorted;
    return allReadsSorted.filter((r) => r.tags.includes(activeTag));
  }, [activeTag, allReadsSorted]);

  const visibleTags = useMemo(() => filterTagStatsByQuery(tagData, tagQuery), [tagData, tagQuery]);
  const visibleTagCount = visibleTags.length;
  const displayedTags = useMemo(() => {
    if (showAllTagsMobile) return visibleTags;
    return visibleTags.slice(0, 24);
  }, [showAllTagsMobile, visibleTags]);
  const topTags = useMemo(() => tagData.slice(0, 10), [tagData]);

  const tagCountRange = useMemo(() => {
    const maxCount = tagData[0]?.count ?? 1;
    const minCount = tagData[tagData.length - 1]?.count ?? maxCount;
    return { minCount, maxCount };
  }, [tagData]);

  const totalResults = filteredPosts.length + filteredReads.length;
  const displayedPosts = useMemo(() => filteredPosts.slice(0, postLimit), [filteredPosts, postLimit]);
  const displayedReads = useMemo(() => filteredReads.slice(0, readLimit), [filteredReads, readLimit]);

  const handleTagClick = (tag: string) => {
    setShowAllTagsMobile(false);
    setShowTagPanelMobile(false);
    setPostLimit(14);
    setReadLimit(10);
    if (tag === activeTag) {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  useEffect(() => {
    setShowAllTagsMobile(false);
  }, [tagQuery]);

  useEffect(() => {
    setPostLimit(14);
    setReadLimit(10);
  }, [activeTag, resultView]);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-24 pb-12 overflow-x-clip">
      <div className="w-full mb-8 sm:mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
          <Tag size={26} />
          Tags
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8">
          {activeTag
            ? `Menampilkan konten dengan tag "${activeTag}"`
            : `Menampilkan semua konten dari ${tagData.length} tag.`}
        </p>
      </div>

      <div className="lg:hidden mb-4 w-full">
        <div className="glass rounded-[20px] border border-border/70 p-3 sm:p-4 w-full">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Quick Tags</p>
            <button
              onClick={() => setShowTagPanelMobile((prev) => !prev)}
              className="text-xs text-accent hover:opacity-80"
              aria-expanded={showTagPanelMobile}
              aria-controls="mobile-tag-panel"
            >
              {showTagPanelMobile ? "Tutup Navigator" : "Buka Navigator"}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSearchParams({})}
              className={`whitespace-nowrap rounded-full border transition-all text-[11px] px-3 py-1.5 ${
                !activeTag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "glass glass-hover text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              Semua
            </button>
            {topTags.map((item) => (
              <button
                key={item.tag}
                onClick={() => handleTagClick(item.tag)}
                className={`whitespace-nowrap rounded-full border transition-all text-[11px] px-3 py-1.5 ${
                  activeTag === item.tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "glass glass-hover text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                }`}
              >
                #{item.tag} ({item.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start w-full">
        <aside
          id="mobile-tag-panel"
          className={`${showTagPanelMobile ? "block" : "hidden"} lg:block glass rounded-[20px] border border-border/70 p-4 sm:p-6 lg:sticky lg:top-24 h-fit w-full`}
        >
          <div className="flex items-center justify-between gap-3 mb-2 lg:hidden">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Navigator Detail</p>
            <button
              onClick={() => setShowTagPanelMobile(false)}
              className="text-xs text-accent hover:opacity-80"
            >
              Tutup
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tagQuery}
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder="Cari tag..."
              className="h-9 sm:h-10 pl-9 bg-transparent border-border/80 text-sm"
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tag Navigator</p>
            <p className="text-xs text-muted-foreground">{visibleTagCount} terlihat</p>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[32vh] sm:max-h-[45vh] lg:max-h-[60vh] overflow-y-auto pr-1">
            <button
              onClick={() => {
                setShowTagPanelMobile(false);
                setSearchParams({});
              }}
              className={`rounded-full border transition-all inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 ${
                !activeTag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "glass glass-hover text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              Semua
            </button>
            {displayedTags.map(({ tag, count, postCount, readCount }) => {
              const density = getTagDensity(count, tagCountRange.minCount, tagCountRange.maxCount);
              const sizeClass =
                density > 0.78
                  ? "text-xs sm:text-sm px-3 sm:px-3.5 py-1.5 sm:py-2"
                  : density > 0.58
                    ? "text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5"
                    : "text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1";
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`rounded-full border transition-all inline-flex items-center gap-1.5 ${sizeClass} ${
                    tag === activeTag
                      ? "bg-primary text-primary-foreground border-primary"
                      : "glass glass-hover text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <Hash size={12} />
                  <span>{tag}</span>
                  <span className={`text-[10px] ${tag === activeTag ? "opacity-90" : "opacity-65"}`}>
                    {count}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] ${tag === activeTag ? "opacity-75" : "opacity-45"}`}>
                    {postCount}/{readCount}
                  </span>
                </button>
              );
            })}
          </div>
          {visibleTagCount === 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Tidak ada tag yang cocok. Coba kata kunci lain.
            </p>
          )}

          {!showAllTagsMobile && visibleTagCount > 24 && (
            <button
              onClick={() => setShowAllTagsMobile(true)}
              className="mt-3 text-xs text-accent hover:opacity-80"
            >
              Lihat semua tag ({visibleTagCount})
            </button>
          )}
        </aside>

        <div className="w-full min-w-0">
          {totalResults === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Tidak ada konten dengan tag ini.</p>
            </div>
          ) : (
            <>
              <div className="glass rounded-[20px] border border-border/70 p-3 sm:p-4 mb-4 sm:mb-6 w-full">
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Hasil Tag
                </p>
                <div className="flex flex-wrap items-center gap-2.5 justify-between">
                  <h2 className="font-heading text-lg sm:text-xl font-bold">
                    {activeTag ? `#${activeTag}` : "Semua Konten"}
                  </h2>
                  {activeTag && (
                    <button
                      onClick={() => setSearchParams({})}
                      className="text-xs text-accent hover:opacity-80"
                    >
                      Reset ke semua
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
                  {totalResults} konten ditemukan ({filteredPosts.length} tulisan, {filteredReads.length} bacaan)
                </p>
                <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                  {[
                    { key: "all", label: "Semua" },
                    { key: "posts", label: `Tulisan (${filteredPosts.length})` },
                    { key: "reads", label: `Bacaan (${filteredReads.length})` },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setResultView(item.key as "all" | "posts" | "reads")}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] sm:text-xs border transition-all ${
                        resultView === item.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "glass glass-hover text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {(resultView === "all" || resultView === "posts") && (
                <div className="grid gap-3 sm:gap-4 w-full">
                  {displayedPosts.map((post) => {
                    const link = post.type === "article" ? `/artikel/${post.slug}` : `/writing/${post.slug}`;
                    return (
                      <Link
                        key={post.slug}
                        to={link}
                        className="group glass rounded-[18px] border border-border/70 p-4 sm:p-5 block transition-all hover:bg-[hsl(var(--glass-bg-hover))] w-full min-w-0"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <TypeBadge type={post.type} />
                          <span className="text-[11px] sm:text-xs text-muted-foreground">{post.category}</span>
                        </div>
                        <h3 className="font-heading text-[19px] sm:text-xl font-bold leading-tight mb-2 group-hover:text-accent transition-colors break-words">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm sm:text-base line-clamp-2 mb-4">
                          {post.summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground">
                          <span>{formatDateShort(post.date)}</span>
                          <span>·</span>
                          <span>{post.readingTime} min read</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
              {(resultView === "all" || resultView === "posts") && filteredPosts.length > displayedPosts.length && (
                <button
                  onClick={() => setPostLimit((prev) => prev + 14)}
                  className="mt-3 text-xs text-accent hover:opacity-80"
                >
                  Muat lebih banyak tulisan ({filteredPosts.length - displayedPosts.length} tersisa)
                </button>
              )}

              {(resultView === "all" || resultView === "reads") && filteredReads.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-heading text-base sm:text-lg font-semibold text-muted-foreground mb-4">
                    Bacaan
                  </h3>
                  <div className="glass rounded-[18px] overflow-hidden border border-border/70">
                    {displayedReads.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/read/${item.slug}`}
                        className="group flex items-center justify-between gap-3 py-3 px-3.5 sm:px-4 border-b border-border/60 last:border-0"
                      >
                        <span className="text-sm font-medium group-hover:text-accent transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground flex-shrink-0 max-w-[40%] truncate text-right">
                          {item.source}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {filteredReads.length > displayedReads.length && (
                    <button
                      onClick={() => setReadLimit((prev) => prev + 10)}
                      className="mt-3 text-xs text-accent hover:opacity-80"
                    >
                      Muat lebih banyak bacaan ({filteredReads.length - displayedReads.length} tersisa)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
