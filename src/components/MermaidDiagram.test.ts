import { describe, expect, it } from "vitest";
import {
  getMermaidThemeConfig,
  getMermaidThemeMode,
  normalizeMermaidLineBreaks,
  shouldRenderMermaidDiagram,
} from "@/components/MermaidDiagram";

describe("normalizeMermaidLineBreaks", () => {
  it("converts escaped line breaks inside node labels into html breaks", () => {
    const chart = 'flowchart TD\nA["🩹 TRAUMA = LUKA PSIKIS\\n(Psychic Wound)\\n\\nMeninggalkan bekas di:\\n• Sistem saraf\\n• Tubuh fisik"]';

    expect(normalizeMermaidLineBreaks(chart)).toBe(
      'flowchart TD\nA["🩹 TRAUMA = LUKA PSIKIS<br/>(Psychic Wound)<br/><br/>Meninggalkan bekas di:<br/>• Sistem saraf<br/>• Tubuh fisik"]'
    );
  });

  it("supports escaped line breaks in non-flowchart mermaid text blocks", () => {
    const chart = "sequenceDiagram\nNote over A: Baris 1\\nBaris 2";

    expect(normalizeMermaidLineBreaks(chart)).toBe(
      "sequenceDiagram\nNote over A: Baris 1<br/>Baris 2"
    );
  });

  it("keeps diagram structure newlines untouched", () => {
    const chart = "flowchart TD\nA-->B";

    expect(normalizeMermaidLineBreaks(chart)).toBe(chart);
  });
});

describe("getMermaidThemeMode", () => {
  it("normalizes resolved theme values into light or dark", () => {
    expect(getMermaidThemeMode("light")).toBe("light");
    expect(getMermaidThemeMode("dark")).toBe("dark");
    expect(getMermaidThemeMode(undefined)).toBe("dark");
    expect(getMermaidThemeMode("system")).toBe("dark");
  });
});

describe("getMermaidThemeConfig", () => {
  it("uses the base theme so custom palettes control both light and dark rendering", () => {
    expect(getMermaidThemeConfig("light").theme).toBe("base");
    expect(getMermaidThemeConfig("dark").theme).toBe("base");
  });

  it("returns different palettes for light and dark mode", () => {
    const light = getMermaidThemeConfig("light").themeVariables;
    const dark = getMermaidThemeConfig("dark").themeVariables;

    expect(light.primaryColor).not.toBe(dark.primaryColor);
    expect(light.noteBkgColor).not.toBe(dark.noteBkgColor);
    expect(dark.primaryTextColor).toBe("#F8F4EC");
  });
});

describe("shouldRenderMermaidDiagram", () => {
  it("defers first render until the diagram enters the viewport", () => {
    expect(shouldRenderMermaidDiagram(false, false)).toBe(false);
  });

  it("keeps the diagram eligible for rerender after it has rendered once", () => {
    expect(shouldRenderMermaidDiagram(false, true)).toBe(true);
    expect(shouldRenderMermaidDiagram(true, false)).toBe(true);
  });
});
