import type { Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const EVIDENCE_BASE =
  '../../docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence/screenshots'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  abstract readonly url: string

  async visit(): Promise<void> {
    await this.page.goto(this.url)
  }

  async screenshot(name: string, viewport: 'desktop' | 'mobile' = 'desktop'): Promise<void> {
    const filePath = join(EVIDENCE_BASE, viewport, `${name}.png`)
    await mkdir(dirname(filePath), { recursive: true })
    await this.page.screenshot({ path: filePath, fullPage: true })
  }
}
