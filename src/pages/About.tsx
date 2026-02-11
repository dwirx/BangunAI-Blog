import { getAboutContent } from "@/content";
import { mdxComponents } from "@/components/MdxComponents";

export default function About() {
  const about = getAboutContent();

  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-6">About</h1>

        <div className="prose-article">
          {about ? (
            <about.Component components={mdxComponents} />
          ) : (
            <p className="text-muted-foreground">Konten About belum tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
