import type { ComponentPropsWithoutRef, ReactNode } from "react";
import CodeBlock from "./CodeBlock";
import Callout from "./Callout";
import MermaidDiagram from "./MermaidDiagram";
import YouTubeEmbed from "./YouTubeEmbed";
import WikiLink from "./WikiLink";
import Highlight from "./Highlight";

// Detect mermaid code blocks
function PreBlock(props: ComponentPropsWithoutRef<"pre">) {
  const child = props.children as any;
  if (child?.props?.className === "language-mermaid") {
    const code = typeof child.props.children === "string" ? child.props.children : "";
    return <MermaidDiagram chart={code} />;
  }
  return <CodeBlock {...props} />;
}

// Custom MDX component overrides — Obsidian-compatible
export const mdxComponents: Record<string, any> = {
  pre: PreBlock,

  // Callout component usage: <Callout type="info" title="Title">content</Callout>
  Callout,

  // YouTube embed: <YouTube url="..." />
  YouTube: YouTubeEmbed,

  // Wiki link: <WikiLink to="slug" label="display" />
  WikiLink,

  // Highlight: <Highlight>text</Highlight>
  Highlight,
  mark: Highlight,

  // Enhanced blockquote to detect Obsidian callout syntax
  blockquote: (props: { children?: ReactNode }) => {
    const children = props.children;
    // Try to parse Obsidian-style callouts: > [!type] title
    if (children && typeof children === "object" && "props" in (children as any)) {
      const inner = (children as any).props?.children;
      if (typeof inner === "string") {
        const match = inner.match(/^\[!([\w]+)\]\s*(.*)/);
        if (match) {
          const [, type, title] = match;
          return <Callout type={type} title={title || undefined}>{""}</Callout>;
        }
      }
      // Check array children for callout pattern
      if (Array.isArray(inner)) {
        const firstText = inner.find((c: any) => typeof c === "string");
        if (typeof firstText === "string") {
          const match = firstText.match(/^\[!([\w]+)\]\s*(.*)/);
          if (match) {
            const [, type, title] = match;
            const rest = inner.filter((c: any) => c !== firstText);
            return <Callout type={type} title={title || undefined}>{rest}</Callout>;
          }
        }
      }
    }
    // Handle array of paragraph children
    if (Array.isArray(children)) {
      const firstP = children.find((c: any) => c?.props?.children);
      if (firstP) {
        const pChildren = (firstP as any).props.children;
        const firstText = Array.isArray(pChildren)
          ? pChildren.find((c: any) => typeof c === "string")
          : typeof pChildren === "string" ? pChildren : null;
        if (typeof firstText === "string") {
          const match = firstText.match(/^\[!([\w]+)\]\s*(.*)/);
          if (match) {
            const [, type, title] = match;
            const restChildren = children.filter((c: any) => c !== firstP);
            return <Callout type={type} title={title || undefined}>{restChildren}</Callout>;
          }
        }
      }
    }
    return <blockquote>{children}</blockquote>;
  },
};
