import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReadBySlug } from "@/data/posts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, ExternalLink, Link as LinkIcon, Check } from "lucide-react";

export default function ReadDetail() {
  const { slug } = useParams<{ slug: string }>();
  const item = getReadBySlug(slug || "");
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

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!item) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 text-center">
          <p className="text-muted-foreground">Bacaan tidak ditemukan.</p>
          <Link to="/read" className="text-accent mt-4 inline-block">Kembali ke Read</Link>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {item.content && <div className="reading-progress" style={{ width: `${progress}%` }} />}
      <Navbar />

      <main className="container mx-auto px-6 pt-28 pb-12">
        <Link to="/read" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          Kembali ke Read
        </Link>

        <header className="max-w-[68ch] mx-auto mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 leading-tight">{item.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <span>{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span>{item.source}</span>
          </div>
          <p className="text-muted-foreground text-lg font-serif leading-relaxed">{item.snippet}</p>
          <div className="mt-6">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm glass glass-hover rounded-xl text-accent hover:opacity-80 transition"
            >
              <ExternalLink size={16} />
              Baca sumber asli
            </a>
          </div>
        </header>

        {item.content && (
          <article className="prose-article">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
          </article>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="max-w-[68ch] mx-auto mt-8 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Copy link */}
        <div className="max-w-[68ch] mx-auto mt-8 pt-8 border-t border-border">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm glass glass-hover rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? "Tersalin!" : "Copy link"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
