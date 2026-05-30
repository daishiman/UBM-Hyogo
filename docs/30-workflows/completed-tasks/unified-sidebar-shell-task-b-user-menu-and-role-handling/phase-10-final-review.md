# Phase 10: 最終レビュー

## レビュー観点

| 観点 | チェック |
| --- | --- |
| role scope | `viewer` / `member` / `admin` 以外の語彙が混在していない（表示は「管理者 / 会員 / ゲスト」のみ） |
| action contract | viewer 1 / member 3 / admin 4 件の順序が `user-menu-config.spec.ts` で snapshot 化されている |
| a11y | `<details>` + `aria-haspopup` + `role=menu/menuitem` + `aria-label` が全て揃う |
| popover close | route 変更で `details.open=false` が動作する（vitest mock 経由） |
| signOut reuse | `SignOutButton` を embed、`signOut({ redirectTo:'/login' })` 不変 |
| deletion safety | 本 task では既存 component 削除を行わない。削除は Task C/D の責務 |
| visual boundary | screenshot pending を `present` と書かない |
| system sync | aiworkflow quick-reference / resource-map / task-workflow-active / artifact inventory に同一 wave で登録 |

## 4条件

| 条件 | 判定根拠 |
| --- | --- |
| 矛盾なし | role 表示語彙とコード識別子が分離されている（Phase 1 §AC-B5） |
| 漏れなし | Phase 1 AC-B1..AC-B10 が Phase 2-9 にすべて trace |
| 整合性あり | Task A の `ShellRole` 型再利用、独自 enum なし |
| 依存関係整合 | Task A 先行 → 本 task → Task C/D layout 移行の順で gate |

## 完了条件

4条件が Phase 12 compliance check で PASS。
