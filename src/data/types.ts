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
  slug: string;
  title: string;
  date: string;
  snippet: string;
  source: string;
  url: string;
  tags: string[];
  hasBody?: boolean;
  content?: string;
}

export interface DailyNote {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content?: string;
}

export const categories: Category[] = ["Tech", "Refleksi", "Produktivitas", "Linux", "Coding", "Life"];
