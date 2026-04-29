# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | template_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 9 の品質保証結果を受け、Phase 11 の 2 worktree / 4 worktree smoke を実走できる状態か GO / NO-GO を判定する。

## 実行タスク

1. AC-1〜AC-11 の未達を確認する。
2. Phase 3 の MINOR / MAJOR が解消済みか確認する。
3. A-2 completed gate と Phase 13 承認 gate を再確認する。
4. Phase 11 の evidence 保存先を確定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-03.md | GO / NO-GO 基準 |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-09.md | QA 結果 |
| 必須 | .claude/skills/task-specification-creator/references/review-gate-criteria.md | レビュー gate |

## 実行手順

1. Phase 9 の検証結果を読み、未達 AC を列挙する。
2. 未達 0 件なら Phase 11 GO、1 件以上なら NO-GO とする。
3. Phase 13 はユーザー承認があるまで blocked のままとする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定、evidence 保存先、実走手順 |
| Phase 12 | レビュー結果のドキュメント反映範囲 |

## 多角的チェック観点（AIが判断）

- smoke 実走前に仕様・実装・成果物の依存が閉じているか。
- NO-GO を GO と誤判定する曖昧な条件が残っていないか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | AC 未達確認 | pending | Phase 9 後 |
| 2 | GO / NO-GO 判定 | pending | Phase 11 gate |
| 3 | Phase 13 blocked 確認 | pending | 承認必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 最終レビュー | outputs/phase-10/main.md | GO / NO-GO 判定と根拠 |

## 完了条件

- [ ] GO / NO-GO が明示されている
- [ ] 未達 AC が 0 件または戻り先付きで列挙されている
- [ ] Phase 13 が承認待ちであることが確認されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク（3 件）が completed
- [ ] 成果物が `outputs/phase-10/main.md` に配置済み

## 次Phase

- 次 Phase: 11 (手動 smoke test)
