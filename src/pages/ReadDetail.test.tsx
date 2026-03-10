import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ReadDetail from "@/pages/ReadDetail";

vi.mock("@/content", () => ({
  getReadBySlug: vi.fn((slug: string) => {
    if (slug !== "test-item") return undefined;

    return {
      slug: "test-item",
      title: "Test Item",
      date: "2026-03-10",
      snippet: "Ringkasan singkat",
      source: "Example Source",
      url: "https://example.com",
      tags: ["testing"],
      hasBody: true,
      Component: function MockReadBody() {
        return <div>Isi bacaan</div>;
      },
    };
  }),
}));

vi.mock("@/components/MdxComponents", () => ({
  mdxComponents: {},
}));

vi.mock("@/components/TagLink", () => ({
  default: function MockTagLink({ tag }: { tag: string }) {
    return <span>{tag}</span>;
  },
}));

vi.mock("@/components/TableOfContents", () => ({
  default: function MockTableOfContents() {
    return <div data-testid="toc" />;
  },
}));

describe("ReadDetail", () => {
  it("scrolls to the top when navigating back to the read list", () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      value: scrollToMock,
      writable: true,
    });

    render(
      <MemoryRouter
        initialEntries={["/read/test-item"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/read/:slug" element={<ReadDetail />} />
          <Route path="/read" element={<div>Read List Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    scrollToMock.mockClear();

    fireEvent.click(screen.getByRole("link", { name: /kembali ke read/i }));

    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    expect(screen.getByText("Read List Page")).toBeInTheDocument();
  });
});
