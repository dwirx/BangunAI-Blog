import type { ReactNode } from "react";

export default function Highlight({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-highlight/20 text-highlight px-1 rounded-sm">
      {children}
    </mark>
  );
}
