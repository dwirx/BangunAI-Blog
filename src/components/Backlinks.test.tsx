import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Backlinks from "@/components/Backlinks";

const mockPosts = vi.hoisted(() => [
  {
    slug: "current-post",
    title: "Current Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-01",
    readingTime: 6,
  },
  {
    slug: "alpha-post",
    title: "Alpha Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-02",
    readingTime: 8,
  },
  {
    slug: "beta-post",
    title: "Beta Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-03",
    readingTime: 7,
  },
  {
    slug: "gamma-post",
    title: "Gamma Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-04",
    readingTime: 7,
  },
  {
    slug: "delta-post",
    title: "Delta Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-05",
    readingTime: 7,
  },
  {
    slug: "epsilon-post",
    title: "Epsilon Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-06",
    readingTime: 7,
  },
  {
    slug: "zeta-post",
    title: "Zeta Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-07",
    readingTime: 7,
  },
  {
    slug: "eta-post",
    title: "Eta Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-08",
    readingTime: 7,
  },
  {
    slug: "theta-post",
    title: "Theta Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-09",
    readingTime: 7,
  },
  {
    slug: "iota-post",
    title: "Iota Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-10",
    readingTime: 7,
  },
  {
    slug: "kappa-post",
    title: "Kappa Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-11",
    readingTime: 7,
  },
  {
    slug: "lambda-post",
    title: "Lambda Post",
    summary: "",
    type: "essay",
    category: "Tech",
    tags: [],
    date: "2026-01-12",
    readingTime: 7,
  },
  {
    slug: "mu-post",
    title: "Mu Post",
    summary: "",
    type: "article",
    category: "Tech",
    tags: [],
    date: "2026-01-13",
    readingTime: 7,
  },
]);

vi.mock("@/content", () => ({
  allPosts: mockPosts,
}));

vi.mock("@/lib/graph-engine", () => ({
  buildHybridGraph: vi.fn(() => ({
    nodes: [],
    edges: [
      { source: "current-post", target: "beta-post", weight: 9, kind: "direct" },
      { source: "current-post", target: "alpha-post", weight: 3, kind: "direct" },
      { source: "current-post", target: "gamma-post", weight: 7.2, kind: "direct" },
      { source: "current-post", target: "delta-post", weight: 6.8, kind: "direct" },
      { source: "current-post", target: "epsilon-post", weight: 6.4, kind: "direct" },
      { source: "current-post", target: "zeta-post", weight: 5.7, kind: "direct" },
      { source: "current-post", target: "eta-post", weight: 5.2, kind: "direct" },
      { source: "current-post", target: "theta-post", weight: 4.8, kind: "direct" },
      { source: "current-post", target: "iota-post", weight: 4.4, kind: "direct" },
      { source: "current-post", target: "kappa-post", weight: 4.1, kind: "direct" },
      { source: "current-post", target: "lambda-post", weight: 3.6, kind: "direct" },
      { source: "current-post", target: "mu-post", weight: 3.2, kind: "direct" },
    ],
    neighbors: new Map<string, Set<string>>([
      [
        "current-post",
        new Set([
          "alpha-post",
          "beta-post",
          "gamma-post",
          "delta-post",
          "epsilon-post",
          "zeta-post",
          "eta-post",
          "theta-post",
          "iota-post",
          "kappa-post",
          "lambda-post",
          "mu-post",
        ]),
      ],
      ["alpha-post", new Set(["current-post"])],
      ["beta-post", new Set(["current-post"])],
      ["gamma-post", new Set(["current-post"])],
      ["delta-post", new Set(["current-post"])],
      ["epsilon-post", new Set(["current-post"])],
      ["zeta-post", new Set(["current-post"])],
      ["eta-post", new Set(["current-post"])],
      ["theta-post", new Set(["current-post"])],
      ["iota-post", new Set(["current-post"])],
      ["kappa-post", new Set(["current-post"])],
      ["lambda-post", new Set(["current-post"])],
      ["mu-post", new Set(["current-post"])],
    ]),
  })),
}));

describe("Backlinks", () => {
  it("renders compact grouped backlinks with quality badges and animated toggle", () => {
    render(
      <MemoryRouter>
        <Backlinks slug="current-post" />
      </MemoryRouter>
    );

    const list = screen.getByTestId("backlinks-list");
    expect(list).toHaveClass("max-h-56");
    expect(list).toHaveClass("overflow-y-auto");
    expect(list).toHaveClass("transition-[max-height]");
    expect(screen.getByText("12 tulisan")).toBeInTheDocument();
    expect(screen.getByText("Artikel")).toBeInTheDocument();
    expect(screen.getByText("Writing")).toBeInTheDocument();
    expect(screen.getByText("R9.0")).toBeInTheDocument();
    expect(screen.getAllByText("Tinggi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sedang").length).toBeGreaterThan(0);

    const toggleButton = screen.getByRole("button", { name: "Lihat semua (12)" });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    let links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(screen.getByRole("link", { name: /beta post/i })).toHaveAttribute("href", "/writing/beta-post");
    expect(screen.getByRole("link", { name: /delta post/i })).toHaveAttribute("href", "/artikel/delta-post");

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(list).toHaveClass("max-h-[28rem]");
    expect(screen.getAllByText("Rendah").length).toBeGreaterThan(0);
    links = screen.getAllByRole("link");
    expect(links).toHaveLength(12);
    expect(screen.getByRole("link", { name: /mu post/i })).toHaveAttribute("href", "/artikel/mu-post");
    expect(screen.getByRole("button", { name: "Tampilkan ringkas (6)" })).toBeInTheDocument();
  });

  it("renders nothing when current post has no backlink neighbors", () => {
    const { container } = render(
      <MemoryRouter>
        <Backlinks slug="missing-post" />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
