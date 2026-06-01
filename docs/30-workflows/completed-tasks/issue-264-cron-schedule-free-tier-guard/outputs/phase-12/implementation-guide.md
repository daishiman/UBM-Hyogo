# Phase 12 — 実装ガイド（implementation-guide）【最重要】

> 本サイクルで実装した guard test の設計・ADR・無料枠予算を記録する。
> 以下のコードフェンスは設計サンプルであり、実体は `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` として作成済み。
> free-tier 制約: **依存追加 0**（TOML パーサ等の新規 import 禁止）/ paid Cloudflare 機能なし / runtime deploy なし。

---

## (1) 変更対象ファイル表

| 種別 | パス | 内容 | 依存追加 |
| --- | --- | --- | --- |
| 新規（コード） | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` | `apps/api/wrangler.toml` を読み 3 セクションの `crons` を抽出して assert する純粋テスト | なし |
| 参照のみ（編集なし） | `apps/api/wrangler.toml` | guard test の入力。L14 / L91 / L173 の `crons` | — |
| 正本同期 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | guard test への back-link 追記 | — |

- 配置先 `apps/api/src/sync/` は `runScheduledSync` 等の既存 sync ジョブと同居するディレクトリで、cron 由来ジョブの隣に
  ガードを置く意図。新規ファイルは **`*.spec.ts` のみ**（CLAUDE.md 不変条件 #8 / lefthook `block-test-suffix`）。
- `node:fs` / `node:path` / `node:url` のみ使用（Node 標準・依存追加に当たらない）。

---

## (2) `extractCrons` シグネチャ・正規表現方針・エッジケース

```
extractCrons(tomlText: string, sectionHeader: string): string[]
```

- **目的**: TOML 全文 `tomlText` から、指定セクション見出し `sectionHeader`（例 `[triggers]` /
  `[env.staging.triggers]` / `[env.production.triggers]`）直下の `crons = [...]` 配列要素を文字列配列で返す純粋関数。
- **正規表現方針**（zero-dep / TOML パーサ不使用）:
  1. セクション境界を切り出す。`sectionHeader` の出現位置から、次の `\n[`（次セクション見出し）または文末までを
     当該セクション本文とする。`sectionHeader` 内の `[` `]` は `RegExp` メタ文字なので `escapeRegExp` でエスケープする。
  2. セクション本文内で `crons\s*=\s*\[([^\]]*)\]` にマッチさせ、`[ ... ]` の中身（capture group 1）を取り出す。
  3. 中身をカンマ分割 → 各要素を `trim` → 先頭末尾の `"` / `'` を除去（クォート除去）→ 空要素を除外。
- **エッジケース**:
  - **section 不在** → `[]` を返す（throw しない）。呼び出し側 assertion で「3 セクション存在」を別途検証する設計。
  - **クォート除去**: `"0 18 * * *"` / `'0 18 * * *'` のどちらも `0 18 * * *` に正規化。
  - **コメント除外**: 行コメント `# ...` を含み得るため、配列キャプチャ前に各行の `#` 以降を落とす
    （ただし cron 式自体に `#` は含まれないので `# ` 以降を行単位で除去すれば安全）。`crons = [...] # 注釈` の
     末尾コメントも `]` までしか拾わないため影響しない。
  - **複数行配列**: `[^\]]*` は改行を含むので `crons = [\n  "...",\n]` の複数行記法にも対応する。
  - **空配列** `crons = []` → `[]`（legacy 不在の assert はこれを許容しつつ canonical 一致 assert で fail させる）。

---

## (3) テストファイル全体スケルトン（ガイド内サンプル — apps/ に実装済み）

```ts
// apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

// --- canonical 期待値（free-plan 上限 3 本 / Forms ベース確定スケジュール） ---
const CANONICAL_CRONS = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"] as const;
const LEGACY_SHEETS_CRON = "0 * * * *"; // 手動限定・cron 非登録（混入禁止）
const SECTION_HEADERS = [
  "[triggers]",
  "[env.staging.triggers]",
  "[env.production.triggers]",
] as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractCrons(tomlText: string, sectionHeader: string): string[] {
  const headerIdx = tomlText.indexOf(sectionHeader);
  if (headerIdx === -1) return [];
  const afterHeader = tomlText.slice(headerIdx + sectionHeader.length);
  // 次セクション見出し（行頭 '[')までを当該セクション本文とする
  const nextSection = afterHeader.search(/\n\s*\[/);
  const body = nextSection === -1 ? afterHeader : afterHeader.slice(0, nextSection);
  // 行コメント除去（cron 式に '#' は出現しない）
  const noComments = body
    .split("\n")
    .map((line) => line.replace(/#.*$/, ""))
    .join("\n");
  const m = noComments.match(/crons\s*=\s*\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((e) => e.trim().replace(/^['"]|['"]$/g, ""))
    .filter((e) => e.length > 0);
}

function loadWranglerToml(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // apps/api/src/sync → apps/api/wrangler.toml
  const tomlPath = resolve(here, "../../wrangler.toml");
  return readFileSync(tomlPath, "utf8");
}

describe("wrangler cron schedule free-tier guard", () => {
  const toml = loadWranglerToml();
  const perSection = SECTION_HEADERS.map((h) => ({ h, crons: extractCrons(toml, h) }));

  // A. canonical 一致
  it.each(perSection)("$h は canonical 3-cron と一致する", ({ crons }) => {
    expect(crons).toEqual([...CANONICAL_CRONS]);
  });

  // B. ≤3 本（free-plan account cron 上限）
  it.each(perSection)("$h は cron 本数が free-plan 上限 3 以下", ({ crons }) => {
    expect(crons.length).toBeLessThanOrEqual(3);
  });

  // C. legacy Sheets cron 不在
  it.each(perSection)("$h に legacy Sheets cron が混入しない", ({ crons }) => {
    expect(crons).not.toContain(LEGACY_SHEETS_CRON);
  });

  // D. 3 セクション parity（全セクション同一スケジュール）
  it("3 セクションの crons は完全一致（parity）", () => {
    const [base, staging, production] = perSection.map((p) => p.crons);
    expect(staging).toEqual(base);
    expect(production).toEqual(base);
  });
});
```

> `extractCrons` を `export` するのは、純粋関数を単体でも `import` 検証可能にするため。
> 本サイクルでは `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` に 1 ファイル完結で実装済み。

---

## (4) 4 assertion 詳細

| ID | assertion | 目的 | fail する変更例 |
| --- | --- | --- | --- |
| A | canonical 一致（`toEqual(CANONICAL_CRONS)`） | デプロイ済み 3-cron を SSOT に固定 | cron 式の typo / 順序入替 / 値変更 |
| B | `length ≤ 3`（free-plan 上限） | 4 本目追加を即検知 | 4 本目 cron 追加 |
| C | legacy `0 * * * *` 不在 | Sheets hourly の cron 再混入を禁止 | 撤回済み Sheets cron の再登録 |
| D | 3 セクション parity | base / staging / production の drift 防止 | 1 セクションだけ別スケジュールに変更 |

- A は実質 B・C を包含するが、**fail 時の原因切り分け**のため独立 assertion として残す（A=値ずれ / B=本数超過 / C=legacy 混入 / D=セクション間 drift）。
- `it.each` で 3 セクション × A/B/C = 9 ケース ＋ D parity 1 ケース = 10 it。加えて `extractCrons` 純粋関数の単体テスト 6 ケース（クォート抽出 / section 不在 / crons キー不在 / コメント除外+bracketed header / 次セクション非読込 / 複数行配列）を実装し、**実 run 合計 = 16 it**（`vitest run` 実測一致）。

---

## (5) ADR-264-01 — デプロイ済み 3-cron を free-plan 上限として固定する

**Status**: Accepted（spec 段階・本サイクルで back-link を deployment-cloudflare.md へ追記）
**Date**: 2026-05-31
**Context（背景）**:
issue #264 は Sheets→D1 同期 cron の最適間隔を 24h staging 実測で決める計画だった。しかし同期元が
Google Forms API へ移行し、Sheets hourly cron `0 * * * *` は手動限定へ撤回された。現行のデプロイ済み cron は
3 本 `["0 18 * * *","*/15 * * * *","*/5 * * * *"]` に確定しており、これは Cloudflare **free-plan の
account あたり cron 上限 3 本**に収める統合の結果である（`deployment-cloudflare.md:85-89,269`）。
この制約を守る回帰ガードが存在せず、4 本目追加や legacy cron 再混入が deploy 失敗まで検知できない。

**Decision（決定）**:
デプロイ済み 3-cron スケジュールを canonical SSOT として固定し、`wrangler.toml` の 3 セクション
（`[triggers]` / `[env.staging.triggers]` / `[env.production.triggers]`）に対する **zero-dependency な
回帰ガードテスト**（`wrangler-cron-schedule.guard.spec.ts`）で enforce する。間隔は解析的予算（(6) 参照）で
free 枠内が確定済みのため、**24h staging 実測は行わない**。

**根拠**:
- free-plan の account cron 上限が 3 本という構造的制約は実測不要（既知の硬い上限）。
- 各 cron の頻度・外部 API・D1 write は解析的に算出でき、free 枠（Workers 100k req/日, D1 100k write/日）に対し
  桁違いの余裕がある（(6) 参照）。
- ガードを CI のテストとして常駐させれば、PR 時点で破壊を検知できる（deploy 後の障害化を防ぐ）。

**代替案と却下理由**:
| 代替案 | 却下理由 |
| --- | --- |
| TOML パーサライブラリ（`@iarna/toml` 等）を追加して厳密パース | **依存増**で free-tier 方針（zero-dep）に反する。cron 抽出は regex で十分かつ安定。 |
| 原 issue 通り 6h/1h/5min を 24h staging 実測 | **obsolete**。Sheets cron は撤回済み、間隔は free-plan 制約で確定。実測は時間と staging 枠を浪費。 |
| シェルスクリプト（CI で grep）で本数チェック | **テストで十分**かつ可読・回帰追跡しやすい。vitest 既存基盤に乗るため新規 CI 配線も不要。 |

**影響**:
- `apps/api` に spec test 1 本追加（依存追加 0）。CI test ジョブで自動実行され、cron drift を PR 時点で fail させる。
- 将来 cron を意図的に変更する場合は `CANONICAL_CRONS` 更新が必須となり、変更が必ずレビューを通る（意図しない drift を抑止）。

---

## (6) 無料枠予算表（解析的予算・24h 実測不要の理由）

| cron 式 | 頻度/日 | 駆動ジョブ | 外部 API/日 | D1 write/日（上限見積） | free 枠距離 |
| --- | --- | --- | --- | --- | --- |
| `0 18 * * *` | 1 | `runSchemaSync`(Forms batchGet) + `runRetentionPurge` + `runAlertRelayHealthcheck` | Forms ×1 | 数十（schema/retention 行） | 無視可 |
| `*/15 * * * *` | 96 | `runResponseSync`(Forms responses.list, cursor, **200 write cap**) + `runSheetsAuthHealthcheck` + `scheduledAuditCorrelation`(条件付) | Forms ≤96 | ≤ 96 × 200 = **19,200** < 100k | 余裕 ~5x |
| `*/5 * * * *` | 288 | `runTagQueueRetryTick` + `runNotificationDispatchTick`(条件付) | 0（D1-only） | tick あたり小（retry/dispatch） | 無視可 |
| ~~`0 * * * *`~~（legacy） | — | `runScheduledSync`(Sheets) — **手動限定・cron 非登録** | — | — | guard で登録禁止 |

- **Workers 起動合計** ≈ 1 + 96 + 288 = **385/日 ≪ free Workers 100,000 req/日**。
- **D1 write 合計** 上限見積 ≈ 19,200 + α < **100,000 write/日**。`*/15` の 200 write cap が支配項で、
  これ自体が cap により頭打ち（cursor 進行で実測値はさらに小さい）。
- **env あたり cron 数 = 3 = free-plan 上限**（余裕 0 本 → 4 本目混入を guard で検知する動機）。
- **24h 実測不要の理由**: 頻度は cron 式から確定、外部 API/D1 write は cap と分岐条件から上限が解析的に求まり、
  いずれも free 枠に対し桁違いの余裕がある。実測しても結論（free 枠内・3-cron 固定）は変わらないため、
  原 issue の AC-1/AC-2（24h staging 実測）を supersede する。

---

## (7) DoD チェックリスト（本サイクル）

- [x] `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を新規作成（`*.spec.ts` のみ・依存追加 0）。
- [x] `extractCrons` の section 不在 → `[]` / クォート除去 / コメント除外 / 複数行配列を満たす。
- [x] 4 assertion（A canonical / B ≤3 / C legacy 不在 / D parity）を 3 セクション分実装。
- [x] `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` が green。
- [x] `pnpm typecheck` / `pnpm lint` が green。
- [x] `wrangler.toml` の 3 セクション `crons` を**変更していない**（guard はあくまで現状固定）。
- [x] `deployment-cloudflare.md` に guard test への back-link を追記。

## (8) 実行コマンド

```bash
# guard test のみ実行
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
