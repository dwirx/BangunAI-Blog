import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getDailyBySlug } from "@/content";
import { mdxComponents } from "@/components/MdxComponents";
import BackLink from "@/components/BackLink";
import { ArrowLeft, Link as LinkIcon, Check } from "lucide-react";
import TagLink from "@/components/TagLink";
import TableOfContents from "@/components/TableOfContents";

type MdxRendererProps = {
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
};

function formatDailyDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DailyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const note = getDailyBySlug(slug || "");
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!note) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 text-center">
        <p className="text-muted-foreground">Daily note tidak ditemukan.</p>
        <BackLink to="/daily" className="text-accent mt-4 inline-block">
          Kembali ke Daily
        </BackLink>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MdxContent = note.Component as React.ComponentType<MdxRendererProps>;

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />

      <div className="mx-auto w-full max-w-[1080px] px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 md:pt-32 pb-24 overflow-x-clip">
        <div className="max-w-[68ch] w-full mx-auto mb-6">
          <BackLink
            to="/daily"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Kembali ke Daily
          </BackLink>
        </div>

        <header className="max-w-[68ch] w-full mx-auto mb-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              Daily
            </span>
            <span className="text-xs text-muted-foreground/60">{formatDailyDate(note.date)}</span>
          </div>

          <h1 className="font-heading text-[clamp(2.05rem,4.7vw,3.1rem)] font-bold leading-[1.05] tracking-tight mb-4">
            {note.title}
          </h1>
          <p className="text-muted-foreground text-base font-serif leading-relaxed">
            {note.summary}
          </p>
        </header>

        <TableOfContents />

        <article className="prose-article animate-fade-in">
          <MdxContent components={mdxComponents} />
        </article>

        {note.tags.length > 0 && (
          <div className="max-w-[68ch] w-full mx-auto mt-10 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
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
