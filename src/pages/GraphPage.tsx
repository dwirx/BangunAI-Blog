import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { allPosts } from "@/content";
import { buildHybridGraph, seededUnit, type GraphEdgeKind } from "@/lib/graph-engine";
import { ZoomIn, ZoomOut, Search, ArrowLeft, RotateCcw, Focus, SlidersHorizontal } from "lucide-react";

interface Node {
  id: string;
  label: string;
  fullLabel: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  slug: string;
  category: string;
  tags: string[];
  pinned: boolean;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  kind: GraphEdgeKind;
}

export default function GraphPage() {
  const allTags = useMemo(
    () => Array.from(new Set(allPosts.flatMap((p) => p.tags))).sort((a, b) => a.localeCompare(b)),
    []
  );
  const allCategories = useMemo(
    () => Array.from(new Set(allPosts.map((p) => p.category))).sort((a, b) => a.localeCompare(b)),
    []
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [activeTypes, setActiveTypes] = useState<string[]>(["note", "essay", "article"]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showKinds, setShowKinds] = useState<Record<GraphEdgeKind, boolean>>({
    direct: true,
    semantic: true,
    category: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<{ type: "pan" | "node"; nodeId?: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [pinVersion, setPinVersion] = useState(0);

  const transformRef = useRef(transform);
  transformRef.current = transform;
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const hoveredRef = useRef(hoveredNode);
  hoveredRef.current = hoveredNode;
  const selectedRef = useRef(selectedNode);
  selectedRef.current = selectedNode;
  const sizeRef = useRef({ w: 800, h: 600 });

  const lastTouchDist = useRef(0);
  const touchDragging = useRef(false);
  const dragMovedRef = useRef(false);
  const dragWasPinnedRef = useRef(false);

  const { nodes, edges } = useMemo(() => {
    const graph = buildHybridGraph(allPosts);
    const nodeList: Node[] = graph.nodes.map((node, i) => {
      const angle = (i / graph.nodes.length) * Math.PI * 2 + seededUnit(`${node.id}:angle`) * 0.8;
      const radius = 220 + seededUnit(`${node.id}:radius`) * 140;
      return {
        id: node.id,
        label: node.title.length > 25 ? node.title.slice(0, 25) + "…" : node.title,
        fullLabel: node.title,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        type: node.type,
        slug: node.slug,
        category: node.category,
        tags: node.tags,
        pinned: false,
      };
    });

    return { nodes: nodeList, edges: graph.edges };
  }, []);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const visibleNodeIds = useMemo(() => {
    return new Set(
      allPosts
        .filter((p) => activeTypes.includes(p.type))
        .filter((p) => activeCategories.length === 0 || activeCategories.includes(p.category))
        .filter((p) => selectedTag === "all" || p.tags.includes(selectedTag))
        .map((p) => p.slug)
    );
  }, [activeTypes, activeCategories, selectedTag]);

  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target) && showKinds[e.kind]
    );
  }, [edges, visibleNodeIds, showKinds]);

  const visibleNeighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    visibleNodeIds.forEach((id) => map.set(id, new Set()));
    visibleEdges.forEach((e) => {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    });
    return map;
  }, [visibleNodeIds, visibleEdges]);

  useEffect(() => {
    if (!selectedNode) return;
    if (!visibleNodeIds.has(selectedNode)) setSelectedNode(null);
  }, [selectedNode, visibleNodeIds]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // HiDPI resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      sizeRef.current = { w, h };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Force simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const tick = () => {
      const ns = nodesRef.current;
      const t = transformRef.current;
      const dpr = window.devicePixelRatio || 1;
      const W = sizeRef.current.w;
      const H = sizeRef.current.h;
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;
      const visibleIds = visibleNodeIds;
      const nodeById = new Map(ns.map((n) => [n.id, n]));
      const visibleNodes = ns.filter((n) => visibleIds.has(n.id));

      // Physics
      for (let i = 0; i < visibleNodes.length; i++) {
        if (visibleNodes[i].pinned) continue;
        for (let j = i + 1; j < visibleNodes.length; j++) {
          const dx = visibleNodes[j].x - visibleNodes[i].x;
          const dy = visibleNodes[j].y - visibleNodes[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!visibleNodes[i].pinned) { visibleNodes[i].vx -= fx; visibleNodes[i].vy -= fy; }
          if (!visibleNodes[j].pinned) { visibleNodes[j].vx += fx; visibleNodes[j].vy += fy; }
        }
      }

      visibleEdges.forEach((e) => {
        const s = nodeById.get(e.source);
        const t2 = nodeById.get(e.target);
        if (!s || !t2) return;
        const dx = t2.x - s.x;
        const dy = t2.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const idealDist = 150 / e.weight;
        const force = (dist - idealDist) * 0.005;
        if (!s.pinned) { s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
        if (!t2.pinned) { t2.vx -= (dx / dist) * force; t2.vy -= (dy / dist) * force; }
      });

      visibleNodes.forEach((n) => {
        if (n.pinned) return;
        // Keep the layout centered in world space so nodes don't drift outward forever.
        n.vx += -n.x * 0.0032;
        n.vy += -n.y * 0.0032;

        n.vx *= 0.88;
        n.vy *= 0.88;
        const speed = Math.hypot(n.vx, n.vy);
        const maxSpeed = 4.2;
        if (speed > maxSpeed) {
          n.vx = (n.vx / speed) * maxSpeed;
          n.vy = (n.vy / speed) * maxSpeed;
        }
        n.x += n.vx;
        n.y += n.vy;

        // Soft radial boundary to keep clusters dense and readable.
        const radius = Math.hypot(n.x, n.y);
        const maxRadius = 780;
        if (radius > maxRadius) {
          const pull = (radius - maxRadius) * 0.04;
          n.x -= (n.x / radius) * pull;
          n.y -= (n.y / radius) * pull;
        }
      });

      // Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2 + t.x, H / 2 + t.y);
      ctx.scale(t.scale, t.scale);

      // Subtle dot grid
      const gridSize = 40;
      const gridRange = 1200;
      ctx.fillStyle = "rgba(100,116,139,0.04)";
      for (let gx = -gridRange; gx <= gridRange; gx += gridSize) {
        for (let gy = -gridRange; gy <= gridRange; gy += gridSize) {
          ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
        }
      }

      // Connected set
      const connectedTo = new Set<string>();
      const activeNode = selected || hovered;
      if (activeNode) {
        visibleNeighbors.get(activeNode)?.forEach((id) => connectedTo.add(id));
      }

      // Edges
      visibleEdges.forEach((e) => {
        const s = nodeById.get(e.source);
        const t2 = nodeById.get(e.target);
        if (!s || !t2) return;
        const isActive = activeNode && (e.source === activeNode || e.target === activeNode);
        const dimmed = activeNode && !isActive;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t2.x, t2.y);
        const kindTint = e.kind === "direct" ? 1 : e.kind === "semantic" ? 0.7 : 0.45;
        ctx.strokeStyle = isActive
          ? `rgba(124,58,237,${0.28 + e.weight * 0.07})`
          : dimmed
            ? "rgba(100,116,139,0.03)"
            : `rgba(100,116,139,${0.05 + e.weight * 0.025 + kindTint * 0.02})`;
        ctx.lineWidth = (isActive ? 1.8 + e.weight * 0.32 : 0.55 + e.weight * 0.05) / t.scale;
        ctx.stroke();
      });

      // Nodes
      const colors: Record<string, string> = {
        note: "#38bdf8",
        essay: "#a78bfa",
        article: "#fbbf24",
      };

      const searchLower = searchQuery.toLowerCase();

      const occupiedLabels: Array<{ x: number; y: number; w: number; h: number }> = [];
      visibleNodes.forEach((n) => {
        const isSelected = n.id === selected;
        const isHovered = n.id === hovered;
        const isConnected = connectedTo.has(n.id);
        const dimmed = activeNode && !isSelected && !isHovered && !isConnected;
        const matchesSearch = searchLower && (n.fullLabel.toLowerCase().includes(searchLower) || n.tags.some(t3 => t3.toLowerCase().includes(searchLower)));

        const baseRadius = 5;
        const radius = isSelected ? 10 : isHovered ? 8 : isConnected ? 6 : matchesSearch ? 8 : baseRadius;
        const color = colors[n.type] || "#64748b";

        // Glow
        if (isSelected || isHovered || matchesSearch) {
          const glowR = radius + 14;
          const grad = ctx.createRadialGradient(n.x, n.y, radius * 0.5, n.x, n.y, glowR);
          const glowColor = isSelected ? "124,58,237" : matchesSearch ? "56,189,248" : "148,163,184";
          grad.addColorStop(0, `rgba(${glowColor},0.3)`);
          grad.addColorStop(0.6, `rgba(${glowColor},0.08)`);
          grad.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Node with gradient
        const nodeGrad = ctx.createRadialGradient(n.x - radius * 0.3, n.y - radius * 0.3, 0, n.x, n.y, radius);
        nodeGrad.addColorStop(0, dimmed ? `${color}55` : color);
        nodeGrad.addColorStop(1, dimmed ? `${color}33` : color);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.25)";
          ctx.lineWidth = 1.5 / t.scale;
          ctx.stroke();
        }

        // Labels
        const showLabel = isSelected || isHovered || isConnected || matchesSearch || t.scale > 1.2;
        if (showLabel && !dimmed) {
          const fontSize = Math.max(10, 12 / t.scale);
          ctx.font = `600 ${fontSize}px 'Space Grotesk', system-ui, sans-serif`;
          ctx.textAlign = "center";

          const text = n.label;
          const tw = ctx.measureText(text).width;
          const pad = 6;
          const lh = fontSize + 6;
          const ly = n.y - radius - lh - 3;
          const lx = n.x - tw / 2 - pad;
          const lw = tw + pad * 2;
          const overlaps = occupiedLabels.some((box) =>
            lx < box.x + box.w && lx + lw > box.x && ly < box.y + box.h && ly + lh > box.y
          );
          const prioritize = isSelected || isHovered || matchesSearch;
          if (overlaps && !prioritize) return;
          occupiedLabels.push({ x: lx, y: ly, w: lw, h: lh });

          ctx.fillStyle = "rgba(15,23,42,0.92)";
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, 5);
          ctx.fill();
          ctx.strokeStyle = "rgba(100,116,139,0.12)";
          ctx.lineWidth = 0.5 / t.scale;
          ctx.stroke();

          ctx.fillStyle = isSelected ? "rgba(167,139,250,0.95)" : isHovered ? "rgba(226,232,240,0.95)" : "rgba(226,232,240,0.7)";
          ctx.fillText(text, n.x, ly + lh - 5);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [visibleEdges, visibleNeighbors, visibleNodeIds, searchQuery]);

  // Screen to world
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const W = sizeRef.current.w;
    const H = sizeRef.current.h;
    const t = transformRef.current;
    return {
      wx: (clientX - rect.left - W / 2 - t.x) / t.scale,
      wy: (clientY - rect.top - H / 2 - t.y) / t.scale,
    };
  }, []);

  const findNodeAt = useCallback((wx: number, wy: number) => {
    const ns = nodesRef.current;
    const hitRadius = 14 / transformRef.current.scale;
    for (const n of ns) {
      if (!visibleNodeIds.has(n.id)) continue;
      const dx = wx - n.x, dy = wy - n.y;
      if (dx * dx + dy * dy < hitRadius * hitRadius) return n;
    }
    return null;
  }, [visibleNodeIds]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(wx, wy);
    dragMovedRef.current = false;
    if (node) {
      dragWasPinnedRef.current = node.pinned;
      setDragging({ type: "node", nodeId: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y });
    } else {
      setDragging({ type: "pan", startX: e.clientX, startY: e.clientY, origX: transformRef.current.x, origY: transformRef.current.y });
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [screenToWorld, findNodeAt]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = draggingRef.current;
    if (d) {
      if (d.type === "pan") {
        if (Math.abs(e.clientX - d.startX) > 2 || Math.abs(e.clientY - d.startY) > 2) {
          dragMovedRef.current = true;
        }
        setTransform((prev) => ({ ...prev, x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) }));
      } else if (d.type === "node" && d.nodeId) {
        const ns = nodesRef.current;
        const node = ns.find((n) => n.id === d.nodeId);
        if (node) {
          if (Math.abs(e.clientX - d.startX) > 2 || Math.abs(e.clientY - d.startY) > 2) {
            dragMovedRef.current = true;
          }
          const t = transformRef.current;
          node.x = d.origX + (e.clientX - d.startX) / t.scale;
          node.y = d.origY + (e.clientY - d.startY) / t.scale;
          node.vx = 0;
          node.vy = 0;
          if (dragMovedRef.current) node.pinned = true;
        }
      }
    } else {
      const { wx, wy } = screenToWorld(e.clientX, e.clientY);
      const node = findNodeAt(wx, wy);
      setHoveredNode(node?.id || null);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = node ? "pointer" : "grab";
    }
  }, [screenToWorld, findNodeAt]);

  const handlePointerUp = useCallback(() => {
    const d = draggingRef.current;
    if (d?.type === "node" && d.nodeId) {
      const ns = nodesRef.current;
      const node = ns.find((n) => n.id === d.nodeId);
      if (node && !dragMovedRef.current) {
        node.pinned = dragWasPinnedRef.current;
      }
      if (dragMovedRef.current) setPinVersion((v) => v + 1);
    }
    setDragging(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(wx, wy);
    if (node) {
      setSelectedNode((prev) => (prev === node.id ? null : node.id));
    } else {
      setSelectedNode(null);
    }
  }, [screenToWorld, findNodeAt]);

  const handleDblClick = useCallback((e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(wx, wy);
    if (node) {
      const href = node.type === "article" ? `/artikel/${node.slug}` : `/writing/${node.slug}`;
      navigate(href);
    }
  }, [screenToWorld, findNodeAt, navigate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = sizeRef.current.w;
    const H = sizeRef.current.h;
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    
    setTransform((prev) => {
      const newScale = Math.max(0.15, Math.min(5, prev.scale * delta));
      // Zoom toward cursor position
      const worldX = (mx - W / 2 - prev.x) / prev.scale;
      const worldY = (my - H / 2 - prev.y) / prev.scale;
      return {
        x: mx - W / 2 - worldX * newScale,
        y: my - H / 2 - worldY * newScale,
        scale: newScale,
      };
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      touchDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDragging.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist.current;
      lastTouchDist.current = dist;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.15, Math.min(5, prev.scale * scale)),
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchDragging.current = false;
  }, []);

  const zoom = useCallback((factor: number) => {
    setTransform((prev) => {
      const newScale = Math.max(0.15, Math.min(5, prev.scale * factor));
      return { ...prev, scale: newScale };
    });
  }, []);

  const resetView = useCallback(() => {
    nodesRef.current.forEach((n) => {
      n.pinned = false;
    });
    setPinVersion((v) => v + 1);
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
  }, []);

  const fitToContent = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const { w, h } = sizeRef.current;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    ns.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });
    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.min(w / contentW, h / contentH, 2.5);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setTransform({
      x: -centerX * scale,
      y: -centerY * scale,
      scale,
    });
    setSelectedNode(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "+" || e.key === "=") zoom(1.3);
      else if (e.key === "-") zoom(0.7);
      else if (e.key === "0") resetView();
      else if (e.key === "f" || e.key === "F") fitToContent();
      else if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoom, resetView, fitToContent]);

  const selectedPost = useMemo(() => {
    if (!selectedNode) return null;
    return allPosts.find((p) => p.slug === selectedNode) || null;
  }, [selectedNode]);

  const connectedPosts = useMemo(() => {
    if (!selectedNode) return [];
    const connected = visibleNeighbors.get(selectedNode) ?? new Set<string>();
    return allPosts.filter((p) => connected.has(p.slug));
  }, [selectedNode, visibleNeighbors]);
  const selectedNodePinned = useMemo(() => {
    if (!selectedNode) return false;
    return nodesRef.current.find((n) => n.id === selectedNode)?.pinned ?? false;
  }, [selectedNode, pinVersion]);

  const toggleType = (type: string) => {
    setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleKind = (kind: GraphEdgeKind) => {
    setShowKinds((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  const resetFilters = () => {
    setSelectedTag("all");
    setActiveTypes(["note", "essay", "article"]);
    setActiveCategories([]);
    setShowKinds({ direct: true, semantic: true, category: true });
  };
  const activeFilterCount =
    (selectedTag !== "all" ? 1 : 0) +
    (activeTypes.length !== 3 ? 1 : 0) +
    (activeCategories.length > 0 ? 1 : 0) +
    ((showKinds.direct && showKinds.semantic && showKinds.category) ? 0 : 1);

  const ControlBtn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border transition-all shadow-sm backdrop-blur-sm ${
        active 
          ? "bg-primary/20 border-primary/40 text-primary" 
          : "bg-background/90 border-border/40 text-muted-foreground/70 hover:text-foreground hover:bg-background hover:border-border/60"
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="h-[100svh] flex flex-col pt-14 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-heading text-sm font-semibold">Graph View</h1>
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
            {visibleNodeIds.size} / {allPosts.length} nodes · {visibleEdges.length} / {edges.length} edges
          </span>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={`ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] transition-colors ${
              settingsOpen
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/40 text-muted-foreground/70 hover:text-foreground"
            }`}
            title="Show/Hide filters"
          >
            <SlidersHorizontal size={12} />
            {settingsOpen ? "Hide Settings" : "Show Settings"}
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative hidden sm:block">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/40 rounded-lg w-48 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
          <ControlBtn onClick={() => zoom(1.3)} title="Zoom in (+)"><ZoomIn size={15} /></ControlBtn>
          <ControlBtn onClick={() => zoom(0.7)} title="Zoom out (-)"><ZoomOut size={15} /></ControlBtn>
          <ControlBtn onClick={fitToContent} title="Fit all (F)"><Focus size={15} /></ControlBtn>
          <ControlBtn onClick={resetView} title="Reset (0)"><RotateCcw size={15} /></ControlBtn>
          <span className="text-[10px] text-muted-foreground/40 ml-1 min-w-[32px] text-right">{Math.round(transform.scale * 100)}%</span>
        </div>
      </div>

      {/* Filters */}
      {settingsOpen && (
        <div className="px-3 sm:px-4 py-2.5 border-b border-border/30 bg-background/80 backdrop-blur-sm space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border/30 bg-secondary/20 p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5">Type</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {(["note", "essay", "article"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-2.5 py-1 rounded-md text-[10px] border transition-colors ${
                      activeTypes.includes(type)
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/40 text-muted-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/30 bg-secondary/20 p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5">Connection</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {(["direct", "semantic", "category"] as GraphEdgeKind[]).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => toggleKind(kind)}
                    className={`px-2.5 py-1 rounded-md text-[10px] border transition-colors ${
                      showKinds[kind]
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-border/40 text-muted-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/30 bg-secondary/20 p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5">Tag</p>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] bg-background/70 border border-border/40 rounded-md text-foreground"
              >
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-border/30 bg-secondary/20 p-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Category</p>
              <button
                onClick={resetFilters}
                className="px-2.5 py-1 rounded-md text-[10px] border border-border/40 text-muted-foreground/70 hover:text-foreground"
              >
                Reset
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-2 py-1 rounded-md text-[10px] border transition-colors ${
                    activeCategories.includes(category)
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                      : "border-border/40 text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile search */}
      <div className="sm:hidden px-3 py-2 border-b border-border/30">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/40 rounded-lg w-full focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleClick}
          onDoubleClick={handleDblClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 sm:gap-4 px-3 py-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/30 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Note</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" /> Essay</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" /> Article</span>
          <span className="opacity-50 hidden sm:inline">Scroll=Zoom · Drag=Pan · Click=Select · DblClick=Open · Filter=Type/Tag/Category/Koneksi</span>
        </div>

        {/* Info Panel */}
        {selectedPost && (
          <div className="absolute top-4 right-4 w-64 sm:w-72 rounded-xl bg-background/90 backdrop-blur-md border border-border/40 p-4 shadow-xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${selectedPost.type === "note" ? "bg-[#38bdf8]" : selectedPost.type === "essay" ? "bg-[#a78bfa]" : "bg-[#fbbf24]"}`} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{selectedPost.type} · {selectedPost.category}</span>
            </div>
            <h3 className="font-heading text-sm font-semibold mb-1.5 leading-snug">{selectedPost.title}</h3>
            <p className="text-xs text-muted-foreground/60 mb-3 line-clamp-2">{selectedPost.summary}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedPost.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground/50">{tag}</span>
              ))}
            </div>
            {connectedPosts.length > 0 && (
              <div className="border-t border-border/30 pt-2.5 mt-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 block mb-1.5">Connected ({connectedPosts.length})</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {connectedPosts.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => setSelectedNode(p.slug)}
                      className="block text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate w-full"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                const href = selectedPost.type === "article" ? `/artikel/${selectedPost.slug}` : `/writing/${selectedPost.slug}`;
                navigate(href);
              }}
              className="mt-3 w-full py-1.5 text-xs font-medium rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Buka Artikel →
            </button>
            {selectedNodePinned && (
              <button
                onClick={() => {
                  const node = nodesRef.current.find((n) => n.id === selectedPost.slug);
                  if (node) {
                    node.pinned = false;
                    setPinVersion((v) => v + 1);
                  }
                }}
                className="mt-2 w-full py-1.5 text-xs font-medium rounded-lg bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                Lepas Pin Node
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
