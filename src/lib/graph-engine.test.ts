import { describe, expect, it } from "vitest";
import { buildPreviewGraph, type HybridGraphData } from "@/lib/graph-engine";

function createGraph(nodeIds: string[]): HybridGraphData {
  const nodes = nodeIds.map((id) => ({
    id,
    slug: id,
    title: id.toUpperCase(),
    summary: "",
    type: "essay" as const,
    category: "cat",
    tags: [],
  }));
  return {
    nodes,
    edges: [],
    neighbors: new Map(nodes.map((n) => [n.id, new Set<string>()])),
  };
}

describe("buildPreviewGraph", () => {
  it("keeps the focused node and removes category edges by default", () => {
    const graph = createGraph(["a", "b", "c", "d", "e"]);
    graph.edges = [
      { source: "a", target: "b", weight: 9, kind: "direct" },
      { source: "a", target: "c", weight: 8, kind: "semantic" },
      { source: "a", target: "d", weight: 10, kind: "category" },
      { source: "c", target: "e", weight: 6, kind: "direct" },
    ];

    const preview = buildPreviewGraph(graph, {
      focusId: "a",
      maxNodes: 4,
      maxEdges: 4,
      maxFocusNeighbors: 2,
      maxEdgesPerNode: 3,
    });

    expect(preview.nodes.map((n) => n.id)).toContain("a");
    expect(preview.edges.every((edge) => edge.kind !== "category")).toBe(true);
    expect(preview.nodes.map((n) => n.id)).not.toContain("d");
  });

  it("respects node/edge limits and per-node degree cap", () => {
    const graph = createGraph(["a", "b", "c", "d", "e", "f"]);
    graph.edges = [
      { source: "a", target: "b", weight: 9, kind: "direct" },
      { source: "a", target: "c", weight: 8, kind: "direct" },
      { source: "a", target: "d", weight: 7, kind: "direct" },
      { source: "b", target: "c", weight: 6, kind: "semantic" },
      { source: "c", target: "d", weight: 5, kind: "semantic" },
      { source: "d", target: "e", weight: 4, kind: "direct" },
      { source: "e", target: "f", weight: 3, kind: "direct" },
      { source: "b", target: "f", weight: 2, kind: "semantic" },
    ];

    const preview = buildPreviewGraph(graph, {
      focusId: "a",
      maxNodes: 4,
      maxEdges: 3,
      maxFocusNeighbors: 3,
      maxEdgesPerNode: 2,
    });

    expect(preview.nodes.length).toBeLessThanOrEqual(4);
    expect(preview.edges.length).toBeLessThanOrEqual(3);

    const degree = new Map<string, number>();
    preview.edges.forEach((edge) => {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    });
    degree.forEach((count) => expect(count).toBeLessThanOrEqual(2));
  });
});
