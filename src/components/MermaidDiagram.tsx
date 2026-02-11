import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  const renderCountRef = useRef(0);

  const renderChart = useCallback(async () => {
    try {
      const mermaid = (await import("mermaid")).default;
      const isLight = document.documentElement.classList.contains("light");

      mermaid.initialize({
        startOnLoad: false,
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
              clusterBkg: "#f8fafc",
              clusterBorder: "#cbd5e1",
              titleColor: "#1e293b",
              edgeLabelBackground: "#f8fafc",
              noteBkgColor: "#f8fafc",
              noteTextColor: "#1e293b",
              actorTextColor: "#1e293b",
              actorBkg: "#ede9fe",
              actorBorder: "#a78bfa",
              actorLineColor: "#94a3b8",
              signalColor: "#1e293b",
              signalTextColor: "#1e293b",
              labelBoxBkgColor: "#f8fafc",
              labelBoxBorderColor: "#cbd5e1",
              labelTextColor: "#1e293b",
              loopTextColor: "#475569",
              activationBorderColor: "#a78bfa",
              activationBkgColor: "#ede9fe",
              sequenceNumberColor: "#fff",
              pieTitleTextSize: "16px",
              pieTitleTextColor: "#1e293b",
              pieSectionTextSize: "13px",
              pieSectionTextColor: "#fff",
              pieLegendTextSize: "13px",
              pieLegendTextColor: "#1e293b",
              pieStrokeColor: "#e2e8f0",
              pieOuterStrokeColor: "#cbd5e1",
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
              clusterBkg: "#1e293b",
              clusterBorder: "#334155",
              titleColor: "#e2e8f0",
              edgeLabelBackground: "#1e293b",
              noteBkgColor: "#1e293b",
              noteTextColor: "#e2e8f0",
              actorTextColor: "#e2e8f0",
              actorBkg: "#1e293b",
              actorBorder: "#6d28d9",
              actorLineColor: "#64748b",
              signalColor: "#e2e8f0",
              signalTextColor: "#e2e8f0",
              labelBoxBkgColor: "#1e293b",
              labelBoxBorderColor: "#334155",
              labelTextColor: "#e2e8f0",
              loopTextColor: "#94a3b8",
              activationBorderColor: "#6d28d9",
              activationBkgColor: "#7c3aed",
              sequenceNumberColor: "#fff",
              pieTitleTextSize: "16px",
              pieTitleTextColor: "#e2e8f0",
              pieSectionTextSize: "13px",
              pieSectionTextColor: "#fff",
              pieLegendTextSize: "13px",
              pieLegendTextColor: "#e2e8f0",
              pieStrokeColor: "#334155",
              pieOuterStrokeColor: "#475569",
              pie1: "#7c3aed",
              pie2: "#38bdf8",
              pie3: "#f59e0b",
              pie4: "#10b981",
              pie5: "#f43f5e",
              pie6: "#8b5cf6",
            },
        fontFamily: "'Inter', sans-serif",
      });

      // Use unique ID each render to avoid conflicts
      renderCountRef.current += 1;
      const uniqueId = `${idRef.current}-${renderCountRef.current}`;

      // Remove old rendered element if exists
      const oldEl = document.getElementById(uniqueId);
      if (oldEl) oldEl.remove();

      const { svg: rendered } = await mermaid.render(uniqueId, chart.trim());
      setSvg(rendered);
      setError("");
    } catch (e: any) {
      // Clean up failed render element
      const errId = `d${idRef.current}-${renderCountRef.current}`;
      const errEl = document.getElementById(errId);
      if (errEl) errEl.remove();
      setError(String(e?.message || e));
    }
  }, [chart]);

  useEffect(() => {
    renderChart();

    // Re-render on theme change
    const observer = new MutationObserver(() => {
      renderChart();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [renderChart]);

  if (error) {
    return (
      <div className="my-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-mono">
        <p className="font-semibold mb-1">Mermaid Error</p>
        <p className="opacity-70 text-xs">{error}</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-8 flex justify-center items-center rounded-2xl border border-border/60 bg-card/60 p-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container my-8 flex justify-center overflow-x-auto rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
