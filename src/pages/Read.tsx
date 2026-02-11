import { useState, useMemo } from "react";
import { readItems } from "@/data/posts";
import ReadItemCard from "@/components/ReadItemCard";
import FilterChips from "@/components/FilterChips";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Calendar, Hash } from "lucide-react";

export default function Read() {
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    readItems.forEach((item) => item.tags.forEach((t) => tags.add(t)));
    return [...tags];
  }, []);

  const filtered = useMemo(() => {
    if (!tagFilter) return readItems;
    return readItems.filter((item) => item.tags.includes(tagFilter));
  }, [tagFilter]);

  const thisYear = readItems.filter(
    (item) => new Date(item.date).getFullYear() === new Date().getFullYear()
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-12">
        <div className="max-w-3xl mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Read</h1>
          <p className="text-muted-foreground text-lg">
            Kumpulan bacaan yang menginspirasi, menantang, atau sekadar menarik. 
            Saya percaya membaca adalah investasi terbaik untuk cara berpikir.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className="glass-card flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{readItems.length}</p>
              <p className="text-xs text-muted-foreground">Total bacaan</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{thisYear}</p>
              <p className="text-xs text-muted-foreground">Tahun ini</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2.5 rounded-xl bg-highlight/15 text-highlight">
              <Hash size={20} />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{allTags.length}</p>
              <p className="text-xs text-muted-foreground">Topik</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <FilterChips options={allTags} selected={tagFilter} onSelect={setTagFilter} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((item) => (
            <ReadItemCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Tidak ada bacaan dengan tag ini.</p>
            <button onClick={() => setTagFilter(null)} className="text-sm text-accent hover:opacity-80">
              Reset filter
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
