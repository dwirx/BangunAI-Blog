import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getFeaturedPosts, getLatestPosts, readItems } from "@/data/posts";
import { FeaturedCard, CompactRow } from "@/components/PostCard";
import ReadItemCard from "@/components/ReadItemCard";

export default function Index() {
  const featured = getFeaturedPosts();
  const latest = getLatestPosts(6);
  const nowReading = readItems.slice(0, 3);

  return (
    <>
      {/* Featured */}
      <section className="container mx-auto px-6 pt-24 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl font-bold">Featured</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {featured.map((post) => (
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
