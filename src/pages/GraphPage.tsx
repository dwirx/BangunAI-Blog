import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { allPosts } from "@/content";
import { ZoomIn, ZoomOut, Maximize2, Search } from "lucide-react";

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
}

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<{ type: "pan" | "node"; nodeId?: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const transformRef = useRef(transform);
  transformRef.current = transform;
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;
  const hoveredRef = useRef(hoveredNode);
  hoveredRef.current = hoveredNode;
  const selectedRef = useRef(selectedNode);
  selectedRef.current = selectedNode;

  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];
    const cx = 0, cy = 0;

    allPosts.forEach((p, i) => {
      const angle = (i / allPosts.length) * Math.PI * 2;
      const radius = 200 + Math.random() * 150;
      nodeList.push({
        id: p.slug,
        label: p.title.length > 25 ? p.title.slice(0, 25) + "…" : p.title,
        fullLabel: p.title,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        type: p.type,
        slug: p.slug,
        category: p.category,
        tags: p.tags,
        pinned: false,
      });
    });

    for (let i = 0; i < allPosts.length; i++) {
      for (let j = i + 1; j < allPosts.length; j++) {
        const a = allPosts[i], b = allPosts[j];
        const sharedTags = a.tags.filter((t) => b.tags.includes(t));
        const sameCategory = a.category === b.category ? 1 : 0;
        const weight = sharedTags.length + sameCategory;
        if (weight > 0) {
          edgeList.push({ source: a.slug, target: b.slug, weight });
        }
      }
    }

    return { nodes: nodeList, edges: edgeList };
  }, []);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Force simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const ns = nodesRef.current;
      const t = transformRef.current;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const hovered = hoveredRef.current;
      const selected = selectedRef.current;

      // Physics
      for (let i = 0; i < ns.length; i++) {
        if (ns[i].pinned) continue;
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!ns[i].pinned) { ns[i].vx -= fx; ns[i].vy -= fy; }
          if (!ns[j].pinned) { ns[j].vx += fx; ns[j].vy += fy; }
        }
      }

      edges.forEach((e) => {
        const s = ns.find((n) => n.id === e.source);
        const t2 = ns.find((n) => n.id === e.target);
        if (!s || !t2) return;
        const dx = t2.x - s.x;
        const dy = t2.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const idealDist = 150 / e.weight;
        const force = (dist - idealDist) * 0.005;
        if (!s.pinned) { s.vx += (dx / dist) * force; s.vy += (dy / dist) * force; }
        if (!t2.pinned) { t2.vx -= (dx / dist) * force; t2.vy -= (dy / dist) * force; }
      });

      ns.forEach((n) => {
        if (n.pinned) return;
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.save();
      ctx.translate(W / 2 + t.x, H / 2 + t.y);
      ctx.scale(t.scale, t.scale);

      const gridSize = 50;
      const gridRange = 1000;
      ctx.strokeStyle = "rgba(100,116,139,0.05)";
      ctx.lineWidth = 0.5 / t.scale;
      for (let gx = -gridRange; gx <= gridRange; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, -gridRange);
        ctx.lineTo(gx, gridRange);
        ctx.stroke();
      }
      for (let gy = -gridRange; gy <= gridRange; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-gridRange, gy);
        ctx.lineTo(gridRange, gy);
        ctx.stroke();
      }

      // Connected nodes for highlight
      const connectedTo = new Set<string>();
      if (selected || hovered) {
        const active = selected || hovered;
        edges.forEach((e) => {
          if (e.source === active) connectedTo.add(e.target);
          if (e.target === active) connectedTo.add(e.source);
        });
      }

      // Edges
      edges.forEach((e) => {
        const s = ns.find((n) => n.id === e.source);
        const t2 = ns.find((n) => n.id === e.target);
        if (!s || !t2) return;
        const activeNode = selected || hovered;
        const isActive = activeNode && (e.source === activeNode || e.target === activeNode);
        const dimmed = activeNode && !isActive;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.strokeStyle = isActive
          ? `rgba(124,58,237,${0.3 + e.weight * 0.1})`
          : dimmed
            ? "rgba(100,116,139,0.03)"
            : `rgba(100,116,139,${0.05 + e.weight * 0.03})`;
        ctx.lineWidth = isActive ? (1.5 + e.weight * 0.5) / t.scale : 0.5 / t.scale;
        ctx.stroke();
      });

      // Nodes
      const colors: Record<string, string> = {
        note: "#38bdf8",
        essay: "#a78bfa",
        article: "#fbbf24",
      };

      const searchLower = searchQuery.toLowerCase();

      ns.forEach((n) => {
        const isSelected = n.id === selected;
        const isHovered = n.id === hovered;
        const isConnected = connectedTo.has(n.id);
        const activeNode = selected || hovered;
        const dimmed = activeNode && !isSelected && !isHovered && !isConnected;
        const matchesSearch = searchLower && (n.fullLabel.toLowerCase().includes(searchLower) || n.tags.some(t3 => t3.toLowerCase().includes(searchLower)));

        const baseRadius = 5;
        const radius = isSelected ? 9 : isHovered ? 7 : isConnected ? 6 : matchesSearch ? 7 : baseRadius;
        const color = colors[n.type] || "#64748b";

        // Glow for active/search match
        if (isSelected || matchesSearch) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(n.x, n.y, radius, n.x, n.y, radius + 8);
          grad.addColorStop(0, isSelected ? "rgba(124,58,237,0.3)" : "rgba(56,189,248,0.3)");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = dimmed ? `${color}33` : color;
        ctx.fill();

        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1.5 / t.scale;
          ctx.stroke();
        }

        // Labels
        const showLabel = isSelected || isHovered || isConnected || matchesSearch || t.scale > 1.2;
        if (showLabel && !dimmed) {
          const fontSize = Math.max(10, 12 / t.scale);
          ctx.font = `500 ${fontSize}px 'Space Grotesk', sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = isSelected || isHovered ? "rgba(226,232,240,0.95)" : "rgba(226,232,240,0.6)";
          ctx.fillText(n.label, n.x, n.y - radius - 6 / t.scale);
        }
      });

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [edges, searchQuery]);

  // Screen to world coords
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const t = transformRef.current;
    return {
      wx: (sx - rect.left - cx - t.x) / t.scale,
      wy: (sy - rect.top - cy - t.y) / t.scale,
    };
  }, []);

  const findNodeAt = useCallback((wx: number, wy: number) => {
    const ns = nodesRef.current;
    const t = transformRef.current;
    const hitRadius = 12 / t.scale;
    for (const n of ns) {
      const dx = wx - n.x, dy = wy - n.y;
      if (dx * dx + dy * dy < hitRadius * hitRadius) return n;
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(wx, wy);
    if (node) {
      node.pinned = true;
      setDragging({ type: "node", nodeId: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y });
    } else {
      setDragging({ type: "pan", startX: e.clientX, startY: e.clientY, origX: transformRef.current.x, origY: transformRef.current.y });
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = draggingRef.current;
    if (d) {
      if (d.type === "pan") {
        setTransform((prev) => ({ ...prev, x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) }));
      } else if (d.type === "node" && d.nodeId) {
        const ns = nodesRef.current;
        const node = ns.find((n) => n.id === d.nodeId);
        if (node) {
          const t = transformRef.current;
          node.x = d.origX + (e.clientX - d.startX) / t.scale;
          node.y = d.origY + (e.clientY - d.startY) / t.scale;
          node.vx = 0;
          node.vy = 0;
        }
      }
    } else {
      const { wx, wy } = screenToWorld(e.clientX, e.clientY);
      const node = findNodeAt(wx, wy);
      setHoveredNode(node?.id || null);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = node ? "grab" : "default";
    }
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    const d = draggingRef.current;
    if (d?.type === "node" && d.nodeId) {
      const ns = nodesRef.current;
      const node = ns.find((n) => n.id === d.nodeId);
      if (node) node.pinned = false;
    }
    setDragging(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(5, prev.scale * delta)),
    }));
  }, []);

  const zoom = useCallback((factor: number) => {
    setTransform((prev) => ({ ...prev, scale: Math.max(0.2, Math.min(5, prev.scale * factor)) }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedNode(null);
  }, []);

  const selectedPost = useMemo(() => {
    if (!selectedNode) return null;
    return allPosts.find((p) => p.slug === selectedNode) || null;
  }, [selectedNode]);

  const connectedPosts = useMemo(() => {
    if (!selectedNode) return [];
    const connected = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNode) connected.add(e.target);
      if (e.target === selectedNode) connected.add(e.source);
    });
    return allPosts.filter((p) => connected.has(p.slug));
  }, [selectedNode, edges]);

  return (
    <div className="h-screen flex flex-col pt-14">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-sm font-semibold">Graph View</h1>
          <span className="text-[10px] text-muted-foreground/50">{allPosts.length} nodes · {edges.length} edges</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/40 rounded-lg w-48 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
          <button onClick={() => zoom(1.3)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/60 hover:text-foreground transition-colors" title="Zoom in">
            <ZoomIn size={15} />
          </button>
          <button onClick={() => zoom(0.7)} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/60 hover:text-foreground transition-colors" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <button onClick={resetView} className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground/60 hover:text-foreground transition-colors" title="Reset view">
            <Maximize2 size={15} />
          </button>
          <span className="text-[10px] text-muted-foreground/40 ml-1">{Math.round(transform.scale * 100)}%</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDblClick}
          onWheel={handleWheel}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/30 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> Note</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" /> Essay</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" /> Article</span>
          <span className="opacity-50">Scroll = Zoom · Drag = Pan · Click = Select · DblClick = Open</span>
        </div>

        {/* Info Panel */}
        {selectedPost && (
          <div className="absolute top-4 right-4 w-72 rounded-xl bg-background/90 backdrop-blur-md border border-border/40 p-4 shadow-xl">
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
          </div>
        )}
      </div>
    </div>
  );
}
