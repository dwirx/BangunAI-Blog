import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPostBySlug, getRelatedPosts } from "@/data/posts";
import TypeBadge from "@/components/TypeBadge";
import { CompactRow } from "@/components/PostCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Link as LinkIcon, Check } from "lucide-react";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug || "");
  const related = getRelatedPosts(slug || "", 3);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) setProgress((window.scrollY / docHeight) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 text-center">
          <p className="text-muted-foreground">Tulisan tidak ditemukan.</p>
          <Link to="/" className="text-accent mt-4 inline-block">Kembali ke Home</Link>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const backLink = post.type === "article" ? "/artikel" : "/writing";

  return (
    <div className="min-h-screen">
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <Navbar />

      <main className="container mx-auto px-6 pt-28 pb-12">
        <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          Kembali
        </Link>

        <header className="max-w-[68ch] mx-auto mb-12">
          <div className="flex items-center gap-3 mb-4">
            <TypeBadge type={post.type} />
            <span className="text-sm text-muted-foreground">{post.category}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{new Date(post.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </header>

        <article className="prose-article">
          {post.content ? (
            post.content.split("\n\n").map((block, i) => {
              if (block.startsWith("## ")) return <h2 key={i}>{block.replace("## ", "")}</h2>;
              if (block.startsWith("### ")) return <h3 key={i}>{block.replace("### ", "")}</h3>;
              if (block.startsWith("> ")) return <blockquote key={i}><p>{block.replace("> ", "")}</p></blockquote>;
              if (block.startsWith("```")) {
                const lines = block.split("\n");
                const code = lines.slice(1, -1).join("\n");
                return <pre key={i}><code>{code}</code></pre>;
              }
              return <p key={i}>{block}</p>;
            })
          ) : (
            <>
              <p>{post.summary}</p>
              <p className="text-muted-foreground italic">Konten lengkap akan segera tersedia.</p>
            </>
          )}
        </article>

        {/* Copy link */}
        <div className="max-w-[68ch] mx-auto mt-12 pt-8 border-t border-border">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm glass glass-hover rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? "Tersalin!" : "Copy link"}
          </button>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="max-w-[68ch] mx-auto mt-16">
            <h2 className="font-heading text-xl font-bold mb-6">Tulisan Terkait</h2>
            <div className="glass-card">
              {related.map((p) => (
                <CompactRow key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
