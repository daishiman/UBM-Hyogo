[実装区分: 実装仕様書]

# Phase 5: guard script 実装 + dead code 削除

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-05/main.md` |

## 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `scripts/lint-stable-key-update.mjs` | new | guard script 本体 |
| `apps/api/src/repository/schemaQuestions.ts` | modify（削除） | `updateStableKey()`（lines 153-172）を削除 |

## guard script 構造（疑似コード）

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { isAbsolute, join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");

const EXCEPTION_GLOBS = [
  /[\\/]migrations[\\/]/,
  /[\\/]__fixtures__[\\/]/,
  /[\\/]__tests__[\\/]/,
  /\.spec\.(ts|tsx|mjs|js)$/,
  /[\\/]node_modules[\\/]/,
  /[\\/]\.next[\\/]/,
  /[\\/]\.open-next[\\/]/,
  /[\\/]coverage[\\/]/,
  /[\\/]dist[\\/]/,
];

const SCAN_ROOTS = ["apps", "packages", "scripts"];

// Detector 1: SQL 文字列直更新
const SQL_UPDATE_RE = /UPDATE\s+(?:(?:"?[A-Za-z_][\w$]*"?|`[A-Za-z_][\w$]*`)\s*\.\s*)?(?:"schema_questions"|`schema_questions`|schema_questions)[\s\S]{0,400}?SET[\s\S]{0,160}?(?:"stable_key"|`stable_key`|\bstable_key\b)/i;

// Detector 2: drizzle / builder
const BUILDER_UPDATE_RE = /\.update\(\s*schemaQuestions\s*\)[\s\S]{0,500}?\.set\(\s*\{[\s\S]{0,400}?\b(stable_key|stableKey)\b/;

// Detector 3 (warning 固定): 関数呼び出し mutation hint
const FN_NAME_RE = /(?<!function\s)\bupdateStableKey\s*\(/;

function stripComments(src) { /* lint-stablekey-literal.mjs 流用 */ }
function isException(absPath) { /* 既存 pattern */ }
function listFiles(dir) { /* 既存 pattern */ }

function findViolations(src, file) {
  const stripped = stripComments(src);
  const out = [];
  for (const [reId, re, severity] of [
    ["sql-direct-update", SQL_UPDATE_RE, "error"],
    ["builder-direct-update", BUILDER_UPDATE_RE, "error"],
    ["function-direct-update", FN_NAME_RE, "warning"],
  ]) {
    let m;
    while ((m = re.exec(stripped)) !== null) {
      const before = stripped.slice(0, m.index);
      const line = before.split("\n").length;
      const col = m.index - before.lastIndexOf("\n");
      out.push({ file, detector: reId, line, col, snippet: m[0].slice(0, 80), severity });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict") || process.env.STABLE_KEY_UPDATE_LINT_MODE === "error";
  const json = args.includes("--json");
  const includeIdx = args.indexOf("--include");
  const include = includeIdx >= 0 ? args[includeIdx + 1] : undefined;

  const files = include
    ? include.split(",").map((p) => isAbsolute(p) ? p : join(repoRoot, p))
    : SCAN_ROOTS.flatMap((r) => listFiles(join(repoRoot, r)));
  const targets = include ? files : files.filter((f) => !isException(f));

  const violations = [];
  for (const f of targets) {
    const rel = relative(repoRoot, f).split(sep).join(posix.sep);
    const src = readFileSync(f, "utf8");
    violations.push(...findViolations(src, rel));
  }

  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  if (json) {
    process.stdout.write(JSON.stringify({ mode: strict ? "error" : "warning", violations }, null, 2) + "\n");
  } else {
    if (violations.length === 0) {
      console.log(`[stable-key-update-lint] OK (mode=${strict ? "error" : "warning"}, scanned=${targets.length} files)`);
    } else {
      console.log(`[stable-key-update-lint] ${errors.length} error(s), ${warnings.length} warning(s) detected (mode=${strict ? "error" : "warning"})`);
      for (const v of violations) {
        console.log(
          `  ${v.file}:${v.line}:${v.col}  [${v.severity}] ${v.detector}  "${v.snippet}"\n` +
          `    -> direct schema_questions.stable_key mutation is forbidden; write aliases through schema_aliases / POST /admin/schema/aliases.`
        );
      }
    }
  }

  if (errors.length > 0 && strict) process.exit(1);
}

main();
```

## 関数シグネチャ

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `stripComments(src: string)` | source code | comment 領域を空白化したソース | なし |
| `isException(absPath: string)` | 絶対パス | boolean | なし |
| `listFiles(dir: string)` | dir 絶対パス | ts/tsx/mjs/cjs/js ファイル列 | なし |
| `findViolations(src, file)` | source / rel path | `{ file, detector, line, col, snippet, severity }[]`（同一ファイル複数違反を全件列挙） | なし |
| `main()` | `process.argv` | — | stdout 出力 / 必要に応じ `process.exit(1)` |

## dead code 削除

`apps/api/src/repository/schemaQuestions.ts` の lines 153-172（`updateStableKey()`）を削除。
削除に伴う他ファイル変更は不要（caller 0 件 / Phase 1 P50 で確認済）。

## ローカル検証コマンド

```bash
mise exec -- node scripts/lint-stable-key-update.mjs            # warning mode（exit 0）
mise exec -- node scripts/lint-stable-key-update.mjs --strict   # strict mode（violation あれば exit 1）
mise exec -- node scripts/lint-stable-key-update.mjs --json     # JSON 出力
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## DoD

- [ ] guard script が `--strict` なしで `[stable-key-update-lint] OK` を返す
- [ ] dead code 削除後 `rg -n "updateStableKey" apps packages` が 0 件
- [ ] `mise exec -- pnpm typecheck` 0 件 error
- [ ] `mise exec -- pnpm build` 成功

## 次Phase

Phase 6（spec / fixture 実装）
