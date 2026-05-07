# Phase 3: 設計レビューゲート

`[実装区分: 実装仕様書]`

## 1. 4 条件評価

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| API contract 不変 | PASS | `apps/api/src/routes/admin/schema.ts` / `schemaAliasAssign.ts` を変更しない |
| 不変条件遵守 | PASS | #5（D1 直アクセス禁止）/ #11（profile mutation 追加禁止）/ #14（schema 解消画面限定）すべて維持 |
| 単一責務 | PASS | 表示分岐のみ。queue / cron / retry workflow は UT-07B-FU-01 に閉じる |
| スコープ最小性 | PASS | 修正ファイル 4（`api.ts` / `SchemaDiffPanel.tsx` / 各 test）に限定 |

## 2. 既存仕様との整合チェック

| 既存仕様 | 整合 | チェック |
| --- | --- | --- |
| UT-07B 本体（HTTP 202 contract） | OK | UI 側で 202 を retryable continuation として扱うのみ |
| UT-07B-FU-01（queue/cron 分割） | OK | enqueue 結果（`backfill.dedupeKey` / `enqueued`）は表示しないが、retryable 表示と直交 |
| 不変条件 #11 | OK | profile 本文 mutation を追加しない |
| Phase 12 unassigned-task-detection | OK | 「admin UI retry label」検出項目を本タスクで formalize |

## 3. リスクレビュー

| リスク | 対策 | Phase |
| --- | --- | --- |
| HTTP 202 を成功と扱い back-fill 未完了が見えなくなる | `isSchemaAliasRetryableContinuation` predicate で 202 / status / retryable の 3 点合致を強制 | Phase 5 |
| 文言が通常 error と類似で運用者が誤認 | label に「再試行可能」「続きから処理」を含めて明示 | Phase 2 確定済 |
| 重複送信による back-fill 競合 | 既存 `busy` state で送信中ボタン disabled、retry 時も同一フローを通す | Phase 5 |
| API client 型変更の波及 | `postSchemaAlias` の戻り値型を拡張するだけで既存 callers なし（panel のみ）を grep で確認 | Phase 5 / Phase 9 |

## 4. ゲート判定

- [ ] 4 条件評価がすべて PASS
- [ ] 既存仕様整合 OK
- [ ] リスクと対策が表で対応付け済み
- [ ] Phase 4 検証戦略へ進める

判定: **DESIGN_SPEC_READY（仕様確定 / Phase 4 へ進む）**

注意: 本 Phase は設計ゲートであり、runtime screenshot PASS を意味しない。コード変更と focused tests は本サイクルで完了済み、UI screenshot は Phase 11 deferred evidence として残す。
