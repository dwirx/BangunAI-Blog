---
name: bangunai-blog-manager
description: Use when managing BangunAI Blog content, automating blog workflows, and writing MDX articles with frontmatter conventions.
---

# BangunAI Blog Manager (Smart Blog + Content Workflow)

**Homepage:** React + Vite + MDX + shadcn/ui
**Blog Root:** `/home/hades/BangunAI-Blog`
**Content Root:** `/home/hades/BangunAI-Blog/src/content`

Skill ini menggabungkan:
- workflow custom untuk blog content (daily, fetch style, universal writer, logging, smart read), dan
- MDX authoring untuk React-based blog dengan frontmatter standar.

## BangunAI Blog Fundamentals

Blog ini menggunakan React + Vite + MDX dengan struktur:

```
/home/hades/BangunAI-Blog/
├── src/
│   ├── content/
│   │   ├── writing/       # Blog posts (MDX)
│   │   ├── articles/      # Articles (MDX)
│   │   ├── read/          # Reading notes (MDX)
│   │   ├── daily/         # Daily notes (MDX)
│   │   ├── about.mdx      # About page (single file)
│   │   ├── now.mdx        # Now page (single file)
│   │   └── index.ts       # Content loader (auto-import)
│   ├── components/        # React components
│   ├── pages/             # Route pages
│   ├── lib/               # Utilities
│   └── assets/            # Static assets
├── public/                # Public files
├── skill/                 # Agent skills
└── package.json           # Dependencies
```

**Content Categories:**
- `writing/` — Blog posts (personal notes, tutorials, life)
- `articles/` — Long-form articles (deep dives, technical)
- `read/` — Reading notes (books, papers)
- `daily/` — Daily notes (tasks, logs, personal journal)

**Special Files:**
- `about.mdx` — About page (single file)
- `now.mdx` — Now page (what I'm doing now)
- `index.ts` — Content loader (auto-import all MDX)

**File Format:** `.mdx` (Markdown + JSX components)

## Content Workflows

### Search & Discovery

```bash
# Find content by keyword
find /home/hades/BangunAI-Blog/src/content -name "*.mdx" | xargs grep -l "keyword"

# List all writing posts
ls -lt /home/hades/BangunAI-Blog/src/content/writing/*.mdx | head -10

# List all articles
ls -lt /home/hades/BangunAI-Blog/src/content/articles/*.mdx | head -10
```

### Move/Rename Posts

```bash
# Use git mv to preserve history
cd /home/hades/BangunAI-Blog
git mv src/content/writing/old-name.mdx src/content/writing/new-name.mdx
```

### Delete Posts

```bash
# Delete with git to track removal
cd /home/hades/BangunAI-Blog
git rm src/content/writing/file-to-delete.mdx
```

---

## Existing Workflows (Custom untuk BangunAI Blog)

## 1) `daily` (Smart Daily Note)

Logic rollover task dari daily note sebelumnya + section log.

```bash
BLOG_ROOT="/home/hades/BangunAI-Blog"
DAILY_DIR="$BLOG_ROOT/src/content/daily"
mkdir -p "$DAILY_DIR"

TODAY=$(date +%Y-%m-%d)
FILE="$DAILY_DIR/$TODAY.mdx"
LAST_FILE=$(find "$DAILY_DIR" -name "????-??-??.mdx" ! -name "$TODAY.mdx" | sort | tail -n 1)

if [ ! -f "$FILE" ]; then
  cat > "$FILE" <<EOF
---
title: "Daily Note: $TODAY"
date: "$TODAY"
type: daily
tags: [daily]
---

# Daily Note: $TODAY

EOF

  if [ -n "$LAST_FILE" ]; then
    PENDING=$(grep "\- \[ \]" "$LAST_FILE" || true)
    if [ -n "$PENDING" ]; then
      echo "## Rollover Tasks" >> "$FILE"
      echo "" >> "$FILE"
      echo "$PENDING" >> "$FILE"
      echo "" >> "$FILE"
    fi
  fi
  
  cat >> "$FILE" <<EOF
## Tasks Today

- [ ] 

## Log

EOF
  echo "✅ Created: $FILE"
else
  echo "📂 Exists: $FILE"
fi
```

## 2) `fetch_last` (Style Analysis)

Ambil file terbaru per kategori untuk referensi gaya.

```bash
# Input: CATEGORY (writing, articles, read, daily, about, now)
BLOG_ROOT="/home/hades/BangunAI-Blog"
case "$CATEGORY" in
  "daily") DIR="$BLOG_ROOT/src/content/daily" ;;
  "writing") DIR="$BLOG_ROOT/src/content/writing" ;;
  "articles") DIR="$BLOG_ROOT/src/content/articles" ;;
  "read") DIR="$BLOG_ROOT/src/content/read" ;;
  "about") 
    cat "$BLOG_ROOT/src/content/about.mdx"
    exit 0
    ;;
  "now") 
    cat "$BLOG_ROOT/src/content/now.mdx"
    exit 0
    ;;
  *) echo "❌ Unknown category"; exit 1 ;;
esac
LAST_FILE=$(ls -t "$DIR"/*.mdx 2>/dev/null | head -n 1)
if [ -f "$LAST_FILE" ]; then
  echo "📄 REFERENSI GAYA ($LAST_FILE):"
  head -n 40 "$LAST_FILE"
else
  echo "❌ Belum ada file di $CATEGORY"
fi
```

## 3) `write` (Universal Writer + BangunAI Blog Style)

Menulis konten. Untuk artikel panjang, gunakan style guide di bawah.

### BangunAI Blog Style Guide

### BangunAI Blog Style Guide

**Ada 2 jenis frontmatter:**

#### A. Standard Posts (writing, articles, daily)

```yaml
---
title: "Judul Artikel Yang Menarik"
slug: judul-artikel-yang-menarik
summary: "Ringkasan pendek 1-2 kalimat yang menjelaskan isi artikel."
type: note  # atau: article, tutorial, guide
category: Tech  # atau: Life, Design, Business
tags: [tag1, tag2, tag3]
date: "2026-02-12T10:30:00"
readingTime: 5
---
```

**Field penting:**
- `title` — Judul artikel (string, wajib)
- `slug` — URL-friendly slug (string, wajib)
- `summary` — Deskripsi singkat (string, wajib)
- `type` — Jenis konten: `note`, `article`, `tutorial`, `guide` (string, wajib)
- `category` — Kategori utama: `Tech`, `Life`, `Design`, `Business` (string, wajib)
- `tags` — Array tags (array, wajib)
- `date` — ISO timestamp (string, wajib)
- `readingTime` — Estimasi menit baca (number, optional)

#### B. Read Items (read/)

Format khusus untuk bookmarks, reading notes, link sharing:

```yaml
---
title: "Judul Artikel/Bacaan"
slug: judul-artikel-bacaan
snippet: "Quote atau snippet menarik dari artikel (1-2 kalimat)."
source: "nama-situs.com"
url: "https://link-ke-artikel.com"
tags: [tag1, tag2]
date: "2026-02-12T10:30:00"
---

## Notes (Optional)

Catatan personal tentang artikel ini...
```

**Field penting untuk Read Items:**
- `title` — Judul artikel (string, wajib)
- `slug` — URL-friendly slug (string, wajib)
- `snippet` — Quote/snippet menarik (string, wajib)
- `source` — Domain sumber (string, wajib)
- `url` — Link ke artikel asli (string, wajib)
- `tags` — Array tags (array, wajib)
- `date` — Tanggal disimpan (ISO timestamp, wajib)

**Body content:** Optional, gunakan untuk catatan personal

#### C. Special Pages (about.mdx, now.mdx)

Format minimalis tanpa banyak frontmatter:

```yaml
---
title: "About"  # atau "Now"
---

Content langsung di sini...
```

1. **Frontmatter (Wajib):**

2. **Struktur Artikel:**

```markdown
## Section Heading

Paragraf pembuka yang menarik. Gunakan **bold** untuk emphasis dan *italic* untuk istilah asing.

### Subsection Heading

- Bullet point 1
- Bullet point 2
- Bullet point 3

### Contoh Code Block

\`\`\`typescript
function hello(name: string): string {
  return `Hello, ${name}!`;
}
\`\`\`

### Blockquote

> Kutipan atau catatan penting yang perlu disorot.

### Link

Gunakan [link text](https://example.com) untuk referensi eksternal.
```

3. **Best Practices:**
   - Gunakan heading hierarchy (`##`, `###`, `####`) dengan benar
   - Sertakan code block dengan syntax highlighting yang sesuai
   - Tulis summary yang compelling (1-2 kalimat)
   - Gunakan kategori yang konsisten: `Tech`, `Life`, `Design`, `Business`
   - Estimasi `readingTime` berdasarkan word count (~200 kata/menit)
   - Slug harus lowercase, pakai dash, tanpa special characters

Writer command:

```bash
# Input: CATEGORY="writing" (atau articles/read)
# Input: FILENAME="judul-artikel.mdx"
# Input: CONTENT="..."
BLOG_ROOT="/home/hades/BangunAI-Blog"
FULL_PATH="$BLOG_ROOT/src/content/$CATEGORY/$FILENAME"
mkdir -p "$(dirname "$FULL_PATH")"
echo "$CONTENT" > "$FULL_PATH"
echo "✅ Written to: $FULL_PATH"
```

## 4) `log` (Append Log)

```bash
# Input: CONTENT="..."
TODAY=$(date +%Y-%m-%d)
FILE="/home/hades/BangunAI-Blog/src/content/daily/$TODAY.mdx"
if [ ! -f "$FILE" ]; then echo "❌ Run 'daily' first!"; exit 1; fi
echo "- $(date +%H:%M) $CONTENT" >> "$FILE"
echo "✅ Logged."
```

## 5) `read` (Smart Read)

```bash
# Input: FILE="..."
find "/home/hades/BangunAI-Blog/src/content" -name "*$FILE*.mdx" | head -n 1 | xargs -r cat
```

## 6) `update_about` (Update About Page)

Update halaman About dengan konten baru.

```bash
# Input: CONTENT="..."
FILE="/home/hades/BangunAI-Blog/src/content/about.mdx"
cat > "$FILE" <<EOF
---
title: "About"
---

$CONTENT
EOF
echo "✅ Updated: $FILE"
```

## 7) `update_now` (Update Now Page)

Update halaman Now dengan status terbaru.

```bash
# Input: CONTENT="..."
FILE="/home/hades/BangunAI-Blog/src/content/now.mdx"
CURRENT_DATE=$(date +"%B %Y")
cat > "$FILE" <<EOF
---
title: "Now"
---

## Apa yang Sedang Saya Kerjakan

*Terakhir diperbarui: $CURRENT_DATE*

Halaman ini terinspirasi dari [nownownow.com](https://nownownow.com) — tempat saya mencatat apa yang sedang saya fokuskan saat ini.

---

$CONTENT

---

> *Halaman ini adalah snapshot dari kehidupan saya saat ini. Bukan resume, bukan portofolio — hanya update jujur tentang apa yang sedang saya kerjakan.*
EOF
echo "✅ Updated: $FILE"
```

## 8) `verify_index` (Verify Content Auto-Import)

Verify bahwa index.ts auto-detect semua MDX files dengan benar.

```bash
BLOG_ROOT="/home/hades/BangunAI-Blog"
echo "📊 Content Statistics:"
echo ""
echo "Writing posts: $(ls -1 "$BLOG_ROOT/src/content/writing"/*.mdx 2>/dev/null | wc -l)"
echo "Articles: $(ls -1 "$BLOG_ROOT/src/content/articles"/*.mdx 2>/dev/null | wc -l)"
echo "Read items: $(ls -1 "$BLOG_ROOT/src/content/read"/*.mdx 2>/dev/null | wc -l)"
echo "Daily notes: $(ls -1 "$BLOG_ROOT/src/content/daily"/*.mdx 2>/dev/null | wc -l)"
echo ""
echo "Special files:"
echo "- about.mdx: $(test -f "$BLOG_ROOT/src/content/about.mdx" && echo "✅" || echo "❌")"
echo "- now.mdx: $(test -f "$BLOG_ROOT/src/content/now.mdx" && echo "✅" || echo "❌")"
echo "- index.ts: $(test -f "$BLOG_ROOT/src/content/index.ts" && echo "✅" || echo "❌")"
```

---

## Integration Guidelines

### When to Use This Skill

Gunakan skill ini saat:
- Membuat blog post baru (`writing`, `articles`, `read`)
- Mengelola daily notes
- Mencari referensi style dari artikel sebelumnya
- Membuat log activity harian
- Membaca atau mencari konten di blog

### Best Practices

- **Jika task adalah operasi content-level** (search/create/move/delete):
  - Untuk search: gunakan `find` + `grep` di `/home/hades/BangunAI-Blog/src/content`
  - Untuk create: gunakan workflow `write` dengan frontmatter lengkap
  - Untuk move/rename: gunakan `git mv` untuk preserve history
  - Untuk delete: gunakan `git rm` untuk track removal

- **Jika task adalah formatting/authoring konten**:
  - Gunakan workflow custom (`fetch_last`, `write`, `log`)
  - Ikuti BangunAI Blog Style Guide untuk frontmatter
  - Pastikan slug konsisten (lowercase, dash-separated)
  - Estimasi `readingTime` berdasarkan word count

- **Jika task adalah daily note management**:
  - Gunakan workflow `daily` untuk rollover tasks
  - Gunakan workflow `log` untuk append activity
  - Simpan di `/home/hades/BangunAI-Blog/src/content/daily/`

### Content Category Guidelines

| Category | Path | Use Case | Frontmatter Type | Example |
|----------|------|----------|------------------|---------|
| `writing` | `src/content/writing/` | Personal blog posts, tutorials, notes | Standard (A) | Belajar Bahasa Jepang |
| `articles` | `src/content/articles/` | Long-form articles, deep dives | Standard (A) | Technical architecture guides |
| `read` | `src/content/read/` | Reading notes, bookmarks, link sharing | Read Items (B) | Choose Boring Technology |
| `daily` | `src/content/daily/` | Daily notes, logs, tasks | Standard (A) | 2026-02-12.mdx |
| `about` | `src/content/about.mdx` | About page (single file) | Special (C) | About Me |
| `now` | `src/content/now.mdx` | Now page (single file) | Special (C) | What I'm doing now |

### Frontmatter Quick Reference

**Standard Posts (writing, articles, daily):**
```yaml
---
title: "Your Article Title"              # String, wajib
slug: your-article-slug                  # String (kebab-case), wajib
summary: "Brief 1-2 sentence summary"    # String, wajib
type: note                               # note|article|tutorial|guide, wajib
category: Tech                           # Tech|Life|Design|Business, wajib
tags: [react, typescript, vite]          # Array, wajib
date: "2026-02-12T10:30:00"             # ISO timestamp, wajib
readingTime: 5                           # Number (minutes), optional
---
```

**Read Items (read/):**
```yaml
---
title: "Article Title"                   # String, wajib
slug: article-slug                       # String (kebab-case), wajib
snippet: "Interesting quote/snippet"     # String, wajib
source: "website.com"                    # String (domain), wajib
url: "https://full-url.com"             # String (full URL), wajib
tags: [tag1, tag2]                       # Array, wajib
date: "2026-02-12T10:30:00"             # ISO timestamp, wajib
---
```

**Special Pages (about, now):**
```yaml
---
title: "About"                           # String, wajib (About atau Now)
---
```

### Development Workflow

```bash
# 1. Start dev server
cd /home/hades/BangunAI-Blog
bun run dev

# 2. Build for production
bun run build

# 3. Preview production build
bun run preview

# 4. Run tests
bun run test

# 5. Lint code
bun run lint
```

### Common Tasks

**Create new blog post:**
```bash
# 1. Fetch style reference
CATEGORY="writing" bash -c 'fetch_last workflow'

# 2. Create new post with frontmatter
cat > src/content/writing/new-post.mdx <<'EOF'
---
title: "New Post Title"
slug: new-post-title
summary: "Brief summary of the post"
type: note
category: Tech
tags: [tag1, tag2]
date: "2026-02-12T10:00:00"
readingTime: 5
---

## Introduction

Your content here...
EOF

# 3. Verify file created
ls -lh src/content/writing/new-post.mdx
```

**Search for content:**
```bash
# Search by keyword
grep -r "keyword" src/content/writing/

# Find specific file
find src/content -name "*keyword*.mdx"

# List recent posts
ls -lt src/content/writing/*.mdx | head -5
```

**Update existing post:**
```bash
# Open and edit
$EDITOR src/content/writing/existing-post.mdx

# Or use fs_write tool in agent context
```
