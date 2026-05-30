---
Phase: 3
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-3-design-review.md
---

# Phase 3 — 設計レビュー (task A)

## 判定: PASS

| 観点 | 結果 | 根拠 |
|------|------|------|
| 単一責務 | PASS | shell primitive のみ。UserMenu / Drawer / Layout 統合は他タスク |
| 既存 API 不変 | PASS | API call なし。session は server wrapper 経由 |
| トークン整合 | PASS | tokens.css 5 件追加。HEX 直書きなし |
| a11y | PASS | `aria-label` / `aria-current` / `aria-expanded` 明示 |
| SSR safety | PASS | `useSidebarState` で `typeof window` ガード前提 |
| 依存ロック | PASS | 新規 npm 追加なし |

## Phase 4 移行条件

- 3 spec ファイル（`shell-config` / `useSidebarState` / `SidebarShell`）のテストケースが Phase 4 で列挙され、RED 期待になっていること
- token 追加 5 件が tokens.css に書き出しできる状態であること
