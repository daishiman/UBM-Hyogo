# Phase 8: 品質ゲート

## ゲート

| Gate | 判定 | 根拠 |
|------|------|------|
| implementation classification | PASS | `taskType=implementation`, `visualEvidence=NON_VISUAL` に正規化 |
| env contract | PASS | 既存 `NEXT_PUBLIC_API_BASE_URL` を使用。存在しない `NEXT_PUBLIC_API_ORIGIN` は撤回 |
| security contract | PASS | CSP report-only、Trusted Types enforcement 非採用、Permissions-Policy に `browsing-topics` なし |
| dependency boundary | PASS | `apps/web` middleware + lib に限定。API/D1 変更なし |
| user gate | PASS | staging/production verification、commit、push、PR は user approval required |
| local verification | PASS | typecheck / lint / unit / Playwright smoke / env付き build を確認 |
