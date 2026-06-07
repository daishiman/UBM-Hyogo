import { expect, test } from '../fixtures/auth'
import { defaultAttendanceSeed, type MockMeetingsSeed } from '../fixtures/admin-meetings'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const WORKFLOW_ROOT = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../docs/30-workflows/completed-tasks/issue-1112-attendance-count-badge-emphasis',
)
const PHASE11_DIR = join(WORKFLOW_ROOT, 'outputs/phase-11')
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

function issue1112Seed(): MockMeetingsSeed {
  const base = defaultAttendanceSeed()
  const candidates = base.members
  return {
    members: candidates,
    meetings: [
      {
        sessionId: 'badge-none',
        title: '出席未登録の回',
        heldOn: '2026-06-01',
        note: null,
        createdAt: '2026-06-01T00:00:00.000Z',
        candidates,
        attendees: [],
      },
      {
        sessionId: 'badge-normal',
        title: '通常出席の回',
        heldOn: '2026-06-02',
        note: null,
        createdAt: '2026-06-02T00:00:00.000Z',
        candidates,
        attendees: Array.from({ length: 5 }, (_, index) => ({
          memberId: `normal-${index + 1}`,
          assignedAt: '2026-06-02T00:00:00.000Z',
        })),
      },
      {
        sessionId: 'badge-high',
        title: '多数出席の回',
        heldOn: '2026-06-03',
        note: null,
        createdAt: '2026-06-03T00:00:00.000Z',
        candidates,
        attendees: Array.from({ length: 12 }, (_, index) => ({
          memberId: `high-${index + 1}`,
          assignedAt: '2026-06-03T00:00:00.000Z',
        })),
      },
    ],
  }
}

async function captureBadge(
  page: import('@playwright/test').Page,
  sessionId: string,
  file: string,
): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.getByTestId(`meeting-attendance-count-${sessionId}`).screenshot({
    path: join(SCREENSHOT_DIR, file),
  })
}

test.describe('issue-1112 attendance count badge emphasis Phase 11 evidence', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('captures none, normal, and high attendance badge states', async ({
    adminPage,
    mockApi,
  }) => {
    await mockApi.seedMeetings(issue1112Seed())
    await adminPage.goto('/admin/meetings', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(adminPage.getByRole('heading', { name: '開催日 / 出席管理' })).toBeVisible()

    await expect(adminPage.getByTestId('meeting-attendance-count-badge-none')).toHaveAttribute(
      'data-attendance-level',
      'none',
    )
    await expect(adminPage.getByTestId('meeting-attendance-count-badge-normal')).toHaveAttribute(
      'data-attendance-level',
      'normal',
    )
    await expect(adminPage.getByTestId('meeting-attendance-count-badge-high')).toHaveAttribute(
      'data-attendance-level',
      'high',
    )

    await captureBadge(adminPage, 'badge-none', 'attendance-badge-level-none.png')
    await captureBadge(adminPage, 'badge-normal', 'attendance-badge-level-normal.png')
    await captureBadge(adminPage, 'badge-high', 'attendance-badge-level-high.png')

    const capturedAt = new Date().toISOString()
    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: 'issue-1112-attendance-count-badge-emphasis',
          mode: 'local-playwright-fixture',
          route: '/admin/meetings',
          component: 'MeetingTimeline',
          capturedAt,
          screenshots: [
            {
              tc: 'TC-BADGE-01',
              file: 'screenshots/attendance-badge-level-none.png',
              status: 'present',
              expectedLevel: 'none',
            },
            {
              tc: 'TC-BADGE-02',
              file: 'screenshots/attendance-badge-level-normal.png',
              status: 'present',
              expectedLevel: 'normal',
            },
            {
              tc: 'TC-BADGE-03',
              file: 'screenshots/attendance-badge-level-high.png',
              status: 'present',
              expectedLevel: 'high',
            },
          ],
          stagingRuntimeBoundary: 'staging authenticated screenshots remain user-gated',
        },
        null,
        2,
      ),
    )
  })
})
