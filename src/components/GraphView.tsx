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
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragNode = useRef<Node | null>(null);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    allPosts.forEach((p, i) => {
      const angle = (i / allPosts.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 80;
      nodeMap.set(p.slug, {
        id: p.slug,
        label: p.title.length > 24 ? p.title.slice(0, 24) + "…" : p.title,
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

  // Screen to canvas coords
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
    const hitRadius = 12 / transformRef.current.scale;
    for (const n of ns) {
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy < hitRadius * hitRadius) return n;
    }
    return null;
  }, [screenToCanvas]);

  // Force simulation + draw
  useEffect(() => {
    if (isCollapsed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;

    const tick = () => {
      const ns = nodesRef.current;
      const t = transformRef.current;

      // Physics (skip dragged node)
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

      // Draw
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
        const isHoverEdge = s.id === hoveredNode || t2.id === hoveredNode;
        ctx.strokeStyle = isActive
          ? "rgba(124,58,237,0.5)"
          : isHoverEdge
          ? "rgba(148,163,184,0.3)"
          : "rgba(100,116,139,0.1)";
        ctx.lineWidth = isActive ? 2 : isHoverEdge ? 1.2 : 0.5;
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
        const isHovered = n.id === hoveredNode;
        const radius = isCurrent ? 7 : isHovered ? 6 : 4;

        // Glow
        if (isCurrent || isHovered) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius + 8);
          const color = isCurrent ? "124,58,237" : "148,163,184";
          grad.addColorStop(0, `rgba(${color},0.25)`);
          grad.addColorStop(1, `rgba(${color},0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? "#7c3aed" : colors[n.type] || "#64748b";
        ctx.fill();

        // Ring
        if (isCurrent) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(124,58,237,0.3)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Label
        if (isCurrent || isHovered) {
          ctx.font = "11px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          // bg
          const text = n.label;
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = "rgba(15,23,42,0.85)";
          ctx.beginPath();
          ctx.roundRect(n.x - tw / 2 - 5, n.y - radius - 22, tw + 10, 18, 4);
          ctx.fill();
          ctx.fillStyle = "rgba(226,232,240,0.95)";
          ctx.fillText(text, n.x, n.y - radius - 8);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [edges, currentSlug, hoveredNode, isCollapsed]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const node = findNodeAt(mx, my);
    if (node) {
      dragNode.current = node;
    } else {
      isPanning.current = true;
      panStart.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    }
  }, [findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragNode.current) {
      const { x, y } = screenToCanvas(mx, my);
      dragNode.current.x = x;
      dragNode.current.y = y;
      dragNode.current.vx = 0;
      dragNode.current.vy = 0;
      return;
    }

    if (isPanning.current) {
      const newT = {
        ...transformRef.current,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      };
      transformRef.current = newT;
      setTransform(newT);
      return;
    }

    const node = findNodeAt(mx, my);
    setHoveredNode(node?.id || null);
    canvas.style.cursor = node ? "pointer" : "grab";
  }, [findNodeAt, screenToCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragNode.current) {
      // If barely moved, treat as click
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const node = findNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        if (node && node.id === dragNode.current.id) {
          const href = node.type === "article" ? `/artikel/${node.slug}` : `/writing/${node.slug}`;
          navigate(href);
        }
      }
      dragNode.current = null;
      return;
    }
    isPanning.current = false;
  }, [findNodeAt, navigate]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const t = transformRef.current;
    const newScale = Math.max(0.3, Math.min(3, t.scale * delta));

    const newT = {
      x: mx - (mx - t.x) * (newScale / t.scale),
      y: my - (my - t.y) * (newScale / t.scale),
      scale: newScale,
    };
    transformRef.current = newT;
    setTransform(newT);
  }, []);

  const resetView = useCallback(() => {
    const newT = { x: 0, y: 0, scale: 1 };
    transformRef.current = newT;
    setTransform(newT);
  }, []);

  const zoomIn = useCallback(() => {
    const t = transformRef.current;
    const newScale = Math.min(3, t.scale * 1.3);
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 250;
    const cy = canvas ? canvas.height / 2 : 200;
    const newT = { x: cx - (cx - t.x) * (newScale / t.scale), y: cy - (cy - t.y) * (newScale / t.scale), scale: newScale };
    transformRef.current = newT;
    setTransform(newT);
  }, []);

  const zoomOut = useCallback(() => {
    const t = transformRef.current;
    const newScale = Math.max(0.3, t.scale * 0.7);
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 250;
    const cy = canvas ? canvas.height / 2 : 200;
    const newT = { x: cx - (cx - t.x) * (newScale / t.scale), y: cy - (cy - t.y) * (newScale / t.scale), scale: newScale };
    transformRef.current = newT;
    setTransform(newT);
  }, []);

  const openFullGraph = useCallback(() => {
    navigate("/graph");
  }, [navigate]);

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
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={400}
            className="w-full h-[300px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { isPanning.current = false; dragNode.current = null; }}
            onWheel={handleWheel}
          />
          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <button onClick={zoomIn} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Zoom in">
              <ZoomIn size={13} />
            </button>
            <button onClick={zoomOut} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Zoom out">
              <ZoomOut size={13} />
            </button>
            <button onClick={resetView} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Reset view">
              <RotateCcw size={13} />
            </button>
            <button onClick={openFullGraph} className="p-1.5 rounded-md bg-background/80 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-background transition-colors" title="Full page">
              <Maximize2 size={13} />
            </button>
          </div>
          {/* Zoom indicator */}
          {transform.scale !== 1 && (
            <span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground/40 bg-background/60 px-1.5 py-0.5 rounded">
              {Math.round(transform.scale * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
