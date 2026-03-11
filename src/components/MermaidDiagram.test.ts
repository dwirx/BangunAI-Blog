import { describe, expect, it } from "vitest";
import {
  collectMermaidNodeColorMap,
  getMermaidThemeConfig,
  getMermaidThemeMode,
  normalizeMermaidLineBreaks,
  pickReadableNodeTextColor,
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

describe("collectMermaidNodeColorMap", () => {
  it("reads node fill and text colors from id-based Mermaid style rules", () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <style>
          #flowchart-G-0 > rect { fill: #1a3a6b; stroke: #1a3a6b; }
          #flowchart-G-0 .label { color: #fff; }
          #flowchart-H-1 rect { fill: #2d5a27; }
          #flowchart-H-1 .nodeLabel { color: #ffffff; }
        </style>
      </svg>
    `;

    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const colorMap = collectMermaidNodeColorMap(doc);

    expect(colorMap.get("flowchart-G-0")).toEqual({ fill: "#1a3a6b", text: "#fff" });
    expect(colorMap.get("flowchart-H-1")).toEqual({ fill: "#2d5a27", text: "#ffffff" });
  });
});

describe("pickReadableNodeTextColor", () => {
  it("prefers explicit text color from Mermaid node styling before computing contrast", () => {
    expect(pickReadableNodeTextColor("#1a3a6b", "#fff")).toBe("#fff");
  });

  it("falls back to contrast-based text color when Mermaid does not provide one", () => {
    expect(pickReadableNodeTextColor("#1a3a6b")).toBe("#f8fafc");
    expect(pickReadableNodeTextColor("#f4e4d1")).toBe("#111827");
  });
});
