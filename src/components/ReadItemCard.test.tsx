import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReadItemCard from "@/components/ReadItemCard";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

describe("ReadItemCard", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("navigates to internal read page when card has body content", () => {
    render(
      <ReadItemCard
        item={{
          slug: "sample-note",
          title: "Sample Note",
          snippet: "Snippet",
          source: "Blog",
          url: "https://example.com/article",
          tags: ["ai"],
          date: "2026-03-06",
          hasBody: true,
        }}
      />
    );

    const card = screen.getByRole("link", { name: /buka catatan sample note/i });
    fireEvent.click(card);
    expect(navigateMock).toHaveBeenCalledWith("/read/sample-note");

    const externalLink = screen.getByRole("link", { name: /buka sumber eksternal sample note/i });
    fireEvent.click(externalLink);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("does not navigate when card has no internal content", () => {
    render(
      <ReadItemCard
        item={{
          slug: "external-only",
          title: "External Only",
          snippet: "Snippet",
          source: "Source",
          url: "https://example.com/external",
          tags: [],
          date: "2026-03-06",
          hasBody: false,
        }}
      />
    );

    expect(screen.queryByText("Ada catatan")).not.toBeInTheDocument();
    const externalLink = screen.getByRole("link", { name: /buka sumber eksternal external only/i });
    fireEvent.click(externalLink);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
