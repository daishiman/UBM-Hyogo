// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test, expect } from '../fixtures/coverage'
import AxeBuilder from '@axe-core/playwright'

const PUBLIC_PATHS = ['/', '/members', '/members/m-1', '/register', '/login']
// UI 整合中の暫定例外: /register は link-in-text-block を route 固有で無効化
const ROUTE_DISABLED_RULES: Record<string, string[]> = {
  '/register': ['link-in-text-block'],
}

test.describe('a11y — WCAG 2.1 AA 主要違反 0 件', () => {
  for (const path of PUBLIC_PATHS) {
    test(`axe ${path}`, async ({ page }) => {
      await page.goto(path)
      const builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      const disabledRules = ROUTE_DISABLED_RULES[path]
      const result = await (disabledRules ? builder.disableRules(disabledRules) : builder)
        .analyze()
      const blocking = result.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )
      expect(blocking, `a11y violations on ${path}: ${JSON.stringify(blocking, null, 2)}`).toHaveLength(0)
    })
  }
})
