// PARALLEL-02-STATE-SYNC: router.refresh localized state-sync visual evidence.
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '../fixtures/auth'

const here = dirname(fileURLToPath(import.meta.url))
const screenshotsDir = resolve(
  here,
  '../../../../docs/30-workflows/parallel-02-state-sync-router-refresh/outputs/phase-11/screenshots',
)

test.describe('profile state-sync router refresh visual evidence', () => {
  test('captures pending banner bridge after visibility and delete mutations', async ({
    memberPage,
  }) => {
    await mkdir(screenshotsDir, { recursive: true })

    await memberPage.goto('/profile')
    await memberPage.addStyleTag({
      content:
        '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
    })
    await memberPage.locator('main h1').waitFor({ state: 'visible' })
    await memberPage.screenshot({
      path: `${screenshotsDir}/01-profile-initial.png`,
      fullPage: true,
    })

    await memberPage.getByTestId('open-hide-dialog').click()
    await expect(memberPage.getByTestId('visibility-request-dialog')).toBeVisible()
    await memberPage.screenshot({
      path: `${screenshotsDir}/02-visibility-dialog-open.png`,
      fullPage: true,
    })

    await memberPage.getByTestId('visibility-submit').click()
    await expect(memberPage.locator('[data-pending-type="visibility_request"]')).toBeVisible()
    await expect(memberPage.getByTestId('open-hide-dialog')).toBeDisabled()
    await memberPage.screenshot({
      path: `${screenshotsDir}/03-visibility-banner-shown.png`,
      fullPage: true,
    })

    await memberPage.getByTestId('open-delete-dialog').click()
    await memberPage.getByTestId('delete-confirm-checkbox').check()
    await expect(memberPage.getByTestId('delete-submit')).toBeEnabled()
    await memberPage.screenshot({
      path: `${screenshotsDir}/04-delete-dialog-confirmed.png`,
      fullPage: true,
    })

    await memberPage.getByTestId('delete-submit').click()
    await expect(memberPage.locator('[data-pending-type="delete_request"]')).toBeVisible()
    await expect(memberPage.getByTestId('open-delete-dialog')).toBeDisabled()
    await memberPage.screenshot({
      path: `${screenshotsDir}/05-delete-banner-shown.png`,
      fullPage: true,
    })
  })
})
