import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { allPosts } from "@/content";
import { useNavigate } from "react-router-dom";

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

export default function GraphView({ currentSlug }: { currentSlug?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edgeList: Edge[] = [];

    // Create nodes from posts
    allPosts.forEach((p, i) => {
      const angle = (i / allPosts.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 80;
      nodeMap.set(p.slug, {
        id: p.slug,
        label: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
        x: 250 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        type: p.type,
        slug: p.slug,
      });
    });

    // Create edges based on shared tags/category
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

  // Simple force simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = canvas.width;
    const H = canvas.height;

    const tick = () => {
      const ns = nodesRef.current;

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          ns[i].vx -= fx;
          ns[i].vy -= fy;
          ns[j].vx += fx;
          ns[j].vy += fy;
        }
      }

      // Attraction along edges
      edges.forEach((e) => {
        const s = ns.find((n) => n.id === e.source);
        const t = ns.find((n) => n.id === e.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.003;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      });

      // Center gravity
      ns.forEach((n) => {
        n.vx += (W / 2 - n.x) * 0.001;
        n.vy += (H / 2 - n.y) * 0.001;
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(20, Math.min(W - 20, n.x));
        n.y = Math.max(20, Math.min(H - 20, n.y));
      });

      // Draw
      ctx.clearRect(0, 0, W, H);

      // Edges
      ctx.strokeStyle = "rgba(100,116,139,0.15)";
      ctx.lineWidth = 1;
      edges.forEach((e) => {
        const s = ns.find((n) => n.id === e.source);
        const t = ns.find((n) => n.id === e.target);
        if (!s || !t) return;
        const isActive = s.id === currentSlug || t.id === currentSlug;
        ctx.strokeStyle = isActive ? "rgba(124,58,237,0.4)" : "rgba(100,116,139,0.12)";
        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      });

      // Nodes
      ns.forEach((n) => {
        const isCurrent = n.id === currentSlug;
        const isHovered = n.id === hoveredNode;
        const radius = isCurrent ? 6 : isHovered ? 5 : 3.5;
        const colors: Record<string, string> = {
          note: "#38bdf8",
          essay: "#a78bfa",
          article: "#fbbf24",
        };

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? "#7c3aed" : colors[n.type] || "#64748b";
        ctx.fill();

        if (isCurrent || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = isCurrent ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label
        if (isCurrent || isHovered) {
          ctx.font = "11px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "rgba(226,232,240,0.9)";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y - radius - 6);
        }
      });

      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [edges, currentSlug, hoveredNode]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ns = nodesRef.current;
      for (const n of ns) {
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < 100) {
          const href = n.type === "article" ? `/artikel/${n.slug}` : `/writing/${n.slug}`;
          navigate(href);
          return;
        }
      }
    },
    [navigate]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ns = nodesRef.current;
      let found: string | null = null;
      for (const n of ns) {
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < 100) {
          found = n.id;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? "pointer" : "default";
    },
    []
  );

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
      <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground/50 font-heading">Graph View</span>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Note</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Essay</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Article</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        className="w-full h-[300px]"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
      />
    </div>
  );
}
