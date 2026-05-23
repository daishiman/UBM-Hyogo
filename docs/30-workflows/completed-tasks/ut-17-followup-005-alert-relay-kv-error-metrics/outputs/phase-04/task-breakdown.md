# Phase 4 成果物: タスク分解表（T1〜T8）

## サマリ

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| サブタスク総数 | T1〜T8（8 件） |
| 想定総工数 | 3.5h（半営業日） |
| 主要変更ファイル | `apps/api/src/routes/internal/alert-relay.ts`, `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`, `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |

## サブタスクテーブル

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `isolateId` module-top 採番 | module load 時に `const isolateId = crypto.randomUUID()` を 1 回だけ採番 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | Phase 03 GO | 0.25h | top-level に `const isolateId = crypto.randomUUID();` が追加され、handler 内で再採番されない。`pnpm typecheck` PASS |
| T2 | `sha256Hex12` / `logKvOperationError` ヘルパ実装 | private helper を top-level に新設（外部 export しない） | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T1 完了 | 0.5h | `async function logKvOperationError(op, err, dedupeKey)` と `async function sha256Hex12(input)` が定義され、Phase 02 log-schema (`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`) を満たす JSON を `console.warn(JSON.stringify(payload))` で 1 行 emit する |
| T3 | `KV.get` try/catch + fail-open 化 | 既存 `const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey)` を `try { ... } catch (err) { await logKvOperationError('get', err, dedupeKey); seen = null }` に置換 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T2 完了 | 0.5h | `KV.get` throw 時に warn 1 回 emit され、`seen` 相当が `null` 扱いで通常 Slack 配信フローへ続行する。`pnpm typecheck` PASS |
| T4 | `KV.put` catch JSON 化 | 既存 plain object `console.warn(...)` を `await logKvOperationError('put', error, dedupeKey)` に置換。戻り値 `dedupPersisted: false` は不変 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T2 完了 | 0.25h | `KV.put` throw 時に warn 1 回 emit され、payload の `op` が `"put"`、レスポンスに `dedupPersisted: false` が乗る |
| T5 | vitest 新規 4 ケース | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH を `alert-relay.spec.ts` に追加 | 編集 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | T3 / T4 完了 | 1.0h | 4 ケース全 PASS、`afterEach(() => vi.restoreAllMocks())` が追加。`mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` PASS |
| T6 | 既存 TC-KV-05 の挙動更新 | `get` fail-open 化により、TC-KV-05（`get` throw で 500 期待）を削除し TC-KV-GET-THROW へ統合 | 編集 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | T5 と並行 | 0.25h | TC-KV-05 が削除されており、`get` throw 経路は TC-KV-GET-THROW でカバーされている |
| T7 | runbook 追記 | KV 操作エラーログの確認手順・`scripts/cf.sh tail` grep 例・しきい値・schema 表を runbook へ追加 | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T5 完了 | 0.5h | 「KV 操作エラーログの確認」セクションが追加されており、grep 例・しきい値・schema 表（field 名・型・例値）が記載されている |
| T8 | 品質ゲート | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` 全 PASS | n/a | T7 完了 | 0.25h | 3 コマンド全 PASS |

## 不変条件チェック

- D1 直接アクセスなし（本タスクは KV のみ）
- Cloudflare CLI は `bash scripts/cf.sh` 経由（runbook 例も同様）
- alert-relay 主機能（Slack 配信 retry / dedupe TTL）改変なし
- `event` 文字列は `"alert_relay_kv_op_failed"` 固定
- `isolateId` は module top で 1 回採番
- raw `dedupeKey` をログ出力しない（12 char SHA-256 hash のみ）
