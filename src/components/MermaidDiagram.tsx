import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

let mermaidIdCounter = 0;

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${++mermaidIdCounter}-${Date.now()}`);
  const [error, setError] = useState<string>("");
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chart.trim()) return;

    let cancelled = false;

    const doRender = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isLight = document.documentElement.classList.contains("light");

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isLight ? "default" : "dark",
          themeVariables: isLight
            ? {
                primaryColor: "#ede9fe",
                primaryTextColor: "#1e1b4b",
                primaryBorderColor: "#a78bfa",
                lineColor: "#64748b",
                secondaryColor: "#f1f5f9",
                tertiaryColor: "#e2e8f0",
                mainBkg: "#ede9fe",
                nodeBorder: "#a78bfa",
                titleColor: "#1e293b",
                edgeLabelBackground: "#f8fafc",
                actorTextColor: "#1e293b",
                actorBkg: "#ede9fe",
                actorBorder: "#a78bfa",
                signalColor: "#1e293b",
                signalTextColor: "#1e293b",
                labelTextColor: "#1e293b",
                loopTextColor: "#475569",
                noteBkgColor: "#f8fafc",
                noteTextColor: "#1e293b",
                pieTitleTextColor: "#1e293b",
                pieSectionTextColor: "#fff",
                pieLegendTextColor: "#1e293b",
                pie1: "#7c3aed",
                pie2: "#0ea5e9",
                pie3: "#f59e0b",
                pie4: "#10b981",
                pie5: "#f43f5e",
                pie6: "#8b5cf6",
              }
            : {
                primaryColor: "#7c3aed",
                primaryTextColor: "#e2e8f0",
                primaryBorderColor: "#6d28d9",
                lineColor: "#64748b",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
                mainBkg: "#7c3aed",
                nodeBorder: "#6d28d9",
                titleColor: "#e2e8f0",
                edgeLabelBackground: "#1e293b",
                actorTextColor: "#e2e8f0",
                actorBkg: "#1e293b",
                actorBorder: "#6d28d9",
                signalColor: "#e2e8f0",
                signalTextColor: "#e2e8f0",
                labelTextColor: "#e2e8f0",
                loopTextColor: "#94a3b8",
                noteBkgColor: "#1e293b",
                noteTextColor: "#e2e8f0",
                pieTitleTextColor: "#e2e8f0",
                pieSectionTextColor: "#fff",
                pieLegendTextColor: "#e2e8f0",
                pie1: "#7c3aed",
                pie2: "#38bdf8",
                pie3: "#f59e0b",
                pie4: "#10b981",
                pie5: "#f43f5e",
                pie6: "#8b5cf6",
              },
          fontFamily: "Inter, sans-serif",
        });

        // Use unique ID to avoid conflicts with multiple diagrams
        const uniqueId = idRef.current;
        el.innerHTML = "";
        el.removeAttribute("data-processed");

        const { svg } = await mermaid.render(uniqueId, chart.trim());
        if (!cancelled) {
          el.innerHTML = svg;
          setRendered(true);
          setError("");
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Mermaid render error:", e);
          setError(String(e?.message || e));
        }
      }
    };

    doRender();

    // Re-render on theme change
    const observer = new MutationObserver(() => {
      idRef.current = `mermaid-${++mermaidIdCounter}-${Date.now()}`;
      setRendered(false);
      doRender();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-mono">
        <p className="font-semibold mb-1">Mermaid Error</p>
        <p className="opacity-70 text-xs break-all">{error}</p>
      </div>
    );
  }

  return (
    <div className="mermaid-container my-8 overflow-x-auto rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
      <div
        ref={containerRef}
        className="mermaid flex justify-center"
      >
        {!rendered && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground/50">Loading diagram...</span>
          </div>
        )}
      </div>
    </div>
  );
}
