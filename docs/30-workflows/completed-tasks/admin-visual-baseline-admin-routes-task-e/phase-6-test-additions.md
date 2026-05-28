---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 6
phase_name: テスト追加
created_at: 2026-05-27
---

# Phase 6: テスト追加

[実装区分: 実装仕様書]

## 1. 追加テスト一覧

| # | ファイル | 種別 | カバー対象 |
|---|---|---|---|
| 1-12 | `apps/web/playwright/tests/visual/admin-shell/*.spec.ts` | Playwright visual | 12 routes × 4 viewport = 最大 48 撮影点 |

> visual baseline spec それ自体が test であるため、追加 unit test は発生しない。

---

## 2. unit test の要否

| 対象 | 要否 | 理由 |
|---|---|---|
| `_helpers.ts::waitAdminPageReady` | 不要 | Playwright `Page` API に薄くラップしているだけ |
| `_helpers.ts::freezeAnimations` | 不要 | `page.addStyleTag` の薄いラッパー |

---

## 3. test 命名規約

- `admin <route-slug> staging visual baseline`
- baseline file: `admin-<route-slug>-<project>-linux.png`

---

## 4. test data / fixture

- admin storageState — 既存 `staging-visual-authenticated` setup project（staging baseline では `adminLogin(context)` 直呼びを避ける）
- `mockApi(page)` — 既存。client-side GET のみに適用、mutation には触らない
- seed ID: `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` / `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID`（CI secret）。両方そろう場合のみ detail 2 spec を有効化する。

---

## 5. 期待値

- 全 baseline で `maxDiffPixelRatio: 0.02` 以内
- `fullPage: true`
- env-gated 2 spec は seed 未設定時 `skipped`
