// issue-276: /members mobile FilterBar + tag picker visual evidence.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '../fixtures/auth'

const evidenceRoot = join(
  process.cwd(),
  '../../docs/30-workflows/issue-276-mobile-filterbar-tag-picker/outputs/phase-11',
)
const screenshotDir = join(evidenceRoot, 'evidence')

const screenshotPath = (name: string) => {
  mkdirSync(screenshotDir, { recursive: true })
  return join(screenshotDir, name)
}

test.describe('issue-276 members FilterBar tag picker', () => {
  test('mobile collapsed / expanded / limit and desktop selected states', async ({
    page,
    mockApi,
  }) => {
    void mockApi

    await page.setViewportSize({ width: 375, height: 844 })
    await page.goto('/members?tag=ai&tag=design')
    await expect(page.locator('[data-component="member-filters"]')).toHaveAttribute(
      'data-expanded',
      'false',
    )
    await expect(page.locator('[data-role="filters-body"]')).not.toBeVisible()
    await page.screenshot({
      path: screenshotPath('mobile-initial.png'),
      fullPage: true,
    })

    await page.locator('[data-component="filters-summary-mobile"]').click()
    await expect(page.locator('[data-component="tag-picker"]')).toBeVisible()
    await expect(page.locator('[data-role="active-filters"] li')).toHaveCount(2)
    await page.screenshot({
      path: screenshotPath('mobile-expanded.png'),
      fullPage: true,
    })

    await page.goto('/members?tag=ai&tag=design&tag=startup&tag=kobe&tag=dx')
    await page.locator('[data-component="filters-summary-mobile"]').click()
    await expect(page.locator('[data-role="tag-limit-hint"]')).toBeVisible()
    await expect(page.locator('[data-tag-code="community"]')).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await page.screenshot({
      path: screenshotPath('mobile-limit-reached.png'),
      fullPage: true,
    })

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/members?tag=ai&tag=design')
    await expect(page.locator('[data-component="tag-picker"]')).toBeVisible()
    await expect(page.locator('[data-role="active-filters"] li')).toHaveCount(2)
    await page.screenshot({
      path: screenshotPath('desktop-picker-and-selected.png'),
      fullPage: true,
    })
  })
})
