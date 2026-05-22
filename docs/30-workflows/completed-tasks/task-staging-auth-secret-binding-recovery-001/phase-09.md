# Phase 9: 品質保証

[実装区分: 実装仕様書]

## 1. チェック項目

| 観点 | 確認方法 | PASS 基準 |
|------|----------|-----------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| unit test | `pnpm --filter @ubm-hyogo/api test` | 全 PASS |
| smoke test | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | 全 PASS |
| AUTH_SECRET 値の非転記 | `git diff dev...HEAD | grep -i "auth_secret.*="` | 実値マッチ 0 件 |
| CI gate | `bash scripts/verify-pr-ready.sh` | exit 0 |
| `wrangler` 直接呼出 | `git diff dev...HEAD scripts/ | grep -v cf.sh | grep "wrangler "` | 0 件 |
| `*.test.{ts,tsx}` 新規 | `git diff dev...HEAD --name-only | grep -E "\.test\.(ts|tsx)$"` | 0 件 |

## 2. mirror parity

- 本 workflow は `.claude/skills/` 直接編集を含まない（spec 仕様書のみ） → mirror sync 不要

## 3. Phase 9 DoD

- 全 checklist が PASS
- AUTH_SECRET 値の漏洩なし
- 既存 CI gate（verify-pr-ready / verify-indexes-up-to-date / verify-gate-metadata）が green
