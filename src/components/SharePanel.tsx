import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Instagram,
  MessageCircle,
  Sparkles,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SharePanelProps = {
  title: string;
  summary?: string;
  badge?: string;
  className?: string;
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function slugifyFilename(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "story"
  );
}

function copyWithFallback(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise<void>((resolve, reject) => {
    try {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      if (ok) resolve();
      else reject(new Error("Clipboard not available"));
    } catch (error) {
      reject(error);
    }
  });
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    let last = visible[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[maxLines - 1] = `${last.trimEnd()}...`;
    lines.splice(0, lines.length, ...visible);
  }

  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });

  return y + lines.length * lineHeight;
}

async function makeStoryImage(
  title: string,
  summary: string,
  badge: string,
  displayUrl: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const baseGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  baseGradient.addColorStop(0, "#121a2e");
  baseGradient.addColorStop(0.52, "#1f2340");
  baseGradient.addColorStop(1, "#19132b");

  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "rgba(251, 191, 36, 0.17)";
  ctx.beginPath();
  ctx.arc(910, 160, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
  ctx.beginPath();
  ctx.arc(160, 1700, 320, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(72, 120, 280, 58);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(72, 120, 280, 58);

  ctx.fillStyle = "#ffddb2";
  ctx.font = "600 30px 'Space Grotesk', sans-serif";
  ctx.fillText(badge.toUpperCase(), 96, 158);

  ctx.fillStyle = "#fff8eb";
  ctx.font = "700 74px 'Space Grotesk', sans-serif";
  const titleEndY = drawWrappedText(ctx, title, 72, 330, 936, 92, 7);

  const summaryText = summary || "Bacaan singkat yang wajib kamu cek.";
  ctx.fillStyle = "rgba(255, 248, 235, 0.88)";
  ctx.font = "500 40px 'Source Serif 4', serif";
  drawWrappedText(ctx, summaryText, 72, titleEndY + 62, 936, 58, 5);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 1660);
  ctx.lineTo(1008, 1660);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 248, 235, 0.8)";
  ctx.font = "500 34px 'Inter', sans-serif";
  drawWrappedText(ctx, displayUrl, 72, 1734, 936, 46, 2);

  ctx.fillStyle = "rgba(255, 248, 235, 0.6)";
  ctx.font = "500 28px 'Inter', sans-serif";
  ctx.fillText("Upload ke IG Story lalu tempel link di sticker", 72, 1848);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

export default function SharePanel({
  title,
  summary = "",
  badge = "share",
  className,
}: SharePanelProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const summaryText = useMemo(
    () => truncateText(normalizeText(summary), 200),
    [summary],
  );

  const captionText = useMemo(() => {
    const parts = [title];
    if (summaryText) parts.push(summaryText);
    if (shareUrl) parts.push(shareUrl);
    return parts.join("\n\n");
  }, [title, summaryText, shareUrl]);

  const whatsappText = useMemo(() => {
    const parts = [`${title}`];
    if (summaryText) parts.push(summaryText);
    if (shareUrl) parts.push(shareUrl);
    return parts.join("\n\n");
  }, [title, summaryText, shareUrl]);

  const xText = useMemo(() => {
    const base = summaryText ? `${title} — ${summaryText}` : title;
    return truncateText(base, 220);
  }, [title, summaryText]);

  const displayUrl = useMemo(() => {
    if (!shareUrl) return "";
    try {
      const parsed = new URL(shareUrl);
      return `${parsed.host}${parsed.pathname}`;
    } catch {
      return shareUrl;
    }
  }, [shareUrl]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await copyWithFallback(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // noop
    }
  };

  const handleCopyCaption = async () => {
    if (!captionText) return;
    try {
      await copyWithFallback(captionText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 1800);
    } catch {
      // noop
    }
  };

  const handleCreateStory = async () => {
    if (!title || !shareUrl || isGeneratingStory) return;
    setIsGeneratingStory(true);

    try {
      const storyBlob = await makeStoryImage(title, summaryText, badge, displayUrl);
      if (!storyBlob) return;

      const filename = `${slugifyFilename(title)}-story.png`;
      const storyFile = new File([storyBlob], filename, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [storyFile] })
      ) {
        try {
          await navigator.share({
            files: [storyFile],
            title: `${title} - Story`,
            text: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      const objectUrl = URL.createObjectURL(storyBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/35 px-3 py-2.5 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary/60";

  return (
    <div className={cn("max-w-[68ch] w-full mx-auto mt-10 pt-8 border-t border-border/40", className)}>
      <div className="rounded-2xl border border-border/45 bg-card/35 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground/95">Bagikan Tulisan</p>
          <p className="text-[11px] text-muted-foreground/75">WhatsApp • X • Instagram Story</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
            aria-label="Bagikan ke WhatsApp"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>

          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
            aria-label="Bagikan ke X"
          >
            <Twitter size={14} />
            X.com
          </a>

          <button onClick={handleCopyCaption} className={buttonClass} aria-label="Salin caption">
            {copiedCaption ? <Check size={14} className="text-green-400" /> : <Instagram size={14} />}
            {copiedCaption ? "Tersalin" : "Caption IG"}
          </button>

          <button
            onClick={handleCopyLink}
            className={buttonClass}
            aria-label="Salin link"
          >
            {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copiedLink ? "Tersalin" : "Copy Link"}
          </button>
        </div>

        <button
          onClick={handleCreateStory}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/35 bg-accent/12 px-3 py-2.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          aria-label="Buat story Instagram"
        >
          {isGeneratingStory ? <Sparkles size={14} className="animate-pulse" /> : <Download size={14} />}
          {isGeneratingStory ? "Membuat Story..." : "Buat Story (1080x1920)"}
        </button>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/75">
          Tombol Story akan membuat gambar 9:16 siap upload ke Instagram. Setelah upload, tempel link dari tombol
          <span className="px-1">Copy Link</span>
          atau caption dari
          <span className="px-1">Caption IG</span>
          .
        </p>
      </div>
    </div>
  );
}
