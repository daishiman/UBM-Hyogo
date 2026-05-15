# Phase 3 成果物 — 設計レビュー

## Simpler Alternative 検討

| 案 | 評価 | 結論 |
|----|------|------|
| ToastProvider を `(admin)` layout に閉じる | 公開/ログイン画面の `useToast` が throw する。step-01 で共有不能 | 採用せず |
| `useAdminMutation` を step-01 で同時新設 | parallel-08 が serial-05 を blocking する循環依存 | 採用せず |
| 本仕様 (root wrap + skeleton hook + barrel) | 最小差分・後続を unblock・既存契約破壊なし | **採用** |

## Phase 4 開始条件

- Phase 1 AC 確定済
- Phase 2 topology / Validation Matrix 確定済
- 既存 Toast / middleware / error.tsx に破壊変更がないことを確認

## Phase 13 blocked 条件 (PR 提出を止める条件)

- Phase 6 のいずれかが fail
- coverage <80%
- `verify-design-tokens` / `*.test.{ts,tsx}` lefthook gate に違反
- 新規 API endpoint / D1 schema 変更が紛れている

## Approve

設計は最小スコープ・最小差分で AC を満たす。Phase 4 着手可。
