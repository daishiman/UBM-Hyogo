# Phase 10: 最終レビュー / DoD G-01〜G-12

| ID | 項目 | 判定 | 根拠 |
|----|------|------|------|
| G-01 | 既存 API endpoint 範囲のみ利用 | ✅ | 新規 endpoint なし。`apps/api/src/routes/` 既存 surface（`/admin/dashboard` `/admin/members`）のみ消費 |
| G-02 | OKLch tokens のみ（HEX 直書き禁止） | ✅ | `grep` 0 件。全 component で `var(--ubm-color-*)` 参照 |
| G-03 | D1 直接アクセス禁止 | ✅ | `apps/web` から `D1Database` import なし（既存 boundary lint で担保） |
| G-04 | shared schema 不変（FB-W0-01） | ✅ | `packages/shared` 無変更。`byZone` / `byStatus` は web local UI mapper (`admin-dashboard-ui.ts`) で吸収 |
| G-05 | Server / Client 境界明示 | ✅ | page = Server Component (await getSession + fetch)、interactive = `"use client"` (`MembersClientShell` / `BulkActionBar` / `MemberDrawer` 等) |
| G-06 | URL state sync (q/zone/filter/sort/page) | ✅ | `MembersClientShell` で `useSearchParams` + `router.replace` + `useTransition` |
| G-07 | TDD red→green | ✅ | Phase 4 で 5 file の RED → Phase 5 実装で全 case GREEN |
| G-08 | a11y role / aria 配置 | ✅ | `role="status"` / `role="img"` / `aria-label` / `aria-live="polite"` を網羅。Phase 6 で `jest-axe` 自動検査 5 件 PASS |
| G-09 | キーボード導線 | ✅ | 全 interactive は `<button>` / `<input>` / `<a>` の native semantics で focusable |
| G-10 | エラー / 空 / 中間状態の placeholder | ✅ | `MembersTable` empty / `Zone/Status Distribution` empty / `KpiCard` zero / `BulkActionBar` busy / `SchemaAlertCard` 0=非表示 |
| G-11 | 型 / lint / build green | ✅ | Phase 9 全 gate pass |
| G-12 | task-09/task-10 primitives 整合 | ✅ | `ui-card` / `--ubm-radius-*` / `--ubm-color-*` のみ使用。新 primitive 追加なし |

## 総合判定
**GO** — 12/12 充足。旧 `MembersClient` / `MemberDrawer` は現 tree に存在せず、新 `features/admin/components/_members/*` が正本。
