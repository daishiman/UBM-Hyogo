# Phase 6: テスト実装結果

## 実装済みテスト

| ファイル | 内容 |
|------|------|
| `apps/web/src/lib/security-headers.spec.ts` | CSP mode、connect-src、Trusted Types 非採用、Permissions-Policy、既存 header merge、hardening header |
| `apps/web/playwright/tests/security-headers.spec.ts` | `/`、`/login`、`/admin` redirect の HTTP response header smoke |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers
```

## 結果

実行中に既存 `apps/web` test suite も同時に走る runner で確認。最終結果は Phase 11 に集約する。
