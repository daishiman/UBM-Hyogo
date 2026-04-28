# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動 smoke） |
| 状態 | pending |

## 目的

GO / NO-GO を判定し、blocker と open question を整理する。本タスクは 03a / 02a / 02b / 01b の上流に強く依存するため、上流 AC が達成されていなければ実装着手を保留する。

## 実行タスク

1. 上流 wave AC 達成状況を表化（02a / 02b / 01b / 03a）。
2. 自タスク AC-1〜AC-10 の green / red を確認。
3. 並列タスク 03a との共通モジュール契約整合を確認。
4. blocker 一覧を整理。
5. GO / NO-GO 判定。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/ac-matrix.md | 自タスク AC |
| 必須 | docs/30-workflows/02-application-implementation/02a-parallel-member-identity-status-and-response-repository/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/02b-parallel-meeting-tag-queue-and-schema-diff-repository/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/01b-parallel-zod-view-models-and-google-forms-api-client/index.md | 上流 AC |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/phase-08.md | 共通モジュール契約 |
| 必須 | outputs/phase-09/free-tier-estimate.md | 無料枠 |

## 実行手順

### ステップ 1: 上流 AC 確認
- 02a / 02b / 01b / 03a の Phase 10 GO 状況を確認。

### ステップ 2: 自タスク AC 確認
- AC-1〜AC-10 が phase-07 で green である。

### ステップ 3: 並列契約整合
- 03a Phase 8 と 03b Phase 8 で `_shared/ledger.ts` / `_shared/sync-error.ts` の interface が一致しているか。

### ステップ 4: blocker 抽出
- 上流タスクが完了していなければ blocker として記載。

### ステップ 5: GO/NO-GO
- blocker 0 + 自 AC green + 並列契約整合 → GO

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke 実行可否 |
| Phase 13 | PR 作成可否 |
| Wave 8a | contract test の最終 green |
| Wave 8b | E2E 再回答シナリオの実行可否 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | lint rule + 正規化 |
| responseEmail | #3 | system field 区別が repository に存在 |
| 上書き禁止 | #4 | snapshot は consent のみ |
| ID 混同 | #7 | Brand 型 export 済み |
| schema 集約 | #14 | unknown は queue 経由 |
| 無料枠 | #10 | Phase 9 estimate を再確認 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 表化 | 10 | pending | 02a/02b/01b/03a |
| 2 | 自 AC 確認 | 10 | pending | AC-1〜AC-10 |
| 3 | 並列契約整合 | 10 | pending | 03a Phase 8 |
| 4 | blocker 一覧 | 10 | pending | - |
| 5 | GO/NO-GO 判定 | 10 | pending | - |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | GO/NO-GO 判定 |
| メタ | artifacts.json | phase 10 を `completed` に更新 |

## 完了条件

- [ ] 上流 AC 状況 / 自 AC 状況 / 並列契約 / blocker / 判定の 5 セクション
- [ ] GO の場合のみ Phase 11 へ進む

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] 上流 AC が表で可視化されている
- [ ] 03a との共通モジュール契約が一致
- [ ] blocker が 0 のとき GO
- [ ] artifacts.json の phase 10 が `completed`

## 次 Phase

- 次: 11（手動 smoke）
- 引き継ぎ事項: GO 判定、smoke 対象
- ブロック条件: 上流 AC 未達 → NO-GO

## GO/NO-GO 判定

### 上流 wave AC 状況

| 上流タスク | 主 AC | 状態 |
| --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | identities / responses / fields / status repository が CRUD + UNIQUE constraint を持つ / 型 brand | pending（spec_created 完了前提） |
| 02b-parallel-meeting-tag-queue-and-schema-diff-repository | `schema_diff_queue` upsert (no-op on dup) + `schema_questions` 引き | pending（spec_created 完了前提） |
| 01b-parallel-zod-view-models-and-google-forms-api-client | `googleFormsClient.listResponses(formId, { pageToken })` 戻り型 + auth | pending（spec_created 完了前提） |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | sync_jobs ledger + `_shared/ledger.ts` 契約 | pending（並列 spec_created） |

### 自タスク AC 状況

| AC | 状態 |
| --- | --- |
| AC-1〜AC-10 | Phase 7 で green |

### 並列契約整合（03a と 03b）

| 共通モジュール | 03a 想定 | 03b 想定 | 状態 |
| --- | --- | --- | --- |
| `_shared/ledger.ts` | `tryAcquire({ job_type: 'schema_sync', jobId })` | `tryAcquire({ job_type: 'response_sync', jobId })` | OK（job_type enum 共有） |
| `_shared/sync-error.ts` | `SyncError({ code, message, metrics_json })` | 同 | OK |
| `packages/shared/src/types/brand.ts` | `MemberId` / `ResponseId` / `StableKey` / `TagCode` を export | 同 import | OK |

### blocker 一覧

| # | 内容 | 解消条件 |
| --- | --- | --- |
| B-1 | 上流 02a の identities / responses / fields repository が pending | 02a Phase 10 GO |
| B-2 | 上流 02b の schema_diff_queue + schema_questions repository が pending | 02b Phase 10 GO |
| B-3 | 上流 01b の googleFormsClient.listResponses が pending | 01b Phase 10 GO |
| B-4 | 並列 03a の `_shared/ledger.ts` 設計が pending | 03a Phase 10 GO |

### 判定

- spec 単位: GO（仕様は完結、依存契約も矛盾なし）
- 実装単位: 上流 + 並列 GO 待ち（B-1 〜 B-4）
- 結論: spec 完了として GO、実装着手は上流 GO 後

## open question

- per sync write 上限 200 の根拠は「無料枠 100k / day を 96 sync で割った概算」だが、実回答が 1 sync で 200 を超えるケースは現状想定外。実運用後 1 ヶ月の monitoring で再評価。
- consent 撤回の取り扱い: 同 email で再回答時に publicConsent='declined' に変わった場合、`member_status.public_consent='declined'` 反映 + 公開ディレクトリ非表示は 04a 担当（本タスクは status 反映のみ）。
- responseEmail 変更時の運用: 既存 identity の email 変更は admin 04c の手動操作で対応（再回答では新 identity が発生）。
