import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface MermaidDiagramProps {
  chart: string;
}

type MermaidThemeMode = "light" | "dark";

let mermaidIdCounter = 0;
let mermaidModulePromise: Promise<(typeof import("mermaid"))["default"]> | null = null;
let initializedMermaidMode: MermaidThemeMode | null = null;

export function normalizeMermaidLineBreaks(chart: string) {
  return chart.replaceAll("\\n", "<br/>");
}

export function getMermaidThemeMode(resolvedTheme?: string): MermaidThemeMode {
  return resolvedTheme === "light" ? "light" : "dark";
}

export function getMermaidThemeConfig(mode: MermaidThemeMode) {
  return {
    startOnLoad: false as const,
    securityLevel: "loose" as const,
    suppressErrorRendering: true as const,
    theme: "base" as const,
    mindmap: {
      padding: mode === "light" ? 22 : 24,
      maxNodeWidth: 220,
    },
    themeVariables:
      mode === "light"
        ? {
            primaryColor: "#F4E4D1",
            primaryTextColor: "#1A1A2E",
            primaryBorderColor: "#C4A882",
            lineColor: "#8B7355",
            secondaryColor: "#FBF6EF",
            tertiaryColor: "#F0E4D4",
            mainBkg: "#F8F2E8",
            nodeBorder: "#C4A882",
            clusterBkg: "#F7EFE3",
            clusterBorder: "#C8AA7A",
            textColor: "#1A1A2E",
            titleColor: "#1A1A2E",
            edgeLabelBackground: "#FFF9F2",
            actorTextColor: "#1A1A2E",
            actorBkg: "#F5E6D3",
            actorBorder: "#C4A882",
            signalColor: "#1A1A2E",
            signalTextColor: "#1A1A2E",
            labelTextColor: "#1A1A2E",
            loopTextColor: "#6B5B4E",
            noteBkgColor: "#FFF7ED",
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
            git0: "#E1D3BC",
            gitBranchLabel0: "#1A1A2E",
          }
        : {
            primaryColor: "#D6B887",
            primaryTextColor: "#F8F4EC",
            primaryBorderColor: "#B99362",
            lineColor: "#BFA57F",
            secondaryColor: "#1B2333",
            tertiaryColor: "#141B2A",
            mainBkg: "#0E1421",
            nodeBorder: "#B99362",
            clusterBkg: "#111A2A",
            clusterBorder: "#8A744F",
            textColor: "#F2E8D7",
            titleColor: "#F5EBDC",
            edgeLabelBackground: "#11192A",
            actorTextColor: "#F5EBDC",
            actorBkg: "#1A2234",
            actorBorder: "#B99362",
            signalColor: "#F2E8D7",
            signalTextColor: "#F2E8D7",
            labelTextColor: "#F2E8D7",
            loopTextColor: "#D8BC8A",
            noteBkgColor: "#1C2740",
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
            git0: "#3F527F",
            gitBranchLabel0: "#F8FAFC",
          },
    fontFamily: "Space Grotesk, Inter, sans-serif",
  };
}

export function shouldRenderMermaidDiagram(isInView: boolean, hasRenderedOnce: boolean) {
  return isInView || hasRenderedOnce;
}

async function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((module) => module.default);
  }

  return mermaidModulePromise;
}

async function getConfiguredMermaid(mode: MermaidThemeMode) {
  const mermaid = await loadMermaid();

  if (initializedMermaidMode !== mode) {
    mermaid.initialize(getMermaidThemeConfig(mode));
    initializedMermaidMode = mode;
  }

  return mermaid;
}

function extractFillColor(el: Element | null): string | null {
  if (!el) return null;
  const fillAttr = el.getAttribute("fill");
  if (fillAttr && fillAttr !== "none") return fillAttr.trim();

  const style = el.getAttribute("style") ?? "";
  const fillFromStyle = style.match(/fill:\s*([^;]+)/i)?.[1]?.trim();
  if (fillFromStyle && fillFromStyle !== "none") return fillFromStyle;
  return null;
}

function collectCssFillMap(doc: Document) {
  const map = new Map<string, string>();
  const styleBlocks = doc.querySelectorAll("style");

  const addMatches = (cssText: string, re: RegExp) => {
    let match: RegExpExecArray | null;
    while ((match = re.exec(cssText)) !== null) {
      const className = match[1]?.trim();
      const fill = match[2]?.trim();
      if (className && fill && !map.has(className)) {
        map.set(className, fill);
      }
    }
  };

  styleBlocks.forEach((styleEl) => {
    const cssText = styleEl.textContent ?? "";
    addMatches(cssText, /\.([a-zA-Z_][\w-]*)\s*>\s*\*\s*\{[^}]*?\bfill:\s*([^;!}]+)/g);
    addMatches(cssText, /\.([a-zA-Z_][\w-]*)\s*\{[^}]*?\bfill:\s*([^;!}]+)/g);
    addMatches(cssText, /\.([a-zA-Z_][\w-]*)[^{]*\{[^}]*?\bfill:\s*([^;!}]+)/g);
  });

  return map;
}

function resolveNodeFill(
  group: Element,
  shape: Element | null,
  cssFillMap: Map<string, string>
) {
  const directFill = extractFillColor(shape);
  if (directFill) return directFill;

  const classCandidates = new Set<string>();
  group.classList.forEach((name) => classCandidates.add(name));
  shape?.classList.forEach((name) => classCandidates.add(name));

  for (const className of classCandidates) {
    const fill = cssFillMap.get(className);
    if (fill) return fill;
  }

  return null;
}

function parseColorToRgb(input: string): [number, number, number] | null {
  const value = input.trim().toLowerCase();
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
  };
  if (named[value]) return named[value];

  const hex = value.match(/^#([a-f0-9]{3}|[a-f0-9]{6})$/i);
  if (hex) {
    const code = hex[1];
    if (code.length === 3) {
      return [
        parseInt(code[0] + code[0], 16),
        parseInt(code[1] + code[1], 16),
        parseInt(code[2] + code[2], 16),
      ];
    }
    return [
      parseInt(code.slice(0, 2), 16),
      parseInt(code.slice(2, 4), 16),
      parseInt(code.slice(4, 6), 16),
    ];
  }

  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1]
      .split(",")
      .map((part) => Number.parseFloat(part.trim()))
      .filter((part) => Number.isFinite(part));
    if (parts.length >= 3) {
      return [
        Math.max(0, Math.min(255, Math.round(parts[0]))),
        Math.max(0, Math.min(255, Math.round(parts[1]))),
        Math.max(0, Math.min(255, Math.round(parts[2]))),
      ];
    }
  }

  return null;
}

function getLuminance([r, g, b]: [number, number, number]) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function estimateLabelWidth(text: string) {
  const normalized = text.trim();
  if (!normalized) return 0;
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const longest = lines.length
    ? Math.max(...lines.map((line) => line.length))
    : normalized.length;
  return Math.min(520, Math.max(150, Math.round(22 + longest * 8.2)));
}

function applyNodeLabelContrast(svg: string) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const renderedErrorText = doc.querySelector("text.error-text")?.textContent ?? "";
  if (/syntax error in text/i.test(renderedErrorText)) {
    throw new Error("Sintaks diagram Mermaid tidak valid.");
  }

  const cssFillMap = collectCssFillMap(doc);
  const nodeGroups = doc.querySelectorAll("g.node");
  nodeGroups.forEach((group) => {
    const bg = group.querySelector("rect, polygon, ellipse, circle, path");
    const fill = resolveNodeFill(group, bg, cssFillMap);
    if (!fill) return;

    const rgb = parseColorToRgb(fill);
    if (!rgb) return;

    const isLightBackground = getLuminance(rgb) > 0.62;
    const textColor = isLightBackground ? "#111827" : "#f8fafc";
    const strokeColor = isLightBackground ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.45)";
    const shadow = isLightBackground
      ? "0 1px 0 rgba(255,255,255,.45)"
      : "0 1px 1px rgba(0,0,0,.55)";

    group.querySelectorAll("text").forEach((textNode) => {
      const style = textNode.getAttribute("style") ?? "";
      textNode.setAttribute("fill", textColor);
      textNode.setAttribute(
        "style",
        `${style};fill:${textColor} !important;paint-order:stroke;stroke:${strokeColor};stroke-width:.9px;font-weight:700;`
      );
    });

    group.querySelectorAll("foreignObject *").forEach((htmlNode) => {
      const style = htmlNode.getAttribute("style") ?? "";
      htmlNode.setAttribute(
        "style",
        `${style};color:${textColor} !important;-webkit-text-fill-color:${textColor} !important;fill:${textColor} !important;font-weight:700 !important;text-shadow:${shadow};`
      );
    });
  });

  const clusterGroups = doc.querySelectorAll("g.cluster");
  clusterGroups.forEach((group) => {
    const bg = group.querySelector("rect, polygon, ellipse, circle, path");
    const fill = resolveNodeFill(group, bg, cssFillMap);
    const rgb = fill ? parseColorToRgb(fill) : null;
    const isLightBackground = rgb ? getLuminance(rgb) > 0.62 : false;
    const textColor = isLightBackground ? "#111827" : "#f8fafc";

    group.querySelectorAll("text").forEach((textNode) => {
      const style = textNode.getAttribute("style") ?? "";
      textNode.setAttribute("fill", textColor);
      textNode.setAttribute("style", `${style};fill:${textColor} !important;stroke:none;font-weight:600;`);
    });

    group.querySelectorAll("foreignObject *").forEach((htmlNode) => {
      const style = htmlNode.getAttribute("style") ?? "";
      htmlNode.setAttribute(
        "style",
        `${style};color:${textColor} !important;-webkit-text-fill-color:${textColor} !important;fill:${textColor} !important;font-weight:600 !important;white-space:normal !important;overflow:visible !important;text-overflow:clip !important;`
      );
    });
  });

  const clusterLabelGroups = doc.querySelectorAll(
    "g.cluster-label, g.clusterLabel, g[class*='cluster'][class*='label']"
  );
  clusterLabelGroups.forEach((group) => {
    const textContent = group.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const foreignObject = group.querySelector("foreignObject");
    if (foreignObject) {
      const currentWidth = Number.parseFloat(foreignObject.getAttribute("width") ?? "");
      const estimatedWidth = estimateLabelWidth(textContent);

      if (Number.isFinite(currentWidth) && currentWidth > 0 && estimatedWidth > currentWidth) {
        const x = Number.parseFloat(foreignObject.getAttribute("x") ?? "0");
        if (Number.isFinite(x)) {
          foreignObject.setAttribute("x", `${x - (estimatedWidth - currentWidth) / 2}`);
        }
        foreignObject.setAttribute("width", `${estimatedWidth}`);
      }

      const foStyle = foreignObject.getAttribute("style") ?? "";
      foreignObject.setAttribute(
        "style",
        `${foStyle};overflow:visible !important;max-width:none !important;`
      );
    }

    group.querySelectorAll("foreignObject *").forEach((htmlNode) => {
      const style = htmlNode.getAttribute("style") ?? "";
      htmlNode.setAttribute(
        "style",
        `${style};max-width:none !important;width:fit-content !important;white-space:nowrap !important;overflow:visible !important;text-overflow:clip !important;font-weight:600 !important;`
      );
    });
  });

  return new XMLSerializer().serializeToString(doc.documentElement);
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const { resolvedTheme } = useTheme();
  const mermaidThemeMode = getMermaidThemeMode(resolvedTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const renderTokenRef = useRef(0);
  const rawChart = normalizeMermaidLineBreaks(chart.trim());
  const canRender = shouldRenderMermaidDiagram(isInView, hasRenderedOnce);

  useEffect(() => {
    if (canRender) {
      return;
    }

    const node = containerRef.current;
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [canRender]);

  useEffect(() => {
    const renderToken = ++renderTokenRef.current;

    if (!rawChart) {
      setSvgHtml("");
      setError("");
      setLoading(false);
      setHasRenderedOnce(false);
      return;
    }

    if (!canRender) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const renderChart = async () => {
      try {
        setLoading(true);
        setError("");

        const mermaid = await getConfiguredMermaid(mermaidThemeMode);

        const uniqueId = `mermaid-${++mermaidIdCounter}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, rawChart);
        const normalizedSvg = applyNodeLabelContrast(svg);

        if (cancelled || renderToken !== renderTokenRef.current) {
          return;
        }

        setSvgHtml(normalizedSvg);
        setHasRenderedOnce(true);
      } catch (e: unknown) {
        if (cancelled || renderToken !== renderTokenRef.current) {
          return;
        }

        console.error("Mermaid render error:", e);
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
      } finally {
        if (!cancelled && renderToken === renderTokenRef.current) {
          setLoading(false);
        }
      }
    };

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [canRender, mermaidThemeMode, rawChart]);

  if (error && !svgHtml) {
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
    <div ref={containerRef} className="my-8">
      <div className="mermaid-container overflow-hidden rounded-[30px] border border-border/60 bg-card/50 p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.7)] backdrop-blur-md sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/45 pb-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/62">
            <span className="h-2 w-2 rounded-full bg-primary/70" />
            Mermaid
          </span>
          <span className="rounded-full border border-border/55 bg-background/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/68">
            {loading ? "Rendering" : canRender ? "Ready" : "On demand"}
          </span>
        </div>

        <div className="mermaid-stage relative overflow-x-auto rounded-[22px] border border-border/45 px-3 py-4 sm:px-4 sm:py-5">
          {!canRender && !svgHtml ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="h-10 w-10 rounded-full border border-border/60 bg-background/65" />
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/68">
                  Diagram menunggu viewport
                </p>
                <p className="max-w-xs text-sm text-muted-foreground/72">
                  Render ditunda sampai diagram mendekati area baca supaya halaman tetap ringan.
                </p>
              </div>
            </div>
          ) : loading && !svgHtml ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground/55">Rendering diagram...</span>
            </div>
          ) : (
            <div
              className="flex min-w-max justify-center"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}

          {loading && svgHtml ? (
            <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-border/60 bg-background/78 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/68 shadow-sm">
              Memperbarui
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-xs text-amber-300/85">
            Render terakhir dipertahankan karena ada kendala saat memperbarui diagram.
          </p>
        ) : null}
      </div>
    </div>
  );
}
