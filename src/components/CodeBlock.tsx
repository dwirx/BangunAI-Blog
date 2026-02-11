import { useState, useRef, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children?: ReactNode;
  [key: string]: unknown;
}

export default function CodeBlock({ children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    const code = preRef.current?.textContent || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract language from data attribute
  const lang = (props as Record<string, string>)["data-language"] || "";

  return (
    <div className="code-block-wrapper group relative my-8">
      {lang && (
        <div className="code-block-lang absolute top-0 left-4 px-3 py-1 text-xs font-mono rounded-b-lg z-10"
          style={{ background: "hsl(228 20% 16%)", color: "hsl(var(--muted-foreground))" }}>
          {lang}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 hover:bg-white/10"
        style={{ color: "hsl(var(--muted-foreground))" }}
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
}
