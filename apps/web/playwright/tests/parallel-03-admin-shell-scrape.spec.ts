import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { expect, test } from '../fixtures/auth'

const evidencePath = resolve(
  process.cwd(),
  '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt',
)

test.describe('parallel-03 admin AppShell runtime evidence (EV-12)', () => {
  test('admin runtime DOM exposes AppShell data contract and writes EV-12 scrape', async ({
    adminPage,
    mockApi,
  }) => {
    await mockApi.reset()
    await adminPage.goto('/admin')

    const shell = adminPage.getByTestId('admin-shell')
    await expect(shell).toBeVisible()
    await expect(shell).toHaveAttribute('data-theme', 'cool')
    await expect(shell).toHaveAttribute('data-route-group', 'admin')
    const viewportWidth = adminPage.viewportSize()?.width ?? 0
    const sidebar = adminPage.locator('[data-shell="sidebar"]')
    await expect(sidebar).toBeAttached()
    if (viewportWidth >= 768) {
      await expect(sidebar).toBeVisible()
    } else {
      await expect(sidebar).toBeHidden()
    }
    await expect(adminPage.locator('[data-shell="topbar"]')).toHaveCount(0)
    await expect(adminPage.locator('main[data-route="admin"]')).toBeVisible()

    const lines = await adminPage.evaluate(() => {
      const selectors = [
        '[data-testid="admin-shell"]',
        '[data-shell="sidebar"]',
        'main[data-route="admin"]',
      ]
      return selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) =>
          element.outerHTML
            .replace(/\s+/g, ' ')
            .replace(/>.*$/s, '>')
            .trim(),
        ),
      )
    })

    expect(lines.length).toBeGreaterThanOrEqual(3)
    const header = [
      '# EV-12 admin AppShell DOM scrape (parallel-03-followup-002)',
      '# captured via apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts',
      '# route: /admin (admin session fixture, mock API)',
      '',
    ].join('\n')
    const scrape = `${header}${lines.join('\n')}`
    expect(scrape).toContain('data-theme="cool"')
    expect(scrape).toContain('data-route-group="admin"')
    expect(scrape).toContain('data-testid="admin-shell"')
    expect(scrape).toContain('data-shell="sidebar"')
    expect(scrape).not.toContain('data-shell="topbar"')
    expect(scrape).toContain('data-route="admin"')

    await mkdir(dirname(evidencePath), { recursive: true })
    await writeFile(evidencePath, `${scrape}\n`, 'utf8')
  })
})
