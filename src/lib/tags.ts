import type { Post, ReadItem } from "@/data/types";

export interface TagStat {
  tag: string;
  count: number;
  postCount: number;
  readCount: number;
}

export function buildTagStats(posts: Post[], readItems: ReadItem[]): TagStat[] {
  const stats = new Map<string, TagStat>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = stats.get(tag) ?? { tag, count: 0, postCount: 0, readCount: 0 };
      current.count += 1;
      current.postCount += 1;
      stats.set(tag, current);
    }
  }

  for (const item of readItems) {
    for (const tag of item.tags) {
      const current = stats.get(tag) ?? { tag, count: 0, postCount: 0, readCount: 0 };
      current.count += 1;
      current.readCount += 1;
      stats.set(tag, current);
    }
  }

  return [...stats.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function filterTagStatsByQuery(tagStats: TagStat[], query: string): TagStat[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tagStats;
  return tagStats.filter((item) => item.tag.toLowerCase().includes(normalized));
}

export function getTagDensity(count: number, minCount: number, maxCount: number): number {
  if (maxCount <= minCount) return 1;
  const normalized = (count - minCount) / (maxCount - minCount);
  return 0.4 + normalized * 0.6;
}
