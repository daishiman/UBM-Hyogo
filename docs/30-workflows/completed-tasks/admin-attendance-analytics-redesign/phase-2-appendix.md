[実装区分: 実装仕様書]

# Phase 2 Appendix: 詳細設計

> 親: [phase-2.md](phase-2.md)。500行制限のため、詳細チェックリストと補助設計を分離する。

## 1. staging 404 RCA

Phase 5 冒頭で、staging の `/admin/dashboard/attendance/*` 404 を次の順で分類する。

1. Browser Network で failed URL が `/admin/dashboard/attendance/*` か別 host か確認する。
2. 別 host / undefined なら `INTERNAL_API_BASE_URL` と internal proxy 設定を確認する。
3. API Worker へ `x-internal-auth` と admin JWT 付き curl を直接打つ。
4. 200 かつ空値なら D1 seed / data 0 件、401 なら internal auth、404 なら route mount / deploy revision drift を疑う。
5. `wrangler tail` と D1 count で route 到達、active session / active member / attendance rows を確認する。
6. fixture fallback が staging で fall-through していないか `apps/web/src/lib/admin/server-fetch.ts` を確認する。

判定結果は Phase 5 output に記録し、staging 未実行なら PASS 化しない。

## 2. CSV Export

Endpoint: `GET /admin/dashboard/attendance/export?periodFrom&periodTo&zone&format=csv`。

- 認可: 既存 admin gate (`requireAdmin`) のみ。
- Response: `text/csv; charset=utf-8`、BOM、CRLF、RFC4180 quote escape。
- v1 columns: `sessionId,title,heldOn,memberId,displayName,zone,attended`。
- 生成責務: `apps/api/src/lib/csv-export.ts`。
- Client: browser download に委譲し、filters を querystring 化する。
- 大量行非同期 export は scope 外。必要なら別 workflow。

## 3. Identifier Collision Gate

主な採用名:

| Identifier | 採用理由 |
| --- | --- |
| `attendance-analytics.ts` | 既存 `attendance.ts` と分離 |
| `AttendanceOverviewExtZ` | 既存 `AttendanceOverviewZ` との互換境界を明示 |
| `AttendanceAnalyticsPage` | Next `page.tsx` から委譲する feature component |
| `fetchAttendanceAnalytics` | admin attendance 専用 server fetcher |

検査:

```bash
rg "AttendanceTrend|AttendanceAnalytics|attendance-analytics|AttendanceOverviewExt" packages/shared/src apps/api/src apps/web/src
```

## 4. IPC / Preload

本タスクは Web (Next.js) + API (Cloudflare Workers) のみ。Electron / IPC / Preload は N/A。適用対象は既存コンポーネント再利用判定のみ。

## 5. Cache Strategy

| 層 | 戦略 |
| --- | --- |
| page | `dynamic = "force-dynamic"` 維持 |
| fetch | `cache: "no-store"` 相当の fresh fetch |
| API | admin data のため private/no-store 境界 |
| client drilldown | modal local state、close で破棄 |

SWR / React Query は初回 scope では採用しない。

## 6. Accessibility

- chart は `role="img"` 相当の label と表 fallback を持つ。
- table は caption / header / button label を明示する。
- modal は dialog role、Escape close、focus restoration を持つ。
- filter は native checkbox / segmented radio semantics を使う。
- color only で意味を伝えない。

## 7. Requirement Review Summary

真の論点は「404 を消す」ではなく「Admin が出席分析業務を継続できる状態にする」こと。URL を filter SSOT、Server を fetch、Client を表示 state、Workers を HTTP、Repository を SQL に分離する。

価値は運用復帰、分析機能、CSV 連携。高コスト部品は chart、modal a11y、export、staging RCA。優先順位は RCA、Zod/DTO、API、UI、CSV/a11y/Playwright、仕様同期。

## 8. Phase 3 Handoff Checklist

- topology / responsibility boundary / state ownership が一致している。
- Zod schema と API paths が実装候補と一致している。
- existing component reuse が確認されている。
- CSV / cache / a11y / RCA が Phase 4-5 で検証可能な粒度になっている。
- identifier collision grep の実行方法が明記されている。
