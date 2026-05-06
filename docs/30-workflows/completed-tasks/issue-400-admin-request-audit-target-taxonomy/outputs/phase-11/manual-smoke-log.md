# Phase 11 Manual Smoke Log

NON_VISUAL task のため screenshot は不要。

| 項目 | 状態 |
| --- | --- |
| api focused tests | PASS — `test-api.log`（3 files / 27 tests） |
| web focused tests | PASS — `test-web.log`（workspace script 経由 48 files / 400 tests） |
| typecheck | PASS — `typecheck-api.log` / `typecheck-web.log` |
| lint | PASS — `lint.log`（stableKey literal 既存 warning 2 件のみ） |
| coverage | PASS — `coverage-summary.log`（changed target files: `auditLog.ts` 98.46%, `audit.ts` 95.4%, `requests.ts` 85.09%, `AuditLogPanel.tsx` 100%） |
| visual evidence | N/A |

## 補足

`pnpm --filter @ubm-hyogo/api test -- <files>` は package script 側で `apps/api` 全体を対象にするため、Miniflare 並列実行の一時 port exhaustion (`EADDRNOTAVAIL`) を誘発した。Issue #400 の focused evidence は `pnpm exec vitest run --config=vitest.config.ts <3 api files>` で取得し、`test-api.log` に PASS を保存した。
