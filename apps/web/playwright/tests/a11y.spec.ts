// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test, expect } from '../fixtures/coverage'
import { memberLogin } from '../fixtures/auth'
import AxeBuilder from '@axe-core/playwright'

const PUBLIC_PATHS = ['/', '/members', '/members/m-1', '/register', '/login']

test.describe('a11y — WCAG 2.1 AA 主要違反 0 件', () => {
  for (const path of PUBLIC_PATHS) {
    test(`axe ${path}`, async ({ page }) => {
      // 公開層は全ルート認証必須化されたため gated ルートは会員認証して訪問する。
      // /login は認証不要かつ認証済みだと /profile へリダイレクトするため認証しない。
      if (path !== '/login') {
        await memberLogin(page.context())
      }
      await page.goto(path)
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const blocking = result.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )
      expect(blocking, `a11y violations on ${path}: ${JSON.stringify(blocking, null, 2)}`).toHaveLength(0)
    })
  }
})
