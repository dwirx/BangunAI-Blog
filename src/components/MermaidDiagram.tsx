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
    const rawChart = chart.trim();
    if (!rawChart) {
      setSvgHtml("");
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSvgHtml("");
      const mermaid = (await import("mermaid")).default;
      const isLight = document.documentElement.classList.contains("light");

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        suppressErrorRendering: true,
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
              primaryColor: "#D8BC8A",
              primaryTextColor: "#1A1712",
              primaryBorderColor: "#B99362",
              lineColor: "#BFA57F",
              secondaryColor: "#1A2234",
              tertiaryColor: "#131A29",
              mainBkg: "#0F1422",
              nodeBorder: "#B99362",
              clusterBkg: "#11192A",
              clusterBorder: "#8A744F",
              textColor: "#F2E8D7",
              titleColor: "#F5EBDC",
              edgeLabelBackground: "#0F1422",
              actorTextColor: "#F5EBDC",
              actorBkg: "#1A2234",
              actorBorder: "#B99362",
              signalColor: "#F2E8D7",
              signalTextColor: "#F2E8D7",
              labelTextColor: "#F2E8D7",
              loopTextColor: "#D8BC8A",
              noteBkgColor: "#1A2234",
              noteTextColor: "#F5EBDC",
              pieTitleTextColor: "#F5EBDC",
              pieSectionTextColor: "#fff",
              pieLegendTextColor: "#F5EBDC",
              pie1: "#D8BC8A",
              pie2: "#D4A574",
              pie3: "#E8C9A0",
              pie4: "#8B7355",
              pie5: "#A0865E",
              pie6: "#7A6548",
            },
        fontFamily: "Space Grotesk, Inter, sans-serif",
      });

      const uniqueId = `mermaid-${++mermaidIdCounter}-${Date.now()}`;
      idRef.current = uniqueId;
      const { svg } = await mermaid.render(uniqueId, rawChart);

      // Mermaid injects some internal class names in generated SVG styles.
      // Only treat it as invalid when the rendered SVG explicitly contains
      // the visible syntax-error text node.
      try {
        const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
        const renderedErrorText = doc.querySelector("text.error-text")?.textContent ?? "";
        if (/syntax error in text/i.test(renderedErrorText)) {
          throw new Error("Sintaks diagram Mermaid tidak valid.");
        }
      } catch (parseError) {
        // If DOM parsing fails, do not block valid SVG output.
        // Rendering fallback is handled by Mermaid throw/catch above.
        if (parseError instanceof Error && /Sintaks diagram Mermaid/i.test(parseError.message)) {
          throw parseError;
        }
      }

      setSvgHtml(svg);
    } catch (e: unknown) {
      console.error("Mermaid render error:", e);
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
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
      <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
        <p className="text-xs font-medium text-amber-300">Diagram tidak dapat ditampilkan.</p>
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] text-muted-foreground/70">
            Lihat detail teknis
          </summary>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground/75">{error}</p>
        </details>
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
