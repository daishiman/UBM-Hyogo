# Phase 11 — Evidence Inventory

参照: `../../phase-11-evidence-inventory.md`

## 変更 diff

```
 apps/web/app/(admin)/layout.tsx  | 27 ++++++++++++++++++++-------
 apps/web/app/(member)/layout.tsx | 17 ++++++++++++++---
 apps/web/app/(public)/layout.tsx | 16 +++++++++-------
```

## 追加 spec

- `apps/web/app/(public)/layout.spec.tsx` — 3 tests
- `apps/web/app/(member)/layout.spec.tsx` — 3 tests
- `apps/web/app/(admin)/layout.spec.tsx` — 4 tests (未認証 / non-admin / authorized / axe)

## 実行ログ要約

| gate | 結果 |
|------|------|
| web regression including 3 layout spec | `97 passed / 1 skipped`, `686 passed / 1 skipped` in `layout-specs.log` and `admin-layout-spec.log` |
| `pnpm typecheck` | exit 0 (6 workspaces), see `typecheck.log` |
| `pnpm lint` | exit 0 (lint-boundaries / dep-cruiser / stablekey / eslint), see `lint.log` |
| `pnpm --filter @ubm-hyogo/web build` | exit 0, see `web-build.log` |
| `pnpm verify:tokens` | ✓ 88 tracked, see `verify-design-tokens.log` |
| HEX 直書きスキャン | no matches, see `hex-scan.log` |
| DOM scrape public | `/members` contains `data-theme="warm"` / `data-route-group="public"` / `data-shell` / `data-route`, see `dom-scrape-public.txt` |
| DOM scrape admin (EV-12) | `/admin` contains `data-theme="cool"` / `data-route-group="admin"` / `data-shell="sidebar"` / `data-shell="topbar"` / `main[data-route="admin"]`, see `dom-scrape-admin.txt`（`parallel-03-followup-002-admin-runtime-evidence` で admin session fixture + mock API 経由 Playwright scrape として取得） |

## 視覚的検証 (VISUAL)

本 sub-workflow は AppShell の DOM 契約（`data-theme` / `data-shell` / `data-route`）を機械化する責務に閉じる。VISUAL gate の最低証跡として、`/members` の public AppShell を local dev server で撮影した。

| artifact | status |
| --- | --- |
| `screenshots/screenshot-plan.json` | present |
| `screenshots/phase11-capture-metadata.json` | present |
| `screenshot-coverage.md` | present |
| `screenshots/public-shell.png` | captured (1280x800 PNG, `/members`) |

Admin runtime DOM scrape (EV-12, `dom-scrape-admin.txt`) は後続 `parallel-03-followup-002-admin-runtime-evidence`（Phase 12 完了済み・spec は `docs/30-workflows/completed-tasks/parallel-03-followup-002-admin-runtime-evidence/` へ移動済み）で admin session fixture + mock API 経由 Playwright scrape として取得済み（text evidence。`dom-scrape-admin.txt` 本体は本親 workflow の `outputs/phase-11/` に存置）。一方 admin / member の **full chrome screenshot** はここでは claim しない。Admin full chrome は authenticated admin session fixture を要し、member は `(member)` 配下に子 route がない（`/login` / `/profile` は root route のまま）。これら screenshot capture は serial-07 integration evidence に委譲し、hidden PASS は置かない。

## DoD トレース

- DoD-01 build: `web-build.log` exit 0
- DoD-02/03: layout spec で wrapper / chrome の data-* 全 hit を assert 済
- DoD-05: Admin layout の `!session` / `!isAdmin` / authorized の 3 分岐 spec green
- DoD-06: primitive 5 ファイル無改変（diff stat に primitive なし）
- DoD-07: layout spec 3 本 green + axe critical 0
- DoD-08: typecheck / lint / verify:tokens exit 0
- DoD-09: HEX 直書き 0
- DoD-10: layout に D1 binding 参照なし
