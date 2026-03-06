import { describe, expect, it } from "vitest";
import { buildSearchExcerpt } from "@/lib/search-preview";

describe("buildSearchExcerpt", () => {
  it("returns full text when already short", () => {
    expect(buildSearchExcerpt("Halo dunia", "dunia", 100)).toBe("Halo dunia");
  });

  it("focuses excerpt around matching query", () => {
    const text = "Ini adalah kalimat pembuka. Bagian penting tentang totalitarianisme ada di sini. Penutup panjang.";
    const excerpt = buildSearchExcerpt(text, "totalitarianisme", 50);
    expect(excerpt.toLowerCase()).toContain("totalitarianisme");
    expect(excerpt.length).toBeLessThanOrEqual(60);
  });

  it("falls back to leading excerpt when query not found", () => {
    const text = "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh";
    const excerpt = buildSearchExcerpt(text, "tidak-ada", 25);
    expect(excerpt.startsWith("Satu dua tiga")).toBe(true);
  });
});
