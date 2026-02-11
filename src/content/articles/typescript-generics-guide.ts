import { Post } from "@/data/types";

const post: Post = {
  slug: "typescript-generics-guide",
  title: "TypeScript Generics: Panduan Praktis",
  summary: "Dari dasar sampai pattern lanjutan, dijelaskan dengan contoh nyata.",
  type: "article",
  category: "Coding",
  tags: ["typescript", "generics", "tutorial"],
  date: "2025-12-15",
  readingTime: 14,
  content: `## Apa itu Generics?

Generics memungkinkan kamu membuat fungsi dan tipe yang fleksibel tapi tetap *type-safe*. Bayangkan seperti "template" yang bisa diisi tipe apa saja.

## Contoh Dasar

\`\`\`typescript
// Tanpa generics
function getFirst(arr: any[]): any {
  return arr[0];
}

// Dengan generics — type-safe!
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const num = getFirst([1, 2, 3]); // type: number
const str = getFirst(["a", "b"]); // type: string
\`\`\`

## Generic Constraints

Batasi tipe yang bisa dipakai dengan \`extends\`:

\`\`\`typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(item.length);
}

logLength("hello"); // OK
logLength([1, 2]); // OK
logLength(123); // Error!
\`\`\`

## Generic dengan Multiple Types

\`\`\`typescript
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const result = merge({ name: "John" }, { age: 30 });
// type: { name: string } & { age: number }
\`\`\`

## Pattern: Generic React Component

\`\`\`typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}

// Usage
<List
  items={users}
  renderItem={(user) => <li>{user.name}</li>}
/>
\`\`\`

## Kesimpulan

Generics adalah salah satu fitur TypeScript yang paling powerful. Mulai dari yang sederhana dan perlahan tambahkan complexity sesuai kebutuhan.`
};

export default post;
