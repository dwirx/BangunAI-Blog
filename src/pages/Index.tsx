import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { dailyNotes, getLatestDailyNotes, getLatestPosts, posts, readItems } from "@/data/posts";
import { CompactRow, FeaturedCard } from "@/components/PostCard";
import ReadItemCard from "@/components/ReadItemCard";
import { formatDateMedium, formatDateShort } from "@/lib/date";

function SectionHeader({
  eyebrow,
  title,
  description,
  to,
}: {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/58">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-[2rem]">{title}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      <Link
        to={to}
        className="inline-flex items-center gap-1.5 text-sm text-accent transition-opacity hover:opacity-80"
      >
        Lihat semua <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function QuickAccessCard({
  to,
  label,
  count,
  description,
}: {
  to: string;
  label: string;
  count: number;
  description: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="glass-card group block rounded-[24px] border border-border/65 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-[hsl(var(--glass-bg-hover))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/58">
            {label}
          </p>
          <p className="mt-3 font-heading text-3xl font-bold">{count}</p>
        </div>
        <span className="rounded-full border border-border/55 bg-background/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/68 transition-colors group-hover:text-foreground">
          Buka
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  );
}

export default function Index() {
  const latestPosts = getLatestPosts(7);
  const heroPost = latestPosts[0];
  const highlighted = heroPost ? latestPosts.slice(1, 4) : latestPosts.slice(0, 3);
  const latest = heroPost ? latestPosts.slice(1) : latestPosts;
  const daily = getLatestDailyNotes(3);
  const nowReading = readItems.slice(0, 3);
  const writingCount = posts.filter((post) => post.type !== "article").length;
  const articleCount = posts.filter((post) => post.type === "article").length;
  const heroLink = heroPost
    ? heroPost.type === "article"
      ? `/artikel/${heroPost.slug}`
      : `/writing/${heroPost.slug}`
    : "/semua";

  return (
    <>
      <section className="container mx-auto mb-16 px-6 pt-28 sm:pt-32 lg:pt-36">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(19rem,1.2fr)] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/65 bg-background/55 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-[0_18px_44px_-34px_rgba(15,23,42,0.72)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-primary/70" />
              BangunAI
              <span className="text-muted-foreground/45">notes and ideas</span>
            </div>

            <div className="max-w-xl space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/58">
                Jelajah cepat
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Pilih jalur baca yang kamu butuhkan, tanpa pembuka yang terlalu panjang.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <QuickAccessCard
                to="/writing"
                label="Writing"
                count={writingCount}
                description="Catatan dan essay yang terus bertambah."
              />
              <QuickAccessCard
                to="/artikel"
                label="Artikel"
                count={articleCount}
                description="Tulisan yang lebih padat dan terstruktur."
              />
              <QuickAccessCard
                to="/daily"
                label="Daily"
                count={dailyNotes.length}
                description="Potongan ide singkat yang tetap bisa dicari lagi."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/semua"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Lihat terbaru
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/graph"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-4 py-2.5 text-sm text-foreground/88 backdrop-blur-xl transition-colors hover:border-primary/35 hover:text-foreground"
              >
                Buka graph
              </Link>
            </div>
          </div>

          {heroPost ? (
            <Link
              to={heroLink}
              className="glass-card group relative block overflow-hidden rounded-[30px] border border-border/65 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35"
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/14 via-accent/8 to-transparent" />
              <div className="relative p-6 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-border/60 bg-background/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/68">
                    Spotlight
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDateShort(heroPost.date)}
                  </span>
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/52">
                  {heroPost.type === "article" ? "Artikel terbaru" : "Tulisan terbaru"}
                </p>
                <h2 className="mt-3 font-heading text-[clamp(1.7rem,3.7vw,2.35rem)] font-bold leading-tight tracking-tight transition-colors group-hover:text-accent">
                  {heroPost.title}
                </h2>
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {heroPost.summary}
                </p>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground/72">
                  <span>{formatDateMedium(heroPost.date)}</span>
                  <span className="inline-flex items-center gap-1.5 text-accent">
                    Buka tulisan
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {highlighted.length > 0 ? (
        <section className="container mx-auto mb-20 px-6">
          <SectionHeader
            eyebrow="Pilihan Baru"
            title="Titik masuk yang cepat"
            description="Beberapa tulisan terbaru yang cocok untuk mulai menjelajah tanpa harus membuka arsip penuh."
            to="/semua"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {highlighted.map((post) => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto mb-20 px-6">
        <SectionHeader
          eyebrow="Arsip Ringkas"
          title="Terbaru"
          description="Daftar cepat untuk melihat apa yang baru ditambahkan tanpa perlu menelusuri halaman panjang."
          to="/semua"
        />
        <div className="glass-card rounded-[28px] p-3 sm:p-4">
          {latest.map((post) => (
            <CompactRow key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {daily.length > 0 ? (
        <section className="container mx-auto mb-20 px-6">
          <SectionHeader
            eyebrow="Daily Notes"
            title="Catatan pendek"
            description="Fragmen ide, log kecil, dan insight yang cukup singkat untuk dibaca cepat tapi tetap berguna."
            to="/daily"
          />
          <div className="glass-card divide-y divide-border/35 rounded-[28px] p-3 sm:p-4">
            {daily.map((note) => (
              <Link
                key={note.slug}
                to={`/daily/${note.slug}`}
                className="group block rounded-[20px] px-3 py-4 transition-colors first:pt-2 last:pb-2 hover:bg-[hsl(var(--glass-bg-hover))]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs text-muted-foreground/60">{formatDateShort(note.date)}</p>
                    <h3 className="font-heading text-base font-semibold transition-colors group-hover:text-accent">
                      {note.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.summary}</p>
                  </div>
                  <span className="mt-1 shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                    Daily
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto mb-20 px-6">
        <SectionHeader
          eyebrow="Reading Desk"
          title="Sedang dibaca"
          description="Bacaan yang sedang diproses, diringkas, atau sudah diberi catatan supaya jejak belajarnya tidak hilang."
          to="/read"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {nowReading.map((item) => (
            <ReadItemCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
