import { getNowContent } from "@/content";
import { mdxComponents } from "@/components/MdxComponents";

export default function Now() {
  const now = getNowContent();

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Now</h1>
        <p className="text-muted-foreground/60 text-sm mb-8">
          Apa yang sedang saya kerjakan saat ini — terinspirasi dari{" "}
          <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            nownownow.com
          </a>
        </p>

        <div className="prose-article">
          {now ? (
            <now.Component components={mdxComponents} />
          ) : (
            <p className="text-muted-foreground">Konten Now belum tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
