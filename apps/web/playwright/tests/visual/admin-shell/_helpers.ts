// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5 §2
// Shared helpers for admin-shell staging visual baseline specs.

import type { Page } from '@playwright/test'

export async function waitAdminPageReady(page: Page, headingSelector: string): Promise<void> {
  await page.locator(headingSelector).first().waitFor({ state: 'visible' })
}

export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}

export const DETAIL_SEEDS = {
  memberId: process.env.PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID,
  meetingId: process.env.PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID,
} as const

export const DETAIL_SEEDS_READY = Boolean(DETAIL_SEEDS.memberId && DETAIL_SEEDS.meetingId)
