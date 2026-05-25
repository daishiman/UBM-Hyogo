# Phase 2: 設計

## 受信先確定

| 項目 | 値 |
| --- | --- |
| 受信先 | Sentry CSP security endpoint |
| URL 形式 | `https://<org>.ingest.sentry.io/api/<project>/security/?sentry_key=<public_key>` |
| 注入経路 | 既存公開 env `NEXT_PUBLIC_SENTRY_DSN` から CSP security endpoint URL を導出 |
| apps/api 変更 | なし（不変条件 #5 維持） |

> Sentry public key は DSN 内に含まれる公開値であり secret ではない。新しい CSP 専用 URL env は増やさず、既存 public/browser DSN を再利用する。

## canonical 定数（グループ名一致の正本）

```ts
// security-headers.ts
const CSP_REPORT_GROUP = "csp-endpoint";
const CSP_REPORT_MAX_AGE_SECONDS = 10886400;
```

`Reporting-Endpoints` / `Report-To` のグループ名と CSP `report-to` の値を**同一定数**から導出することで AC-2 のグループ名一致を構造的に保証する。

## 関数シグネチャ（変更/新規）

```ts
export interface SecurityHeaderConfig {
  cspMode: SecurityHeaderMode;
  apiBaseUrl: string;
  authOrigin: string;
  reportEndpoint?: string; // CSP 違反送信先（Sentry）。未設定なら report 系を出力しない
}

export const buildSentryCspReportUrl = (
  dsn: string | undefined,
): string | undefined => {
  // https://<public_key>@<org>.ingest.sentry.io/<project>
  // -> https://<org>.ingest.sentry.io/api/<project>/security/?sentry_key=<public_key>
};

// 新規: Reporting-Endpoints ヘッダ値。未設定時 null（ヘッダを set しない判定に使う）
export const buildReportingEndpointsHeader = (
  cfg: SecurityHeaderConfig,
): string | null =>
  cfg.reportEndpoint ? `${CSP_REPORT_GROUP}="${cfg.reportEndpoint}"` : null;

// 新規: legacy Report-To JSON。Reporting-Endpoints 未対応 UA / Sentry 推奨互換用
export const buildReportToHeader = (
  cfg: SecurityHeaderConfig,
): string | null =>
  cfg.reportEndpoint ? JSON.stringify({
    group: CSP_REPORT_GROUP,
    max_age: CSP_REPORT_MAX_AGE_SECONDS,
    endpoints: [{ url: cfg.reportEndpoint }],
    include_subdomains: true,
  }) : null;
```

## buildCspDirective 拡張

`reportEndpoint` がある場合のみ末尾に 2 ディレクティブを append:

```ts
...(cfg.reportEndpoint
  ? [`report-to ${CSP_REPORT_GROUP}`, `report-uri ${cfg.reportEndpoint}`]
  : []),
```

## buildSecurityHeaders 拡張

```ts
const reportingEndpoints = buildReportingEndpointsHeader(cfg);
if (reportingEndpoints) {
  headers.set("Reporting-Endpoints", reportingEndpoints);
}
const reportTo = buildReportToHeader(cfg);
if (reportTo) {
  headers.set("Report-To", reportTo);
}
```

## env 注入経路（env アクセス不変条件遵守）

```ts
// PublicEnvSchema(pick) にも追加 → getPublicEnv() で参照可能にする
const PublicEnvSchema = EnvSchema.pick({
  ENVIRONMENT: true,
  NEXT_PUBLIC_API_BASE_URL: true,
  NEXT_PUBLIC_SENTRY_DSN: true,
});
```

```ts
// middleware.ts buildSecurityHeaderConfig
const env = getPublicEnv();
return {
  cspMode: "report-only",
  apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  authOrigin: "https://accounts.google.com",
  reportEndpoint: buildSentryCspReportUrl(env.NEXT_PUBLIC_SENTRY_DSN),
};
```

## 因果ループ

- バランスループ: report 出力 → Sentry に違反集約 → 誤検知/許可漏れ把握 → enforce 安全切替 → 違反減。
- 強化ループ（負の防止）: `reportEndpoint` 未設定でも既存挙動を壊さない（後方互換 AC-4）ことで、env 未投入環境（local）での回帰を防ぐ。

## 状態所有権

- ヘッダ生成ロジック: `security-headers.ts`（純関数。副作用は response.headers への set のみ）。
- 受信・保存・retention: Sentry（apps 側は所有しない）。

## 次フェーズ引き継ぎ

Phase 3 で内製 vs SaaS と report-to/report-uri 併記の設計判断をレビューする。
