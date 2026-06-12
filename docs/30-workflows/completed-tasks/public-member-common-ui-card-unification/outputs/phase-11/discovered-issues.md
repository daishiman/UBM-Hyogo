# Phase 11: 発見事項（implemented local / screenshot pending）

- task_id: `public-member-common-ui-card-unification`
- 状態: implemented_local_visual_pending。apps/web 実装は存在するが Phase 11 screenshot 検証由来の発見事項は未収集（pending）。

## 現時点で識別済みの観察点（実装時に検証する候補）

| ID | 観察点 | 種別 | 扱い |
|----|--------|------|------|
| OBS-1 | admin 画面群への共通レイアウト層適用は本サイクル外（一般ユーザー非対象） | スコープ外 | Phase 12 未タスク候補（baseline） |
| OBS-2 | globals.css 2715行の feature クラス全面整理は段階適用（Phase 8 で重複削減のみ） | リファクタ範囲 | 本サイクルは新層関連のみ。残りは Phase 12 未タスク候補 |
| OBS-3 | LegalProse → Prose 縮退時、既存 privacy/terms spec の selector 保持確認が必要 | 回帰リスク | Phase 4/6 で回帰 guard 設計済み |

> 実装後 Phase 11 実行で HIGH 問題が出た場合は `unassigned-task/` へ自動生成し、本ファイルへ追記する。
