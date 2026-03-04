import { Link } from "react-router-dom";
import { dailyNotes } from "@/data/posts";
import { CalendarDays, NotebookPen, Hash } from "lucide-react";

function formatDailyDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Daily() {
  const currentYear = new Date().getFullYear();
  const thisYearCount = dailyNotes.filter(
    (note) => new Date(note.date).getFullYear() === currentYear
  ).length;
  const totalTags = new Set(dailyNotes.flatMap((note) => note.tags)).size;

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-3xl mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">Daily</h1>
        <p className="text-muted-foreground text-lg">
          Catatan harian singkat untuk melacak progres, ide, dan hal penting setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
            <NotebookPen size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{dailyNotes.length}</p>
            <p className="text-xs text-muted-foreground">Total catatan</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{thisYearCount}</p>
            <p className="text-xs text-muted-foreground">Tahun ini</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 rounded-xl bg-highlight/15 text-highlight">
            <Hash size={20} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{totalTags}</p>
            <p className="text-xs text-muted-foreground">Tag aktif</p>
          </div>
        </div>
      </div>

      {dailyNotes.length === 0 ? (
        <div className="glass-card text-center py-14">
          <p className="text-muted-foreground">Belum ada daily note.</p>
        </div>
      ) : (
        <div className="glass-card divide-y divide-border/40">
          {dailyNotes.map((note) => (
            <Link
              key={note.slug}
              to={`/daily/${note.slug}`}
              className="group block py-4 first:pt-1 last:pb-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      Daily
                    </span>
                    <span className="text-xs text-muted-foreground/65">
                      {formatDailyDate(note.date)}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-semibold group-hover:text-accent transition-colors">
                    {note.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {note.summary}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-xs text-muted-foreground/55">Buka</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
