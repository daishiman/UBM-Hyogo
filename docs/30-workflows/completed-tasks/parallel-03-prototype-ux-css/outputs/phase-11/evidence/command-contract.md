# Phase 11 Command Contract — parallel-03-prototype-ux-css

## Existing Scripts Checked

| 目的 | 実コマンド |
| --- | --- |
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| web unit/component tests | `mise exec -- pnpm --filter @ubm-hyogo/web test` |
| web coverage | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` |
| web OpenNext build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` |
| design token gate | `mise exec -- pnpm verify:tokens` または `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` |
| Playwright visual | `PLAYWRIGHT_EVIDENCE_TASK=parallel-03-prototype-ux-css PLAYWRIGHT_BASE_URL=http://localhost:3017 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-chromium playwright/tests/visual/visual-feedback.spec.ts` |
| Playwright smoke | `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke` |

## Token Fallback

`verify:tokens` が使えない場合のみ、次の fallback を使う。

```bash
if mise exec -- pnpm verify:tokens; then
  echo "verify:tokens PASS"
else
  if rg -n 'bg-\[#|text-\[#|border-\[#|#[0-9A-Fa-f]{3,8}' apps/web/src; then
    echo "HEX or arbitrary color token found (NG)"
    exit 1
  else
    echo "fallback token grep PASS"
  fi
fi
```
