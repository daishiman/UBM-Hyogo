---
phase: 4
title: 入出力・データ契約 — route URL / viewport / mock seed / wait conditions
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 4 — Playwright test の入出力契約

[実装区分: 実装仕様書]

## 1. test 入力契約（共通）

| 項目 | 値 | 出典 |
|------|-----|------|
| baseURL | `http://localhost:3000`（local）/ `PLAYWRIGHT_BASE_URL` env | playwright.config.ts L72 |
| webServer | local の場合 `apps/web` を `pnpm start`（playwright.config.ts L73-L100）で起動 | 既存 |
| mock API base | `http://127.0.0.1:8787` | fixtures/auth.ts L26 / config L82 |
| browser | `chromium`（playwright project 既定） | config 既定 |
| viewport | desktop 既定（spec 内で override しない） | 既存 visual spec 揃え |
| timezone | `Asia/Tokyo`（既存 config 継承） | config 既存 |
| locale | `ja-JP`（既存 config 継承） | config 既存 |
| disable animation | `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }` を `addStyleTag` で注入 | 既存 spec パターン |

## 2. 4 spec の入出力契約

### 2.1 top.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/` |
| 認証 | 不要（公開） |
| mock seed | `mockApi.reset()` の既定状態（`buildStats()` / `buildPreview()` で公開 KPI と member preview を返す） |
| wait condition | `page.locator('main h1').waitFor({ state: 'visible' })` |
| snapshot 名 | `top.png` |
| diff threshold | `maxDiffPixelRatio: 0.02` / `fullPage: true` |

### 2.2 members-list.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/members` |
| 認証 | 不要 |
| mock seed | `mockApi.reset()` 既定（公開 members 一覧 = `buildMember()` × N） |
| wait condition | `page.locator('[data-component="member-card"]').first().waitFor({ state: 'visible' })`（serial-05 で `data-component` 属性が member-card に付く前提） |
| fallback wait | 属性未配置時は `page.locator('main h1').waitFor()` |
| snapshot 名 | `members-list.png` |

### 2.3 member-detail.spec.ts

| 項目 | 値 |
|------|-----|
| Route | `/members/${memberId}` |
| memberId | mock fixture の固定値（`buildMember()` のデフォルト `MemberId` を用い、spec 内 const で expose） |
| 認証 | 不要 |
| mock seed | `mockApi.reset()` 既定 + member detail response_fields（serial-06 で接続済） |
| wait condition | `page.locator('[data-component="member-detail"]').waitFor({ state: 'visible' })`（serial-06 で 付与） |
| fallback wait | `page.locator('main h1').waitFor()` |
| snapshot 名 | `member-detail.png` |

### 2.4 admin-dashboard.spec.ts（既存活用）

| 項目 | 値 |
|------|-----|
| Route | `/admin` |
| 認証 | `await adminLogin(context)`（fixtures/auth.ts 既存 helper） |
| mock seed | `mockApi.reset()` 既定 |
| wait condition | `page.locator('[aria-labelledby="admin-dashboard-h"]').waitFor({ state: 'visible' })` |
| snapshot 名 | `admin-dashboard.png` |

## 3. mock API endpoint surface（再掲）

`apps/web/playwright/fixtures/auth.ts` の `mockApi` server が処理する endpoint（既存・本 SW では追加しない）:

| method | path | 用途 spec |
|--------|------|---------|
| GET | `/public/stats` | top |
| GET | `/public/members/preview` | top |
| GET | `/public/members` | members-list |
| GET | `/public/members/:id` | member-detail |
| GET | `/admin/dashboard` | admin-dashboard |
| GET | `/admin/members` 等 | admin-dashboard 周辺 |

> serial-06 で `/public/members/:id` の response_fields shape が `{ id, displayName, fields: [...] }` で揃っていることが前提。

## 4. snapshot baseline の保存契約

| 項目 | 値 |
|------|-----|
| 保存先 | `apps/web/playwright/tests/visual/<spec-name>.spec.ts-snapshots/<snapshot-name>-chromium-linux.png`（CI で生成）/ `-darwin.png`（macOS 生成） |
| 正本 | CI ubuntu-latest 生成の `-chromium-linux.png` |
| macOS 生成 baseline の扱い | コミットしない（`-darwin.png` は除外せず、CI を正本として上書きする運用） |
| 更新 trigger | `--update-snapshots` flag 明示時のみ |

## 5. 出力（test 失敗時の artifact）

| artifact | 配置 |
|---------|------|
| test-results | `apps/web/playwright/evidence/test-results/`（既存） |
| playwright-report | `apps/web/playwright/evidence/playwright-report/html/`（既存） |
| screenshot diff | test-results 配下の `<test>-diff.png` |
| evidence ledger | `outputs/phase-11/screenshots/*.png`（成功 baseline を Phase 11 へ複製） |

## 6. 不変条件

- spec は API 直叩きを行わない（page.goto 経由のみ）
- spec は D1 を呼ばない（mockApi 経由のみ）
- spec は新規 endpoint を期待しない
- snapshot 名は spec 内に literal で記述（動的生成禁止）
