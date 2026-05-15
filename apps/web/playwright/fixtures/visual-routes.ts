export type AuthRole = 'none' | 'member' | 'admin'

export interface VisualRoute {
  /** スナップショット slug（ファイル名生成用） */
  slug: string
  /** Playwright page.goto に渡す path（先頭 / 付き） */
  path: string
  /** 認証要否 */
  auth: AuthRole
  /** 表示完了を待つ data-testid（無ければ body） */
  waitFor?: string
}

export const VISUAL_ROUTES = [
  { slug: 'root', path: '/', auth: 'none' },
  { slug: 'members', path: '/members', auth: 'none' },
  { slug: 'members-detail', path: '/members/sample-001', auth: 'none' },
  { slug: 'register', path: '/register', auth: 'none' },
  { slug: 'privacy', path: '/privacy', auth: 'none' },
  { slug: 'terms', path: '/terms', auth: 'none' },
  { slug: 'login', path: '/login', auth: 'none' },
  { slug: 'profile', path: '/profile', auth: 'member' },
  { slug: 'admin', path: '/admin', auth: 'admin' },
  { slug: 'admin-members', path: '/admin/members', auth: 'admin' },
  { slug: 'admin-tags', path: '/admin/tags', auth: 'admin' },
  { slug: 'admin-meetings', path: '/admin/meetings', auth: 'admin' },
  { slug: 'admin-schema', path: '/admin/schema', auth: 'admin' },
  { slug: 'admin-requests', path: '/admin/requests', auth: 'admin' },
  { slug: 'admin-identity-conflicts', path: '/admin/identity-conflicts', auth: 'admin' },
  { slug: 'admin-audit', path: '/admin/audit', auth: 'admin' },
  { slug: 'not-found', path: '/__not_found_canary', auth: 'none' },
] as const satisfies readonly VisualRoute[]

export const EXPECTED_VISUAL_ROUTE_COUNT = 17

if (VISUAL_ROUTES.length !== EXPECTED_VISUAL_ROUTE_COUNT) {
  throw new Error(
    `VISUAL_ROUTES must contain ${EXPECTED_VISUAL_ROUTE_COUNT} routes, got ${VISUAL_ROUTES.length}`,
  )
}
