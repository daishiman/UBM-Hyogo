import AxeBuilder from '@axe-core/playwright'

import { adminLogin, expect, memberLogin, test } from '../fixtures/auth'

interface SmokeRoute {
  path: string
  auth: 'public' | 'member' | 'admin'
  landmark: string[]
  expectedStatus?: number
}

const ROUTES: SmokeRoute[] = [
  { path: '/', auth: 'public', landmark: ['main h1', '[data-testid="public-hero"]'] },
  { path: '/members', auth: 'public', landmark: ['main h1', '[data-testid="member-grid"]'] },
  { path: '/members/sample-001', auth: 'public', landmark: ['main h1'] },
  { path: '/register', auth: 'public', landmark: ['main h1'] },
  { path: '/privacy', auth: 'public', landmark: ['main h1'] },
  { path: '/terms', auth: 'public', landmark: ['main h1'] },
  { path: '/login', auth: 'public', landmark: ['main h1'] },
  { path: '/profile', auth: 'member', landmark: ['main h1'] },
  { path: '/admin', auth: 'admin', landmark: ['main h1', '[aria-labelledby="admin-dashboard-h"]'] },
  { path: '/admin/members', auth: 'admin', landmark: ['main h1', '[aria-labelledby="admin-members-h"]'] },
  { path: '/admin/tags', auth: 'admin', landmark: ['main h1', 'text=タグキュー'] },
  { path: '/admin/meetings', auth: 'admin', landmark: ['main h1', 'text=開催日'] },
  { path: '/admin/schema', auth: 'admin', landmark: ['main h1', '[data-testid="admin-schema-section"]'] },
  { path: '/admin/requests', auth: 'admin', landmark: ['main h1', 'text=依頼キュー'] },
  { path: '/admin/identity-conflicts', auth: 'admin', landmark: ['main h1'] },
  { path: '/admin/audit', auth: 'admin', landmark: ['main h1', '[data-component="admin-audit"]'] },
  { path: '/__not_found_canary', auth: 'public', landmark: ['[data-testid="not-found"]'], expectedStatus: 404 },
]

for (const route of ROUTES) {
  test(`smoke: ${route.path} (${route.auth})`, async ({ page, context, mockApi }) => {
    void mockApi
    if (route.auth === 'admin') await adminLogin(context)
    if (route.auth === 'member') await memberLogin(context)

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    expect(response, `no response for ${route.path}`).not.toBeNull()
    if (route.expectedStatus !== undefined) {
      expect(response!.status(), `${route.path} status`).toBe(route.expectedStatus)
    } else {
      expect(response!.status(), `${route.path} status`).toBeLessThan(400)
    }

    await Promise.any(
      route.landmark.map((sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 10_000 })),
    )

    const a11y = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()
    const blocking = a11y.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
  })
}
