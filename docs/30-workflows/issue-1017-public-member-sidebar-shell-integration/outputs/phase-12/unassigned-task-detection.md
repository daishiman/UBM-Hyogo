---
Phase: 12
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

# 未割当タスク検出（issue-1017）

結論を先に: **新規未割当タスク = 0 件。**

## ソース別確認表

| ソース | 確認内容 | 検出件数 | 備考 |
|--------|----------|----------|------|
| 元仕様書スコープ外 | #1017 受け入れ条件 4 件以外で新規に発生した作業 | 0 | admin layout は Task D #1018、visual CI は Task F #1019 に既分離 |
| Phase 3 MINOR | 設計レビューで挙がった軽微指摘 | 0 | role 判定の SidebarShellServer 集約は #1028 で完了 |
| Phase 10 MINOR | 最終レビューで挙がった軽微指摘 | 0 | 未解決の MINOR なし |
| Phase 11 発見 | 手動テスト/回帰で見つかった課題 | 0 | 受け入れ条件 4 件すべて PASS。staging screenshot は Task F #1019 の予定作業（新規ではない） |
| TODO / FIXME | landed 実装内のコメント | 0 | verify_existing 対象（#1028）に新規 TODO/FIXME なし |
| describe.skip | スキップされたテスト | 0 | apps/web 全体 1 skipped は本タスク無関係の既存 skip |

## current / baseline 分離

| 区分 | 内容 |
|------|------|
| baseline | #1017 受け入れ条件 4 件 = すべて #1028 で landed 済み・PASS |
| current（本 wave 発生分） | なし。本 wave は Phase 12 ドキュメント成果物の作成のみで、コード変更を伴わない |

## 関連タスク差分確認

| 関連タスク | issue | 状態 | 重複起票判断 |
|-----------|-------|------|------|
| Task D: admin layout SidebarShell 統合 | #1018 | CLOSED | 既起票・完了済み。重複起票しない |
| Task F: visual baseline CI 化（staging screenshot 取得） | #1019 | CLOSED | 既起票・完了済み。本タスクの staging visual はここでカバー。重複起票しない |

本タスクから派生する新規 follow-up は存在しない（残作業は #1018 / #1019 に既収容）。
したがって `unassigned-task-specs/` への新規仕様書生成は **0 件**。
