import type { ComponentPropsWithoutRef } from "react";
import CodeBlock from "./CodeBlock";

// Custom MDX component overrides
export const mdxComponents = {
  pre: (props: ComponentPropsWithoutRef<"pre">) => <CodeBlock {...props} />,
};
