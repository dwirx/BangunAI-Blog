import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getLatestPosts, getLatestDailyNotes, readItems } from "@/data/posts";
import { FeaturedCard, CompactRow } from "@/components/PostCard";
import ReadItemCard from "@/components/ReadItemCard";
import { formatDateShort } from "@/lib/date";

export default function Index() {
  const highlighted = getLatestPosts(3);
  const latest = getLatestPosts(6);
  const daily = getLatestDailyNotes(3);
  const nowReading = readItems.slice(0, 3);

  return (
    <>
      {/* Terbaru */}
      <section className="container mx-auto px-6 pt-24 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl font-bold">Terbaru</h2>
          <Link to="/writing" className="text-sm text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
            Semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {highlighted.map((post) => (
            <FeaturedCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className="container mx-auto px-6 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Latest</h2>
          <Link to="/writing" className="text-sm text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
            Semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="glass-card">
          {latest.map((post) => (
            <CompactRow key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Daily */}
      {daily.length > 0 && (
        <section className="container mx-auto px-6 mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Daily</h2>
            <Link to="/daily" className="text-sm text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
              Semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="glass-card divide-y divide-border/35">
            {daily.map((note) => (
              <Link key={note.slug} to={`/daily/${note.slug}`} className="group block py-3 first:pt-1 last:pb-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground/60 mb-1">{formatDateShort(note.date)}</p>
                    <h3 className="font-heading text-base font-semibold group-hover:text-accent transition-colors truncate">
                      {note.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{note.summary}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary mt-1">
                    Daily
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Now Reading */}
      <section className="container mx-auto px-6 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">Now Reading</h2>
          <Link to="/read" className="text-sm text-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
            Semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {nowReading.map((item) => (
            <ReadItemCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
