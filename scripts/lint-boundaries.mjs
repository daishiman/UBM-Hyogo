import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const repoRoot = process.cwd();
const webSrc = join(repoRoot, "apps", "web");
const forbidden = [
  "@cloudflare/d1",
  "D1Database",
  "apps/api",
  "apps/api/src/env",
  "@ubm-hyogo/api",
  "@ubm-hyogo/integrations-google",
  "@ubm-hyogo/integrations/google",
  "packages/integrations/google",
  "localStorage",
  "sessionStorage",
];

function listFiles(dir) {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") return [];
      return listFiles(path);
    }
    if (/\.test\.(ts|tsx)$/.test(entry)) return [];
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

const violations = [];
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;

function isInsidePath(path, dir) {
  const rel = relative(dir, path);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/"));
}

for (const file of listFiles(webSrc)) {
  const body = readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (body.includes(token)) {
      violations.push(`${relative(repoRoot, file)} contains forbidden token: ${token}`);
    }
  }

  for (const match of body.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier?.startsWith(".")) continue;

    const resolved = resolve(dirname(file), specifier);
    if (isInsidePath(resolved, join(repoRoot, "apps", "api"))) {
      violations.push(
        `${relative(repoRoot, file)} imports forbidden apps/api module via relative path: ${specifier}`,
      );
    }
    if (isInsidePath(resolved, join(repoRoot, "packages", "integrations", "google"))) {
      violations.push(
        `${relative(repoRoot, file)} imports forbidden Google integration module via relative path: ${specifier}`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}
