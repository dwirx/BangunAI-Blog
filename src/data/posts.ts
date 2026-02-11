// Re-export types and provide helper functions
// All content is auto-loaded from src/content/*.mdx via import.meta.glob

export type { Post, PostType, Category, ReadItem } from "./types";
export { categories } from "./types";

import { allPosts, allReadItems } from "@/content";
import type { Post, PostType, Category } from "./types";

export const posts: Post[] = allPosts;
export const readItems = allReadItems;

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

export function getRelatedPosts(slug: string, count: number = 3) {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return posts
    .filter((p) => p.slug !== slug && (p.category === post.category || p.type === post.type))
    .slice(0, count);
}
