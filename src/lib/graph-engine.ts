import type { Post } from "@/data/types";

export type GraphEdgeKind = "direct" | "semantic" | "category";

export interface GraphNodeData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: Post["type"];
  category: string;
  tags: string[];
}

export interface GraphEdgeData {
  source: string;
  target: string;
  weight: number;
  kind: GraphEdgeKind;
}

export interface HybridGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  neighbors: Map<string, Set<string>>;
}

export interface PreviewGraphOptions {
  focusId?: string;
  maxNodes?: number;
  maxEdges?: number;
  maxFocusNeighbors?: number;
  maxEdgesPerNode?: number;
  includeCategoryEdges?: boolean;
}

function normalizeText(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");
  return text.toLowerCase().trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asPhrase(slug: string) {
  return slug.replace(/[-_]+/g, " ").trim();
}

function scoreDirectLink(from: GraphNodeData, to: GraphNodeData): number {
  let score = 0;
  const summary = normalizeText(from.summary || "");
  const toSlug = normalizeText(to.slug);
  const toPhrase = normalizeText(asPhrase(to.slug));

  if (!summary) {
    return from.tags.some((tag) => normalizeText(tag) === toSlug) ? 2 : 0;
  }

  if (summary.includes(`[[${toSlug}]]`)) score += 3;
  if (summary.includes(`/writing/${toSlug}`) || summary.includes(`/artikel/${toSlug}`)) score += 3;
  if (summary.includes(`#${toSlug}`)) score += 2;
  if (from.tags.some((tag) => normalizeText(tag) === toSlug)) score += 2;

  // Keep phrase matching strict to avoid random accidental matches.
  if (toPhrase.length >= 5) {
    const phraseRegex = new RegExp(`\\b${escapeRegex(toPhrase)}\\b`, "i");
    if (phraseRegex.test(summary)) score += 1;
  }

  return score;
}

function getSharedTagCount(a: GraphNodeData, b: GraphNodeData): number {
  const aTags = new Set(a.tags.map(normalizeText));
  let count = 0;
  for (const tag of b.tags) {
    if (aTags.has(normalizeText(tag))) count += 1;
  }
  return count;
}

function getKind(directScore: number, semanticScore: number, categoryScore: number): GraphEdgeKind {
  if (directScore > 0) return "direct";
  if (semanticScore > 0) return "semantic";
  if (categoryScore > 0) return "category";
  return "semantic";
}

export function buildHybridGraph(posts: Post[]): HybridGraphData {
  const nodes: GraphNodeData[] = posts.map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: post.title,
    summary: post.summary || "",
    type: post.type,
    category: post.category || "uncategorized",
    tags: post.tags || [],
  }));

  const edges: GraphEdgeData[] = [];
  const neighbors = new Map<string, Set<string>>();
  for (const node of nodes) neighbors.set(node.id, new Set());

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const directScore = scoreDirectLink(a, b) + scoreDirectLink(b, a);
      const sharedTags = getSharedTagCount(a, b);
      const semanticScore = sharedTags * 1.2;
      const categoryScore = a.category === b.category ? 1 : 0;

      if (directScore <= 0 && semanticScore <= 0 && categoryScore <= 0) {
        continue;
      }

      const kind = getKind(directScore, semanticScore, categoryScore);
      const baseWeight =
        directScore > 0
          ? 5 + Math.min(4, directScore) + semanticScore * 0.4 + categoryScore * 0.3
          : semanticScore > 0
            ? semanticScore * 1.3 + categoryScore * 0.9
            : 1.1;

      const weight = Math.min(10, Math.max(1, baseWeight));
      edges.push({ source: a.id, target: b.id, weight, kind });
      neighbors.get(a.id)?.add(b.id);
      neighbors.get(b.id)?.add(a.id);
    }
  }

  return { nodes, edges, neighbors };
}

export function buildPreviewGraph(
  graph: HybridGraphData,
  options: PreviewGraphOptions = {}
): HybridGraphData {
  const {
    focusId,
    maxNodes = 48,
    maxEdges = 120,
    maxFocusNeighbors = 18,
    maxEdgesPerNode = 7,
    includeCategoryEdges = false,
  } = options;

  if (includeCategoryEdges && graph.nodes.length <= maxNodes && graph.edges.length <= maxEdges) {
    return graph;
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const candidateEdges = graph.edges
    .filter((edge) => includeCategoryEdges || edge.kind !== "category")
    .sort((a, b) => b.weight - a.weight);

  const selectedNodes = new Set<string>();
  const addNode = (id: string) => {
    if (!nodeById.has(id) || selectedNodes.has(id) || selectedNodes.size >= maxNodes) return false;
    selectedNodes.add(id);
    return true;
  };

  if (focusId) addNode(focusId);

  if (focusId && maxFocusNeighbors > 0) {
    let focusCount = 0;
    for (const edge of candidateEdges) {
      if (focusCount >= maxFocusNeighbors || selectedNodes.size >= maxNodes) break;
      if (edge.source !== focusId && edge.target !== focusId) continue;
      const peerId = edge.source === focusId ? edge.target : edge.source;
      if (addNode(peerId)) focusCount += 1;
    }
  }

  for (const edge of candidateEdges) {
    if (selectedNodes.size >= maxNodes) break;
    const hasSource = selectedNodes.has(edge.source);
    const hasTarget = selectedNodes.has(edge.target);
    if (hasSource && hasTarget) continue;
    if (hasSource || hasTarget) {
      addNode(hasSource ? edge.target : edge.source);
    }
  }

  for (const edge of candidateEdges) {
    if (selectedNodes.size >= maxNodes) break;
    const hasSource = selectedNodes.has(edge.source);
    const hasTarget = selectedNodes.has(edge.target);
    if (hasSource && hasTarget) continue;
    addNode(edge.source);
    addNode(edge.target);
  }

  if (selectedNodes.size === 0) {
    for (const node of graph.nodes) {
      if (!addNode(node.id)) break;
    }
  }

  const selectedEdges: GraphEdgeData[] = [];
  const degreeByNode = new Map<string, number>();
  for (const edge of candidateEdges) {
    if (selectedEdges.length >= maxEdges) break;
    if (!selectedNodes.has(edge.source) || !selectedNodes.has(edge.target)) continue;

    const sourceDegree = degreeByNode.get(edge.source) ?? 0;
    const targetDegree = degreeByNode.get(edge.target) ?? 0;
    if (sourceDegree >= maxEdgesPerNode || targetDegree >= maxEdgesPerNode) continue;

    selectedEdges.push(edge);
    degreeByNode.set(edge.source, sourceDegree + 1);
    degreeByNode.set(edge.target, targetDegree + 1);
  }

  const selectedNodeList = graph.nodes.filter((node) => selectedNodes.has(node.id));
  const neighbors = new Map<string, Set<string>>();
  selectedNodeList.forEach((node) => neighbors.set(node.id, new Set()));
  selectedEdges.forEach((edge) => {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  });

  return {
    nodes: selectedNodeList,
    edges: selectedEdges,
    neighbors,
  };
}

function hashString(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

export function seededUnit(seed: string) {
  return (hashString(seed) % 1000) / 1000;
}
