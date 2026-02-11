export type PostType = "note" | "essay" | "article";
export type Category = "Tech" | "Refleksi" | "Produktivitas" | "Linux" | "Coding" | "Life";

export interface Post {
  slug: string;
  title: string;
  summary: string;
  type: PostType;
  category: Category;
  tags: string[];
  date: string;
  readingTime: number;
  featured?: boolean;
  content?: string;
}

export interface ReadItem {
  id: string;
  title: string;
  date: string;
  snippet: string;
  source: string;
  url: string;
  tags: string[];
}

export const posts: Post[] = [
  {
    slug: "membangun-workflow-linux-ideal",
    title: "Membangun Workflow Linux yang Ideal untuk Developer",
    summary: "Panduan lengkap menyusun environment development di Linux dari terminal, editor, hingga automation script.",
    type: "article",
    category: "Linux",
    tags: ["linux", "workflow", "developer"],
    date: "2026-02-08",
    readingTime: 12,
    featured: true,
    content: `## Kenapa Linux?

Linux bukan sekadar OS. Bagi developer, Linux adalah kanvas kosong yang bisa kamu bentuk sesuai cara kerja kamu sendiri. Tidak ada yang memaksa kamu pakai workflow tertentu.

## Terminal sebagai Pusat Segalanya

Terminal adalah jantung dari workflow Linux. Dengan shell yang tepat (zsh + oh-my-zsh, atau fish), kamu bisa melakukan hampir semua hal tanpa menyentuh mouse.

### Konfigurasi Zsh

\`\`\`bash
# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Plugin yang wajib
plugins=(git zsh-autosuggestions zsh-syntax-highlighting fzf)
\`\`\`

## Editor: Neovim atau VS Code?

Keduanya punya kelebihan. Neovim untuk yang suka keyboard-driven, VS Code untuk yang butuh GUI dan extension ecosystem.

> "The best editor is the one you know well." — Wisdom dari forum Linux

## Automation dengan Scripts

Buat alias dan script untuk task yang berulang. Ini investasi waktu yang sangat worth it.

## Kesimpulan

Workflow ideal itu personal. Eksperimen, iterasi, dan temukan yang paling cocok untuk kamu.`,
  },
  {
    slug: "menulis-sebagai-berpikir",
    title: "Menulis Sebagai Cara Berpikir",
    summary: "Refleksi tentang kenapa menulis bukan soal publikasi, tapi soal menjernihkan pikiran.",
    type: "essay",
    category: "Refleksi",
    tags: ["menulis", "berpikir", "refleksi"],
    date: "2026-02-05",
    readingTime: 8,
    featured: true,
    content: `## Menulis Bukan untuk Dibaca

Paradoks: tulisan terbaik sering lahir ketika kita tidak peduli apakah ada yang membacanya. Menulis untuk diri sendiri membebaskan kita dari tekanan performa.

## Proses, Bukan Produk

Saat menulis, pikiran yang tadinya kabur dipaksa menjadi kalimat. Kalimat memaksa struktur. Struktur memaksa kejelasan.

> "I don't know what I think until I write it down." — Joan Didion

## Catatan Kecil, Dampak Besar

Kebiasaan menulis catatan pendek setiap hari ternyata lebih powerful daripada menulis essay panjang sesekali. Konsistensi mengalahkan intensitas.

## Kesimpulan

Mulai menulis. Jangan tunggu topik sempurna. Tulis apa yang ada di kepala sekarang.`,
  },
  {
    slug: "react-server-components-explained",
    title: "React Server Components, Explained Simply",
    summary: "Penjelasan sederhana tentang RSC tanpa jargon berlebihan.",
    type: "article",
    category: "Coding",
    tags: ["react", "rsc", "frontend"],
    date: "2026-01-28",
    readingTime: 10,
    featured: true,
  },
  {
    slug: "catatan-belajar-rust-minggu-1",
    title: "Catatan Belajar Rust: Minggu Pertama",
    summary: "Ownership, borrowing, dan kenapa compiler Rust terasa seperti guru yang galak tapi peduli.",
    type: "note",
    category: "Coding",
    tags: ["rust", "belajar", "programming"],
    date: "2026-01-25",
    readingTime: 4,
  },
  {
    slug: "produktivitas-bukan-soal-tools",
    title: "Produktivitas Bukan Soal Tools",
    summary: "Kita terlalu banyak waktu memilih tools, terlalu sedikit waktu mengerjakan.",
    type: "essay",
    category: "Produktivitas",
    tags: ["produktivitas", "mindset"],
    date: "2026-01-20",
    readingTime: 6,
  },
  {
    slug: "setup-neovim-2026",
    title: "Setup Neovim Saya di 2026",
    summary: "Konfigurasi Neovim minimalis tapi powerful untuk daily coding.",
    type: "note",
    category: "Tech",
    tags: ["neovim", "config", "editor"],
    date: "2026-01-15",
    readingTime: 5,
  },
  {
    slug: "kenapa-saya-pakai-arch",
    title: "Kenapa Saya Masih Pakai Arch Linux",
    summary: "Setelah 3 tahun, Arch tetap jadi daily driver. Ini alasannya.",
    type: "essay",
    category: "Linux",
    tags: ["arch", "linux", "daily-driver"],
    date: "2026-01-10",
    readingTime: 7,
  },
  {
    slug: "tailwind-tips-cepat",
    title: "5 Tips Tailwind CSS yang Jarang Diketahui",
    summary: "Trik-trik kecil yang bikin workflow Tailwind lebih efisien.",
    type: "article",
    category: "Coding",
    tags: ["tailwind", "css", "tips"],
    date: "2025-12-28",
    readingTime: 6,
  },
  {
    slug: "digital-minimalism-catatan",
    title: "Catatan tentang Digital Minimalism",
    summary: "Setelah membaca buku Cal Newport, ini yang saya coba terapkan.",
    type: "note",
    category: "Life",
    tags: ["minimalism", "digital", "lifestyle"],
    date: "2025-12-20",
    readingTime: 3,
  },
  {
    slug: "typescript-generics-guide",
    title: "TypeScript Generics: Panduan Praktis",
    summary: "Dari dasar sampai pattern lanjutan, dijelaskan dengan contoh nyata.",
    type: "article",
    category: "Coding",
    tags: ["typescript", "generics", "tutorial"],
    date: "2025-12-15",
    readingTime: 14,
  },
  {
    slug: "berpikir-sistematis",
    title: "Belajar Berpikir Sistematis",
    summary: "Bagaimana memecah masalah besar jadi langkah-langkah kecil yang bisa dieksekusi.",
    type: "essay",
    category: "Produktivitas",
    tags: ["thinking", "systems", "problem-solving"],
    date: "2025-12-10",
    readingTime: 9,
  },
  {
    slug: "docker-compose-cheatsheet",
    title: "Docker Compose Cheatsheet untuk Pemula",
    summary: "Referensi cepat untuk docker-compose yang sering saya pakai.",
    type: "note",
    category: "Tech",
    tags: ["docker", "devops", "cheatsheet"],
    date: "2025-12-05",
    readingTime: 4,
  },
  {
    slug: "hidup-tanpa-social-media",
    title: "Satu Bulan Tanpa Social Media",
    summary: "Eksperimen detoks digital dan apa yang saya pelajari.",
    type: "essay",
    category: "Life",
    tags: ["social-media", "detox", "experiment"],
    date: "2025-11-28",
    readingTime: 7,
  },
];

export const readItems: ReadItem[] = [
  {
    id: "1",
    title: "The Grug Brained Developer",
    date: "2026-02-10",
    snippet: "A layman's guide to thinking like the self-aware smol brained developer. Complexity very, very bad.",
    source: "grugbrain.dev",
    url: "https://grugbrain.dev",
    tags: ["programming", "humor"],
  },
  {
    id: "2",
    title: "Choose Boring Technology",
    date: "2026-02-07",
    snippet: "Every technology choice is a trade-off. The boring ones give you more capacity for exciting product work.",
    source: "mcfunley.com",
    url: "https://mcfunley.com/choose-boring-technology",
    tags: ["engineering", "architecture"],
  },
  {
    id: "3",
    title: "Writing Well",
    date: "2026-02-03",
    snippet: "Julian Shapiro's comprehensive guide to writing clearly and persuasively. Free handbook.",
    source: "julian.com",
    url: "https://www.julian.com/guide/write/intro",
    tags: ["writing", "communication"],
  },
  {
    id: "4",
    title: "Mental Models: The Best Way to Make Intelligent Decisions",
    date: "2026-01-30",
    snippet: "A comprehensive list of mental models for better thinking and decision making in everyday life.",
    source: "fs.blog",
    url: "https://fs.blog/mental-models/",
    tags: ["thinking", "decision-making"],
  },
  {
    id: "5",
    title: "Practical Typography",
    date: "2026-01-25",
    snippet: "Matthew Butterick's guide to making your documents look professional. Essential reading for anyone who writes.",
    source: "practicaltypography.com",
    url: "https://practicaltypography.com",
    tags: ["design", "typography"],
  },
  {
    id: "6",
    title: "The Twelve-Factor App",
    date: "2026-01-20",
    snippet: "A methodology for building software-as-a-service apps. Twelve factors for modern cloud-native applications.",
    source: "12factor.net",
    url: "https://12factor.net",
    tags: ["engineering", "architecture"],
  },
  {
    id: "7",
    title: "Teach Yourself Programming in Ten Years",
    date: "2026-01-15",
    snippet: "Peter Norvig's famous essay on why learning programming takes patience and dedication, not 24 hours.",
    source: "norvig.com",
    url: "https://norvig.com/21-days.html",
    tags: ["programming", "learning"],
  },
  {
    id: "8",
    title: "A Rant About Technology",
    date: "2025-12-28",
    snippet: "Ted Nelson's perspective on how technology could be better if we rethought our fundamental assumptions.",
    source: "xanadu.net",
    url: "https://xanadu.net",
    tags: ["technology", "philosophy"],
  },
  {
    id: "9",
    title: "Design Principles Behind Great Products",
    date: "2025-12-20",
    snippet: "Collection of design principles from companies like Apple, Google, and Stripe that shaped modern product design.",
    source: "principles.design",
    url: "https://principles.design",
    tags: ["design", "product"],
  },
  {
    id: "10",
    title: "The Art of Command Line",
    date: "2025-12-15",
    snippet: "Fluency on the command line is a skill often neglected. This guide covers the essentials and beyond.",
    source: "github.com",
    url: "https://github.com/jlevy/the-art-of-command-line",
    tags: ["linux", "terminal"],
  },
];

export const categories: Category[] = ["Tech", "Refleksi", "Produktivitas", "Linux", "Coding", "Life"];

export function getPostsByType(type?: PostType) {
  if (!type) return posts;
  return posts.filter((p) => p.type === type);
}

export function getPostsByCategory(category?: Category) {
  if (!category) return posts;
  return posts.filter((p) => p.category === category);
}

export function getFeaturedPosts() {
  return posts.filter((p) => p.featured);
}

export function getLatestPosts(count: number = 8) {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, count);
}

export function getWritingPosts() {
  return posts.filter((p) => p.type === "note" || p.type === "essay");
}

export function getArticlePosts() {
  return posts.filter((p) => p.type === "article");
}

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, count: number = 3) {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return posts
    .filter((p) => p.slug !== slug && (p.category === post.category || p.type === post.type))
    .slice(0, count);
}
