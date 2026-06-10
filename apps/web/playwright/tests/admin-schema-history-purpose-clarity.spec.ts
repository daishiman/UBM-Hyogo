import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '../fixtures/auth'

const ROOT = resolve(process.cwd(), '../..')
const PHASE11_SCREENSHOT_DIR = resolve(
  ROOT,
  'docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11/screenshots',
)

const historyResponse = {
  items: [
    {
      auditId: 'audit_schema_history_001',
      actorEmail: 'admin@example.test',
      action: 'schema_diff.alias_assigned',
      targetType: 'schema_question',
      targetId: 'question_full_name',
      beforeJson: null,
      afterJson: null,
      maskedBefore: {
        stableKey: 'legacy_full_name',
        questionText: 'お名前を教えてください',
      },
      maskedAfter: {
        stableKey: 'full_name',
        questionText: 'お名前を教えてください',
      },
      createdAt: '2026-06-09T10:30:00.000Z',
    },
    {
      auditId: 'audit_schema_history_002',
      actorEmail: 'ops@example.test',
      action: 'schema_diff.alias_assigned',
      targetType: 'schema_question',
      targetId: 'question_company',
      beforeJson: null,
      afterJson: null,
      maskedBefore: {
        stableKey: 'legacy_company',
        questionText: '会社名',
      },
      maskedAfter: {
        stableKey: 'company_name',
        questionText: '会社名',
      },
      createdAt: '2026-06-09T10:20:00.000Z',
    },
  ],
  total: 2,
  nextCursor: null,
  appliedFilters: {
    action: 'schema_diff.alias_assigned',
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: 'batch_schema_history_fixture',
    limit: 50,
  },
}

test.describe('admin schema history purpose clarity evidence', () => {
  test.beforeEach(async () => {
    await mkdir(PHASE11_SCREENSHOT_DIR, { recursive: true })
  })

  test('purpose explainer and alias history cards', async ({ adminPage }) => {
    await adminPage.route('**/api/admin/audit?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(historyResponse),
      })
    })

    await adminPage.goto('/admin/schema/history', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '設問の紐付け履歴' })).toBeVisible()
    await expect(adminPage.getByTestId('schema-history-purpose-explainer')).toBeVisible()
    await expect(adminPage.locator('.schema-history-card')).toHaveCount(2)
    await expect(adminPage.getByText('legacy_full_name', { exact: true })).toBeVisible()
    await expect(adminPage.getByText('full_name', { exact: true })).toBeVisible()

    await adminPage.screenshot({
      path: resolve(PHASE11_SCREENSHOT_DIR, 'admin-schema-history-purpose-and-card.png'),
      fullPage: true,
    })
  })

  test('schema history parse error uses human-readable alert', async ({ adminPage }) => {
    await adminPage.route('**/api/admin/audit?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...historyResponse,
          items: [{ auditId: 'audit_invalid_shape' }],
        }),
      })
    })

    await adminPage.goto('/admin/schema/history', { waitUntil: 'domcontentloaded' })
    const alert = adminPage.locator('.schema-history-error')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('履歴データの形式が想定と一致しませんでした')
    await expect(alert).not.toContainText('unrecognized_keys')
    await expect(alert).not.toContainText('batchId')

    await adminPage.screenshot({
      path: resolve(PHASE11_SCREENSHOT_DIR, 'admin-schema-history-error-message.png'),
      fullPage: true,
    })
  })
})
