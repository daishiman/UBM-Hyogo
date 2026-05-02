#!/usr/bin/env node
// 03a AC-7: stableKey リテラル直書き禁止の静的検査
//
// 不変条件 #1（実フォーム schema をコードに固定しすぎない / stableKey 二重定義禁止）を
// 静的に保護する。許可された supply module 以外で stableKey の文字列リテラルが直書き
// された場合、警告（既定）またはエラー（--strict / STABLEKEY_LINT_MODE=error）を返す。
//
// rule id: @ubm-hyogo/no-stablekey-literal
// 詳細仕様: docs/30-workflows/03a-stablekey-literal-lint-enforcement/

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { isAbsolute, join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");

const ALLOW_LIST = [
  "packages/shared/src/zod/field.ts",
  "packages/integrations/google/src/forms/mapper.ts",
];

const EXCEPTION_GLOBS = [
  /\.test\.(ts|tsx|mjs|js)$/,
  /\.spec\.(ts|tsx|mjs|js)$/,
  /[\\/]__fixtures__[\\/]/,
  /[\\/]__tests__[\\/]/,
  /[\\/]migrations[\\/]seed[\\/]/,
  /[\\/]playwright[\\/]/,
  /[\\/]node_modules[\\/]/,
  /[\\/]\.next[\\/]/,
  /[\\/]coverage[\\/]/,
];

const SCAN_ROOTS = ["apps", "packages"];

function toPosix(p) {
  return p.split(sep).join(posix.sep);
}

function isException(absPath) {
  const rel = toPosix(relative(repoRoot, absPath));
  if (ALLOW_LIST.includes(rel)) return true;
  return EXCEPTION_GLOBS.some((re) => re.test(rel));
}

function loadStableKeys() {
  const fieldTs = join(repoRoot, "packages/shared/src/zod/field.ts");
  const body = readFileSync(fieldTs, "utf8");
  // FieldByStableKeyZ オブジェクト内のキー名を抽出する。
  const start = body.indexOf("FieldByStableKeyZ");
  if (start < 0) throw new Error("FieldByStableKeyZ not found in field.ts");
  const braceStart = body.indexOf("{", start);
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const block = body.slice(braceStart, end);
  const keys = new Set();
  // 行頭（コメント/空白除去後）が `<ident>:` の形を抽出
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\/\/.*$/, "").trim();
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/);
    if (m) keys.add(m[1]);
  }
  if (keys.size !== 31) {
    throw new Error(`expected 31 stableKeys from field.ts, got ${keys.size}`);
  }
  return keys;
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

function stripComments(src) {
  // 文字列リテラルは検査対象なので残し、コメント領域だけ空白化して行/列を維持する。
  let out = "";
  let i = 0;
  let state = "code";
  let quote = "";

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (state === "line-comment") {
      if (ch === "\n") {
        state = "code";
        out += ch;
      } else {
        out += " ";
      }
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

function findLiteralViolations(src, stableKeys) {
  const violations = [];
  const lines = src.split("\n");
  // 通常の文字列 / テンプレートリテラル / 識別子と区別するため、トークン的に検出。
  // 簡易: ['"`] で囲まれた、stableKey と完全一致する内容を全て探す。
  // テンプレートは ${...} を含まない static template literal のみを対象。
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 1) 単一/二重引用符
    const reQuoted = /(["'])([A-Za-z_][A-Za-z0-9_]*)\1/g;
    let m;
    while ((m = reQuoted.exec(line)) !== null) {
      const value = m[2];
      if (stableKeys.has(value)) {
        violations.push({ line: i + 1, col: m.index + 1, value, kind: "string" });
      }
    }
    // 2) 静的テンプレートリテラル: `key` （${ を含まない）
    const reTpl = /`([^`$\\]*)`/g;
    while ((m = reTpl.exec(line)) !== null) {
      const value = m[1];
      if (stableKeys.has(value)) {
        violations.push({ line: i + 1, col: m.index + 1, value, kind: "template" });
      }
    }
  }
  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict") || process.env.STABLEKEY_LINT_MODE === "error";
  const showJson = args.includes("--json");
  const includeIndex = args.indexOf("--include");
  const includeArg = includeIndex >= 0 ? args[includeIndex + 1] : undefined;
  const stableKeys = loadStableKeys();

  const files = includeArg
    ? includeArg.split(",").filter(Boolean).map((p) => isAbsolute(p) ? p : join(repoRoot, p))
    : SCAN_ROOTS.flatMap((r) => listFiles(join(repoRoot, r)));
  const targets = includeArg ? files : files.filter((f) => !isException(f));

  const all = [];
  for (const file of targets) {
    const rel = toPosix(relative(repoRoot, file));
    const src = readFileSync(file, "utf8");
    const stripped = stripComments(src);
    const vs = findLiteralViolations(stripped, stableKeys);
    for (const v of vs) all.push({ file: rel, ...v });
  }

  if (showJson) {
    process.stdout.write(JSON.stringify({
      mode: strict ? "error" : "warning",
      stableKeyCount: stableKeys.size,
      allowList: ALLOW_LIST,
      violations: all,
    }, null, 2) + "\n");
  } else {
    if (all.length === 0) {
      console.log(`[stablekey-literal-lint] OK (mode=${strict ? "error" : "warning"}, scanned=${targets.length} files, stableKeys=${stableKeys.size})`);
    } else {
      console.log(`[stablekey-literal-lint] ${all.length} violation(s) found (mode=${strict ? "error" : "warning"})`);
      for (const v of all) {
        console.log(`  ${v.file}:${v.line}:${v.col}  ${v.kind} literal "${v.value}" — import from supply module instead (allow-list: ${ALLOW_LIST.join(", ")})`);
      }
    }
  }

  if (all.length > 0 && strict) process.exit(1);
}

main();
