// admin-dashboard-recovery-and-byZone:
// Local authenticated visual evidence for Phase 11. The API response is served
// by the in-process mock server in fixtures/auth.ts.
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { expect, test } from '../fixtures/auth'

const TASK_DIR = '../../docs/30-workflows/admin-dashboard-recovery-and-byZone/outputs/phase-11'
const overviewPath = `${TASK_DIR}/admin-dashboard-200-overview.png`
const detailPath = `${TASK_DIR}/admin-dashboard-byZone-detail.png`

const ensureDir = async (filePath: string) => {
  await mkdir(dirname(filePath), { recursive: true })
}

test.describe('admin-dashboard-recovery-and-byZone local visual evidence', () => {
  test('captures overview and byZone detail screenshots', async ({ adminPage, mockApi }) => {
    await mockApi.reset()
    await adminPage.goto('/admin')
    await expect(adminPage.getByTestId('admin-dashboard-root')).toBeVisible({ timeout: 10_000 })

    const zoneSection = adminPage.getByRole('img', { name: /zone 別人数/ })
    await expect(zoneSection).toBeVisible()
    await expect(zoneSection.getByText('0→1', { exact: true })).toBeVisible()
    await expect(zoneSection.getByText('立ち上げ')).toBeVisible()
    await expect(zoneSection.getByText('1→10', { exact: true })).toBeVisible()
    await expect(zoneSection.getByText('拡大')).toBeVisible()
    await expect(zoneSection.getByText('10→100', { exact: true })).toBeVisible()
    await expect(zoneSection.getByText('組織化')).toBeVisible()

    await ensureDir(overviewPath)
    await adminPage.screenshot({ path: overviewPath, fullPage: true })
    await zoneSection.screenshot({ path: detailPath })
  })
})
