import { describe, expect, it } from "vitest";
import { splitHighlightSegments } from "@/lib/search-highlight";

describe("splitHighlightSegments", () => {
  it("highlights case-insensitive matches", () => {
    const segments = splitHighlightSegments("George Orwell dan 1984", "orwell");
    const highlighted = segments.filter((part) => part.match).map((part) => part.text);
    expect(highlighted).toEqual(["Orwell"]);
  });

  it("handles regex special characters in query", () => {
    const segments = splitHighlightSegments("C++ untuk backend", "c++");
    const highlighted = segments.filter((part) => part.match).map((part) => part.text);
    expect(highlighted).toEqual(["C++"]);
  });

  it("returns original text when query is empty", () => {
    const segments = splitHighlightSegments("Some text", "");
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ text: "Some text", match: false });
  });

  it("prioritizes longer terms first", () => {
    const segments = splitHighlightSegments("totalitarianisme", "total totalitarianisme");
    const highlighted = segments.filter((part) => part.match).map((part) => part.text);
    expect(highlighted[0]).toBe("totalitarianisme");
  });

  it("ignores filter operators in query", () => {
    const segments = splitHighlightSegments("Daily Fokus 1984", "type:daily 1984");
    const highlighted = segments.filter((part) => part.match).map((part) => part.text);
    expect(highlighted).toEqual(["1984"]);
  });
});
