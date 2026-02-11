import { Post } from "@/data/types";

const post: Post = {
  slug: "membangun-workflow-linux-ideal",
  title: "Membangun Workflow Linux yang Ideal untuk Developer",
  summary: "Panduan lengkap menyusun environment development di Linux dari terminal, editor, hingga automation script.",
  type: "article",
  category: "Linux",
  tags: ["linux", "workflow", "developer"],
  date: "2026-02-08",
  readingTime: 12,
  featured: true,
  content: `## Kenapa Linux?

Linux bukan sekadar OS. Bagi developer, Linux adalah kanvas kosong yang bisa kamu bentuk sesuai cara kerja kamu sendiri. Tidak ada yang memaksa kamu pakai workflow tertentu.

## Terminal sebagai Pusat Segalanya

Terminal adalah jantung dari workflow Linux. Dengan shell yang tepat (zsh + oh-my-zsh, atau fish), kamu bisa melakukan hampir semua hal tanpa menyentuh mouse.

### Konfigurasi Zsh

\`\`\`bash
# Install oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Plugin yang wajib
plugins=(git zsh-autosuggestions zsh-syntax-highlighting fzf)
\`\`\`

## Editor: Neovim atau VS Code?

Keduanya punya kelebihan. Neovim untuk yang suka keyboard-driven, VS Code untuk yang butuh GUI dan extension ecosystem.

> "The best editor is the one you know well." — Wisdom dari forum Linux

## Automation dengan Scripts

Buat alias dan script untuk task yang berulang. Ini investasi waktu yang sangat worth it.

\`\`\`bash
# Alias favorit
alias gs="git status"
alias gc="git commit"
alias gp="git push"
alias dc="docker compose"
alias ll="ls -la"
\`\`\`

## Kesimpulan

Workflow ideal itu personal. Eksperimen, iterasi, dan temukan yang paling cocok untuk kamu.`
};

export default post;
