import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
}

let mermaidIdCounter = 0;

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const idRef = useRef(`mermaid-${++mermaidIdCounter}-${Date.now()}`);

  const renderChart = useCallback(async () => {
    if (!chart.trim()) return;
    try {
      setLoading(true);
      const mermaid = (await import("mermaid")).default;
      const isLight = document.documentElement.classList.contains("light");

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: isLight ? "default" : "dark",
        themeVariables: isLight
          ? {
              primaryColor: "#F5E6D3",
              primaryTextColor: "#1A1A2E",
              primaryBorderColor: "#C4A882",
              lineColor: "#8B7355",
              secondaryColor: "#FAF5EE",
              tertiaryColor: "#F0E4D4",
              mainBkg: "#F5E6D3",
              nodeBorder: "#C4A882",
              titleColor: "#1A1A2E",
              edgeLabelBackground: "#FAF5EE",
              actorTextColor: "#1A1A2E",
              actorBkg: "#F5E6D3",
              actorBorder: "#C4A882",
              signalColor: "#1A1A2E",
              signalTextColor: "#1A1A2E",
              labelTextColor: "#1A1A2E",
              loopTextColor: "#6B5B4E",
              noteBkgColor: "#FAF5EE",
              noteTextColor: "#1A1A2E",
              pieTitleTextColor: "#1A1A2E",
              pieSectionTextColor: "#fff",
              pieLegendTextColor: "#1A1A2E",
              pie1: "#C4A882",
              pie2: "#8B7355",
              pie3: "#D4A574",
              pie4: "#A0865E",
              pie5: "#E8C9A0",
              pie6: "#7A6548",
            }
          : {
              primaryColor: "#C4A882",
              primaryTextColor: "#F5E6D3",
              primaryBorderColor: "#A0865E",
              lineColor: "#8B7355",
              secondaryColor: "#1A1A2E",
              tertiaryColor: "#12121F",
              mainBkg: "#C4A882",
              nodeBorder: "#A0865E",
              titleColor: "#F5E6D3",
              edgeLabelBackground: "#1A1A2E",
              actorTextColor: "#F5E6D3",
              actorBkg: "#1A1A2E",
              actorBorder: "#A0865E",
              signalColor: "#F5E6D3",
              signalTextColor: "#F5E6D3",
              labelTextColor: "#F5E6D3",
              loopTextColor: "#C4A882",
              noteBkgColor: "#1A1A2E",
              noteTextColor: "#F5E6D3",
              pieTitleTextColor: "#F5E6D3",
              pieSectionTextColor: "#fff",
              pieLegendTextColor: "#F5E6D3",
              pie1: "#C4A882",
              pie2: "#D4A574",
              pie3: "#E8C9A0",
              pie4: "#8B7355",
              pie5: "#A0865E",
              pie6: "#7A6548",
            },
        fontFamily: "Inter, sans-serif",
      });

      const uniqueId = `mermaid-${++mermaidIdCounter}-${Date.now()}`;
      idRef.current = uniqueId;
      const { svg } = await mermaid.render(uniqueId, chart.trim());
      setSvgHtml(svg);
      setError("");
    } catch (e: any) {
      console.error("Mermaid render error:", e);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [chart]);

  useEffect(() => {
    renderChart();

    const observer = new MutationObserver(() => renderChart());
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
        <p className="opacity-70 text-xs break-all">{error}</p>
      </div>
    );
  }

  return (
    <div className="mermaid-container my-8 overflow-x-auto rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
      {loading && !svgHtml ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground/50">Loading diagram...</span>
        </div>
      ) : (
        <div
          className="flex justify-center"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      )}
    </div>
  );
}
