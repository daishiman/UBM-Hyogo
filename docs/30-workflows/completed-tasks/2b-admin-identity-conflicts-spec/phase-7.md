# Phase 7 — テスト方針 / selector 規約

| 項目 | 方針 |
|------|------|
| skip 件数 | **0 件**（cascade preview skip は 2c 責務） |
| `mergedMemberId` 使用 | **禁止**。merge response / fixture / assert すべて `targetMemberId` 系 |
| describe 名 | 日本語可（例: `'/admin/identity-conflicts × mutation'`） |
| test 名 | `成功系: <action>` / `refresh 境界: <case>` / `認可: <role> <expected>` |
| fixture 配置 | inline（外部 JSON 化禁止） |
| 日時値 | ISO8601 固定（`'2026-05-08T00:00:00Z'`, `'2026-05-09T00:00:00Z'`）。flaky 防止 |
| selector | `getByRole` / `getByText` / `getByTestId` を優先。色値・Tailwind class 依存禁止（不変条件 2） |
| zod 利用 | `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` を import し、mock handler 内で request body の `parse()` を実行（contract drift 即検出） |
| network mock | 初期 list は server-side fixture。browser `page.route()` は mutation と negative fetch observation に限定 |
| 認可分岐 | member は API 403 → UI 403/redirect 表示確認。anonymous は `page.url()` が `/login` を含むこと |

## selector アンチパターン

| ❌ 禁止 | ✅ 採用 |
|---------|--------|
| `page.locator('.bg-\\[#abcdef\\]')` | `page.getByRole('button', { name: 'merge' })` |
| `page.locator('.text-red-500')` | `page.getByTestId('conflict-row-cf_001')` |
| `page.waitForTimeout(1000)` | `expect(locator).toBeVisible()` 等の web-first assert |

## zod parse 失敗時の挙動

mock handler 内で `MergeIdentityRequestZ.parse(body)` が throw した場合、Playwright は test を fail させる。これにより UI ↔ shared schema の contract drift が即検出される。
