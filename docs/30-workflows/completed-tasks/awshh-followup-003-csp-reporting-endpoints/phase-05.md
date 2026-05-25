# Phase 5: 実装

## 変更ファイル一覧

| ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/lib/security-headers.ts` | 修正 | `CSP_REPORT_GROUP` / `CSP_REPORT_MAX_AGE_SECONDS` 定数 / `reportEndpoint` フィールド / `buildReportingEndpointsHeader` / `buildReportToHeader` / CSP report-to・report-uri / Reporting-Endpoints・Report-To ヘッダ |
| `apps/web/src/lib/env.ts` | 修正 | 既存 `NEXT_PUBLIC_SENTRY_DSN` を PublicEnvSchema に追加 |
| `apps/web/middleware.ts` | 修正 | `buildSecurityHeaderConfig` で `buildSentryCspReportUrl(env.NEXT_PUBLIC_SENTRY_DSN)` を注入 |
| `apps/web/src/lib/security-headers.spec.ts` | 修正 | TC-1〜5 追加 |
| `apps/web/src/lib/__tests__/env.spec.ts` | 修正 | getPublicEnv public subset に `NEXT_PUBLIC_SENTRY_DSN` を追加 |

## security-headers.ts diff

```diff
 export interface SecurityHeaderConfig {
   cspMode: SecurityHeaderMode;
   apiBaseUrl: string;
   authOrigin: string;
+  /** CSP 違反送信先（Sentry CSP security endpoint）。未設定なら report 系を出力しない */
+  reportEndpoint?: string;
 }

+/** Reporting-Endpoints グループ名と CSP report-to の値を一致させる正本定数 */
+const CSP_REPORT_GROUP = "csp-endpoint";
+const CSP_REPORT_MAX_AGE_SECONDS = 10886400;
+
+export const buildSentryCspReportUrl = (
+  dsn: string | undefined,
+): string | undefined => {
+  const url = new URL(dsn);
+  return `${url.protocol}//${url.host}/api/${projectId}/security/?sentry_key=${url.username}`;
+};
+
+/** Reporting-Endpoints ヘッダ値。reportEndpoint 未設定なら null */
+export const buildReportingEndpointsHeader = (
+  cfg: SecurityHeaderConfig,
+): string | null =>
+  cfg.reportEndpoint ? `${CSP_REPORT_GROUP}="${cfg.reportEndpoint}"` : null;
+
+export const buildReportToHeader = (
+  cfg: SecurityHeaderConfig,
+): string | null =>
+  cfg.reportEndpoint ? JSON.stringify({
+    group: CSP_REPORT_GROUP,
+    max_age: CSP_REPORT_MAX_AGE_SECONDS,
+    endpoints: [{ url: cfg.reportEndpoint }],
+    include_subdomains: true,
+  }) : null;
+
 export const buildCspDirective = (cfg: SecurityHeaderConfig): string =>
   [
     "default-src 'self'",
     "script-src 'self' 'unsafe-inline'",
     "style-src 'self' 'unsafe-inline'",
     "img-src 'self' data: https:",
     `connect-src 'self' ${cfg.apiBaseUrl} ${cfg.authOrigin}`,
     "font-src 'self' data:",
     "frame-ancestors 'none'",
     "base-uri 'self'",
     `form-action 'self' ${cfg.authOrigin}`,
+    ...(cfg.reportEndpoint
+      ? [`report-to ${CSP_REPORT_GROUP}`, `report-uri ${cfg.reportEndpoint}`]
+      : []),
   ].join("; ");

 export const buildSecurityHeaders = (cfg: SecurityHeaderConfig): Headers => {
   const headers = new Headers();
   const cspHeaderName =
     cfg.cspMode === "enforce"
       ? "Content-Security-Policy"
       : "Content-Security-Policy-Report-Only";

   headers.set(cspHeaderName, buildCspDirective(cfg));
+  const reportingEndpoints = buildReportingEndpointsHeader(cfg);
+  if (reportingEndpoints) {
+    headers.set("Reporting-Endpoints", reportingEndpoints);
+  }
+  const reportTo = buildReportToHeader(cfg);
+  if (reportTo) {
+    headers.set("Report-To", reportTo);
+  }
   headers.set("Permissions-Policy", PERMISSIONS_POLICY_DIRECTIVES.join(", "));
   headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
   headers.set("X-Content-Type-Options", "nosniff");
   headers.set("X-Frame-Options", "DENY");

   return headers;
 };
```

## env.ts diff

```diff
 const PublicEnvSchema = EnvSchema.pick({
   ENVIRONMENT: true,
   NEXT_PUBLIC_API_BASE_URL: true,
+  NEXT_PUBLIC_SENTRY_DSN: true,
 });
```

`getPublicEnv` の戻り型 `Pick<Env, ...>` も同フィールドを追加する。

## middleware.ts diff

```diff
 const buildSecurityHeaderConfig = (): SecurityHeaderConfig => {
   const env = getPublicEnv();
   return {
     cspMode: "report-only",
     apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
     authOrigin: "https://accounts.google.com",
+    reportEndpoint: buildSentryCspReportUrl(env.NEXT_PUBLIC_SENTRY_DSN),
   };
 };
```

## env 設計（新規 URL env なし）

`NEXT_PUBLIC_SENTRY_DSN` は既存の public/browser DSN 契約で、`https://<public_key>@<org>.ingest.sentry.io/<project>` 形式から `https://<org>.ingest.sentry.io/api/<project>/security/?sentry_key=<public_key>` を導出する。CSP 専用 URL env や `wrangler.toml` 差分は増やさない。未設定なら report 系は出力されず既存挙動を維持（AC-4）。

## 実装手順

1. security-headers.ts を上記 diff で修正
2. env.ts の PublicEnvSchema + getPublicEnv 戻り型を更新
3. middleware.ts で DSN 導出済み reportEndpoint を注入
4. security-headers.spec.ts / env.spec.ts に回帰テスト追加
5. `mise exec -- pnpm typecheck && mise exec -- pnpm lint`
6. `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers`

## 次フェーズ引き継ぎ

Phase 6 で異常系（空文字 URL / グループ名 drift）の回帰 guard を追加する。
