import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { formatDateTime, formatDateShort } from "@/lib/date";
import { getContentBySlug } from "@/content";
import { getRelatedPosts, type RelatedPost } from "@/data/posts";
import BackLink from "@/components/BackLink";
import TypeBadge from "@/components/TypeBadge";
import { mdxComponents } from "@/components/MdxComponents";
import Backlinks from "@/components/Backlinks";
import TagLink from "@/components/TagLink";
import GraphView from "@/components/GraphView";
import TableOfContents from "@/components/TableOfContents";
import SharePanel from "@/components/SharePanel";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

type MdxRendererProps = {
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
};

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = getContentBySlug(slug || "");
  const related = useMemo(() => getRelatedPosts(slug || "", 4), [slug]);
  const [progress, setProgress] = useState(0);

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
      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-32 text-center">
        <p className="text-muted-foreground">Tulisan tidak ditemukan.</p>
        <BackLink to="/" className="text-accent mt-4 inline-block">Kembali ke Home</BackLink>
      </div>
    );
  }

  const backLink = post.type === "article" ? "/artikel" : "/writing";
  const MdxContent = post.Component as React.ComponentType<MdxRendererProps>;
  const formattedDate = formatDateTime(post.date);

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-24 pb-24 overflow-x-clip">
        {/* Back link */}
        <div className="max-w-[68ch] w-full mx-auto mb-10">
          <BackLink to={backLink} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Kembali
          </BackLink>
        </div>

        {/* Header */}
        <header className="max-w-[68ch] w-full mx-auto mb-14">
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
          <div className="max-w-[68ch] w-full mx-auto mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        )}

        <SharePanel
          title={post.title}
          summary={post.summary}
          badge={post.type === "article" ? "Artikel" : "Writing"}
        />

        {/* Backlinks */}
        <Backlinks slug={slug || ""} />

        {/* Graph View */}
        <div className="max-w-[68ch] w-full mx-auto mt-10">
          <GraphView currentSlug={slug} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="max-w-[68ch] w-full mx-auto mt-14">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-3">
              Tulisan Terkait
            </h2>
            <div className="divide-y divide-border/30">
              {(related as RelatedPost[]).map((p) => {
                const link = p.type === "article" ? `/artikel/${p.slug}` : `/writing/${p.slug}`;
                return (
                  <Link
                    key={p.slug}
                    to={link}
                    className="group flex items-center justify-between gap-4 py-2.5 -mx-2 px-2 rounded-lg hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TypeBadge type={p.type} />
                      <span className="text-sm font-medium group-hover:text-accent transition-colors truncate">
                        {p.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/45 flex-shrink-0 tabular-nums">
                      {formatDateShort(p.date)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
