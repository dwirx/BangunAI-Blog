import { Post } from "@/data/types";

const post: Post = {
  slug: "setup-neovim-2026",
  title: "Setup Neovim Saya di 2026",
  summary: "Konfigurasi Neovim minimalis tapi powerful untuk daily coding.",
  type: "note",
  category: "Tech",
  tags: ["neovim", "config", "editor"],
  date: "2026-01-15",
  readingTime: 5,
  content: `## Filosofi Setup

Prinsip saya: **seminimal mungkin, se-powerful mungkin**. Setiap plugin harus punya alasan jelas kenapa dia ada.

## Plugin Inti

\`\`\`lua
-- lazy.nvim sebagai plugin manager
require("lazy").setup({
  "nvim-treesitter/nvim-treesitter",
  "neovim/nvim-lspconfig",
  "hrsh7th/nvim-cmp",
  "nvim-telescope/telescope.nvim",
  "lewis6991/gitsigns.nvim",
  "echasnovski/mini.nvim",
})
\`\`\`

## LSP Config

TypeScript, Rust, dan Go — tiga bahasa yang sering saya pakai:

\`\`\`lua
local lspconfig = require("lspconfig")
lspconfig.ts_ls.setup({})
lspconfig.rust_analyzer.setup({})
lspconfig.gopls.setup({})
\`\`\`

## Keybindings yang Sering Dipakai

- \`<leader>ff\` — find files (Telescope)
- \`<leader>fg\` — live grep
- \`gd\` — go to definition
- \`K\` — hover docs
- \`<leader>ca\` — code action

## Colorscheme

Pakai **Catppuccin Mocha** — gelap, warm, dan enak dilihat berjam-jam.

## Kesimpulan

Neovim bukan untuk semua orang, tapi kalau sudah "klik", susah balik ke editor lain.`
};

export default post;
