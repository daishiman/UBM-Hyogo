#!/usr/bin/env node
// scripts/coverage-merge.mjs — 複数の Istanbul/v8 coverage-final.json を 1 つに merge し
// coverage-summary.json を再生成する。
// 仕様: docs/30-workflows/issue-617-ci-test-time-reduction-split/phase-07.md
//
// Usage:
//   node scripts/coverage-merge.mjs \
//     --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
//     --output="apps/api/coverage"
//
// Exit code:
//   0 = success
//   1 = input ファイル欠損 / parse error / 構造致命的不整合
//   2 = 引数不正

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const out = { inputs: null, output: null };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--inputs=")) out.inputs = arg.slice("--inputs=".length);
    else if (arg.startsWith("--output=")) out.output = arg.slice("--output=".length);
    else if (arg === "-h" || arg === "--help") {
      console.log("usage: coverage-merge.mjs --inputs=A,B,... --output=DIR");
      process.exit(0);
    } else {
      console.error(`[coverage-merge] ERROR: unknown arg: ${arg}`);
      process.exit(2);
    }
  }
  if (!out.inputs || !out.output) {
    console.error("[coverage-merge] ERROR: --inputs and --output are required");
    process.exit(2);
  }
  return out;
}

async function readJson(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text);
  } catch (err) {
    console.error(`[coverage-merge] ERROR: failed to read/parse ${file}: ${err.message}`);
    process.exit(1);
  }
}

// Istanbul FileCoverage の hit count (s/f/b) を加算する。
// statementMap / fnMap / branchMap は same source で同一であることを前提とし、
// 違えば WARN を出して片側を採用する。
function mergeFile(a, b) {
  const merged = {
    path: a.path,
    statementMap: a.statementMap,
    fnMap: a.fnMap,
    branchMap: a.branchMap,
    s: { ...a.s },
    f: { ...a.f },
    b: {},
  };

  // s (statements)
  for (const k of Object.keys(b.s ?? {})) {
    merged.s[k] = (merged.s[k] ?? 0) + (b.s[k] ?? 0);
  }
  // f (functions)
  for (const k of Object.keys(b.f ?? {})) {
    merged.f[k] = (merged.f[k] ?? 0) + (b.f[k] ?? 0);
  }
  // b (branches: array per id)
  for (const k of Object.keys(a.b ?? {})) {
    merged.b[k] = [...(a.b[k] ?? [])];
  }
  for (const k of Object.keys(b.b ?? {})) {
    if (!merged.b[k]) {
      merged.b[k] = [...(b.b[k] ?? [])];
      continue;
    }
    const left = merged.b[k];
    const right = b.b[k] ?? [];
    if (left.length !== right.length) {
      console.warn(
        `[coverage-merge] WARN: branch array length mismatch for ${a.path} branch ${k}: ` +
          `${left.length} vs ${right.length} — keeping left side hit counts`
      );
      continue;
    }
    merged.b[k] = left.map((v, i) => (v ?? 0) + (right[i] ?? 0));
  }

  // structural sanity: compare statementMap key counts only (deep compare is too noisy)
  const aS = Object.keys(a.statementMap ?? {}).length;
  const bS = Object.keys(b.statementMap ?? {}).length;
  if (aS !== bS) {
    console.warn(
      `[coverage-merge] WARN: statementMap size mismatch for ${a.path}: ${aS} vs ${bS} — keeping left side map`
    );
  }
  return merged;
}

function pct(covered, total) {
  if (total === 0) return 100;
  return Math.round((covered / total) * 10000) / 100;
}

function recomputeSummary(coverage) {
  const totals = {
    lines: { total: 0, covered: 0 },
    statements: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
  };

  const summary = {};

  for (const [file, fc] of Object.entries(coverage)) {
    // statements
    const sIds = Object.keys(fc.s ?? {});
    const sCovered = sIds.filter((k) => (fc.s[k] ?? 0) > 0).length;

    // functions
    const fIds = Object.keys(fc.f ?? {});
    const fCovered = fIds.filter((k) => (fc.f[k] ?? 0) > 0).length;

    // branches: each branch id has an array of hits
    let bTotal = 0;
    let bCovered = 0;
    for (const arr of Object.values(fc.b ?? {})) {
      for (const v of arr) {
        bTotal += 1;
        if ((v ?? 0) > 0) bCovered += 1;
      }
    }

    // lines: derive from statementMap line numbers (Istanbul convention)
    const lineHits = new Map();
    for (const [sid, loc] of Object.entries(fc.statementMap ?? {})) {
      const line = loc?.start?.line;
      if (typeof line !== "number") continue;
      const hits = fc.s?.[sid] ?? 0;
      const prev = lineHits.get(line) ?? 0;
      lineHits.set(line, Math.max(prev, hits));
    }
    let lTotal = 0;
    let lCovered = 0;
    for (const v of lineHits.values()) {
      lTotal += 1;
      if (v > 0) lCovered += 1;
    }

    summary[file] = {
      lines: { total: lTotal, covered: lCovered, skipped: 0, pct: pct(lCovered, lTotal) },
      statements: {
        total: sIds.length,
        covered: sCovered,
        skipped: 0,
        pct: pct(sCovered, sIds.length),
      },
      functions: {
        total: fIds.length,
        covered: fCovered,
        skipped: 0,
        pct: pct(fCovered, fIds.length),
      },
      branches: { total: bTotal, covered: bCovered, skipped: 0, pct: pct(bCovered, bTotal) },
    };

    totals.statements.total += sIds.length;
    totals.statements.covered += sCovered;
    totals.functions.total += fIds.length;
    totals.functions.covered += fCovered;
    totals.branches.total += bTotal;
    totals.branches.covered += bCovered;
    totals.lines.total += lTotal;
    totals.lines.covered += lCovered;
  }

  const total = {
    lines: { ...totals.lines, skipped: 0, pct: pct(totals.lines.covered, totals.lines.total) },
    statements: {
      ...totals.statements,
      skipped: 0,
      pct: pct(totals.statements.covered, totals.statements.total),
    },
    functions: {
      ...totals.functions,
      skipped: 0,
      pct: pct(totals.functions.covered, totals.functions.total),
    },
    branches: {
      ...totals.branches,
      skipped: 0,
      pct: pct(totals.branches.covered, totals.branches.total),
    },
  };

  return { total, ...summary };
}

export async function mergeCoverage({ inputs, output }) {
  const files = inputs.split(",").map((s) => s.trim()).filter(Boolean);
  if (files.length === 0) {
    console.error("[coverage-merge] ERROR: --inputs is empty");
    process.exit(2);
  }

  const loaded = [];
  for (const f of files) {
    loaded.push(await readJson(f));
  }

  const merged = {};
  for (const cov of loaded) {
    for (const [file, fc] of Object.entries(cov)) {
      if (!merged[file]) {
        merged[file] = fc;
      } else {
        merged[file] = mergeFile(merged[file], fc);
      }
    }
  }

  await fs.mkdir(output, { recursive: true });
  const finalPath = path.join(output, "coverage-final.json");
  const summaryPath = path.join(output, "coverage-summary.json");
  await fs.writeFile(finalPath, JSON.stringify(merged), "utf8");

  const summary = recomputeSummary(merged);
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(
    `[coverage-merge] merged ${files.length} input(s) → ${finalPath} (${
      Object.keys(merged).length
    } files)`
  );
  console.log(
    `[coverage-merge] summary: lines=${summary.total.lines.pct}% ` +
      `branches=${summary.total.branches.pct}% ` +
      `functions=${summary.total.functions.pct}% ` +
      `statements=${summary.total.statements.pct}%`
  );

  return { finalPath, summaryPath, summary };
}

// Run as CLI only when invoked directly (allow import for tests).
const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(path.basename(process.argv[1] ?? ""));

if (invokedDirectly) {
  const args = parseArgs(process.argv);
  await mergeCoverage(args);
}
