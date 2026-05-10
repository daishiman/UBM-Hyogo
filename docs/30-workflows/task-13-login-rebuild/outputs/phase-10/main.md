# Phase 10 tokens / lint / type gate — task-13-login-rebuild

## 結果

| Gate | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | ✅ green |
| `pnpm --filter @ubm-hyogo/web lint` | ✅ green |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | ✅ 1 file / 9 tests passed |
| `grep -rE '#[0-9a-fA-F]{3,6}' apps/web/app/login` | ✅ 0 件（HEX 直書きなし） |
| `git diff -- apps/web/app/api/auth/` | ✅ 0（API surface 不変） |
| Focused Vitest | ✅ 5 files / 41 tests passed |
| Full web Vitest | ✅ 68 files / 510 tests passed, 1 skipped |
| Playwright login smoke | ✅ desktop Chromium 7/7 passed |

## 修正点

- `LoginPanel` → `LoginStatus` への `error` prop 渡しで `exactOptionalPropertyTypes` のため conditional spread に変更し型エラーを解消。
- `apps/web/package.json` に `verify-design-tokens` を追加し、仕様書上の command contract と実 script を一致させた。
