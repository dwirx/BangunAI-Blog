import { Post } from "@/data/types";

const post: Post = {
  slug: "docker-compose-cheatsheet",
  title: "Docker Compose Cheatsheet untuk Pemula",
  summary: "Referensi cepat untuk docker-compose yang sering saya pakai.",
  type: "note",
  category: "Tech",
  tags: ["docker", "devops", "cheatsheet"],
  date: "2025-12-05",
  readingTime: 4,
  content: `## Basic Commands

\`\`\`bash
# Start semua services
docker compose up -d

# Stop semua
docker compose down

# Rebuild
docker compose up -d --build

# Lihat logs
docker compose logs -f [service]

# Masuk ke container
docker compose exec [service] bash
\`\`\`

## Template docker-compose.yml

\`\`\`yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - NODE_ENV=development
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  db_data:
\`\`\`

## Tips

- Selalu pakai \`-d\` (detached) untuk production
- Pakai \`.env\` file untuk secrets
- Volume untuk data persistence
- \`depends_on\` tidak menunggu service ready, hanya start order`
};

export default post;
