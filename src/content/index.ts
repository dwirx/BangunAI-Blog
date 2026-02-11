// Content registry — import all post files here
// To add a new post: create a .ts file in the appropriate folder and import it here

import belajarBahasaJepang from "./writing/belajar-bahasa-jepang";
import catatanBelajarRust from "./writing/catatan-belajar-rust-minggu-1";
import setupNeovim from "./writing/setup-neovim-2026";
import digitalMinimalism from "./writing/digital-minimalism-catatan";
import dockerCompose from "./writing/docker-compose-cheatsheet";
import menulisSebagaiBerpikir from "./writing/menulis-sebagai-berpikir";
import produktivitas from "./writing/produktivitas-bukan-soal-tools";
import arch from "./writing/kenapa-saya-pakai-arch";
import berpikir from "./writing/berpikir-sistematis";
import socialMedia from "./writing/hidup-tanpa-social-media";

import linuxWorkflow from "./articles/membangun-workflow-linux-ideal";
import rsc from "./articles/react-server-components-explained";
import tailwindTips from "./articles/tailwind-tips-cepat";
import tsGenerics from "./articles/typescript-generics-guide";

import type { Post } from "@/data/posts";

// All content posts with their markdown content
export const contentPosts: Post[] = [
  belajarBahasaJepang,
  catatanBelajarRust,
  setupNeovim,
  digitalMinimalism,
  dockerCompose,
  menulisSebagaiBerpikir,
  produktivitas,
  arch,
  berpikir,
  socialMedia,
  linuxWorkflow,
  rsc,
  tailwindTips,
  tsGenerics,
];

export function getContentBySlug(slug: string): Post | undefined {
  return contentPosts.find((p) => p.slug === slug);
}
