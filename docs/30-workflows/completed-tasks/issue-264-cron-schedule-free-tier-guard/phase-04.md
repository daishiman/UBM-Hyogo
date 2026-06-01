# Phase 4: テスト設計

| 項目 | 値 |
| --- | --- |
| 対象 | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts`（新規・本サイクルで実装済み） |
| テストランナー | vitest（apps/api 既存設定を流用。新規依存追加なし） |
| 環境 | `// @vitest-environment node`（fs 読込のみ・D1 / DOM 不要） |
| 種別 | 静的アサーション（回帰ガード）。runtime / network なし |
| 不変条件 | CLAUDE.md #8（`*.spec.ts` のみ。`*.test.ts` 禁止） |

## 設計方針

`apps/api/wrangler.toml` を `node:fs` で読み、**依存追加なしの regex** で 3 セクションの
`crons` 配列を抽出し、Cloudflare free-plan の制約（env あたり cron ≤3 本 / legacy `0 * * * *` 不在 /
3 セクション parity）を固定するガードを置く。TOML パーサライブラリは導入しない（free / minimal 制約）。

`wrangler.toml` の現行値（`L14 / L91 / L173`）は既に CANONICAL と一致しているため、**値の変更は不要**。
本テストはその状態を固定（ピン留め）し、4 本目追加・legacy 再混入を CI で検知する役割のみを負う。

```ts
const CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"];
const FREE_PLAN_CRON_LIMIT = 3;
const LEGACY_HOURLY = "0 * * * *";
const SECTIONS = ["triggers", "env.staging.triggers", "env.production.triggers"];
```

## 純粋関数 `extractCrons` の契約（テスト対象 SUT の一部）

| 項目 | 内容 |
| --- | --- |
| シグネチャ | `extractCrons(tomlText: string, sectionHeader: string): string[]` |
| 仕様 | `[sectionHeader]` の見出し行から、次の `[` 始まり行（or EOF）までを 1 セクションとして切り出し、その範囲内の `crons = [ "...", "..." ]` 配列のクォート内文字列を**順序保持**で返す |
| section 不在 | `[]` を返す（throw しない） |
| 純粋性 | 入力文字列のみに依存。fs 読込・副作用は持たない（fs はテスト本体側で実施） |

## テストケース表

| TC | 目的 | Arrange | Act | Assert（期待値） |
| --- | --- | --- | --- | --- |
| TC-1 | `[triggers].crons` が canonical | wrangler.toml 全文を fs で読込 | `extractCrons(toml, "triggers")` | `deepEqual(["0 18 * * *", "*/15 * * * *", "*/5 * * * *"])` |
| TC-2 | `[env.staging.triggers].crons` が canonical | 同上 | `extractCrons(toml, "env.staging.triggers")` | `deepEqual(CANONICAL)` |
| TC-3 | `[env.production.triggers].crons` が canonical | 同上 | `extractCrons(toml, "env.production.triggers")` | `deepEqual(CANONICAL)` |
| TC-4 | 各セクション length ≤3（free-plan account cron 上限） | 同上 | 3 セクションを抽出 | 各 `crons.length` が `≤ FREE_PLAN_CRON_LIMIT(3)` |
| TC-5 | legacy `"0 * * * *"` をどのセクションも含まない | 同上 | 3 セクションを抽出 | 各 `crons` に `LEGACY_HOURLY` を含まない（`.not.toContain`） |
| TC-6 | parity（3 セクション完全一致） | 同上 | 3 セクション抽出 | `top === staging === production`（top に対し各 `deepEqual`） |
| TC-7 | `extractCrons` 純粋関数単体 | インラインの TOML フィクスチャ文字列（well-formed / section 不在 / コメント・別 key 混在） | 各ケースで `extractCrons` 呼出 | well-formed→期待配列 / section 不在→`[]` / コメント行・`crons` 以外の key を誤抽出しない |

### TC-7 のサブケース詳細

| サブケース | 入力（抜粋） | 期待出力 |
| --- | --- | --- |
| 7-a well-formed | `[triggers]\ncrons = ["0 18 * * *", "*/15 * * * *"]\n` を含む | `["0 18 * * *", "*/15 * * * *"]` |
| 7-b section 不在 | `[triggers]` を含まない文字列 | `[]` |
| 7-c コメント混入 | `[triggers]\n# crons = ["x"]\ncrons = ["0 18 * * *"]\n` | `["0 18 * * *"]`（コメント側を拾わない） |
| 7-d 別 key 混入 | `[triggers]\nname = "foo"\ncrons = ["0 18 * * *"]\n` | `["0 18 * * *"]`（`name` 値を混ぜない） |
| 7-e 次 section で打切 | `[triggers]\ncrons = ["0 18 * * *"]\n[env.staging]\ncrons = ["*/5 * * * *"]\n` を `"triggers"` で抽出 | `["0 18 * * *"]`（次 section の crons を越境抽出しない） |

## describe / it スケルトン（仕様内サンプル。apps/ には書き込まない）

```ts
// @vitest-environment node
// issue-264: wrangler cron schedule を free-plan 上限 3 本に固定する回帰ガード。

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"];
const FREE_PLAN_CRON_LIMIT = 3;
const LEGACY_HOURLY = "0 * * * *";

// 本サイクルで実 path を確認（sync/ から見て 2 階層上が apps/api）
const WRANGLER_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../wrangler.toml",
);

function extractCrons(tomlText: string, sectionHeader: string): string[] {
  // Phase 5 の実装方針に従う（regex / 依存追加なし）
  return [];
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
    it("7-a: well-formed セクションを順序保持で抽出", () => {
      const src = `[triggers]\ncrons = ["0 18 * * *", "*/15 * * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *", "*/15 * * * *"]);
    });

    it("7-b: section 不在は [] を返す", () => {
      expect(extractCrons(`[other]\nx = 1\n`, "triggers")).toEqual([]);
    });

    it("7-c: コメント行の crons を誤抽出しない", () => {
      const src = `[triggers]\n# crons = ["x"]\ncrons = ["0 18 * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });

    it("7-d: 別 key の値を混ぜない", () => {
      const src = `[triggers]\nname = "foo"\ncrons = ["0 18 * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });

    it("7-e: 次 section の crons を越境抽出しない", () => {
      const src =
        `[triggers]\ncrons = ["0 18 * * *"]\n[env.staging]\ncrons = ["*/5 * * * *"]\n`;
      expect(extractCrons(src, "triggers")).toEqual(["0 18 * * *"]);
    });
  });
});
```

## DoD（Phase 4）

- TC-1..7 が表として確定し、各 TC に Arrange/Act/Assert と期待値が明記されている。
- vitest（既存設定）で実行する前提が明記され、依存追加が無い。
- `extractCrons` の契約（section 不在→`[]`・順序保持・純粋）が定義済み。
