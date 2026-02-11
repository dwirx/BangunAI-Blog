// Auto-detect content registry using import.meta.glob
// To add new content: just create a .ts file in the appropriate folder
// No manual imports needed — files are auto-detected!

import type { Post, ReadItem } from "@/data/types";

// Auto-import all writing content files
const writingModules = import.meta.glob<{ default: Post }>("./writing/*.ts", { eager: true });

// Auto-import all article content files
const articleModules = import.meta.glob<{ default: Post }>("./articles/*.ts", { eager: true });

// Auto-import all read content files
const readModules = import.meta.glob<{ default: ReadItem }>("./read/*.ts", { eager: true });

// Extract posts from modules
export const writingPosts: Post[] = Object.values(writingModules).map((m) => m.default);
export const articlePosts: Post[] = Object.values(articleModules).map((m) => m.default);
export const allPosts: Post[] = [...writingPosts, ...articlePosts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

// Extract read items from modules
export const allReadItems: ReadItem[] = Object.values(readModules)
  .map((m) => m.default)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getContentBySlug(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getReadBySlug(slug: string): ReadItem | undefined {
  return allReadItems.find((r) => r.slug === slug);
}
