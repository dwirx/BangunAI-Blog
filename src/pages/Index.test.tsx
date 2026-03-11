import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";

vi.mock("@/data/posts", () => ({
  dailyNotes: [
    { slug: "daily-1", title: "Daily 1", date: "2026-03-10", summary: "Ringkas", tags: [] },
  ],
  posts: [
    {
      slug: "writing-1",
      title: "Writing 1",
      summary: "Summary 1",
      type: "essay",
      category: "Life",
      tags: ["a"],
      date: "2026-03-10",
      readingTime: 5,
    },
    {
      slug: "article-1",
      title: "Article 1",
      summary: "Summary 2",
      type: "article",
      category: "Tech",
      tags: ["b"],
      date: "2026-03-09",
      readingTime: 6,
    },
  ],
  readItems: [
    {
      slug: "read-1",
      title: "Read 1",
      snippet: "Snippet",
      source: "Source",
      url: "https://example.com",
      tags: [],
      date: "2026-03-08",
      hasBody: true,
    },
  ],
  getLatestPosts: vi.fn(() => [
    {
      slug: "writing-1",
      title: "Writing 1",
      summary: "Summary 1",
      type: "essay",
      category: "Life",
      tags: ["a"],
      date: "2026-03-10",
      readingTime: 5,
    },
    {
      slug: "article-1",
      title: "Article 1",
      summary: "Summary 2",
      type: "article",
      category: "Tech",
      tags: ["b"],
      date: "2026-03-09",
      readingTime: 6,
    },
  ]),
  getLatestDailyNotes: vi.fn(() => [
    { slug: "daily-1", title: "Daily 1", date: "2026-03-10", summary: "Ringkas", tags: [] },
  ]),
}));

vi.mock("@/components/PostCard", () => ({
  FeaturedCard: function MockFeaturedCard() {
    return <div data-testid="featured-card" />;
  },
  CompactRow: function MockCompactRow() {
    return <div data-testid="compact-row" />;
  },
}));

vi.mock("@/components/ReadItemCard", () => ({
  default: function MockReadItemCard() {
    return <div data-testid="read-item-card" />;
  },
}));

describe("Index", () => {
  it("removes the oversized hero copy and exposes clickable overview cards", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Index />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/Catatan yang tenang, diagram yang lebih jelas, dan ide yang bisa ditelusuri/i)
    ).not.toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /writing/i })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "http://localhost:3000/writing" })])
    );
    expect(screen.getAllByRole("link", { name: /artikel/i })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "http://localhost:3000/artikel" })])
    );
    expect(screen.getAllByRole("link", { name: /daily/i })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "http://localhost:3000/daily" })])
    );
  });
});
