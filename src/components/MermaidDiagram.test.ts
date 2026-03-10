import { describe, expect, it } from "vitest";
import { normalizeMermaidLineBreaks } from "@/components/MermaidDiagram";

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
