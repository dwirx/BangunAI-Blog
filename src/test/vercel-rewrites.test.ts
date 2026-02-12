import { readFileSync } from "node:fs";
import path from "node:path";

describe("Vercel SPA routing", () => {
  it("defines a catch-all rewrite to index.html", () => {
    const configPath = path.resolve(process.cwd(), "vercel.json");
    const raw = readFileSync(configPath, "utf8");
    const config = JSON.parse(raw) as {
      rewrites?: Array<{ source?: string; destination?: string }>;
    };

    expect(config.rewrites).toBeDefined();
    expect(config.rewrites).toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
