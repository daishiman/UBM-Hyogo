import { expect, type Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProfilePage extends BasePage {
  readonly url = '/profile'
  readonly userName = this.page.locator('[data-testid="profile-user-name"]')
  readonly editResponseUrlButton = this.page.locator(
    '[data-testid="edit-response-url-button"]',
  )

  // 不変条件 #4: 自前の編集 form は持たず、Google Form viewform 経由のみ
  async assertNoEditFormVisible(): Promise<void> {
    await expect(this.page.locator('form[data-testid="profile-edit-form"]')).toHaveCount(0)
    await expect(this.page.locator('input[name="profile-edit"]')).toHaveCount(0)
  }

  async clickEditResponseUrl(): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup')
    await this.editResponseUrlButton.click()
    return popupPromise
  }
}
