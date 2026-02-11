declare module '*.mdx' {
  import type { ComponentType } from 'react';
  
  const MDXComponent: ComponentType;
  export default MDXComponent;
  
  // Frontmatter exports
  export const frontmatter: Record<string, unknown>;
}
