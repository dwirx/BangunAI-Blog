import { Post } from "@/data/types";

const post: Post = {
  slug: "react-server-components-explained",
  title: "React Server Components, Explained Simply",
  summary: "Penjelasan sederhana tentang RSC tanpa jargon berlebihan.",
  type: "article",
  category: "Coding",
  tags: ["react", "rsc", "frontend"],
  date: "2026-01-28",
  readingTime: 10,
  featured: true,
  content: `## Apa itu Server Components?

React Server Components (RSC) adalah fitur baru di React yang memungkinkan komponen di-render di server, bukan di browser. Tapi ini **bukan** server-side rendering (SSR) tradisional.

## Perbedaan RSC vs SSR

- **SSR**: Render HTML di server → kirim ke client → hydrate dengan JavaScript
- **RSC**: Komponen *tetap* di server, tidak pernah dikirim ke client sebagai JavaScript

Hasilnya? Bundle size lebih kecil karena kode server component tidak masuk ke bundle client.

## Kapan Pakai Server vs Client Component?

### Server Component (default)
- Fetch data
- Akses backend langsung
- Komponen yang tidak butuh interaktivitas

### Client Component (\`"use client"\`)
- Event handler (onClick, onChange, dll)
- State dan effects (useState, useEffect)
- Browser-only APIs

\`\`\`tsx
// Server Component (default)
async function PostList() {
  const posts = await db.posts.findMany();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// Client Component
"use client";
function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>❤️</button>;
}
\`\`\`

## Mental Model

Bayangkan seperti ini:
- Server Components = **konten statis** yang di-render sekali
- Client Components = **bagian interaktif** yang butuh JavaScript

## Kesimpulan

RSC bukan pengganti SSR. Ini paradigma baru yang memisahkan "apa yang butuh JavaScript di browser" dan "apa yang bisa tetap di server". Hasilnya: app lebih cepat dengan bundle lebih kecil.`
};

export default post;
