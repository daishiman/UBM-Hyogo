# Phase 11: Manual Smoke Log

**[実装区分: 実装仕様書]**

## 取得済み deterministic evidence

| evidence | 取得コマンド | 出力先 |
|---|---|---|
| typecheck | `pnpm -F "@ubm-hyogo/web" typecheck` | `evidence/web-typecheck.log` |
| lint | `pnpm -F "@ubm-hyogo/web" lint` | `evidence/web-lint.log` |
| vitest | `pnpm exec vitest run apps/web/app/profile/__tests__/error.component.spec.tsx` | `evidence/vitest-profile-error.log` |
| changed files | `git diff --name-only` | `evidence/changed-files.txt` |

## Manual SR smoke（任意 / runtime_pending）

- NVDA / VoiceOver で `/profile` を表示し意図的にエラーを発生させ、focus が h1 に当たり読み上げが起きること。runtime 環境準備が必要なため本ワークフローでは `runtime_pending` として残置。

## 状態

`completed (local evidence captured)` — deterministic evidence は取得済み。Manual SR smoke は `runtime_pending`。
