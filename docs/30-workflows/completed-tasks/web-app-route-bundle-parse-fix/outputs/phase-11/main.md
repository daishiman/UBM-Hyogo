# Phase 11 Evidence Index

## 状態

| 項目 | 値 |
| --- | --- |
| workflow | `web-app-route-bundle-parse-fix` |
| state | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| local evidence | PASS |
| staging / production runtime evidence | pending user approval (G2 / G3) |

## Local evidence

| Gate | Evidence | Result |
| --- | --- | --- |
| typecheck | `evidence/typecheck.log` | exit 0 |
| lint | `evidence/lint.log` | exit 0 |
| OpenNext build | `evidence/build.log` | exit 0; `Next.js 16.2.4 (webpack)` and `OpenNext build complete.` |
| Worker bundle virtual path grep | `evidence/grep-gate.log` | exit 1 = `[project]/` not found |
| runner versions | `evidence/runner-version.txt` | recorded |

## Runtime evidence boundary

`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`, staging smoke, staging tail, production deploy, and production smoke are Cloudflare runtime operations. They remain `PENDING_RUNTIME_EVIDENCE` until the Phase 13 G2 / G3 user gates are approved.

