import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Navbar from "@/components/Navbar";

vi.mock("@/components/SearchModal", () => ({
  default: function MockSearchModal() {
    return null;
  },
}));

vi.mock("@/components/ThemeToggle", () => ({
  default: function MockThemeToggle() {
    return <button type="button">Theme</button>;
  },
}));

describe("Navbar", () => {
  it("uses the compact navbar spacing and smaller brand pill", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toHaveClass("py-2.5", "sm:py-3");
    expect(screen.getByRole("link", { name: /bangunai/i })).toHaveClass("px-2.5", "py-1.5");
  });
});
