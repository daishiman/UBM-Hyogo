# Unassigned Task Detection

## Candidates

| ID | 内容 | 優先度 |
| --- | --- | --- |
| U-FIX-CF-ACCT-01 | Cloudflare API Token のスコープ最小化監査 | HIGH |
| U-FIX-CF-ACCT-02 | staging / production Token 値分離 | MEDIUM |
| U-FIX-CF-ACCT-03 | `apps/api/wrangler.toml` vars 継承 warning 対応 | MEDIUM |
| U-FIX-CF-ACCT-04 | `apps/web/wrangler.toml` pages output warning 対応 | MEDIUM |

## Formalized

| ID | 実体 | 方針 |
| --- | --- | --- |
| U-FIX-CF-ACCT-01 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-cloudflare-api-token-scope-audit.md` | HIGH のため単独 formalize |
| U-FIX-CF-ACCT-02〜04 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md` | MEDIUM 3 件は同一 CI/CD warning cleanup として集約 |
