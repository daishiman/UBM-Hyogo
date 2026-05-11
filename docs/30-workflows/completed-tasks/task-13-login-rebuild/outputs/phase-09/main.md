# Phase 9 E2E smoke ログ — task-13-login-rebuild

## 追加ファイル

- `apps/web/playwright/tests/login-smoke.spec.ts`
  - 6 状態（input/sent/unregistered/rules_declined/deleted/error）について `data-testid="login-card"` の `data-state` 属性を検証
  - `gate=admin_required` で warn banner が input に出ることを検証

## 実行手順

```
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts
```

## 状態

- 本サイクルでは spec の検証としてファイル追加のみ。ローカル dev サーバ起動 + Playwright 実機 run は staging smoke wave で実行する想定。
