# Phase 5: 実装手順

| 項目 | 値 |
| --- | --- |
| 実装区分 | 実装仕様書（本サイクルで guard test 実装済み。コード実装は本サイクルで行う） |
| free-tier | 依存追加 0 / paid 機能なし / runtime deploy なし |

## 変更対象ファイル一覧

| 区分 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | 回帰ガードテスト（`extractCrons` 純粋関数 + 3 セクション assert） |
| 変更 | （なし） | `wrangler.toml` の cron は既に canonical（L14 / L91 / L173）。値変更しない |

> プロダクションコードの追加・変更は **0 ファイル**。`extractCrons` はテストファイル内に閉じる（公開ヘルパとして他から import されないため、`src` 配下の別モジュールに切り出さない）。

## `extractCrons` 関数仕様

### シグネチャ

```ts
function extractCrons(tomlText: string, sectionHeader: string): string[]
```

| 項目 | 内容 |
| --- | --- |
| 入力 `tomlText` | `wrangler.toml` の全文文字列（テスト本体が `readFileSync` で渡す） |
| 入力 `sectionHeader` | `[]` を除いた見出し名。例 `"triggers"` / `"env.staging.triggers"` / `"env.production.triggers"` |
| 出力 | 当該セクション内の `crons` 配列要素（クォート内文字列）を順序保持した `string[]`。section / crons 不在は `[]` |
| 副作用 | なし（純粋関数）。fs 読込はテスト本体側に分離 |

### 実装方針（regex / 依存追加なし）

1. **セクション範囲の切出し**: `^\[<escaped header>\]\s*$` にマッチする見出し行を起点に、
   次の `^\[` 始まり行（or 文字列末尾）までを 1 セクションとして slice する。
   - `sectionHeader` は `.` を含むため、regex 化前に `escapeRegExp`（`[.*+?^${}()|[\]\\]` を `\\$&` でエスケープ）を通す。
   - 行ベースで処理する（`tomlText.split(/\r?\n/)` で行配列化 → 見出し行 index を探し、その次行から
     次の `^\[` 行手前までを対象範囲にする実装が誤抽出しにくい）。
2. **crons 行の特定**: 範囲内の各行を `trimStart` し、`# / ;`（コメント）で始まる行を除外したうえで、
   `^crons\s*=` で始まる行のみを対象にする（`name = "..."` 等の別 key を弾く / TC-7d）。
   コメント除外で TC-7c を満たす。
3. **配列要素抽出**: crons 行（複数行に跨る可能性も考慮し、`crons = [` から最初の `]` までを連結した
   サブ文字列に対し）`/"([^"]*)"/g` でクォート内文字列を全マッチし、`match[1]` を順序保持で push。
   - 各要素は `.trim()` 済みの内容（regex がクォート内のみ取るため前後空白は構造上入らないが、念のため `trim`）。
   - 空要素（`""`）は push しない（`if (value.length > 0)`）。
4. **不在時**: 見出し行が見つからない / 範囲内に `crons` 行が無い場合は `[]` を返す（throw しない / TC-7b）。

### 正規表現案（参考・本サイクルで微調整可）

```ts
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCrons(tomlText: string, sectionHeader: string): string[] {
  const lines = tomlText.split(/\r?\n/);
  const headerRe = new RegExp(`^\\[${escapeRegExp(sectionHeader)}\\]\\s*$`);

  const start = lines.findIndex((l) => headerRe.test(l.trim()));
  if (start === -1) return [];

  // 見出しの次行から、次の section 見出し手前までを範囲にする
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\[/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }

  const cronsLine = lines
    .slice(start + 1, end)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith(";"))
    .find((l) => /^crons\s*=/.test(l));

  if (!cronsLine) return [];

  const result: string[] = [];
  const quoteRe = /"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = quoteRe.exec(cronsLine)) !== null) {
    const value = m[1].trim();
    if (value.length > 0) result.push(value);
  }
  return result;
}
```

> 注: 現行 `wrangler.toml` の `crons` は 1 行記法（`crons = ["...", "...", "..."]`）。上記は単一行 crons を前提に
> シンプル化している。将来複数行記法に変えた場合は、範囲内の crons 行以降を `]` まで連結する拡張が必要（Phase 6 参照）。

## テストファイル全体スケルトン（仕様内サンプル。apps/ には書き込まない）

```ts
// @vitest-environment node
// issue-264: wrangler cron schedule を free-plan 上限 3 本に固定する回帰ガード。
// プロダクションコードは追加しない。wrangler.toml の現行 cron 値を固定するだけ。

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"];
const FREE_PLAN_CRON_LIMIT = 3;
const LEGACY_HOURLY = "0 * * * *";

const WRANGLER_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../wrangler.toml", // 本サイクルで実 path 確認（src/sync/ から apps/api/）
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCrons(tomlText: string, sectionHeader: string): string[] {
  const lines = tomlText.split(/\r?\n/);
  const headerRe = new RegExp(`^\\[${escapeRegExp(sectionHeader)}\\]\\s*$`);
  const start = lines.findIndex((l) => headerRe.test(l.trim()));
  if (start === -1) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\[/.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  const cronsLine = lines
    .slice(start + 1, end)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith(";"))
    .find((l) => /^crons\s*=/.test(l));
  if (!cronsLine) return [];
  const result: string[] = [];
  const quoteRe = /"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = quoteRe.exec(cronsLine)) !== null) {
    const value = m[1].trim();
    if (value.length > 0) result.push(value);
  }
  return result;
}

describe("issue-264 wrangler cron free-tier guard", () => {
  const toml = readFileSync(WRANGLER_PATH, "utf8");
  const top = extractCrons(toml, "triggers");
  const staging = extractCrons(toml, "env.staging.triggers");
  const production = extractCrons(toml, "env.production.triggers");

  it("TC-1: [triggers].crons は canonical", () => {
    expect(top).toEqual(CANONICAL);
  });
  it("TC-2: [env.staging.triggers].crons は canonical", () => {
    expect(staging).toEqual(CANONICAL);
  });
  it("TC-3: [env.production.triggers].crons は canonical", () => {
    expect(production).toEqual(CANONICAL);
  });
  it("TC-4: 各セクションは free-plan 上限 (3 本) を超えない", () => {
    for (const crons of [top, staging, production]) {
      expect(crons.length).toBeLessThanOrEqual(FREE_PLAN_CRON_LIMIT);
    }
  });
  it("TC-5: legacy '0 * * * *' をどのセクションも含まない", () => {
    for (const crons of [top, staging, production]) {
      expect(crons).not.toContain(LEGACY_HOURLY);
    }
  });
  it("TC-6: 3 セクションは parity（完全一致）", () => {
    expect(staging).toEqual(top);
    expect(production).toEqual(top);
  });

  describe("TC-7: extractCrons pure function", () => {
    it("7-a: well-formed を順序保持で抽出", () => {
      const src = `[triggers]\ncrons = ["0 18 * * *", "*/15 * * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *", "*/15 * * * *"]);
    });
    it("7-b: section 不在は []", () => {
      expect(extractCrons(`[other]\nx = 1\n`, "triggers")).toEqual([]);
    });
    it("7-c: コメント行を誤抽出しない", () => {
      const src = `[triggers]\n# crons = ["x"]\ncrons = ["0 18 * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });
    it("7-d: 別 key を混ぜない", () => {
      const src = `[triggers]\nname = "foo"\ncrons = ["0 18 * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });
    it("7-e: 次 section を越境しない", () => {
      const src =
        `[triggers]\ncrons = ["0 18 * * *"]\n[env.staging]\ncrons = ["*/5 * * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });
  });
});
```

## 差分方針 / 命名規約

- 既存 `apps/api/src/sync/*.contract.spec.ts`（`scheduled.contract.spec.ts` 等）と同ディレクトリに同居。
- 本ファイルは契約 (contract) ではなく構成ガードのため `*.guard.spec.ts` サフィックスを採用（既存命名と衝突しない）。
- `*.spec.ts` のみ（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止）。
- `// @vitest-environment node`（fs 読込のみ・D1 / jsdom 不要）。

## 入力 / 出力 / 副作用

| 対象 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `extractCrons` | `tomlText`, `sectionHeader` | `string[]` | なし（純粋） |
| テスト本体 | `WRANGLER_PATH` の fs 読込 | assert 結果 | fs read（read-only） |

## エラーハンドリング

- `wrangler.toml` の読込に失敗した場合（path 誤り・ファイル不在）、`readFileSync` が throw し
  **テストが fail する**。これは「ガード対象の設定ファイルが存在しない＝異常」を検知する意図通りの挙動。
  try/catch で握り潰さない。
- `extractCrons` は section / crons 不在で `[]` を返す（throw しない）。その結果として
  TC-1..3 の `deepEqual(CANONICAL)` が fail し、設定欠落を assert で顕在化する。

## DoD（Phase 5）

- 変更対象ファイル一覧（新規 1 / 変更 0）が確定。
- `extractCrons` の完全シグネチャ・実装方針・正規表現案・純粋性が明記。
- テストファイル全体スケルトンを提示（apps/ には書き込まない）。
- 命名規約（`*.guard.spec.ts` / `node` env）とエラーハンドリング方針が明記。
