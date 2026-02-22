import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/date";
import { getReadBySlug } from "@/content";
import { mdxComponents } from "@/components/MdxComponents";
import { ArrowLeft, ExternalLink, Link as LinkIcon, Check } from "lucide-react";
import TagLink from "@/components/TagLink";
import TableOfContents from "@/components/TableOfContents";

type MdxRendererProps = {
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
};

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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-32 text-center">
        <p className="text-muted-foreground">Bacaan tidak ditemukan.</p>
        <Link to="/read" className="text-accent mt-4 inline-block">Kembali ke Read</Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MdxContent = item.Component as React.ComponentType<MdxRendererProps>;

  return (
    <>
      {item.hasBody && <div className="reading-progress" style={{ width: `${progress}%` }} />}

      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-24 pb-24 overflow-x-clip">
        <div className="max-w-[68ch] w-full mx-auto mb-10">
          <Link to="/read" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Kembali ke Read
          </Link>
        </div>

        <header className="max-w-[68ch] w-full mx-auto mb-14">
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold leading-[1.15] mb-5">{item.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/50 mb-6">
            <span>{formatDateTime(item.date)}</span>
            <span>·</span>
            <span>{item.source}</span>
          </div>
          <p className="text-muted-foreground text-base font-serif leading-relaxed">{item.snippet}</p>
          <div className="mt-6">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition"
            >
              <ExternalLink size={13} />
              Baca sumber asli
            </a>
          </div>
        </header>

        <TableOfContents />

        <article className="prose-article animate-fade-in">
          <MdxContent components={mdxComponents} />
        </article>

        {item.tags.length > 0 && (
          <div className="max-w-[68ch] w-full mx-auto mt-10 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div className="max-w-[68ch] w-full mx-auto mt-10 pt-8 border-t border-border/40">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground rounded-lg hover:bg-secondary/50 transition-all"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <LinkIcon size={13} />}
            {copied ? "Tersalin!" : "Copy link"}
          </button>
        </div>
      </div>
    </>
  );
}
