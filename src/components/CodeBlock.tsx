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

  const lang = (props as Record<string, string>)["data-language"] || "";

  return (
    <div className="code-block-wrapper group relative my-8">
      {lang && (
        <div className="code-block-lang absolute top-0 left-4 px-3 py-1 text-[10px] font-mono font-medium rounded-b-lg z-10 bg-secondary text-muted-foreground uppercase tracking-wider">
          {lang}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  );
}
