# Phase 1 — Requirements

[実装区分: 実装仕様書]

## 1.1 ゴール

1. staging `/admin` を render したとき AdminSectionError ではなく **DashboardSections が 200 で表示** される。
2. `<ZoneDistribution>` がプロトタイプ準拠の 3 行 (0→1 立ち上げ / 1→10 拡大 / 10→100 組織化) を、進捗バー高さ 8px・`var(--ubm-color-bg)` 上に `info` / `accent` / `ok` で塗り分けて描画する。
3. KPI 4 種 (`totalMembers` / `publicMembers` / `untaggedMembers` / `unresolvedSchema`) と Status 分布 / RecentActions / SchemaAlertCard が引き続き **1 fetch (`GET /admin/dashboard`)** で揃う。

## 1.2 Acceptance Criteria

| ID | 検証方法 | 期待 |
|----|----------|------|
| AC-B1 | staging で admin cookie 付きの `curl -s -o /tmp/d.json -w "%{http_code}" $WEB_BASE/admin` | HTTP 200 / `admin api /admin/dashboard failed: 404` 文字列を含まない |
| AC-B2 | staging で `curl -s -H "cookie: $ADMIN_COOKIE" $API_BASE/admin/dashboard \| jq '.byZone \| length'` | `3` (key=`0to1`/`1to10`/`10to100`) |
| AC-B3 | `AdminDashboardViewZ.safeParse(response).success` | `true` (byZone は optional 拡張・既存 consumer 後方互換) |
| AC-B4 | playwright smoke で `/admin` を開き `getByRole('img', { name: /zone 別人数/ })` と `getByRole('region', { name: /KPI/ })` | いずれも visible |
| AC-B5 | プロトタイプ `pages-admin.jsx` L80-93 と DOM 比較 | 各 zone 行が `Chip(tone=zoneTone) + label + hint + count(mono) + bar(8px)` 構造に一致 |
| AC-B6 | `verify-design-tokens` CI gate | pass (HEX / `bg-[#xxx]` を `ZoneDistribution.tsx` に追加していない) |
| AC-B7 | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/shared test` / `pnpm --filter @ubm-hyogo/api test` / `pnpm --filter @ubm-hyogo/web test` | 全 green |

## 1.3 非機能要件

- **レイテンシ**: `/admin/dashboard` 集計クエリへ追加するのは既存 `aggregatePublicZones` 1 件のみ。p50 +50ms 以内に収める。
- **a11y**: `<ZoneDistribution>` は `role="img"` + `aria-label` を既存維持。追加の Chip は装飾要素として `aria-hidden`。
- **i18n**: ラベル ("立ち上げ" / "拡大" / "組織化") は web mapper で付与し、API は `key + count + label + hint + tone` を直接返す (server enum 固定で将来 i18n しやすい構造に置く)。
- **後方互換**: `AdminDashboardViewZ` の `byZone` field は optional とし、既存 fixture / 既存 vitest snapshot / `AdminDashboardView` consumer に破壊的影響を与えない。

## 1.4 入力 / 出力 / 副作用

| 種別 | 内容 |
|------|------|
| 入力 (API側) | `requireAdmin` middleware 通過後の `c.env.DB`、admin session cookie |
| 出力 (API側) | 既存 response に `byZone: ByZoneSlice[]` (length=3) を追加 |
| 入力 (UI側) | `safeServerFetch<AdminDashboardView>("/admin/dashboard")` の result |
| 出力 (UI側) | `<ZoneDistribution slices={...} />` の visible DOM |
| 副作用 | なし (read-only 集計のみ・D1 mutation なし) |
