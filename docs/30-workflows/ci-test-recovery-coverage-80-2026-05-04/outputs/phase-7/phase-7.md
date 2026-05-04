# Phase 7: ローカル検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

各 task の verify_commands 成功ログを集約する。

## 実行タスク

- Task A-E の canonical dir は本 workflow root 配下の `task-*` ディレクトリとする。
- 各 child workflow の `artifacts.json` が実在する Phase output path の正本である。
- root Phase は集約ハブであり、実装・テスト・CI 証跡は child workflow の Phase 11/12 へ保存する。

## 完了条件

- [ ] Task A-E の該当 Phase が完了している
- [ ] child workflow の Phase 11/12 evidence link が root に集約されている
- [ ] Phase 13 はユーザー承認まで blocked のまま維持されている
