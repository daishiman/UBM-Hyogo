# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

GO/NO-GO 判定を出す。依存先 wave (02a / 02b / 02c / 03a / 03b) の AC が満たされているかを根拠として、Phase 11 以降に進む可否を確定する。NO-GO の場合は blocker を列挙して上流タスクに差し戻す。

## GO/NO-GO 判定

### 判定基準

- すべての AC（AC-1〜AC-11）に verify suite と runbook step が紐付いている
- すべての failure case (F-1〜F-20) が AC trace 済み
- 不変条件 #1, #4, #5, #7, #11, #12, #13, #14, #15 がすべて担保
- 上流 02a / 02b / 02c / 03a / 03b の AC が満たされている
- Phase 9 の無料枠見積もりが 5% 未満
- Phase 9 の secret hygiene checklist 全 pass
- DRY 化が AC matrix を破壊していない

### Blocker 候補

| # | blocker | 影響 | 対処 |
| --- | --- | --- | --- |
| B-1 | 02b の `tagAssignmentQueueRepo.resolve` が未実装 | tag resolve 不可 | 02b wave 完了待ち |
| B-2 | 02c の `adminMemberNotesRepo.append` が未実装 | notes / visibility request 不可 | 02c wave 完了待ち |
| B-3 | 02c の lint rule (apps/web → D1 直接禁止) が未配備 | apps/web 直接アクセス漏れリスク | 02c wave 完了待ち |
| B-4 | 03a の `schemaSyncJob.run(jobId)` が未実装 | sync schema endpoint 不可 | 03a wave 完了待ち |
| B-5 | 03b の `responseSyncJob.run(jobId)` が未実装 | sync responses endpoint 不可 | 03b wave 完了待ち |
| B-6 | 05a の admin gate helper 未公開 | 全 endpoint 認可 mock 依存 | 05a 着手前段階だが、本タスクは consumer 想定 mock を用意 |

### 判定

- 上流 5 タスクが green の場合: **GO**
- いずれか NO-GO の場合: 本タスクも NO-GO とし、Phase 11 を保留

## 依存 wave AC チェック

| 依存 task | 必要 AC | 確認方法 |
| --- | --- | --- |
| 02a-parallel-member-identity-status-and-response-repository | repository unit test pass / loadMemberProfile / loadMemberStatus | 02a artifacts.json |
| 02b-parallel-meeting-tag-queue-and-schema-diff-repository | meetings / attendance / tag_queue / schema_diff_queue 提供 / attendance UNIQUE 制約 | 02b artifacts.json |
| 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | adminUsers / adminMemberNotes / auditLog / syncJobs / lint rule | 02c artifacts.json |
| 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | schemaSyncJob 提供 / schema_diff_queue 連携 | 03a artifacts.json |
| 03b-parallel-forms-response-sync-and-current-response-resolver | responseSyncJob 提供 / current_response_id 切替 | 03b artifacts.json |
| 01b-parallel-zod-view-models-and-google-forms-api-client | AdminDashboardView 等の view model export | 01b artifacts.json |

## 残存リスク

| # | リスク | 緩和策 |
| --- | --- | --- |
| R-1 | sync trigger が Workers 30s 制限を超える | 02c の sync_jobs テーブルで queued / running / done / failed を保持、cron worker（09b）で実行 |
| R-2 | admin gate が DB 1 query 増（毎回 admin_users lookup） | 短期 KV cache（5 分 TTL）を 05a で導入検討 |
| R-3 | audit_log の容量増加 | 月次 archive 戦略を 09b で記載 |
| R-4 | schema diff resolution で alias 衝突 | 02b の UNIQUE 制約と F-18 で 409 |
| R-5 | attendance 重複 attack（DDoS 状の 409 連投） | 04c の rate limit を sync trigger 系のみ導入、attendance は admin gate で抑止 |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | 02a / 02b / 02c / 03a / 03b の artifacts.json | 依存 AC 確認 |
| 必須 | 本タスクの phase-07.md / phase-09.md | GO/NO-GO 入力 |
| 参考 | doc/02-application-implementation/_design/phase-3-review.md | 設計レビュー |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定後に手動 smoke 実施 |
| Phase 12 | GO/NO-GO 結果を documentation-changelog に記録 |
| 09a (Wave 9) | 本タスクの GO は staging deploy の前提 |

## 多角的チェック観点（不変条件マッピング）

- #5: 02c の lint rule 配備状況最終確認
- #11 / #12 / #13 / #14 / #15: 本タスク内で違反が再現していないか最終確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | GO/NO-GO 判定基準確認 | 10 | pending | main.md |
| 2 | 依存 wave AC チェック | 10 | pending | 02a / 02b / 02c / 03a / 03b |
| 3 | blocker / 残存リスク列挙 | 10 | pending | 6 件以上 |
| 4 | 判定結果記録 | 10 | pending | GO 想定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 主成果物 |
| メタ | artifacts.json | Phase 10 を completed に更新 |

## 完了条件

- [ ] GO/NO-GO 判定が記録
- [ ] blocker と残存リスクが列挙
- [ ] 依存 wave AC チェック表が完成

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 10 を completed に更新

## 次 Phase

- 次: 11 (手動 smoke)
- 引き継ぎ事項: GO の場合のみ Phase 11 開始、NO-GO の場合は blocker 解消待ち
- ブロック条件: NO-GO のまま Phase 11 を開始しない
