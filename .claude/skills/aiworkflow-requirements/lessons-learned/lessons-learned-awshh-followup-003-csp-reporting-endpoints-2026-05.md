# Lessons Learned: awshh-followup-003 CSP Reporting Endpoints

## L-AWSHH-FU003-001: Sentry CSP endpoint は public DSN から導出する

新規 `NEXT_PUBLIC_SENTRY_CSP_REPORT_URL` を追加すると、DSN と CSP endpoint の二重管理で drift しやすい。既存 public/browser DSN `NEXT_PUBLIC_SENTRY_DSN` から `/api/<project>/security/?sentry_key=<public_key>` を導出すれば、設定面を増やさずに CSP report endpoint を得られる。

## L-AWSHH-FU003-002: `report-to` と report endpoint headers はグループ名 SSOT を持つ

CSP `report-to <group>`、`Reporting-Endpoints: <group>="..."`、legacy `Report-To` JSON は、別々の文字列にすると review で見落としやすい。`CSP_REPORT_GROUP` 単一定数と drift guard test で一致を構造的に保証する。

## L-AWSHH-FU003-003: legacy `report-uri` / `Report-To` は report-only 観測では併記する

`report-to` / `Reporting-Endpoints` のブラウザ実装差による取りこぼしを避けるため、同一導出 URL を `report-uri` と legacy `Report-To` にも併記する。受信先は同一 Sentry endpoint で、apps/api / D1 の受信側内製は不要。

## L-AWSHH-FU003-004: optional report endpoint は fail-soft にする

local / preview / DSN 未設定環境では report 系ヘッダを出さず既存挙動を維持する。不正 DSN も endpoint 導出失敗として扱い、middleware で response generation を止めない。

## L-AWSHH-FU003-005: placeholder consumed trace は source 実体も更新する

Phase 12 `unassigned-task-detection.md` だけで CONSUMED と書いても、source placeholder が `未実施` のままだと正本不整合になる。source 側にも `status=CONSUMED` と canonical workflow pointer を同一サイクルで付与する。
