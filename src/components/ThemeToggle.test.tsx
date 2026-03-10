import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "@/components/ThemeToggle";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.hoisted(() => vi.fn());

vi.mock("next-themes", () => ({
  useTheme: mockUseTheme,
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
  });

  it("uses the active theme from the theme provider for its accessible label", () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "light",
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it("toggles the theme through the theme provider", () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "dark",
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: /switch to light mode/i }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
