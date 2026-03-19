import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { Post, ReadItem, DailyNote } from "@/data/types";
import {
  writingMeta,
  articleMeta,
  readMeta,
  dailyMeta,
  aboutMeta,
  nowMeta,
} from "./content-index.generated";

type MdxRendererProps = {
  components?: Record<string, ComponentType<Record<string, unknown>>>;
};

type RenderableMdxComponent =
  | ComponentType<MdxRendererProps>
  | LazyExoticComponent<ComponentType<MdxRendererProps>>;

interface MdxModule {
  default: ComponentType<MdxRendererProps>;
  frontmatter: Record<string, unknown>;
}

const writingModules = import.meta.glob<MdxModule>("./writing/*.mdx");
const articleModules = import.meta.glob<MdxModule>("./articles/*.mdx");
const readModules = import.meta.glob<MdxModule>("./read/*.mdx");
const dailyModules = import.meta.glob<MdxModule>("./daily/*.mdx");
const aboutModules = import.meta.glob<MdxModule>("./about.mdx");
const nowModules = import.meta.glob<MdxModule>("./now.mdx");

const EMPTY_COMPONENT: ComponentType<MdxRendererProps> = () => null;
const componentCache = new Map<string, RenderableMdxComponent>();

function getLazyMdxComponent(path: string, loaders: Record<string, () => Promise<MdxModule>>) {
  const cached = componentCache.get(path);
  if (cached) return cached;

  const loader = loaders[path];
  if (!loader) return EMPTY_COMPONENT;

  const lazyComponent = lazy(async () => {
    const mod = await loader();
    return { default: mod.default };
  });
  componentCache.set(path, lazyComponent);
  return lazyComponent;
}

function toPostMeta(
  item: (typeof writingMeta)[number] | (typeof articleMeta)[number],
  loaders: Record<string, () => Promise<MdxModule>>
): Post & { Component: RenderableMdxComponent } {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    type: item.type as Post["type"],
    category: item.category as Post["category"],
    tags: item.tags,
    date: item.date,
    readingTime: item.readingTime,
    featured: item.featured,
    Component: getLazyMdxComponent(item.path, loaders),
  };
}

function toReadMeta(
  item: (typeof readMeta)[number]
): ReadItem & { Component: RenderableMdxComponent } {
  return {
    slug: item.slug,
    title: item.title,
    snippet: item.snippet,
    source: item.source,
    url: item.url,
    tags: item.tags,
    date: item.date,
    hasBody: item.hasBody ?? true,
    Component: getLazyMdxComponent(item.path, readModules),
  };
}

function toDailyMeta(
  item: (typeof dailyMeta)[number]
): DailyNote & { Component: RenderableMdxComponent } {
  return {
    slug: item.slug,
    title: item.title,
    date: item.date,
    summary: item.summary,
    tags: item.tags.length > 0 ? item.tags : ["daily"],
    Component: getLazyMdxComponent(item.path, dailyModules),
  };
}

export const writingPosts = writingMeta.map((item) => toPostMeta(item, writingModules));
export const articlePosts = articleMeta.map((item) => toPostMeta(item, articleModules));
export const allPosts = [...writingPosts, ...articlePosts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export const allReadItems = readMeta.map(toReadMeta);
export const allDailyNotes = dailyMeta
  .map(toDailyMeta)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getAboutContent() {
  if (!aboutMeta) return null;
  return {
    Component: getLazyMdxComponent(aboutMeta.path, aboutModules),
    frontmatter: aboutMeta.frontmatter,
  };
}

export function getNowContent() {
  if (!nowMeta) return null;
  return {
    Component: getLazyMdxComponent(nowMeta.path, nowModules),
    frontmatter: nowMeta.frontmatter,
  };
}

export function getContentBySlug(slug: string) {
  return allPosts.find((p) => p.slug === slug);
}

export function getReadBySlug(slug: string) {
  return allReadItems.find((r) => r.slug === slug);
}

export function getDailyBySlug(slug: string) {
  return allDailyNotes.find((note) => note.slug === slug);
}
