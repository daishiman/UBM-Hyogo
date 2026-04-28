# Runbook Diff Plan（Step 1-D）

## 上流タスク

`task-conflict-prevention-skill-state-redesign`（Phase 1〜13 承認済）

## 同期判定

- **same-wave**: 上流タスクの Phase 12 ドキュメント更新と同一 wave で進行
- **Wave N+1**: 上流の implementation ロールアウトと本タスクの skill ledger 切替は別 wave だが、本タスクの implementation-ready は同 wave で完結
- **baseline 留置**: なし（上流改修との直接衝突なし）

## 差分追記対象

| 項目 | 同期方針 |
| ---- | -------- |
| 上流 fragment-runbook.md | 本タスクの fragment-runbook.md と命名 / regex / front matter 仕様が一致しているか確認 |
| 上流 task-conflict-prevention-skill-state-redesign の Phase 6 | A-2 完了 evidence として参照 |
| 下流 A-1 / A-3 / B-1 | 本タスク完了後に着手可。各仕様書の前提条件を `task-skill-ledger-a2-fragment 完了` に固定 |

## 実施タイミング

- 同 wave: 本タスク Phase 13 commit 時に上流の Phase 12 documentation-changelog.md へ "A-2 fragment 化 implementation-ready" を追記
- Wave N: 本レビューで `log_usage.js` 切替完了済み。上流 changelog は Phase 13 commit 時に同時更新

## 衝突回避

- 上流 fragment-runbook.md と本タスク fragment-runbook.md は **読み手視点（実装者 / レビュアー）** で住み分け
  - 上流: 全体設計の根拠
  - 本タスク: 実装者・レビュアー向け運用手順

## ステータス

- 同期実施: Phase 13 ユーザー承認後の commit 時
- 同期 evidence: `outputs/phase-12/documentation-changelog.md` に記録済
