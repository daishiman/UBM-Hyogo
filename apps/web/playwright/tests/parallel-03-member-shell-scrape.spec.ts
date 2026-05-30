import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { expect, test } from '../fixtures/auth'

const evidencePath = resolve(
  process.cwd(),
  '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt',
)

const subWorkflowEvidencePath = resolve(
  process.cwd(),
  '../../docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/dom-scrape-member.txt',
)

const screenshotPath = resolve(
  process.cwd(),
  '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png',
)

const subWorkflowScreenshotPath = resolve(
  process.cwd(),
  '../../docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/outputs/phase-11/screenshots/member-shell.png',
)

test.describe('parallel-03 member AppShell runtime evidence (EV-13/EV-16)', () => {
  test('member runtime DOM exposes AppShell data contract and captures evidence', async ({
    memberPage,
    mockApi,
  }) => {
    await mockApi.reset()
    await memberPage.goto('/profile')

    const shell = memberPage.getByTestId('member-shell')
    await expect(shell).toBeVisible()
    await expect(shell).toHaveAttribute('data-theme', 'warm')
    await expect(shell).toHaveAttribute('data-route-group', 'member')
    // task-c: 旧 topbar は SidebarShell へ統合され撤去。sidebar は md+ で表示・mobile では hidden。
    const viewportWidth = memberPage.viewportSize()?.width ?? 0
    const sidebar = memberPage.locator('[data-shell="sidebar"]')
    await expect(sidebar).toBeAttached()
    if (viewportWidth >= 768) {
      await expect(sidebar).toBeVisible()
    } else {
      await expect(sidebar).toBeHidden()
    }
    await expect(memberPage.locator('[data-shell="topbar"]')).toHaveCount(0)
    await expect(memberPage.locator('main[data-route="member"]')).toBeVisible()
    await expect(memberPage.locator('main[data-section-rhythm="comfortable"]')).toBeVisible()

    const lines = await memberPage.evaluate(() => {
      const selectors = [
        '[data-testid="member-shell"]',
        '[data-shell="sidebar"]',
        'main[data-route="member"]',
        'main[data-section-rhythm="comfortable"]',
      ]
      const seen = new Set<string>()
      return selectors.flatMap((selector) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).flatMap((element) => {
          const line = element.outerHTML
            .replace(/\s+/g, ' ')
            .replace(/>.*$/s, '>')
            .trim()
          if (seen.has(line)) return []
          seen.add(line)
          return [line]
        }),
      )
    })

    expect(lines.length).toBeGreaterThanOrEqual(3)
    const header = [
      '# EV-13 member AppShell DOM scrape (issue-903-parallel-03-followup-005)',
      '# captured via apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts',
      '# route: /profile (member session fixture, mock API)',
      '',
    ].join('\n')
    const scrape = `${header}${lines.join('\n')}`
    expect(scrape).toContain('data-theme="warm"')
    expect(scrape).toContain('data-route-group="member"')
    expect(scrape).toContain('data-testid="member-shell"')
    expect(scrape).not.toContain('data-shell="topbar"')
    expect(scrape).toContain('data-shell="sidebar"')
    expect(scrape).toContain('data-route="member"')
    expect(scrape).toContain('data-section-rhythm="comfortable"')
    expect(scrape).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)

    await mkdir(dirname(evidencePath), { recursive: true })
    await mkdir(dirname(screenshotPath), { recursive: true })
    await mkdir(dirname(subWorkflowEvidencePath), { recursive: true })
    await mkdir(dirname(subWorkflowScreenshotPath), { recursive: true })
    await writeFile(evidencePath, `${scrape}\n`, 'utf8')
    await writeFile(subWorkflowEvidencePath, `${scrape}\n`, 'utf8')
    await memberPage.screenshot({ path: screenshotPath })
    await memberPage.screenshot({ path: subWorkflowScreenshotPath })
  })
})
