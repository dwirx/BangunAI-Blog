import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getContentBySlug } from "@/content";
import { getRelatedPosts } from "@/data/posts";
import TypeBadge from "@/components/TypeBadge";
import { CompactRow } from "@/components/PostCard";
import { mdxComponents } from "@/components/MdxComponents";
import Backlinks from "@/components/Backlinks";
import GraphView from "@/components/GraphView";
import TableOfContents from "@/components/TableOfContents";
import { ArrowLeft, Link as LinkIcon, Check, Clock, Calendar } from "lucide-react";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = getContentBySlug(slug || "");
  const related = useMemo(() => getRelatedPosts(slug || "", 3), [slug]);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) setProgress((window.scrollY / docHeight) * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post) {
    return (
      <div className="container mx-auto px-6 pt-32 text-center">
        <p className="text-muted-foreground">Tulisan tidak ditemukan.</p>
        <Link to="/" className="text-accent mt-4 inline-block">Kembali ke Home</Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const backLink = post.type === "article" ? "/artikel" : "/writing";
  const MdxContent = post.Component as React.ComponentType<{ components?: Record<string, React.ComponentType<any>> }>;
  const formattedDate = new Date(post.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      <div className="container mx-auto px-6 pt-24 pb-24">
        {/* Back link */}
        <div className="max-w-[68ch] mx-auto mb-10">
          <Link to={backLink} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Kembali
          </Link>
        </div>

        {/* Header */}
        <header className="max-w-[68ch] mx-auto mb-14">
          <div className="flex items-center gap-2.5 mb-5">
            <TypeBadge type={post.type} />
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">{post.category}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold leading-[1.15] mb-6">{post.title}</h1>
          <p className="text-muted-foreground text-base font-serif leading-relaxed mb-6">{post.summary}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} />
              {post.readingTime} min
            </span>
          </div>
        </header>

        {/* Table of Contents */}
        <TableOfContents />

        {/* Content */}
        <article className="prose-article animate-fade-in">
          <MdxContent components={mdxComponents} />
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-[68ch] mx-auto mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground/60">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="max-w-[68ch] mx-auto mt-10 pt-8 border-t border-border/40">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground rounded-lg hover:bg-secondary/50 transition-all"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <LinkIcon size={13} />}
            {copied ? "Tersalin!" : "Copy link"}
          </button>
        </div>

        {/* Backlinks */}
        <Backlinks slug={slug || ""} />

        {/* Graph View */}
        <div className="max-w-[68ch] mx-auto mt-10">
          <GraphView currentSlug={slug} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="max-w-[68ch] mx-auto mt-14">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">Tulisan Terkait</h2>
            <div className="divide-y divide-border/40">
              {related.map((p) => (
                <CompactRow key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
