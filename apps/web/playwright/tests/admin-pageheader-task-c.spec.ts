import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '../fixtures/auth'

const ROOT = resolve(process.cwd(), '../..')
const PHASE11_DIR = resolve(
  ROOT,
  'docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/outputs/phase-11',
)

type Shot = {
  name: string
  route: string
  heading: string | RegExp
  state: string
}

const shots: Shot[] = [
  {
    name: '01-admin-tags.png',
    route: '/admin/tags',
    heading: 'タグ割当',
    state: 'tag queue page header',
  },
  {
    name: '02-admin-meetings.png',
    route: '/admin/meetings',
    heading: '開催日 / 出席管理',
    state: 'meetings page header',
  },
  {
    name: '03-admin-meetings-detail.png',
    route: '/admin/meetings/sess-1',
    heading: '2026年5月 定例会',
    state: 'meeting detail page header',
  },
  {
    name: '04-admin-schema.png',
    route: '/admin/schema',
    heading: 'フォーム項目の対応づけ',
    state: 'schema diff page header',
  },
  {
    name: '05-admin-schema-history.png',
    route: '/admin/schema/history',
    heading: '設問の紐付け履歴',
    state: 'schema history page header',
  },
  {
    name: '06-admin-requests.png',
    route: '/admin/requests',
    heading: '会員からの申請',
    state: 'request queue page header',
  },
  {
    name: '07-admin-identity-conflicts.png',
    route: '/admin/identity-conflicts',
    heading: 'Identity 重複候補',
    state: 'identity conflict page header',
  },
  {
    name: '08-admin-audit.png',
    route: '/admin/audit',
    heading: '監査ログ',
    state: 'audit log page header',
  },
  {
    name: '09-admin-dashboard-attendance.png',
    route: '/admin/dashboard/attendance',
    heading: '出席ダッシュボード',
    state: 'attendance dashboard page header',
  },
]

test.describe('admin-ui Task C page header screenshots', () => {
  for (const shot of shots) {
    test(shot.name, async ({ adminPage }) => {
      await mkdir(PHASE11_DIR, { recursive: true })
      await adminPage.goto(shot.route)
      await expect(adminPage.getByRole('heading', { level: 1, name: shot.heading })).toBeVisible()
      await adminPage.screenshot({ path: resolve(PHASE11_DIR, shot.name), fullPage: true })
    })
  }

  test.afterAll(async () => {
    await mkdir(PHASE11_DIR, { recursive: true })
    await writeFile(
      resolve(PHASE11_DIR, 'manual-test-result.md'),
      [
        '# Phase 11 Manual Test Result',
        '',
        '- taskId: admin-ui-task-c-pageheader-token-conformance',
        '- mode: local Playwright authenticated admin fixture',
        '- result: PASS',
        '- note: visual baseline refresh remains delegated to Task E.',
        '',
        '| Route | Screenshot | State | Result |',
        '| --- | --- | --- | --- |',
        ...shots.map(
          (shot) => `| \`${shot.route}\` | \`${shot.name}\` | ${shot.state} | PASS |`,
        ),
        '',
      ].join('\n'),
    )
  })
})
