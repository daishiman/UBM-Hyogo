import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const DEFAULT_EVIDENCE_BASE =
  process.env.PLAYWRIGHT_EVIDENCE_TASK === '07c-followup-002'
    ? '../../docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots'
    : '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/screenshots'

const EVIDENCE_BASE = process.env.PLAYWRIGHT_SCREENSHOT_DIR ?? DEFAULT_EVIDENCE_BASE

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  abstract readonly url: string

  async visit(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'load' })
    // Wait briefly for client-side router prefetch / hydration to settle so that
    // the next page.goto() is not interrupted by an in-flight client navigation
    // (observed on mobile-webkit between sequential /admin/* navigations).
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  }

  async screenshot(name: string, viewport: 'desktop' | 'mobile' = 'desktop'): Promise<void> {
    const filePath =
      process.env.PLAYWRIGHT_EVIDENCE_TASK === '07c-followup-002'
        ? join(EVIDENCE_BASE, `${name}.png`)
        : join(EVIDENCE_BASE, viewport, `${name}.png`)
    await mkdir(dirname(filePath), { recursive: true })
    await this.page.screenshot({ path: filePath, fullPage: true })
  }
}
