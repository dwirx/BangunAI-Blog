import { Post } from "@/data/posts";

const post: Post = {
  slug: "tailwind-tips-cepat",
  title: "5 Tips Tailwind CSS yang Jarang Diketahui",
  summary: "Trik-trik kecil yang bikin workflow Tailwind lebih efisien.",
  type: "article",
  category: "Coding",
  tags: ["tailwind", "css", "tips"],
  date: "2025-12-28",
  readingTime: 6,
  content: `## 1. Group Hover & Focus

Pakai \`group\` untuk menerapkan style hover pada child berdasarkan parent:

\`\`\`html
<div class="group">
  <h3 class="group-hover:text-blue-500">Title</h3>
  <p class="group-hover:opacity-100 opacity-0">Description</p>
</div>
\`\`\`

## 2. Arbitrary Values

Butuh nilai custom yang tidak ada di config? Pakai bracket notation:

\`\`\`html
<div class="w-[317px] bg-[#1da1f2] grid-cols-[1fr_2fr_1fr]">
  Custom values!
</div>
\`\`\`

## 3. Responsive Container Queries

Tailwind 3.2+ mendukung container queries:

\`\`\`html
<div class="@container">
  <div class="@lg:grid-cols-2 @sm:grid-cols-1">
    Responsive berdasarkan container, bukan viewport!
  </div>
</div>
\`\`\`

## 4. Dark Mode dengan Strategy

\`\`\`js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // atau 'media'
}
\`\`\`

Lalu pakai \`dark:\` prefix:
\`\`\`html
<div class="bg-white dark:bg-gray-900">
  Automatic dark mode!
</div>
\`\`\`

## 5. @apply untuk Reusable Styles

Kalau ada pattern yang sering dipakai:

\`\`\`css
@layer components {
  .btn-primary {
    @apply px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition;
  }
}
\`\`\`

## Bonus: Prettier Plugin

Install \`prettier-plugin-tailwindcss\` untuk auto-sort class names. Game changer!`
};

export default post;
