// issue-819-admin-dashboard-runtime-screenshot:
// /admin StatusDistribution の placeholder / populated 状態を element-level で
// PNG 取得し、親 workflow (step-05-dashboard-chart-implementation) の dummy PNG を
// 置換する。auth は signed JWT cookie で bypass、API は in-process mock server で
// byStatus を制御する（caller への一時 fixture 注入は不要）。
import { mkdir, copyFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { adminLogin, expect, test } from '../fixtures/auth'

const TASK_DIR =
  '../../docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/outputs/phase-11/screenshots'
const PARENT_DIR =
  '../../docs/30-workflows/completed-tasks/step-05-dashboard-chart-implementation/outputs/phase-11/screenshots'

const placeholderTaskPath = `${TASK_DIR}/admin-dashboard-placeholder.png`
const populatedTaskPath = `${TASK_DIR}/admin-dashboard-chart.png`
const placeholderParentPath = `${PARENT_DIR}/admin-dashboard-placeholder.png`
const populatedParentPath = `${PARENT_DIR}/admin-dashboard-chart.png`

const ensureDir = async (filePath: string) => {
  await mkdir(dirname(filePath), { recursive: true })
}

test.describe('issue-819 StatusDistribution runtime evidence', () => {
  test('captures placeholder + populated PNGs to outputs/phase-11/screenshots', async ({
    page,
    context,
    mockApi,
  }) => {
    void mockApi
    await adminLogin(context)

    // ---- placeholder: byStatus 未提供 → "分布データは現在集計対象外です" ----
    await page.goto('/admin')
    await page.locator('[aria-labelledby="admin-dashboard-h"]').waitFor({ state: 'visible' })

    const placeholderSection = page.getByRole('heading', { name: '公開ステータス' }).locator('..')
    await expect(placeholderSection.getByText('分布データは現在集計対象外です')).toBeVisible()

    await ensureDir(placeholderTaskPath)
    await ensureDir(placeholderParentPath)
    await placeholderSection.screenshot({ path: placeholderTaskPath })
    await copyFile(placeholderTaskPath, placeholderParentPath)

    // ---- populated: byStatus seed → SVG bar chart 3 本 ----
    await mockApi.setAdminDashboardByStatus([
      { status: 'public', count: 12 },
      { status: 'member_only', count: 7 },
      { status: 'hidden', count: 3 },
    ])
    await page.goto('/admin')
    const populatedSection = page.getByRole('heading', { name: '公開ステータス' }).locator('..')
    // カード化リファクタで chart testid は status-distribution-list に統一された（StatusDistribution.tsx）。
    await expect(populatedSection.getByTestId('status-distribution-list')).toBeVisible()
    await expect(populatedSection.locator('[data-testid="status-bar"]')).toHaveCount(3)

    await populatedSection.screenshot({ path: populatedTaskPath })
    await copyFile(populatedTaskPath, populatedParentPath)
  })
})
