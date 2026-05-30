---
実装区分: 実装仕様書
状態: spec_created
Phase: 12
作成日: 2026-05-28
task_id: unified-sidebar-shell-public-and-admin
---

# Unassigned Task Detection

## 結論

未タスク 0 件。実装分割 A-F は本 workflow 配下の正式タスクとして扱い、追加の `docs/30-workflows/unassigned-task/` 仕様書は作成しない。

## 判定

| Candidate | Decision | Reason |
| --- | --- | --- |
| A-F 実装分割 | rejected | 本 workflow 内の `tasks/task-{A..F}-*.md` に formalized |
| visual baseline | rejected | Task F と Phase 11 に formalized |
| aiworkflow sync | rejected | 今回サイクルで同期済み |
| skill feedback | rejected | 既存 skill で吸収でき、skill 本体変更不要 |

## GitHub Issue 照合（2回確認）

| 確認 | 結果 |
| --- | --- |
| 1回目 | `gh issue list --search "unified sidebar shell public admin"` で A/C/D/E/F の open Issue を確認。Task B が検索結果に出ないため追加確認対象に分類。 |
| 2回目 | `SidebarUserMenu` / `UserMenu` / local `docs/30-workflows/issues` grep で Task B の既存 Issue なしを確認し、#1022 を作成。A-F は #1015 / #1022 / #1017 / #1018 / #1016 / #1019 で揃った。 |

## 苦戦箇所・知見

- `sync_new_issues.js --dry-run` は既存 backlog の未同期仕様書を大量検出するため、今回ブランチ由来の新規未タスク判定にはそのまま使えない。対象 workflow path と GitHub title search を組み合わせてスコープを絞る必要がある。
- `unassigned-task` 0 件でも、実装分割 A-F が「残作業」に見えるため誤って二重に未タスク化しやすい。今回は `tasks/task-{A..F}-*.md` と Phase 12 implementation guide に formalized 済みとして扱う。
- Task B は `UserMenu` という一般語が GitHub search で Task A/E/C も拾うため、`SidebarUserMenu` と local issue mirror の両方で確認してから新規作成した。

## 注意

実コード実装は未タスクではなく Gate-B execution wave。commit / push / PR は Gate-C user-gated。
