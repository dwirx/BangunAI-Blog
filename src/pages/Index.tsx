import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getFeaturedPosts, getLatestPosts, readItems } from "@/data/posts";
import { FeaturedCard, CompactRow } from "@/components/PostCard";
import ReadItemCard from "@/components/ReadItemCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import auroraBg from "@/assets/aurora-bg.jpg";

export default function Index() {
  const featured = getFeaturedPosts();
  const latest = getLatestPosts(6);
  const nowReading = readItems.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <img
          src={auroraBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="relative container mx-auto px-6">
          <div className="glass-card max-w-2xl mx-auto text-center py-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Notes, essay, dan artikel<br />
              <span className="text-primary">campuran</span> — nyaman dibaca
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Tempat saya menulis tentang teknologi, produktivitas, dan kehidupan. Ditulis untuk dibaca pelan-pelan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/writing"
                className="px-6 py-3 rounded-[14px] bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Mulai Baca
              </Link>
              <Link
                to="/read"
                className="px-6 py-3 rounded-[14px] glass glass-hover text-foreground font-medium text-sm"
              >
                Lihat Read
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-6 mb-20">
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

      <Footer />
    </div>
  );
}
