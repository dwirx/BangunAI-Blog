// Auto-detect MDX content files using import.meta.glob
// To add new content: just create a .mdx file in the appropriate folder!
// Files are auto-detected — no manual imports needed.

import type { ComponentType } from "react";
import type { Post, ReadItem } from "@/data/types";

interface MdxModule {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
  frontmatter: Record<string, unknown>;
}

// Auto-import all MDX files
const writingModules = import.meta.glob<MdxModule>("./writing/*.mdx", { eager: true });
const articleModules = import.meta.glob<MdxModule>("./articles/*.mdx", { eager: true });
const readModules = import.meta.glob<MdxModule>("./read/*.mdx", { eager: true });
const aboutModule = import.meta.glob<MdxModule>("./about.mdx", { eager: true });

// Convert MDX modules to Post objects
function mdxToPost(mod: MdxModule): Post & { Component: ComponentType } {
  const fm = mod.frontmatter;
  return {
    slug: fm.slug as string,
    title: fm.title as string,
    summary: fm.summary as string,
    type: fm.type as Post["type"],
    category: fm.category as Post["category"],
    tags: (fm.tags as string[]) || [],
    date: fm.date as string,
    readingTime: fm.readingTime as number,
    featured: fm.featured as boolean | undefined,
    Component: mod.default,
  };
}

function mdxToReadItem(mod: MdxModule): ReadItem & { Component: ComponentType } {
  const fm = mod.frontmatter;
  // Check if the MDX has actual body content (not just frontmatter)
  const hasContent = mod.default.toString().length > 50;
  return {
    slug: fm.slug as string,
    title: fm.title as string,
    snippet: fm.snippet as string,
    source: fm.source as string,
    url: fm.url as string,
    tags: (fm.tags as string[]) || [],
    date: fm.date as string,
    hasBody: hasContent,
    Component: mod.default,
  };
}

// Build post arrays
export const writingPosts = Object.values(writingModules).map(mdxToPost);
export const articlePosts = Object.values(articleModules).map(mdxToPost);
export const allPosts = [...writingPosts, ...articlePosts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export const allReadItems = Object.values(readModules).map(mdxToReadItem);

// About page content
export function getAboutContent() {
  const mod = Object.values(aboutModule)[0];
  if (!mod) return null;
  return { Component: mod.default, frontmatter: mod.frontmatter };
}

// Lookup helpers
export function getContentBySlug(slug: string) {
  return allPosts.find((p) => p.slug === slug);
}

export function getReadBySlug(slug: string) {
  return allReadItems.find((r) => r.slug === slug);
}
