import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";
import CodeBlock from "./CodeBlock";
import Callout from "./Callout";
import MermaidDiagram from "./MermaidDiagram";
import YouTubeEmbed from "./YouTubeEmbed";
import WikiLink from "./WikiLink";
import Highlight from "./Highlight";

// Detect mermaid code blocks (handles both raw MDX and rehype-pretty-code processed output)
function PreBlock(props: ComponentPropsWithoutRef<"pre"> & { "data-language"?: string }) {
  // Check rehype-pretty-code data-language attribute
  if (props["data-language"] === "mermaid") {
    const child = props.children;
    const code = extractTextContent(child);
    if (code) return <MermaidDiagram chart={code} />;
  }

  // Check raw className="language-mermaid" on child <code>
  const child = props.children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === "language-mermaid") {
    const code = typeof child.props.children === "string" ? child.props.children : "";
    return <MermaidDiagram chart={code} />;
  }

  // Check data-language on child <code> element
  if (isValidElement<{ "data-language"?: string }>(child) && child.props["data-language"] === "mermaid") {
    const code = extractTextContent(child);
    if (code) return <MermaidDiagram chart={code} />;
  }

  return <CodeBlock {...props} />;
}

// Recursively extract text content from React elements
function extractTextContent(node: ReactNode): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) {
    return extractTextContent(node.props.children);
  }
  return "";
}

// Custom MDX component overrides — Obsidian-compatible
type MdxComponentProps = Record<string, unknown>;
type MdxComponentRegistry = Record<string, ComponentType<MdxComponentProps> | ((props: { children?: ReactNode }) => ReactNode)>;

export const mdxComponents: MdxComponentRegistry = {
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
    if (isValidElement<{ children?: ReactNode }>(children)) {
      const inner = children.props.children;
      if (typeof inner === "string") {
        const match = inner.match(/^\[!([\w]+)\]\s*(.*)/);
        if (match) {
          const [, type, title] = match;
          return <Callout type={type} title={title || undefined}>{""}</Callout>;
        }
      }
      // Check array children for callout pattern
      if (Array.isArray(inner)) {
        const firstText = inner.find((c) => typeof c === "string");
        if (typeof firstText === "string") {
          const match = firstText.match(/^\[!([\w]+)\]\s*(.*)/);
          if (match) {
            const [, type, title] = match;
            const rest = inner.filter((c) => c !== firstText);
            return <Callout type={type} title={title || undefined}>{rest}</Callout>;
          }
        }
      }
    }
    // Handle array of paragraph children
    if (Array.isArray(children)) {
      const firstP = children.find((c) => isValidElement<{ children?: ReactNode }>(c) && c.props.children);
      if (firstP) {
        const pChildren = isValidElement<{ children?: ReactNode }>(firstP) ? firstP.props.children : null;
        const firstText = Array.isArray(pChildren)
          ? pChildren.find((c) => typeof c === "string")
          : typeof pChildren === "string" ? pChildren : null;
        if (typeof firstText === "string") {
          const match = firstText.match(/^\[!([\w]+)\]\s*(.*)/);
          if (match) {
            const [, type, title] = match;
            const restChildren = children.filter((c) => c !== firstP);
            return <Callout type={type} title={title || undefined}>{restChildren}</Callout>;
          }
        }
      }
    }
    return <blockquote>{children}</blockquote>;
  },
};
