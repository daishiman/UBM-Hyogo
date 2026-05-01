# link-checklist

## ステータス

- 状態: pending（Phase 11 smoke 未実行）
- 方針: 実 evidence は本 followup task 側に保持し、06a 親タスクには相対リンク trace のみ追記する。

## 親タスク trace 予定

| 対象 | 予定リンク | 状態 |
| --- | --- | --- |
| 06a Phase 11 evidence index | `../../06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-11/evidence/local-curl.log` | pending |
| 06a Phase 11 evidence index | `../../06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-11/evidence/staging-curl.log` | pending |
| 06a Phase 11 evidence index | `../../06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-11/evidence/staging-screenshot.png` | pending |

## 完了条件

- 親 06a 側に evidence 実体をコピーしない
- 親 06a 側には本 followup evidence への相対リンク trace を 1 箇所に集約する
- `Refs #273` を維持し、Issue #273 は reopen しない
