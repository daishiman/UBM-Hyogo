import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'mobile-boundary-640', width: 640, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 800 },
] as const

async function mountMembersTable(page: import('@playwright/test').Page) {
  const css = await readFile(join(process.cwd(), 'src/styles/globals.css'), 'utf8')
  await page.setContent(`
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <main style="margin:0; padding:0;">
          <div class="ui-card admin-members-table-card" data-component="admin-members-table">
            <table class="w-full text-left text-sm" data-testid="admin-members-table">
              <caption class="sr-only">会員一覧</caption>
              <thead>
                <tr>
                  <th scope="col">選択</th>
                  <th scope="col">メンバー</th>
                  <th scope="col">メール</th>
                  <th scope="col">区画 / ステータス</th>
                  <th scope="col">タグ</th>
                  <th scope="col">最終更新</th>
                  <th scope="col">公開</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr data-testid="admin-members-row-mem_alpha">
                  <td data-cell="select" data-mobile-label="選択"><input aria-label="青木 太郎 を選択" type="checkbox" /></td>
                  <td data-cell="member" data-mobile-label="メンバー"><button type="button">青木 太郎</button></td>
                  <td data-cell="email" data-mobile-label="メール">a***@example.com</td>
                  <td data-cell="status" data-mobile-label="区画 / ステータス"><span>0_to_1</span> <span>公開</span></td>
                  <td data-cell="tags" data-mobile-label="タグ"><span>営業</span> <span>技術</span></td>
                  <td data-cell="updated" data-mobile-label="最終更新">2026-05-01T00:00:00.000Z</td>
                  <td data-cell="publish" data-mobile-label="公開"><button type="button">公開を切替</button></td>
                  <td data-cell="actions" data-mobile-label="操作"><button type="button" aria-label="青木 太郎 を編集">編集</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </body>
    </html>
  `)
}

test.describe('admin members responsive table CSS contract', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: table remains within viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await mountMembersTable(page)

      const table = page.getByTestId('admin-members-table')
      await expect(table).toBeVisible()
      await expect(page.getByTestId('admin-members-row-mem_alpha')).toBeVisible()

      const overflow = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(Math.max(overflow.body, overflow.document)).toBeLessThanOrEqual(overflow.viewport + 1)
    })
  }

  test('mobile: publish controls and mobile labels remain operable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await mountMembersTable(page)

    const firstRow = page.getByTestId('admin-members-row-mem_alpha')
    await expect(firstRow).toBeVisible()
    await expect(firstRow.locator('[data-mobile-label="公開"]')).toBeVisible()
    await expect(firstRow.locator('[data-mobile-label="メール"]')).toBeVisible()
    await expect(firstRow.locator('[data-mobile-label="区画 / ステータス"]')).toBeVisible()

    const publishControl = firstRow.locator('[data-mobile-label="公開"] button').first()
    await expect(publishControl).toBeVisible()
    await expect(publishControl).toBeEnabled()
  })
})
