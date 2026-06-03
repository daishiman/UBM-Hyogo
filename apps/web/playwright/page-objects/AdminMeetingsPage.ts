import { expect, type Locator, type Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminMeetingsPage extends BasePage {
  url = '/admin/meetings'
  readonly meetingsTable = this.page.locator('[data-testid="admin-meetings-table"]')
  readonly attendanceCandidates = this.page.locator(
    '[data-testid="attendance-candidate"]:not([data-deleted="true"])',
  )
  readonly dupToast = this.page.locator('[data-testid="toast"]:has-text("既に出席登録済み")')
  readonly listToast = this.page.locator('[data-testid="attendance-toast"]')

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

  async expectAlreadyRegistered(memberId: string): Promise<void> {
    await expect(
      this.page.locator(
        `[data-testid="attendance-register"][data-member="${memberId}"][data-registered="true"]`,
      ),
    ).toContainText('登録済')
  }

  listPageSelectOption(sessionId: string, memberId: string) {
    return this.listSelect(sessionId).locator(`option[value="${memberId}"]`)
  }

  async addAttendanceOnList(sessionId: string, memberId: string): Promise<void> {
    await this.expandSession(sessionId)
    await this.listSelect(sessionId).selectOption(memberId)
    await this.listSession(sessionId).locator(`[data-testid="add-attendance-${sessionId}"]`).click()
  }

  async removeAttendanceOnList(sessionId: string, memberId: string): Promise<void> {
    await this.expandSession(sessionId)
    await this.listRemoveButton(sessionId, memberId).click()
    await this.page.getByRole('button', { name: '削除する' }).click()
  }

  async openRemoveAttendanceDialog(sessionId: string, memberId: string): Promise<void> {
    await this.expandSession(sessionId)
    await this.listRemoveButton(sessionId, memberId).click()
    await expect(this.page.getByRole('dialog')).toContainText('出席を削除しますか？')
  }

  async confirmOpenDialog(): Promise<void> {
    await this.page.getByRole('button', { name: '削除する' }).click()
  }

  async openDeleteMeetingDialog(sessionId: string): Promise<void> {
    await this.expandSession(sessionId)
    // exact: true 必須。見出しボタンの sr-only ラベル「出席を記録・編集」が
    // 「編集」を部分一致で含むため、非 exact だと <summary>編集</summary> と
    // 2 要素にマッチし strict-mode violation になる。
    await this.listSession(sessionId).getByText('編集', { exact: true }).click()
    await this.listSession(sessionId).getByRole('button', { name: '開催日を削除' }).click()
    await expect(this.page.getByRole('dialog')).toContainText('この開催日を削除しますか？')
  }

  async expectListToast(text: string): Promise<void> {
    await expect(this.listToast).toContainText(text)
  }

  async expectAttendeePresent(
    sessionId: string,
    memberId: string,
    present: boolean,
  ): Promise<void> {
    await this.expandSession(sessionId)
    await expect(this.listAttendee(sessionId, memberId)).toHaveCount(present ? 1 : 0)
  }

  private async expandSession(sessionId: string): Promise<void> {
    const session = this.listSession(sessionId)
    const button = session.getByRole('button').first()
    if ((await button.getAttribute('aria-expanded')) !== 'true') {
      await button.click()
    }
  }

  private listSession(sessionId: string): Locator {
    return this.page.locator(`[data-testid="attendance-list-session-${sessionId}"]`)
  }

  private listSelect(sessionId: string): Locator {
    return this.listSession(sessionId).locator(`[data-testid="attendance-select-${sessionId}"]`)
  }

  private listAttendee(sessionId: string, memberId: string): Locator {
    return this.listSession(sessionId).locator(
      `[data-testid="attendance-attendee-${sessionId}"][data-member="${memberId}"]`,
    )
  }

  private listRemoveButton(sessionId: string, memberId: string): Locator {
    return this.listSession(sessionId).locator(
      `[data-testid="remove-attendance-${sessionId}"][data-member="${memberId}"]`,
    )
  }
}
