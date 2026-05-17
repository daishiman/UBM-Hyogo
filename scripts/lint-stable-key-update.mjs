#!/usr/bin/env node
// Reject direct writes to schema_questions.stable_key.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");

const SCAN_ROOTS = ["apps", "packages", "scripts"];
const EXCEPTION_PATTERNS = [
  /[\\/]__fixtures__[\\/]/,
  /[\\/]__tests__[\\/]/,
  /[\\/]migrations[\\/]/,
  /[\\/]node_modules[\\/]/,
  /[\\/]\.next[\\/]/,
  /[\\/]\.open-next[\\/]/,
  /[\\/]coverage[\\/]/,
  /[\\/]dist[\\/]/,
  /[\\/]docs[\\/]/,
  /\.spec\.(ts|tsx|mjs|js)$/,
  /lint-stable-key-update\.mjs$/,
];

const DETECTORS = [
  {
    id: "sql-direct-update",
    severity: "error",
    pattern: /UPDATE\s+(?:(?:"?[A-Za-z_][\w$]*"?|`[A-Za-z_][\w$]*`)\s*\.\s*)?(?:"schema_questions"|`schema_questions`|schema_questions)[\s\S]{0,400}?SET[\s\S]{0,160}?(?:"stable_key"|`stable_key`|\bstable_key\b)/i,
  },
  {
    id: "builder-direct-update",
    severity: "error",
    pattern: /\.update\(\s*schemaQuestions\s*\)[\s\S]{0,500}?\.set\(\s*\{[\s\S]{0,400}?\b(stable_key|stableKey)\b/,
  },
  {
    id: "function-direct-update",
    severity: "warning",
    pattern: /(?<!function\s)\bupdateStableKey\s*\(/,
  },
];

function toPosix(path) {
  return path.split(sep).join(posix.sep);
}

function stripComments(src) {
  let out = "";
  let i = 0;
  let state = "code";
  let quote = "";

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (state === "line-comment") {
      out += ch === "\n" ? "\n" : " ";
      if (ch === "\n") state = "code";
      i++;
      continue;
    }

    if (state === "block-comment") {
      if (ch === "*" && next === "/") {
        out += "  ";
        i += 2;
        state = "code";
      } else {
        out += ch === "\n" ? "\n" : " ";
        i++;
      }
      continue;
    }

    if (state === "string") {
      out += ch;
      if (ch === "\\") {
        if (i + 1 < src.length) out += src[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) state = "code";
      i++;
      continue;
    }

    if (ch === "/" && next === "/") {
      out += "  ";
      i += 2;
      state = "line-comment";
      continue;
    }
    if (ch === "/" && next === "*") {
      out += "  ";
      i += 2;
      state = "block-comment";
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      state = "string";
      quote = ch;
    }
    out += ch;
    i++;
  }
  return out;
}

function isException(absPath) {
  const rel = toPosix(relative(repoRoot, absPath));
  return EXCEPTION_PATTERNS.some((re) => re.test(rel));
}

function listFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "coverage" || entry === "dist") continue;
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      out.push(...listFiles(path));
    } else if (/\.(ts|tsx|mjs|cjs|js)$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

function lineCol(src, index) {
  const before = src.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

function findViolations(src) {
  const stripped = stripComments(src);
  const violations = [];
  for (const detector of DETECTORS) {
    const pattern = new RegExp(detector.pattern.source, detector.pattern.flags.includes("g") ? detector.pattern.flags : `${detector.pattern.flags}g`);
    let match;
    while ((match = pattern.exec(stripped)) !== null) {
      violations.push({
        detector: detector.id,
        severity: detector.severity,
        snippet: match[0].replace(/\s+/g, " ").trim().slice(0, 80),
        ...lineCol(stripped, match.index),
      });
      if (match[0].length === 0) pattern.lastIndex++;
    }
  }
  return violations;
}

function parseArgs(argv) {
  const strict = argv.includes("--strict") || process.env.STABLE_KEY_UPDATE_LINT_MODE === "error";
  const json = argv.includes("--json");
  const includeIndex = argv.indexOf("--include");
  const includeArg = includeIndex >= 0 ? argv[includeIndex + 1] : undefined;
  return { strict, json, includeArg };
}

function resolveTargets(includeArg) {
  if (includeArg) {
    return includeArg
      .split(",")
      .filter(Boolean)
      .map((p) => (isAbsolute(p) ? p : join(repoRoot, p)));
  }
  return SCAN_ROOTS
    .flatMap((root) => listFiles(join(repoRoot, root)))
    .filter((file) => !isException(file));
}

function run(argv = process.argv.slice(2)) {
  const { strict, json, includeArg } = parseArgs(argv);
  const targets = resolveTargets(includeArg);
  const violations = [];

  for (const file of targets) {
    const src = readFileSync(file, "utf8");
    for (const v of findViolations(src)) {
      violations.push({ file: toPosix(relative(repoRoot, file)), ...v });
    }
  }

  const errors = violations.filter((v) => v.severity === "error");
  const exitCode = strict && errors.length > 0 ? 1 : 0;

  if (json) {
    process.stdout.write(JSON.stringify({ mode: strict ? "error" : "warning", scanned: targets.length, violations }, null, 2) + "\n");
  } else if (violations.length === 0) {
    console.log(`[stable-key-update-lint] OK (mode=${strict ? "error" : "warning"}, scanned=${targets.length} files)`);
  } else {
    const warnings = violations.filter((v) => v.severity === "warning");
    console.log(`[stable-key-update-lint] ${errors.length} error(s), ${warnings.length} warning(s) detected (mode=${strict ? "error" : "warning"})`);
    for (const v of violations) {
      console.log(`  ${v.file}:${v.line}:${v.col} [${v.severity}] ${v.detector} "${v.snippet}"`);
      console.log("    -> direct schema_questions.stable_key mutation is forbidden; write aliases through schema_aliases / POST /admin/schema/aliases.");
    }
  }

  return { exitCode, violations, scanned: targets.length };
}

const result = run();
if (result.exitCode !== 0) process.exit(result.exitCode);
