# Playwright Runtime Screenshot Pattern

issue-819 admin dashboard StatusDistribution の実装で確立した、
**Playwright runtime での element-level PNG 取得**を後続タスクで再現するための canonical reference。

## 概要 (Why this pattern)

Phase 11 evidence として「ダミー PNG ではなく実 UI から撮影した PNG」を要求されるタスクで、
従来は手動撮影 or test fixture 注入で対応していた。これは以下の問題があった:

- **手動撮影**: 再現性ゼロ、CI で再生成できない
- **page.route() による per-test fixture 注入**: Server Component の `fetch()` は
  Playwright の `page.route()` で捕捉できない（Server 側 fetch は Node ランタイムで実行され、
  ブラウザの network layer を通過しない）

解決策は **in-process mock server (`scripts/e2e-mock-api.mjs`) に control endpoint
`POST /__test__/<feature>` を追加し、fixture 経由で state を制御**して
Server Component の `fetch()` レスポンスを切り替えるパターン。
signed JWT cookie で admin auth を bypass し、placeholder / populated の
2-state を element-level `locator.screenshot()` で撮影する。

## Canonical 4-step

### Step 1: mock server に `__test__/<feature>` control endpoint を追加

`scripts/e2e-mock-api.mjs` の `state` に feature 用フィールドを追加し、
`resetState()` でクリアし、`POST /__test__/<feature>` で書き換える。

参照: `scripts/e2e-mock-api.mjs:85-98`（state 定義 + resetState）、
`scripts/e2e-mock-api.mjs:389-400`（control endpoint handler）

実装ポイント:

- state field は optional（`undefined` の場合は placeholder 表現を返す）
- 通常 API endpoint（例: `GET /admin/dashboard`）の response 組立時に
  state を参照し、`...(state.<field> ? { byStatus: state.<field> } : {})` で
  conditional merge する
- `resetState()` に必ず該当 field の cleanup を追加する

### Step 2: fixture wrapper（`MockApi` type 拡張）

`apps/web/playwright/fixtures/auth.ts` の `MockApiState` と `MockApi` 型に
新フィールド + setter を追加し、HTTP control endpoint と同期する node-side state を持つ。

参照:
- `apps/web/playwright/fixtures/auth.ts:41-49`（型定義）
- `apps/web/playwright/fixtures/auth.ts:459-481`（node mock の control endpoint handler）
- `apps/web/playwright/fixtures/auth.ts:594-605`（setter 実装：postControl 経由）

実装ポイント:

- fixture の `MockApi` setter は **node-side state 更新 + `postControl()` 呼出**の二重更新
- `setX(undefined)` で reset 可能にする（placeholder state へ戻すため）
- node mock 側の `__test__/reset` handler にも cleanup を追加（**spec fixture と node mock の resetState 両方を更新**）

### Step 3: spec で `mockApi.setX()` + `locator.screenshot()`

```ts
// 抜粋: apps/web/playwright/tests/issue-819-status-distribution.spec.ts:24-58
test.describe('issue-819 StatusDistribution runtime evidence', () => {
  test('captures placeholder + populated PNGs', async ({ page, context, mockApi }) => {
    await adminLogin(context)
    // placeholder
    await page.goto('/admin')
    const section = page.getByRole('heading', { name: '公開ステータス' }).locator('..')
    await section.screenshot({ path: placeholderTaskPath })
    // populated
    await mockApi.setAdminDashboardByStatus([
      { status: 'public', count: 12 },
      // ...
    ])
    await page.goto('/admin')
    await section.screenshot({ path: populatedTaskPath })
  })
})
```

参照: `apps/web/playwright/tests/issue-819-status-distribution.spec.ts:24-58`

実装ポイント:

- `adminLogin(context)` は signed JWT cookie 注入（fixture が export）
- `mockApi` は test に渡らなくても初期化のため `void mockApi` で fixture を発火
- placeholder 撮影 → state 注入 → `page.goto()` 再訪問 → populated 撮影
- 撮影対象は `getByRole('heading').locator('..')` 等で **chart section のみ** を絞る

### Step 4: 親 workflow PNG `copyFile` 同期

```ts
// 抜粋: spec 内
await copyFile(placeholderTaskPath, placeholderParentPath)
await copyFile(populatedTaskPath, populatedParentPath)
```

参照: `apps/web/playwright/tests/issue-819-status-distribution.spec.ts:43, 57`

実装ポイント:

- 親 workflow (`docs/30-workflows/completed-tasks/<parent>/outputs/phase-11/screenshots/`) の
  dummy PNG を spec 実行時に同名 PNG で上書き
- task dir と親 workflow dir は **両方とも** `mkdir({ recursive: true })` してから書く

## 不変条件

1. **`resetState()` を spec fixture と node mock 両方で更新**
   - `scripts/e2e-mock-api.mjs` の `resetState()` と `apps/web/playwright/fixtures/auth.ts` の
     `/__test__/reset` handler の両方に新 state field の cleanup を追加すること
2. **signed JWT admin context 必須**
   - `adminLogin(context)` で JWT cookie 注入。`page.context().addCookies()` 手書きは禁止
3. **placeholder / populated の 2-state capture**
   - 1 state のみの撮影では「state 切替が反映される」契約を検証できない
4. **screenshot path は task dir + 親 workflow dir 両方**
   - task dir: `docs/30-workflows/<task>/outputs/phase-11/screenshots/`
   - 親 workflow: `docs/30-workflows/completed-tasks/<parent>/outputs/phase-11/screenshots/`
5. **PNG 寸法 >= 200x100**
   - dummy 1x1 / 8-byte PNG は AC-3 (visual evidence) を満たさない
   - element-level `locator.screenshot()` は chart section 全体を含むため自然に満たせる

## リファレンス実装ファイルパス

| Step | ファイル | 行範囲 |
|------|----------|--------|
| 1 | `scripts/e2e-mock-api.mjs` | L85-98 (state/reset), L389-400 (control endpoint) |
| 2 | `apps/web/playwright/fixtures/auth.ts` | L41-49 (type), L459-481 (node mock), L594-605 (setter) |
| 3 | `apps/web/playwright/tests/issue-819-status-distribution.spec.ts` | L24-58 (spec full) |
| 4 | `apps/web/playwright/tests/issue-819-status-distribution.spec.ts` | L43, L57 (copyFile) |

## アンチパターン

### dummy small-byte PNG を Phase-11 evidence に置く

- 1x1 PNG / 8-byte placeholder PNG は AC-3 (visual evidence) を満たさない
- CI gate `verify-phase11-evidence` で PNG dimension check が入る前提
- **解決**: 本 pattern の `locator.screenshot({ path })` で実 UI 撮影

### untracked spec を Phase-11 evidence として参照する

- `git status` で untracked のままだと CI で再現できず evidence 化されない
- **解決**: spec は `apps/web/playwright/tests/<issue>-<feature>.spec.ts` に commit、
  CI ワークフローで実行されることを `playwright.config.ts` の `testMatch` で保証

### single-state-only capture

- populated だけ撮影して placeholder を撮らない → state 切替契約が未検証
- **解決**: 必ず 2-state（or N-state）を 1 test 内で連続撮影

### `page.route()` で Server Component fetch を mock しようとする

- Next.js App Router Server Component の `fetch()` は Node ランタイム実行で
  browser network layer を通過しないため `page.route()` で捕捉不可
- **解決**: in-process mock server (`scripts/e2e-mock-api.mjs`) を起動し、
  Server Component の API base URL をその mock に向ける（fixture が自動起動）
