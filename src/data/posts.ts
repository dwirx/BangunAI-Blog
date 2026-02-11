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

// Import all posts from content files
import { contentPosts } from "@/content";

export const posts: Post[] = contentPosts;

export const readItems: ReadItem[] = [
  { id: "1", title: "The Grug Brained Developer", date: "2026-02-10", snippet: "A layman's guide to thinking like the self-aware smol brained developer. Complexity very, very bad.", source: "grugbrain.dev", url: "https://grugbrain.dev", tags: ["programming", "humor"] },
  { id: "2", title: "Choose Boring Technology", date: "2026-02-07", snippet: "Every technology choice is a trade-off. The boring ones give you more capacity for exciting product work.", source: "mcfunley.com", url: "https://mcfunley.com/choose-boring-technology", tags: ["engineering", "architecture"] },
  { id: "3", title: "Writing Well", date: "2026-02-03", snippet: "Julian Shapiro's comprehensive guide to writing clearly and persuasively. Free handbook.", source: "julian.com", url: "https://www.julian.com/guide/write/intro", tags: ["writing", "communication"] },
  { id: "4", title: "Mental Models: The Best Way to Make Intelligent Decisions", date: "2026-01-30", snippet: "A comprehensive list of mental models for better thinking and decision making in everyday life.", source: "fs.blog", url: "https://fs.blog/mental-models/", tags: ["thinking", "decision-making"] },
  { id: "5", title: "Practical Typography", date: "2026-01-25", snippet: "Matthew Butterick's guide to making your documents look professional. Essential reading for anyone who writes.", source: "practicaltypography.com", url: "https://practicaltypography.com", tags: ["design", "typography"] },
  { id: "6", title: "The Twelve-Factor App", date: "2026-01-20", snippet: "A methodology for building software-as-a-service apps. Twelve factors for modern cloud-native applications.", source: "12factor.net", url: "https://12factor.net", tags: ["engineering", "architecture"] },
  { id: "7", title: "Teach Yourself Programming in Ten Years", date: "2026-01-15", snippet: "Peter Norvig's famous essay on why learning programming takes patience and dedication, not 24 hours.", source: "norvig.com", url: "https://norvig.com/21-days.html", tags: ["programming", "learning"] },
  { id: "8", title: "A Rant About Technology", date: "2025-12-28", snippet: "Ted Nelson's perspective on how technology could be better if we rethought our fundamental assumptions.", source: "xanadu.net", url: "https://xanadu.net", tags: ["technology", "philosophy"] },
  { id: "9", title: "Design Principles Behind Great Products", date: "2025-12-20", snippet: "Collection of design principles from companies like Apple, Google, and Stripe that shaped modern product design.", source: "principles.design", url: "https://principles.design", tags: ["design", "product"] },
  { id: "10", title: "The Art of Command Line", date: "2025-12-15", snippet: "Fluency on the command line is a skill often neglected. This guide covers the essentials and beyond.", source: "github.com", url: "https://github.com/jlevy/the-art-of-command-line", tags: ["linux", "terminal"] },
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
