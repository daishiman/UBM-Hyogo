# Phase 7 出力: AC マトリクス（issue-191）

Phase 1 で確定した AC-1〜AC-6 を Phase 4 verify ケースおよび Phase 5 実装箇所と 1 対 1 でトレース。すべての AC が「検証手段」と「実装箇所」を持つ状態を確定する。

## AC × Phase 4 検証 × Phase 5 実装 トレース表

| AC | 内容 | Phase 4 検証 | Phase 5 実装箇所 |
| --- | --- | --- | --- |
| AC-1 | `schema_aliases` DDL がローカル D1 に applied | sanity S1（apply 後 list で確認）+ E2E seed | Step 1 マイグレーション + Step 2 ローカル apply |
| AC-2 | staging migration plan に反映 | runbook 上の staging apply 手順記載確認（Phase 11 manual evidence） | Step 1 ファイル + Phase 12 runbook |
| AC-3 | repository 契約テスト存在 / green | unit `schemaAliases.contract.test.ts`（lookup/insert/update/UNIQUE/findByQuestionId） | Step 3 `schemaAliases.ts` + 対応テスト |
| AC-4 | 07b が schema_questions を直接 UPDATE しない | contract（handler 後の questions row 不変検証）+ static check `lint:no-direct-stablekey-update` | Step 6 配線 + Step 8 grep script |
| AC-5 | 03a 次回 sync で unresolved 件数が事前比 1 件以上減少 | E2E `alias-resolution.e2e.test.ts` ステップ 1〜4（N → N-1） | Step 5 `resolveStableKey` + Step 7 03a 配線差替 |
| AC-6 | 移行期間中 questions.stable_key fallback を維持 | contract F1〜F4 + Phase 6 F-MIGRATION-CONFLICT | Step 4 `findStableKeyById` + Step 5 lookup 順序 |

## 異常系 AC 補完

| 失敗ケース | 対応 AC | 検証 | 実装 |
| --- | --- | --- | --- |
| F-401 / F-403 | AC-4 構造境界 | authorization テスト | 既存 admin middleware |
| F-409 | AC-3 / AC-4 | unit `insert` 重複 | DDL UNIQUE + ConflictError 正規化 |
| F-422 | AC-4 整合性 | contract validation | handler allow-list |
| F-5xx / F-PARTIAL | AC-5 sync 健全性 | E2E retry 経路 | `sync_jobs.status='failed'` 遷移 |
| F-MIGRATION-CONFLICT | AC-6 | F2 / 警告ログ | `resolveStableKey` aliases 優先 |

## 不変条件マトリクス

| 不変条件 | 関連 AC | 担保 Phase |
| --- | --- | --- |
| #1 | AC-4 / AC-6 | Phase 5 Step 6/8、Phase 6 F-422 |
| #5 | AC-1〜AC-6 全体 | Phase 5 全 Step が apps/api 配下 |
| #14 | AC-4 | Phase 5 Step 6 / Phase 6 F-401/F-403 |

## トレース欠落チェック

| AC | Phase 4 ケース有 | Phase 5 実装箇所有 | 不変条件紐付 |
| --- | --- | --- | --- |
| AC-1 | YES | YES | #5 |
| AC-2 | YES | YES | #5 |
| AC-3 | YES | YES | #5 |
| AC-4 | YES | YES | #1 / #14 |
| AC-5 | YES | YES | #5 |
| AC-6 | YES | YES | #1 |

欠落: なし。

## 次 Phase（8: DRY 化）への引き渡し

- 完全トレース表 / 異常系補完表 / 不変条件マトリクス
- open question: なし
