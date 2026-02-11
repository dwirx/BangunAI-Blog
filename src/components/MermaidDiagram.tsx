import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

function getTheme(): "dark" | "default" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "default" : "dark";
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = getTheme() === "dark";

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          themeVariables: isDark
            ? {
                primaryColor: "#7c3aed",
                primaryTextColor: "#e2e8f0",
                primaryBorderColor: "#6d28d9",
                lineColor: "#64748b",
                secondaryColor: "#1e293b",
                tertiaryColor: "#0f172a",
                noteBkgColor: "#1e293b",
                noteTextColor: "#e2e8f0",
                actorTextColor: "#e2e8f0",
                actorBkg: "#1e293b",
                actorBorder: "#6d28d9",
                signalColor: "#e2e8f0",
                labelBoxBkgColor: "#1e293b",
                labelTextColor: "#e2e8f0",
                loopTextColor: "#e2e8f0",
                sectionBkgColor: "#1e293b",
                altSectionBkgColor: "#0f172a",
                taskBkgColor: "#7c3aed",
                taskTextColor: "#fff",
                pieTitleTextSize: "16px",
                pieTitleTextColor: "#e2e8f0",
                pieSectionTextSize: "14px",
                pieSectionTextColor: "#fff",
                pieStrokeColor: "#334155",
                pie1: "#7c3aed",
                pie2: "#38bdf8",
                pie3: "#f59e0b",
                pie4: "#10b981",
                pie5: "#f43f5e",
                pie6: "#8b5cf6",
              }
            : {
                primaryColor: "#7c3aed",
                primaryTextColor: "#1e293b",
                primaryBorderColor: "#a78bfa",
                lineColor: "#94a3b8",
                secondaryColor: "#f1f5f9",
                tertiaryColor: "#e2e8f0",
                noteBkgColor: "#f8fafc",
                noteTextColor: "#1e293b",
                actorTextColor: "#1e293b",
                actorBkg: "#f1f5f9",
                actorBorder: "#a78bfa",
                signalColor: "#1e293b",
                pieTitleTextSize: "16px",
                pieTitleTextColor: "#1e293b",
                pieSectionTextSize: "14px",
                pieSectionTextColor: "#fff",
                pieStrokeColor: "#e2e8f0",
                pie1: "#7c3aed",
                pie2: "#0ea5e9",
                pie3: "#f59e0b",
                pie4: "#10b981",
                pie5: "#f43f5e",
                pie6: "#8b5cf6",
              },
          fontFamily: "Inter, sans-serif",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };

    render();

    // Re-render when theme changes
    const observer = new MutationObserver(() => {
      render();
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
      <div className="my-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
        Mermaid Error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-8 flex justify-center overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
