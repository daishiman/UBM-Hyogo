#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const appDir = process.cwd();
const nextDir = resolve(appDir, ".next");
const standaloneNextDir = resolve(
  appDir,
  ".next/standalone/apps/web/.next",
);
const traceFile = "server/instrumentation.js.nft.json";

function copyRelative(relativePath) {
  const source = join(nextDir, relativePath);
  const target = join(standaloneNextDir, relativePath);
  if (!existsSync(source)) {
    throw new Error(`[patch-next-standalone-instrumentation] missing ${source}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

copyRelative("server/instrumentation.js");
copyRelative("server/instrumentation.js.map");
copyRelative(traceFile);

const trace = JSON.parse(readFileSync(join(nextDir, traceFile), "utf8"));
for (const tracedPath of trace.files ?? []) {
  copyRelative(join("server", tracedPath));
}

console.log("[patch-next-standalone-instrumentation] instrumentation copied");
