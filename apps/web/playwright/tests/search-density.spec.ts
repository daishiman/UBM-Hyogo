// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { expect, test } from '@playwright/test'
import { MembersListPage } from '../page-objects/MembersListPage'

test.describe.skip('search × density (6 パラメータ + density 3 値)', () => {
  test('q parameter', async ({ page }) => {
    const list = new MembersListPage(page)
    await list.applyQuery({ q: 'tanaka' })
    await expect(page).toHaveURL(/q=tanaka/)
    await list.screenshot('search-q', 'desktop')
  })

  test('zone + status combo', async ({ page }) => {
    const list = new MembersListPage(page)
    await list.applyQuery({ zone: 'hyogo', status: 'active' })
    await list.screenshot('search-zone-status', 'desktop')
  })

  test('tag filter', async ({ page }) => {
    const list = new MembersListPage(page)
    await list.applyQuery({ tag: 'tag-1' })
    await list.screenshot('search-tag', 'desktop')
  })

  test('sort', async ({ page }) => {
    const list = new MembersListPage(page)
    await list.applyQuery({ sort: 'name_asc' })
    await list.screenshot('search-sort', 'desktop')
  })

  test('6 パラメータ複合', async ({ page }) => {
    const list = new MembersListPage(page)
    await list.applyQuery({
      q: 'foo',
      zone: 'osaka',
      status: 'active',
      tag: 'tag-2',
      sort: 'name_desc',
      density: 'dense',
    })
    await list.screenshot('search-combo', 'desktop')
  })

  for (const density of ['comfy', 'dense', 'list'] as const) {
    test(`density=${density}`, async ({ page }) => {
      const list = new MembersListPage(page)
      await list.applyQuery({ density })
      await expect(list.grid).toHaveAttribute('data-density', density)
      await list.screenshot(`density-${density}`, 'desktop')
    })
  }
})
