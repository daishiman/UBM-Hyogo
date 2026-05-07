# Phase 1: 要件定義 / GO 判定 / 採番ルール SSOT 確定

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的
50,000 行 synthetic fixture の SSOT を確定する。具体的には: (1) `schema_diff_queue` の row 構造を 0014 migration / `apps/api/src/repository/schemaDiffQueue.ts` から再現する schema、(2) dedupe_key の決定論的採番ルール（counter ベース、PRNG 不可）、(3) 10 trials の数値 evidence schema（retry_count / cpu_ms / queue_enqueued / dlq_count / backfill_status の 5 フィールド）、(4) production への bulk INSERT を構造的に不可能にするガードポリシー、を SSOT として確定する。

## 実行タスク
1. `apps/api/src/repository/schemaDiffQueue.ts` と migrations 配下から `schema_diff_queue` の column / nullable / unique 制約を抽出し SSOT 表に転記する。
2. dedupe_key 採番式を確定する（推奨: `sha256("ubm-test-fixture-50k-" || index)` の先頭 N 文字、ただし衝突回避のため counter サフィックスを付与）。
3. evidence JSON schema を `outputs/phase-1/evidence-schema.json` に下書きとして記述する。
4. production abort ガード仕様を 2 段（環境変数チェック + 引数チェック）で確定する。
5. `[GO]` / `[NO-GO]` を判定し phase-2 着手可否を結論。

## 統合テスト連携
Phase 4 の bats シナリオで `seed-staging-50k.sh production` → exit 1 を検証。Phase 4 の vitest で dedupe_key 重複ゼロを検証。

## 参照資料
- `apps/api/src/repository/schemaDiffQueue.ts`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/gate-decision.md`
- `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-extended-fixture-50k.md`

## 成果物
- `outputs/phase-1/phase-1.md`
- `outputs/phase-1/evidence-schema.json`（draft）

## 完了条件
- row 構造 SSOT、dedupe_key 採番式、evidence JSON schema、production ガード方針が 1 つの SSOT 表として確定。
- artifacts.json.metadata に `taskType=implementation` / `visualEvidence=NON_VISUAL` が記録済。
- `[GO]` 判定が記載されている。
