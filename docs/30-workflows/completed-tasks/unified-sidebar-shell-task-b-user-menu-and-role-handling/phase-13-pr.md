# Phase 13: commit / PR

## 状態

`pending_user_approval`。commit、push、PR 作成、CI visual baseline 更新、staging deploy はユーザー明示承認後のみ実行する。

## PR boundary

- 本 workflow は `implementation_verified / implementation / VISUAL` として扱う。
- 親 workflow `unified-sidebar-shell-public-and-admin` の sub-task B に該当する旨を PR 本文に明記する。
- apps/web 実装、focused Vitest、grep gate、local Chromium screenshots は present として主張できる。
- staging runtime visual / commit / push / PR / branch protection PUT は user-gated とする。

## PR 本文に含める項目

1. Summary（task-B 単独 PR とするか親 PR に同梱するかの判断）
2. Test plan: typecheck / lint / focused vitest 2 spec / 手動 popover 開閉 / grep gate
3. Phase 11 evidence のうち `present` 化されたものの path 列挙
4. 親 workflow との依存関係（Task A 先行必須、Task C/D unblock）

## 完了条件

ユーザー承認後、commit / push / PR / remote CI evidence を記録し、`outputs/phase-13/pr-url.txt` 等に PR URL を保存する。
