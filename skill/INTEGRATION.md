# BangunAI Blog Manager - Integration Guide

Complete integration guide untuk skill dengan struktur BangunAI Blog.

## Content Structure

```
src/content/
├── writing/     11 posts
├── articles/    4 posts
├── read/        8 items
├── daily/       1 note (growing)
├── about.mdx    Single file
├── now.mdx      Single file
└── index.ts     Auto-import
```

## Frontmatter Formats

### A. Standard (writing, articles, daily)
- title, slug, summary, type, category, tags, date, readingTime

### B. Read Items (read/)
- title, slug, snippet, source, url, tags, date

### C. Special (about, now)
- title only

## Workflows

8 workflows total:
1. daily - Create daily note
2. fetch_last - Style reference
3. write - New content
4. log - Append to daily
5. read - Search content
6. update_about - Update about page
7. update_now - Update now page
8. verify_index - Statistics

## Migration Complete

From ObsBlog to BangunAI-Blog:
- Path updated
- .md to .mdx
- Git-based operations
- Auto-import via index.ts
- 3 new workflows added
