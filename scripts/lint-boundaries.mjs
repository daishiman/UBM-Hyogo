import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const webSrc = join(repoRoot, "apps", "web");
const forbidden = [
  "@cloudflare/d1",
  "D1Database",
  "apps/api",
  "@ubm-hyogo/api",
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
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

const violations = [];
for (const file of listFiles(webSrc)) {
  const body = readFileSync(file, "utf8");
  for (const token of forbidden) {
    if (body.includes(token)) {
      violations.push(`${relative(repoRoot, file)} contains forbidden token: ${token}`);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}
