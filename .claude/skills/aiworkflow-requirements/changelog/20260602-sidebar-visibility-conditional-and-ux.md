# 2026-06-02 sidebar-visibility-conditional-and-ux

`docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/` を
`implemented_local_evidence_captured / implementation / VISUAL` として同期。

- `/login` を `(public)` shell 配下から `(auth)` bare route group へ移動。
- middleware が `x-pathname` request header を注入し、admin layout の `activePath="/admin"` 固定を撤廃。
- viewer sidebar identity を「ゲスト / 未ログイン」+ ログイン CTA にし、active item / badge 視認性を補強。
- `09h-shell-and-fixtures.md` §1.2 / §1.6 を実装に同期（`(auth)` route group、admin nav 14 item、Form回答外部リンク、出席分析 route）。
- direct focused Vitest 20 files / 98 tests PASS、typecheck PASS、lint PASS、design-token gate PASS。

Pixel screenshots、staging visual baseline、commit、push、PR は user-gated。
