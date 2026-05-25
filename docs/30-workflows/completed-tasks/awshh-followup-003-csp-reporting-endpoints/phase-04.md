# Phase 4: テスト作成

## テスト対象

`apps/web/src/lib/security-headers.spec.ts`（既存 7 ケースに追加）。

## 共通 fixture

```ts
const reportCfg: SecurityHeaderConfig = {
  cspMode: "report-only",
  apiBaseUrl: "https://api.example.com",
  authOrigin: "https://accounts.google.com",
  reportEndpoint: "https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc",
};
```

## テストケース（TC-1〜5）

| ID | 検証内容 | 期待 | 対応 AC |
| --- | --- | --- | --- |
| TC-1 | `reportEndpoint` 設定時 `Reporting-Endpoints` / `Report-To` ヘッダが存在 | `headers.get("Reporting-Endpoints")` と `headers.get("Report-To")` が truthy | AC-1 |
| TC-2 | CSP の `report-to` グループ名が `Reporting-Endpoints` / `Report-To` のグループ名と一致 | CSP に `report-to csp-endpoint`、両ヘッダの group が `csp-endpoint` | AC-2 |
| TC-3 | CSP に `report-uri <url>` 併記 | CSP に `report-uri https://o123.ingest.sentry.io/...` を含む | AC-3 |
| TC-4 | `reportEndpoint` 未設定時は report 系を出力しない | `Reporting-Endpoints` が null / CSP に `report-to`・`report-uri` を含まない | AC-4 |
| TC-5 | `buildReportingEndpointsHeader` / `buildReportToHeader` の純関数挙動 | 設定時に同一 group/url、未設定時 `null` | AC-1, AC-2 |

## 期待 assert（抜粋）

```ts
it("emits Reporting-Endpoints header when reportEndpoint is set", () => {
  const headers = buildSecurityHeaders(reportCfg);
  const re = headers.get("Reporting-Endpoints");
  expect(re).toContain('csp-endpoint="');
});

it("uses matching group name for CSP report-to and Reporting-Endpoints", () => {
  const headers = buildSecurityHeaders(reportCfg);
  const csp = headers.get("Content-Security-Policy-Report-Only")!;
  const re = headers.get("Reporting-Endpoints")!;
  expect(csp).toContain("report-to csp-endpoint");
  expect(re.startsWith("csp-endpoint=")).toBe(true);
});

it("includes legacy report-uri for backward compatibility", () => {
  const csp = buildSecurityHeaders(reportCfg).get(
    "Content-Security-Policy-Report-Only",
  )!;
  expect(csp).toContain(
    "report-uri https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc",
  );
});

it("omits report directives and header when reportEndpoint is unset", () => {
  const headers = buildSecurityHeaders(cfg); // reportEndpoint 無し
  const csp = headers.get("Content-Security-Policy-Report-Only")!;
  expect(headers.get("Reporting-Endpoints")).toBeNull();
  expect(csp).not.toContain("report-to");
  expect(csp).not.toContain("report-uri");
});
```

## 命名規則整合チェック

- テストファイル `*.spec.ts`（不変条件 #8 準拠）。
- 関数 `buildReportingEndpointsHeader` は既存 camelCase と整合。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers
```

## 次フェーズ引き継ぎ

Phase 5 で security-headers.ts / env.ts / middleware.ts  の実装 diff を確定する。
