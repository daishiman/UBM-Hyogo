# Phase 02 — 設計: guard test / extractCrons / ADR / 無料枠予算

## 1. アーキテクチャ概要（テキスト図）

```
apps/api/wrangler.toml                       (正本: 3 セクションの crons)
        │  node:fs readFileSync (test ファイルからの相対 path)
        ▼
extractCrons(tomlText, sectionHeader)         (純粋関数・regex 抽出・zero-dep)
   ├─ "[triggers]"               → top-level crons[]
   ├─ "[env.staging.triggers]"    → staging crons[]
   └─ "[env.production.triggers]" → production crons[]
        │
        ▼
assertions (a)(b)(c)(d) vs CANONICAL          (vitest, *.spec.ts)
   (a) 各セクション deepEqual CANONICAL
   (b) 各セクション length ≤ 3 (free-plan 上限)
   (c) どのセクションにも "0 * * * *" を含まない
   (d) parity: top === staging === production
```

テストは外部ネットワーク・D1・デプロイに一切触れず、ローカルの `wrangler.toml` 文字列だけを検査する。

---

## 2. `extractCrons` 純粋関数

### 2.1 シグネチャ・入出力

```ts
/**
 * wrangler.toml 文字列から指定セクションの crons 配列を抽出する純粋関数。
 * 依存追加なし(regex のみ)。section が存在しない / crons 行が無い場合は [] を返す。
 *
 * @param tomlText      wrangler.toml の全文
 * @param sectionHeader 例: "triggers" | "env.staging.triggers" | "env.production.triggers"
 *                      （角括弧は含めない。内部で `[${sectionHeader}]` を組み立てる）
 * @returns 抽出した cron 文字列の配列（クォート除去済み・出現順）
 */
export function extractCrons(tomlText: string, sectionHeader: string): string[];
```

- 入力: toml 全文 + セクション名（角括弧なし）。
- 出力: `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` のような文字列配列。

### 2.2 正規表現方針

1. **セクション範囲の切り出し**: `[${sectionHeader}]` の行頭出現位置を見つけ、そこから次の行頭 `[`（次セクション開始）または文末までを section スライスとする。
   - section header マッチは正規表現の特殊文字（`.` `[` 等）を含むため、`sectionHeader` を escape してから `^\[escapedHeader\]\s*$` を multiline で照合する。
2. **crons 行の抽出**: section スライス内から `crons\s*=\s*\[([^\]]*)\]` を 1 回マッチし、`[...]` 内の生文字列を得る。
   - 単一行 `crons = ["a", "b", "c"]` を前提（実 wrangler.toml は単一行）。複数行 array でも `[^\]]*` が改行を跨ぐよう `s`(dotAll) は不要だが、`[^\]]` は改行を含むため複数行にも対応する。
3. **要素分割とクォート除去**: `[...]` 内を `,` で分割し、各要素を `trim` → 先頭/末尾の `"` または `'` を除去 → 空要素は捨てる。

### 2.3 エッジケース

| ケース | 期待挙動 |
|--------|----------|
| section が存在しない | `[]` を返す（throw しない） |
| section はあるが `crons` 行が無い | `[]` を返す |
| `crons = []`（空配列） | `[]` を返す |
| 行コメント `# ...` が同一行末尾にある | `]` までで切るため crons 値はコメントの影響を受けない。要素分割後の各値は trim 済み |
| 別セクションの `crons` を誤検出 | section スライスを次の `[` で打ち切るため、対象セクションの値のみ抽出 |
| シングル/ダブルクォート混在 | 両方除去 |

### 2.4 単体テスト（extractCrons 自体の固定）

純粋関数の堅牢性を担保するため、in-memory な toml 文字列に対する単体テストを含める（リスク対策・phase-03 参照）:
- 3 要素配列の正常抽出
- section 不在 → `[]`
- crons 行不在 → `[]`
- クォート除去
- 次セクションへ漏れないこと（隣接 section の異なる crons で確認）

---

## 3. テストファイル構造

```ts
// apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"] as const;
const LEGACY_SHEETS_HOURLY = "0 * * * *";
const FREE_PLAN_CRON_LIMIT = 3;

const SECTIONS = ["triggers", "env.staging.triggers", "env.production.triggers"] as const;

export function extractCrons(tomlText: string, sectionHeader: string): string[] { /* §2 */ }

function loadWranglerToml(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/sync/ から apps/api/wrangler.toml への相対 path
  return readFileSync(resolve(here, "../../wrangler.toml"), "utf8");
}

describe("wrangler cron schedule free-tier guard", () => {
  // (a)(b)(c)(d) + extractCrons 単体テスト
});
```

- `import.meta.url` 起点で `resolve(here, "../../wrangler.toml")` を解決（`src/sync/` → `apps/api/`）。
- `*.spec.ts` 命名（不変条件 #8）。

### 3.1 CANONICAL 定数
```ts
const CANONICAL = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"];
```
単一定数として定義し、全 assertion がこれを参照する（NFR-4）。

### 3.2 4 assertion の詳細

| assert | 内容 | 実装方針 |
|--------|------|----------|
| (a) deepEqual | 各 section の `extractCrons(toml, s)` が CANONICAL と順序込み一致 | `SECTIONS.forEach(s => expect(extractCrons(toml, s)).toEqual([...CANONICAL]))` |
| (b) length ≤ 3 | 各 section の crons 長 ≤ free-plan 上限 | `expect(extractCrons(toml, s).length).toBeLessThanOrEqual(FREE_PLAN_CRON_LIMIT)` |
| (c) no legacy | どの section も `"0 * * * *"` を含まない | `expect(extractCrons(toml, s)).not.toContain(LEGACY_SHEETS_HOURLY)` |
| (d) parity | top === staging === production | `const all = SECTIONS.map(s => extractCrons(toml, s)); expect(all[1]).toEqual(all[0]); expect(all[2]).toEqual(all[0]);` |

(a) が成立すれば (b)(c)(d) は論理的に従属するが、**回帰時の失敗メッセージを明確化**するため独立 assertion として全て記述する（どの不変条件が壊れたか即座に判別可能にする）。

---

## 4. ADR（Architecture Decision Record）

### ADR-264-01: 3-cron schedule を free-plan 上限として固定する

**ステータス**: Accepted（本 workflow で正本化）

**背景**
- Cloudflare Workers の **free-plan は account あたり cron trigger 数に上限**があり、本プロジェクトは env(top/staging/production) ごとに 3 本に収めている（`deployment-cloudflare.md` L85-89/269）。
- 同期方式は Google Sheets→**Forms API へ完全移行**し、legacy Sheets hourly (`0 * * * *`) は手動限定に撤回した。
- 原 issue #264 が要求した「6h/1h/5min を 24h 実測して決める」は、移行により前提が消滅した（phase-01 obsolete 判定表）。

**決定**
- デプロイ済みの 3 本 `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を **free-plan 上限に収める正本スケジュール**として固定する。
- この不変条件を `wrangler-cron-schedule.guard.spec.ts` の guard test で CI 強制する。
- legacy `0 * * * *` は cron 非登録（手動限定）を guard test で恒久的に保証する。

**根拠**
- cron 起動合計 ≈ 385/日 ≪ free Workers 100k req/日（§6 予算表）。
- `*/5` は外部 API 非依存の D1-only tick で quota 競合がない。
- 3 本 = free-plan 上限のため、4 本目追加は**デプロイ失敗**を招く。これを test で fail-fast にする方が、デプロイ時に気付くより安全。

**代替案却下**
- *4 本目を追加して機能分離*: free-plan 上限超過でデプロイ不能 → 却下。
- *TOML ライブラリで厳密パース*: 依存追加は free/minimal 方針に反する → regex 抽出を採用（phase-03 参照）。
- *CI シェルスクリプトで grep*: 既存 vitest 基盤に乗る方が可搬・回帰しやすい → test を採用。

**影響**
- 今後 cron を増やす場合は、既存 3 本のいずれかへ機能を統合するか、有料 plan 移行（=「無料の範囲内」要求と矛盾）の判断が必要。guard test の更新が設計レビューのトリガになる。

---

## 5. 無料枠予算表（解析的）

| cron | 頻度/日 | 起動ジョブ | 外部 API コスト/日 | D1 write コスト/日 | free 枠 | 枠までの距離 |
|------|---------|-----------|--------------------|--------------------|---------|--------------|
| `0 18 * * *` | 1 | runSchemaSync(Forms batchGet)+runRetentionPurge+runAlertRelayHealthcheck | Forms API ×1 | 軽微 | Forms API: 実用上十分 | 余裕大 |
| `*/15 * * * *` | 96 | runResponseSync(responses.list, 200 write cap)+runSheetsAuthHealthcheck+scheduledAuditCorrelation(条件付) | Forms API ≤96 | ≤200×96 = 19,200 | D1 write 100k/日 | 19,200 / 100,000 ≈ 19% 使用（余裕 81%） |
| `*/5 * * * *` | 288 | runTagQueueRetryTick+runNotificationDispatchTick(条件付) | 0（D1-only） | 実測依存（tick 単位は小） | D1 write 100k/日 | 余裕大 |
| **cron 起動合計** | **≈385** | — | — | — | Workers 100k req/日 | 385 / 100,000 ≈ 0.4%（余裕極大） |

**env あたり cron 数 = 3 = free-plan 上限（余裕 0 本）** → このセルが本 guard の守る不変条件。

### 24h 実測が不要な理由
- 同期は Forms API への差分取得（cursor high-water）+ 200 write cap で**上限が解析的に確定**しており、実測しても worst-case を超えない設計になっている。
- cron 起動回数は cron 式から決定的に算出できる（実測不要）。
- 唯一の変動要素（response 件数）は 200 write cap で頭打ちのため、最悪値 19,200/日 < 100k/日 が保証される。
- よって「無料の範囲内」は**解析的に成立**し、staging で 24h 流す必要はない（コスト・時間の節約）。

---

## 6. 不変条件チェックリスト（設計時点）

- [x] 新規テストは `*.spec.ts`（#8）
- [x] D1 直接アクセスを増やさない（test は wrangler.toml を読むのみ・#5）
- [x] 依存追加 0（regex 抽出・NFR-1）
- [x] runtime deploy なし（NFR-2）
- [x] enum 整合（#266）に影響なし（cron 値のみ検査）
