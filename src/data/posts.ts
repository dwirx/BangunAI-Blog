// Re-export types and provide helper functions
// All content is auto-loaded from src/content/*.mdx via import.meta.glob

export type { Post, PostType, Category, ReadItem, DailyNote } from "./types";
export { categories } from "./types";

import { allPosts, allReadItems, allDailyNotes } from "@/content";
import type { Post, PostType, Category } from "./types";

export type RelatedPost = Post & { _sharedTags: number };

export const posts: Post[] = allPosts;
export const readItems = allReadItems;
export const dailyNotes = allDailyNotes;

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

export function getReadBySlug(slug: string) {
  return readItems.find((r) => r.slug === slug);
}

export function getRelatedPosts(slug: string, count: number = 4): RelatedPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];

  return posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const tagOverlap = p.tags.filter((t) => post.tags.includes(t)).length;
      const score = tagOverlap * 3 + (p.category === post.category ? 2 : 0) + (p.type === post.type ? 1 : 0);
      return { post: p, score, tagOverlap };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ post: p, tagOverlap }) => ({ ...p, _sharedTags: tagOverlap }));
}

export function getLatestDailyNotes(count: number = 7) {
  return [...dailyNotes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

export function getDailyNoteBySlug(slug: string) {
  return dailyNotes.find((note) => note.slug === slug);
}
