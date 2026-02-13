import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { allPosts } from "@/content";
import { buildHybridGraph, seededUnit, type GraphEdgeKind } from "@/lib/graph-engine";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Maximize2, ZoomIn, ZoomOut, RotateCcw, Focus } from "lucide-react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  slug: string;
  pinned: boolean;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  kind: GraphEdgeKind;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export default function GraphView({ currentSlug }: { currentSlug?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });
  const dragNode = useRef<Node | null>(null);
  const dragMoved = useRef(false);
  const dragWasPinned = useRef(false);
  const sizeRef = useRef({ w: 500, h: 300 });
  const [zoomLevel, setZoomLevel] = useState(100);

  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });

  const { nodes, edges, neighbors } = useMemo(() => {
    const graph = buildHybridGraph(allPosts);
    const nodeMap = new Map<string, Node>();
    graph.nodes.forEach((node, i) => {
      const angle = (i / graph.nodes.length) * Math.PI * 2 + seededUnit(`${node.id}:angle`) * 0.8;
      const radius = 120 + seededUnit(`${node.id}:radius`) * 90;
      nodeMap.set(node.slug, {
        id: node.slug,
        label: node.title.length > 22 ? node.title.slice(0, 22) + "…" : node.title,
        x: 250 + Math.cos(angle) * radius,
        y: 180 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        type: node.type,
        slug: node.slug,
        pinned: false,
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: graph.edges, neighbors: graph.neighbors };
  }, []);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const hoveredRef = useRef(hoveredNode);
  hoveredRef.current = hoveredNode;

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const t = transformRef.current;
    return {
      x: (sx - t.x) / t.scale,
      y: (sy - t.y) / t.scale,
    };
  }, []);

  const findNodeAt = useCallback((mx: number, my: number) => {
    const { x, y } = screenToCanvas(mx, my);
    const ns = nodesRef.current;
    const hitRadius = 14 / transformRef.current.scale;
    for (const n of ns) {
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy < hitRadius * hitRadius) return n;
    }
    return null;
  }, [screenToCanvas]);

  // HiDPI canvas resize
  useEffect(() => {
    if (isCollapsed) return;
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
  }, [isCollapsed]);

  // Force simulation + draw
  useEffect(() => {
    if (isCollapsed) return;
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
      const nodeById = new Map(ns.map((n) => [n.id, n]));

      // Physics
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (dragNode.current?.id !== ns[i].id) { ns[i].vx -= fx; ns[i].vy -= fy; }
          if (dragNode.current?.id !== ns[j].id) { ns[j].vx += fx; ns[j].vy += fy; }
        }
      }

      edges.forEach((e) => {
        const s = nodeById.get(e.source);
        const t2 = nodeById.get(e.target);
        if (!s || !t2) return;
        const dx = t2.x - s.x;
        const dy = t2.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - (140 - e.weight * 6)) * 0.0035;
        if (dragNode.current?.id !== s.id) { s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
        if (dragNode.current?.id !== t2.id) { t2.vx -= (dx / dist) * force; t2.vy -= (dy / dist) * force; }
      });

      ns.forEach((n) => {
        if (n.pinned || dragNode.current?.id === n.id) return;
        n.vx += (W / 2 - n.x) * 0.001;
        n.vy += (H / 2 - n.y) * 0.001;
        n.vx *= 0.9;
        n.vy *= 0.9;
        const speed = Math.hypot(n.vx, n.vy);
        const maxSpeed = 3.6;
        if (speed > maxSpeed) {
          n.vx = (n.vx / speed) * maxSpeed;
          n.vy = (n.vy / speed) * maxSpeed;
        }
        n.x += n.vx;
        n.y += n.vy;

        const dxC = n.x - W / 2;
        const dyC = n.y - H / 2;
        const radius = Math.hypot(dxC, dyC);
        const maxRadius = Math.min(W, H) * 0.52;
        if (radius > maxRadius) {
          const pull = (radius - maxRadius) * 0.15;
          n.x -= (dxC / radius) * pull;
          n.y -= (dyC / radius) * pull;
        }
      });

      // Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Subtle background pattern
      ctx.fillStyle = "rgba(100,116,139,0.015)";
      const gridSize = 30 * t.scale;
      const offX = t.x % gridSize;
      const offY = t.y % gridSize;
      for (let gx = offX - gridSize; gx < W + gridSize; gx += gridSize) {
        for (let gy = offY - gridSize; gy < H + gridSize; gy += gridSize) {
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      // Connected edges set
      const connectedEdges = new Set<string>();
      if (currentSlug || hovered) {
        const activeId = currentSlug || hovered;
        if (activeId) neighbors.get(activeId)?.forEach((id) => connectedEdges.add(id));
      }

      // Edges
      edges.forEach((e) => {
        const s = nodeById.get(e.source);
        const t2 = nodeById.get(e.target);
        if (!s || !t2) return;
        const isActive = s.id === currentSlug || t2.id === currentSlug;
        const isHoverEdge = s.id === hovered || t2.id === hovered;
        const kindTint = e.kind === "direct" ? 1 : e.kind === "semantic" ? 0.7 : 0.45;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.strokeStyle = isActive
          ? "rgba(124,58,237,0.56)"
          : isHoverEdge
            ? "rgba(148,163,184,0.35)"
            : `rgba(100,116,139,${0.06 + e.weight * 0.025 + kindTint * 0.02})`;
        ctx.lineWidth = (isActive ? 2.1 + e.weight * 0.2 : isHoverEdge ? 1.2 + e.weight * 0.12 : 0.45 + e.weight * 0.06) / t.scale;
        ctx.stroke();
      });

      // Nodes
      const colors: Record<string, string> = {
        note: "#38bdf8",
        essay: "#a78bfa",
        article: "#fbbf24",
      };

      ns.forEach((n) => {
        const isCurrent = n.id === currentSlug;
        const isHovered = n.id === hovered;
        const isConnected = connectedEdges.has(n.id);
        const radius = isCurrent ? 8 : isHovered ? 7 : isConnected ? 5 : 4;
        const color = colors[n.type] || "#64748b";

        // Outer glow for active nodes
        if (isCurrent || isHovered) {
          const glowRadius = radius + 14;
          const grad = ctx.createRadialGradient(n.x, n.y, radius * 0.5, n.x, n.y, glowRadius);
          const glowColor = isCurrent ? "124,58,237" : "148,163,184";
          grad.addColorStop(0, `rgba(${glowColor},0.25)`);
          grad.addColorStop(0.6, `rgba(${glowColor},0.08)`);
          grad.addColorStop(1, `rgba(${glowColor},0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Node circle with subtle gradient
        const nodeGrad = ctx.createRadialGradient(n.x - radius * 0.3, n.y - radius * 0.3, 0, n.x, n.y, radius);
        nodeGrad.addColorStop(0, isCurrent ? "#9b6dff" : color);
        nodeGrad.addColorStop(1, isCurrent ? "#7c3aed" : color);
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Ring for current
        if (isCurrent) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(124,58,237,0.35)";
          ctx.lineWidth = 1.5 / t.scale;
          ctx.stroke();
        }

        // Label
        if (isCurrent || isHovered) {
          const fontSize = Math.max(10, 11 / t.scale);
          ctx.font = `600 ${fontSize}px 'Space Grotesk', system-ui, sans-serif`;
          ctx.textAlign = "center";
          const text = n.label;
          const tw = ctx.measureText(text).width;
          const pad = 6;
          const lh = fontSize + 6;
          const ly = n.y - radius - lh - 2;

          // Label background with rounded rect
          ctx.fillStyle = "rgba(15,23,42,0.92)";
          ctx.beginPath();
          ctx.roundRect(n.x - tw / 2 - pad, ly, tw + pad * 2, lh, 5);
          ctx.fill();
          ctx.strokeStyle = "rgba(100,116,139,0.15)";
          ctx.lineWidth = 0.5 / t.scale;
          ctx.stroke();

          // Label text
          ctx.fillStyle = isCurrent ? "rgba(167,139,250,0.95)" : "rgba(226,232,240,0.95)";
          ctx.fillText(text, n.x, ly + lh - 5);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [edges, neighbors, currentSlug, isCollapsed]);

  // Mouse handlers
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    return { mx: clientX - rect.left, my: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { mx, my } = getCanvasPos(e.clientX, e.clientY);
    const node = findNodeAt(mx, my);
    dragMoved.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    if (node) {
      dragWasPinned.current = node.pinned;
      dragNode.current = node;
    } else {
      isPanning.current = true;
      panStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [findNodeAt, getCanvasPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { mx, my } = getCanvasPos(e.clientX, e.clientY);

    if (dragNode.current) {
      if (
        Math.abs(e.clientX - pointerStart.current.x) > 2 ||
        Math.abs(e.clientY - pointerStart.current.y) > 2
      ) {
        dragMoved.current = true;
      }
      const { x, y } = screenToCanvas(mx, my);
      dragNode.current.x = x;
      dragNode.current.y = y;
      dragNode.current.vx = 0;
      dragNode.current.vy = 0;
      if (dragMoved.current) dragNode.current.pinned = true;
      return;
    }

    if (isPanning.current) {
      dragMoved.current = true;
      transformRef.current = {
        ...transformRef.current,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      return;
    }

    const node = findNodeAt(mx, my);
    setHoveredNode(node?.id || null);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = node ? "pointer" : "grab";
  }, [findNodeAt, screenToCanvas, getCanvasPos]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragNode.current && !dragMoved.current) {
      dragNode.current.pinned = dragWasPinned.current;
      const node = dragNode.current;
      const href = node.type === "article" ? `/artikel/${node.slug}` : `/writing/${node.slug}`;
      navigate(href);
    }
    dragNode.current = null;
    isPanning.current = false;
  }, [navigate]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { mx, my } = getCanvasPos(e.clientX, e.clientY);
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const t = transformRef.current;
    const newScale = Math.max(0.2, Math.min(4, t.scale * delta));
    transformRef.current = {
      x: mx - (mx - t.x) * (newScale / t.scale),
      y: my - (my - t.y) * (newScale / t.scale),
      scale: newScale,
    };
    setZoomLevel(Math.round(newScale * 100));
  }, [getCanvasPos]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist.current;
      lastTouchDist.current = dist;

      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const { mx, my } = getCanvasPos(cx, cy);

      const t = transformRef.current;
      const newScale = Math.max(0.2, Math.min(4, t.scale * scale));
      transformRef.current = {
        x: mx - (mx - t.x) * (newScale / t.scale),
        y: my - (my - t.y) * (newScale / t.scale),
        scale: newScale,
      };
      setZoomLevel(Math.round(newScale * 100));
    }
  }, [getCanvasPos]);

  // Fit all nodes in view
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
    const padding = 60;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scale = Math.min(w / contentW, h / contentH, 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    transformRef.current = {
      x: w / 2 - centerX * scale,
      y: h / 2 - centerY * scale,
      scale,
    };
    setZoomLevel(Math.round(scale * 100));
  }, []);

  const resetView = useCallback(() => {
    nodesRef.current.forEach((n) => {
      n.pinned = false;
    });
    transformRef.current = { x: 0, y: 0, scale: 1 };
    setZoomLevel(100);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const t = transformRef.current;
    const { w, h } = sizeRef.current;
    const cx = w / 2, cy = h / 2;
    const newScale = Math.max(0.2, Math.min(4, t.scale * factor));
    transformRef.current = {
      x: cx - (cx - t.x) * (newScale / t.scale),
      y: cy - (cy - t.y) * (newScale / t.scale),
      scale: newScale,
    };
    setZoomLevel(Math.round(newScale * 100));
  }, []);

  const ControlBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg bg-background/90 border border-border/40 text-muted-foreground/70 hover:text-foreground hover:bg-background hover:border-border/60 transition-all shadow-sm backdrop-blur-sm"
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-2.5 border-b border-border/30 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground/50 font-heading">Graph View</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Note</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Essay</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Article</span>
          </div>
          {isCollapsed ? <ChevronDown size={14} className="text-muted-foreground/40" /> : <ChevronUp size={14} className="text-muted-foreground/40" />}
        </div>
      </button>

      {/* Canvas */}
      {!isCollapsed && (
        <div ref={containerRef} className="relative h-[300px] sm:h-[350px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => { isPanning.current = false; dragNode.current = null; }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          />
          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <ControlBtn onClick={() => zoomBy(1.4)} title="Zoom in"><ZoomIn size={14} /></ControlBtn>
            <ControlBtn onClick={() => zoomBy(0.7)} title="Zoom out"><ZoomOut size={14} /></ControlBtn>
            <ControlBtn onClick={fitToContent} title="Fit all nodes"><Focus size={14} /></ControlBtn>
            <ControlBtn onClick={resetView} title="Reset view"><RotateCcw size={14} /></ControlBtn>
            <ControlBtn onClick={() => navigate("/graph")} title="Full page"><Maximize2 size={14} /></ControlBtn>
          </div>
          {/* Zoom indicator */}
          <span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground/40 bg-background/70 px-2 py-0.5 rounded-md backdrop-blur-sm border border-border/20">
            {zoomLevel}%
          </span>
        </div>
      )}
    </div>
  );
}
