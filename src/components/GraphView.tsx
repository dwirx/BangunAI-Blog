import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { allPosts } from "@/content";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  slug: string;
}

interface Edge {
  source: string;
  target: string;
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
  const dragNode = useRef<Node | null>(null);
  const dragMoved = useRef(false);
  const sizeRef = useRef({ w: 500, h: 300 });
  const [zoomLevel, setZoomLevel] = useState(100);

  // Touch state
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    allPosts.forEach((p, i) => {
      const angle = (i / allPosts.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 80;
      nodeMap.set(p.slug, {
        id: p.slug,
        label: p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title,
        x: 250 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        type: p.type,
        slug: p.slug,
      });
    });

    for (let i = 0; i < allPosts.length; i++) {
      for (let j = i + 1; j < allPosts.length; j++) {
        const a = allPosts[i];
        const b = allPosts[j];
        const sharedTags = a.tags.filter((t) => b.tags.includes(t));
        if (sharedTags.length > 0 || a.category === b.category) {
          edgeList.push({ source: a.slug, target: b.slug });
        }
      }
    }

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
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
        const s = ns.find((n) => n.id === e.source);
        const t2 = ns.find((n) => n.id === e.target);
        if (!s || !t2) return;
        const dx = t2.x - s.x;
        const dy = t2.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (dist - 100) * 0.003;
        if (dragNode.current?.id !== s.id) { s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
        if (dragNode.current?.id !== t2.id) { t2.vx -= (dx / dist) * force; t2.vy -= (dy / dist) * force; }
      });

      ns.forEach((n) => {
        if (dragNode.current?.id === n.id) return;
        n.vx += (W / 2 - n.x) * 0.001;
        n.vy += (H / 2 - n.y) * 0.001;
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Draw with HiDPI
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      // Edges
      edges.forEach((e) => {
        const s = ns.find((n) => n.id === e.source);
        const t2 = ns.find((n) => n.id === e.target);
        if (!s || !t2) return;
        const isActive = s.id === currentSlug || t2.id === currentSlug;
        const isHoverEdge = s.id === hovered || t2.id === hovered;
        ctx.strokeStyle = isActive
          ? "rgba(124,58,237,0.5)"
          : isHoverEdge
          ? "rgba(148,163,184,0.35)"
          : "rgba(100,116,139,0.12)";
        ctx.lineWidth = (isActive ? 2 : isHoverEdge ? 1.2 : 0.6) / t.scale;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t2.x, t2.y);
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
        const radius = isCurrent ? 7 : isHovered ? 6 : 4;

        // Glow
        if (isCurrent || isHovered) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius + 10);
          const color = isCurrent ? "124,58,237" : "148,163,184";
          grad.addColorStop(0, `rgba(${color},0.3)`);
          grad.addColorStop(1, `rgba(${color},0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? "#7c3aed" : colors[n.type] || "#64748b";
        ctx.fill();

        if (isCurrent) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(124,58,237,0.3)";
          ctx.lineWidth = 1.5 / t.scale;
          ctx.stroke();
        }

        // Label
        if (isCurrent || isHovered) {
          const fontSize = Math.max(10, 11 / t.scale);
          ctx.font = `500 ${fontSize}px 'Space Grotesk', sans-serif`;
          ctx.textAlign = "center";
          const text = n.label;
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = "rgba(15,23,42,0.88)";
          ctx.beginPath();
          ctx.roundRect(n.x - tw / 2 - 5, n.y - radius - 22 / t.scale, tw + 10, 18 / t.scale, 4);
          ctx.fill();
          ctx.fillStyle = "rgba(226,232,240,0.95)";
          ctx.fillText(text, n.x, n.y - radius - 9 / t.scale);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [edges, currentSlug, isCollapsed]);

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
    if (node) {
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
      dragMoved.current = true;
      const { x, y } = screenToCanvas(mx, my);
      dragNode.current.x = x;
      dragNode.current.y = y;
      dragNode.current.vx = 0;
      dragNode.current.vy = 0;
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const t = transformRef.current;
    const newScale = Math.max(0.3, Math.min(3, t.scale * delta));
    transformRef.current = {
      x: mx - (mx - t.x) * (newScale / t.scale),
      y: my - (my - t.y) * (newScale / t.scale),
      scale: newScale,
    };
    setZoomLevel(Math.round(newScale * 100));
  }, [getCanvasPos]);

  // Touch pinch-zoom
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
      const newScale = Math.max(0.3, Math.min(3, t.scale * scale));
      transformRef.current = {
        x: mx - (mx - t.x) * (newScale / t.scale),
        y: my - (my - t.y) * (newScale / t.scale),
        scale: newScale,
      };
      setZoomLevel(Math.round(newScale * 100));
    }
  }, [getCanvasPos]);

  const resetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    setZoomLevel(100);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const t = transformRef.current;
    const { w, h } = sizeRef.current;
    const cx = w / 2, cy = h / 2;
    const newScale = Math.max(0.3, Math.min(3, t.scale * factor));
    transformRef.current = {
      x: cx - (cx - t.x) * (newScale / t.scale),
      y: cy - (cy - t.y) * (newScale / t.scale),
      scale: newScale,
    };
    setZoomLevel(Math.round(newScale * 100));
  }, []);

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
      {/* Header with toggle */}
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

      {/* Canvas + controls */}
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
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <button onClick={() => zoomBy(1.3)} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Zoom in">
              <ZoomIn size={13} />
            </button>
            <button onClick={() => zoomBy(0.7)} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Zoom out">
              <ZoomOut size={13} />
            </button>
            <button onClick={resetView} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Reset view">
              <RotateCcw size={13} />
            </button>
            <button onClick={() => navigate("/graph")} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Full page">
              <Maximize2 size={13} />
            </button>
          </div>
          {/* Zoom indicator */}
          {zoomLevel !== 100 && (
            <span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground/40 bg-background/60 px-1.5 py-0.5 rounded">
              {zoomLevel}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
