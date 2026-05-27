# Phase 10 — Final Review

[実装区分: 実装仕様書]

## 10.1 AC 最終確認

| AC | 検証手段 | 状態 (PR 提出前に埋める) |
|----|----------|--------------------------|
| AC-B1 | staging curl `/admin` HTTP code | ☐ 200 |
| AC-B2 | staging curl `/admin/dashboard` + jq `.byZone\|length` | ☐ 3 |
| AC-B3 | `AdminDashboardViewZ.safeParse` (T-B-02) | ☑ local success (`admin-dashboard-view-byZone.spec.ts`) |
| AC-B4 | local authenticated Playwright smoke | ☑ visible (`admin-dashboard-byzone-screenshots.spec.ts`) / staging pending |
| AC-B5 | DOM 比較 vs `pages-admin.jsx` L80-93 | ☑ local component + Playwright visible |
| AC-B6 | `verify-design-tokens` CI gate | ☑ covered by web test suite / full CI pending |
| AC-B7 | `pnpm typecheck` / `lint` / `test (shared/api/web)` | ☑ web test 1168 passed / broader gates recorded in implementation guide |

## 10.2 不変条件最終確認

- [x] 新 D1 binding を `apps/web` 配下に追加していない (`rg "DB\.prepare|env\.DB" apps/web/src` で 0 件想定)
- [x] 新 API endpoint を追加していない (`apps/api/src/routes/admin/` の新規ファイルは `_shared/byZone.ts` のみ)
- [x] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を `ZoneDistribution.tsx` に新規追加していない
- [x] `*.test.{ts,tsx}` 命名の test を追加していない (`*.spec.{ts,tsx}` / Playwright `.spec.ts` のみ)
- [x] `apps/web/src` で `process.env.*` を新規直参照していない

## 10.3 404 原因切り分け結果の記録

`outputs/phase-10/root-cause.md` を新規作成し、下記を記載:

- 確定した hypothesis (H1 / H2 / H3)
- 根拠となる wrangler tail log の抜粋 (cookie 値・token 等は伏字に置換)
- 採用した修正 (該当ファイル diff の要点)
- なぜ他 2 件は除外できたか (反証ログ)

## 10.4 プロトタイプ準拠確認

`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L70-107 と実装 DOM を side-by-side で比較し、下記を確認:

- 各 zone 行の構造: `Chip(tone) + label + hint + count(mono) + bar(8px)`
- バー高 8px / `border-radius: 4px`
- bar 背景 `var(--ubm-color-bg)` / 塗り `var(--ubm-color-${tone})`
- eyebrow `DISTRIBUTION` / h2 `UBM区画の分布`

差分があれば Phase 5 step 4 に戻して再修正。

## 10.5 Gate (Phase 11 への進行条件)

- 10.1 全 AC が green
- 10.2 不変条件チェックリスト全通
- 10.3 root-cause.md 作成済
- 10.4 DOM 比較差分 0
