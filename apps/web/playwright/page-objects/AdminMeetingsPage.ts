import { expect, type Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminMeetingsPage extends BasePage {
  url = '/admin/meetings'
  readonly meetingsTable = this.page.locator('[data-testid="admin-meetings-table"]')
  readonly attendanceCandidates = this.page.locator(
    '[data-testid="attendance-candidate"]:not([data-deleted="true"])',
  )
  readonly dupToast = this.page.locator('[data-testid="toast"]:has-text("既に出席登録済み")')

  constructor(page: Page) {
    super(page)
  }

  async visit(id?: string): Promise<void> {
    this.url = id ? `/admin/meetings/${id}` : '/admin/meetings'
    await this.page.goto(this.url)
  }

  async registerAttendance(memberId: string): Promise<void> {
    await this.page.locator(`[data-testid="attendance-register"][data-member="${memberId}"]`).click()
  }

  // 不変条件 #15: 第 1 防御 — 重複登録時の toast
  async expectDupToast(): Promise<void> {
    await expect(this.dupToast).toBeVisible()
  }

  // 不変条件 #15 / #7: 第 2 防御 — 削除済み member は候補に出ない
  async expectDeletedMemberExcluded(deletedMemberId: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="attendance-candidate"][data-member="${deletedMemberId}"]`),
    ).toHaveCount(0)
  }
}
