---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 6
phase_name: テスト追加
created_at: 2026-05-29
---

# Phase 6: テスト追加

[実装区分: 実装仕様書]

## 1. 追加テスト一覧

| # | ファイル | 種別 | カバー対象 | 件数 |
|---|---------|------|-----------|------|
| 1 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-smoke.spec.ts` | Playwright smoke | S1〜S6（3 role × 3 viewport の shell 挙動） | 6 test（`sidebar-shell-smoke` project） |
| 2 | `apps/web/playwright/tests/sidebar-shell/sidebar-shell-visual.spec.ts` | Playwright visual | V1〜V7（viewport project × role の 7 screenshot） | 実 run 7 screenshot（desktop 3 / tablet 2 / mobile 2） |

> smoke spec / visual spec それ自体が test であるため、追加の vitest unit test は発生しない。

### 追加 unit test の要否表

| 対象 | 要否 | 理由 |
|------|------|------|
| smoke spec（S1〜S6） | 不要 | spec 自体が E2E test |
| visual spec（V1〜V7） | 不要 | spec 自体が visual regression test |
| `_helpers.ts` の各関数 | 不要 | §2 参照 |

---

## 2. `_helpers.ts` の unit test 要否

| 関数 | 要否 | 理由 |
|------|------|------|
| `waitShellReady` | 不要 | `page.locator(...).waitFor(...)` の薄いラッパー。Playwright Page API に委譲するのみで分岐ロジックを持たない |
| `freezeAnimations` | 不要 | `page.addStyleTag(...)` の薄いラッパー |
| `openDrawer` | 不要 | `locator.click()` + `waitFor` の薄い合成。実挙動は smoke S4/S6 と visual V7 が E2E で検証する |
| `toggleCollapse` | 不要 | `locator.click()` の薄いラッパー。実挙動は smoke S5 が E2E で検証する |

いずれも Playwright `Page` 依存の thin wrapper であり、vitest（jsdom）では Page を再現できず、
実価値は E2E spec 経由の検証に内包される。

---

## 3. test 命名規約 + baseline file 命名

### test 名

- smoke: `<role> <挙動の英語要約>`（例: `viewer sees public-only sidebar at /`, `admin sees 13 nav items and 4 user actions at /admin`）
- visual: `<role> <route> <viewport> visual`（例: `viewer home desktop visual`, `admin mobile drawer visual`）

### baseline file 命名

Playwright が `snapshotPathTemplate` に従い自動生成する:

```
{arg}-sidebar-shell-visual-<viewport>-{platform}{ext}
```

例（`-linux.png` 正本）:

| screenshot arg | viewport project | baseline file |
|----------------|------------------|---------------|
| `home-1280.png` | desktop | `home-1280-sidebar-shell-visual-desktop-linux.png` |
| `profile-1280.png` | desktop | `profile-1280-sidebar-shell-visual-desktop-linux.png` |
| `admin-1280.png` | desktop | `admin-1280-sidebar-shell-visual-desktop-linux.png` |
| `home-768.png` | tablet | `home-768-sidebar-shell-visual-tablet-linux.png` |
| `admin-768.png` | tablet | `admin-768-sidebar-shell-visual-tablet-linux.png` |
| `home-375.png` | mobile | `home-375-sidebar-shell-visual-mobile-linux.png` |
| `admin-375-drawer.png` | mobile | `admin-375-drawer-sidebar-shell-visual-mobile-linux.png` |

macOS dev 撮影分（`-darwin.png`）は commit しない（不変条件 #1）。

---

## 4. test data / fixture

- 認証: 既存 `apps/web/playwright/fixtures/auth.ts` の拡張 `test`。viewer=`anonymousPage` / member=`memberPage` / admin=`adminPage`。**新規 storageState / mint 経路は作らない**（AC-8 / 不変条件 #2）。
- API mock: 同 fixture の `mockApi`（local mock サーバ `127.0.0.1:8787`）。`/me`・`/me/profile`・`/public/stats`・`/public/members`・`/admin/dashboard` 等の GET を固定応答。`mockApi` fixture は smoke/visual で page と同時に解決されるため明示注入は不要（fixture 依存グラフで自動起動）。
- mutation には触らない（read-only GET のみ）。

---

## 5. 期待値

- smoke S1〜S6: 全件 green（diff/失敗 0）。
- visual V1〜V7: 全 screenshot で `maxDiffPixelRatio: 0.02` 以内・`fullPage: true`。
- visual project の `test.skip` 対象は `skipped` として list/run に現れる（実 pass 件数は desktop 3 / tablet 2 / mobile 2 = 合計 7）。
