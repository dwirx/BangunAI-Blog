import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArticleDetail from "@/pages/ArticleDetail";

vi.mock("@/content", () => ({
  getContentBySlug: vi.fn((slug: string) => {
    if (slug !== "test-article") return undefined;

    return {
      slug: "test-article",
      title: "Judul Artikel Test",
      summary: "Ringkasan test",
      type: "article",
      category: "Essay",
      tags: ["testing"],
      date: "2026-03-10",
      readingTime: 7,
      Component: function MockArticleBody() {
        return <div>Isi artikel</div>;
      },
    };
  }),
}));

vi.mock("@/data/posts", () => ({
  getRelatedPosts: vi.fn(() => []),
}));

vi.mock("@/components/MdxComponents", () => ({
  mdxComponents: {},
}));

vi.mock("@/components/Backlinks", () => ({
  default: function MockBacklinks() {
    return <div data-testid="backlinks" />;
  },
}));

vi.mock("@/components/GraphView", () => ({
  default: function MockGraphView() {
    return <div data-testid="graph-view" />;
  },
}));

vi.mock("@/components/TableOfContents", () => ({
  default: function MockTableOfContents() {
    return <div data-testid="toc" />;
  },
}));

vi.mock("@/components/TagLink", () => ({
  default: function MockTagLink({ tag }: { tag: string }) {
    return <span>{tag}</span>;
  },
}));

describe("ArticleDetail", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
  });

  it("keeps the article header clear of the compact fixed navbar without wasting the first viewport", () => {
    render(
      <MemoryRouter
        initialEntries={["/artikel/test-article"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/artikel/:slug" element={<ArticleDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("detail-shell")).toHaveClass("pt-24");
  });
});
