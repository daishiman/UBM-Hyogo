# Phase 2 / cf.sh integration

## 呼び出し allowlist (read-only)

| 用途 | コマンド |
| --- | --- |
| 認証確認 | `bash scripts/cf.sh whoami` |
| Logpush 一覧 | `bash scripts/cf.sh logpush list --config <config> --env production` (未対応時は API GET 経由) |
| Worker metadata | `bash scripts/cf.sh` 経由 `GET /accounts/{id}/workers/scripts/{script}` |

## 禁止
- `secret put` / `secret delete` / `deploy` / `rollback` / `wrangler login`
- 直接 `wrangler` / `curl` / `npx wrangler` 呼び出し

## 検出方法
- script 内に `\bwrangler\b` (コメント外) が 0 件であることを Phase 9 で grep
- `\b(POST|PUT|DELETE|PATCH)\b` が curl / fetch オプション位置に出ないことを grep
