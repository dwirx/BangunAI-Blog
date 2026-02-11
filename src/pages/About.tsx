export default function About() {
  return (
    <div className="container mx-auto px-6 pt-24 pb-12">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-6">About</h1>

        <div className="prose-article">
          <p>
            Hai, selamat datang. Ini adalah ruang digital saya untuk menulis — catatan pendek,
            essay, dan artikel tentang teknologi, produktivitas, dan hidup.
          </p>
          <p>
            Saya percaya menulis adalah cara berpikir yang paling jujur. Di sini, saya
            memproses ide, mendokumentasikan pembelajaran, dan berbagi perspektif tanpa
            tekanan untuk sempurna.
          </p>

          <h2>Tentang Blog Ini</h2>
          <p>
            Blog ini dibagi menjadi tiga jenis konten:
          </p>
          <ul>
            <li><strong>Notes</strong> — catatan pendek, snapshot pikiran, quick takes</li>
            <li><strong>Essays</strong> — tulisan mendalam yang lebih personal dan eksploratif</li>
            <li><strong>Articles</strong> — konten tutorial, panduan, atau opini yang lebih terstruktur</li>
          </ul>
          <p>
            Ada juga halaman <strong>Read</strong>, tempat saya mengarsipkan bacaan-bacaan yang
            menginspirasi atau menantang cara berpikir saya.
          </p>

          <h2>Kontak</h2>
          <p>
            Silakan hubungi saya via email atau social media. Saya selalu senang
            berdiskusi tentang teknologi, menulis, dan ide-ide menarik.
          </p>
        </div>
      </div>
    </div>
  );
}
