# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | completed |

## 目的

Phase 1 AC × Phase 4 検証 × Phase 5 実装 を 1:1 対応させ、抜け漏れがないことを matrix で固定する。

## 実行タスク

- [ ] AC × verify × 実装ファイル の matrix を `outputs/phase-07/ac-matrix.md` に作成
- [ ] 各 AC が test (Phase 4) と擬似コード (Phase 5) で必ず参照されていることを確認
- [ ] 不変条件 #5 / #7 / #11 / #13 / #15 が AC のいずれかで触れられていることを確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜7 |
| 必須 | outputs/phase-04/test-matrix.md | verify suite |
| 必須 | outputs/phase-05/main.md | 擬似コード |
| 必須 | outputs/phase-06/main.md | failure cases |

## AC マトリクス

| AC ID | AC 内容 | Phase 4 verify | Phase 5 実装位置 | 不変条件 | failure case |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 重複 INSERT が 409 + 既存 row 返却 | unit (attendance.spec.ts: duplicate)、contract (meetings.contract.spec.ts: 409)、DB constraint | Step 4 attendance POST handler の catch | #15 | F-6, F-10, F-11 |
| AC-2 | isDeleted=true は candidates 0 件 | contract (candidates.spec.ts: excludes) | Step 5 candidates resolver WHERE is_deleted=0 | #7, #15 | F-8 |
| AC-3 | 各 admin 操作 = 1 audit row | contract (audit row count assertion) | Step 3 auditHook + Step 6 既存 endpoint 注入 | #5, #11 | F-1, F-2, F-3 |
| AC-4 | payload に before/after JSON | unit (payload schema parse)、contract (payload field) | Step 3 hook の `JSON.stringify({before, after})` | #11 | (sync 系で要 partial) |
| AC-5 | DELETE attendance も audit | contract (DELETE 200 + audit row) | Step 4 attendance DELETE handler | #5, #15 | F-5 |
| AC-6 | profile 編集 endpoint 不在 | contract (404 expected on PATCH /admin/members/:id/profile) | Step 6 注入対象に profile 編集を含めない | #11 | (route 不在) |
| AC-7 | 二重防御明記 | unit + DB constraint 双方 | runbook 冒頭に明記 + Step 4 catch | #15 | F-6, F-10, F-11 |

## 不変条件カバレッジ

| 不変条件 | カバー AC | 検証手段 |
| --- | --- | --- |
| #5 admin / member / public 分離 | AC-3, AC-5 | authz test 401/403/2xx |
| #6 apps/web から D1 直接禁止 | (Wave 02c の lint で担保) | 本タスク追加なし |
| #7 論理削除 | AC-2 | candidates resolver |
| #11 profile 直接編集なし | AC-3, AC-6 | route 不在 + audit |
| #13 admin-managed | (Wave 全体方針) | meeting / attendance schema |
| #15 重複不可 + 削除済み除外 | AC-1, AC-2, AC-7 | UNIQUE + 409 + WHERE |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix から重複命名 / 共通化候補を抽出 |
| Phase 9 | 不変条件カバレッジを QA 観点に流用 |
| Phase 10 | matrix が GO の前提 |
| 下流 08a | matrix の verify 列を 08a contract test が consume |

## 多角的チェック観点

- 不変条件 **#5 / #7 / #11 / #13 / #15** がすべて AC マトリクスで触れられている（理由: spec_created の責務として漏れなし保証）
- AC-3 の audit hook が複数 endpoint にまたがるため、Phase 8 で hook の共通化を再確認
- a11y / 無料枠は Phase 9 で再評価

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC × verify × 実装 matrix | 7 | pending | outputs/phase-07/ac-matrix.md |
| 2 | 不変条件カバレッジ table | 7 | pending | #5/#6/#7/#11/#13/#15 |
| 3 | failure case 紐付け | 7 | pending | F-1〜F-13 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC matrix 本文 |
| matrix | outputs/phase-07/ac-matrix.md | 詳細 matrix |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC マトリクス全 AC × verify × 実装が埋まっている
- [ ] 不変条件カバレッジ table が記述
- [ ] failure case と AC が紐付いている

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 不変条件 #5/#7/#11/#13/#15 が必ずカバーされている
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: 共通化候補（hook / action enum / payload 形）
- ブロック条件: matrix 未完なら Phase 8 不可
