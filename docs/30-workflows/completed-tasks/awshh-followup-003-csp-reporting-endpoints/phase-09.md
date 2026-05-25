# Phase 9: 品質保証

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers
```

## チェック項目

| 項目 | 判定方法 | 期待 |
| --- | --- | --- |
| 型整合 | `pnpm typecheck` | green（SecurityHeaderConfig.reportEndpoint optional / env schema） |
| lint | `pnpm lint`（必要なら `--fix`） | green |
| 単体テスト | TC-1〜9 | all pass |
| 後方互換 | 既存 7 ケース | 無回帰 |
| env アクセス不変条件 | `rg "process.env" apps/web/src/lib/security-headers.ts apps/web/middleware.ts` | 新規追加 0 件（getPublicEnv 経由のみ） |
| secret hygiene | `rg -nE "ghp_|cf_|CLOUDFLARE_API_TOKEN|SENTRY_DSN_WEB=" docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints` | 0 件（CSP report URL は公開値・実 DSN/secret は転記しない） |
| 不変条件 #5 | `git diff --stat -- apps/api apps/api/migrations` | 0 件 |

## secret hygiene 注意

- CSP report URL（`sentry_key` 付き）は公開値だが、実プロジェクトの DSN / secret 値を仕様書・evidence に転記しない。サンプルは `o123.ingest.sentry.io/api/456/...` のダミーを用いる。
- CSP 専用 URL env / `wrangler.toml` 差分は増やさない。既存 public/browser DSN から導出する。

## 次フェーズ引き継ぎ

Phase 10 で GO/NO-GO を判定する。
