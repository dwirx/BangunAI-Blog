import { useState, useMemo } from "react";
import { getArticlePosts, categories } from "@/data/posts";
import { ListCard } from "@/components/PostCard";
import FilterChips from "@/components/FilterChips";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Articles() {
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const allArticles = getArticlePosts();

  const filtered = useMemo(() => {
    let result = allArticles;
    if (catFilter) result = result.filter((p) => p.category === catFilter);
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [catFilter, allArticles]);

  // Group by year
  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    filtered.forEach((post) => {
      const year = new Date(post.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(post);
    });
    return [...map.entries()].sort(([a], [b]) => b - a);
  }, [filtered]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-12">
        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Artikel</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Arsip tulisan panjang — tutorial, opini, dan panduan.
          </p>
        </div>

        <div className="mb-10">
          <FilterChips options={categories} selected={catFilter} onSelect={setCatFilter} />
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Tidak ada artikel dengan filter ini.</p>
            <button onClick={() => setCatFilter(null)} className="text-sm text-accent hover:opacity-80">
              Reset filter
            </button>
          </div>
        ) : (
          grouped.map(([year, posts]) => (
            <div key={year} className="mb-12">
              <h2 className="font-heading text-xl font-bold text-muted-foreground mb-4">{year}</h2>
              {posts.map((post) => (
                <ListCard key={post.slug} post={post} />
              ))}
            </div>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}
