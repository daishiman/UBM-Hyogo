#!/usr/bin/env node
// Issue #560 / task-03-followup-002:
// Next.js standalone build の instrumentation.ts を standalone 出力に物理 copy する workaround。
// `apps/web` を cwd として起動することを前提とし、CI gate (--verify-only) で silent failure を排除する。
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const VERIFY_TOKENS = ["register", "Sentry"];
const TRACE_FILE = "server/instrumentation.js.nft.json";
const FAILURE_MESSAGE =
  "Sentry server instrumentation missing in standalone build artifact";
const REQUIRED_INPUTS = [
  "server/instrumentation.js",
  "server/instrumentation.js.map",
  TRACE_FILE,
];

function logEvent(event, fields = {}) {
  const parts = [`event=${event}`];
  if (event === "verify_failed" && fields.message === undefined) {
    fields.message = FAILURE_MESSAGE;
  }
  for (const [k, v] of Object.entries(fields)) {
    parts.push(`${k}=${v}`);
  }
  const line = `[patch-next-standalone-instrumentation] ${parts.join(" ")}`;
  if (event.endsWith("_failed") || event === "cwd_guard_failed") {
    console.error(line);
  } else {
    console.log(line);
  }
}

function assertCwdIsAppsWeb() {
  const cwd = process.cwd();
  const looksLikeAppsWeb =
    basename(cwd) === "web" && basename(dirname(cwd)) === "apps";
  if (!looksLikeAppsWeb) {
    logEvent("cwd_guard_failed", { cwd });
    process.exit(1);
  }
}

function copyRelative(nextDir, standaloneNextDir, relativePath) {
  const source = join(nextDir, relativePath);
  const target = join(standaloneNextDir, relativePath);
  if (!existsSync(source)) {
    logEvent("copy_failed", { reason: "missing", source });
    process.exit(1);
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  logEvent("copy_ok", { source, target });
}

function verifyArtifact(standaloneNextDir) {
  const target = join(standaloneNextDir, "server/instrumentation.js");
  if (!existsSync(target)) {
    logEvent(
      "verify_failed",
      { reason: "missing", target },
    );
    process.exit(1);
  }
  const content = readFileSync(target, "utf8");
  const missing = VERIFY_TOKENS.filter((t) => !content.includes(t));
  if (missing.length > 0) {
    logEvent("verify_failed", {
      reason: "tokens_missing",
      target,
      tokens: missing.join(","),
    });
    process.exit(1);
  }
  logEvent("verify_ok", { target, tokens: VERIFY_TOKENS.join(",") });
}

function readTraceFiles(nextDir) {
  const tracePath = join(nextDir, TRACE_FILE);
  try {
    const trace = JSON.parse(readFileSync(tracePath, "utf8"));
    if (trace.files !== undefined && !Array.isArray(trace.files)) {
      logEvent("trace_failed", { reason: "files_not_array", trace: tracePath });
      process.exit(1);
    }
    return trace.files ?? [];
  } catch (error) {
    logEvent("trace_failed", {
      reason: "invalid_json",
      trace: tracePath,
      error: error instanceof Error ? error.name : "unknown",
    });
    process.exit(1);
  }
}

function main() {
  assertCwdIsAppsWeb();
  const verifyOnly = process.argv.includes("--verify-only");

  const appDir = process.cwd();
  const nextDir = resolve(appDir, ".next");
  const standaloneNextDir = resolve(appDir, ".next/standalone/apps/web/.next");

  if (verifyOnly) {
    logEvent("verify_start", { mode: "verify-only", target: standaloneNextDir });
    verifyArtifact(standaloneNextDir);
    logEvent("verify_done");
    return;
  }

  logEvent("copy_start", { source: nextDir, target: standaloneNextDir });
  for (const rel of REQUIRED_INPUTS) {
    copyRelative(nextDir, standaloneNextDir, rel);
  }
  for (const tracedPath of readTraceFiles(nextDir)) {
    copyRelative(nextDir, standaloneNextDir, join("server", tracedPath));
  }
  verifyArtifact(standaloneNextDir);
  logEvent("copy_done");
}

main();
