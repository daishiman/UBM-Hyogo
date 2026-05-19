import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { signSessionJwt, type MemberId } from '@ubm-hyogo/shared'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { buildMember, buildPreview, buildStats } from '../../src/test-utils/fixtures/public'
import {
  defaultAttendanceSeed,
  type MockMeetingsSeed,
  unregisteredAttendanceSeed,
} from './admin-meetings'

type AuthFixtures = {
  adminPage: Page
  memberPage: Page
  anonymousPage: Page
  adminContext: BrowserContext
  memberContext: BrowserContext
  mockApi: MockApi
}

const SESSION_COOKIE_NAME = 'authjs.session-token'
const E2E_AUTH_SECRET =
  process.env.AUTH_SECRET ?? 'playwright-e2e-auth-secret-32-bytes'
const MOCK_API_PORT = 8787

type PendingRequests = {
  visibility?: {
    queueId: string
    status: 'pending'
    createdAt: string
    desiredState: 'hidden' | 'public'
  }
  delete?: {
    queueId: string
    status: 'pending'
    createdAt: string
  }
}

type MockApiState = {
  pendingRequests: PendingRequests
  visibilityPost?: { status: number; body: unknown }
  adminDashboardUnresolvedSchema?: number
  meetingsSeed: MockMeetingsSeed
}

type MockApi = {
  reset: () => Promise<void>
  setVisibilityPending: (createdAt?: string) => Promise<void>
  setDeletePending: (createdAt?: string) => Promise<void>
  setVisibilityError: (status: number, body: unknown) => void
  setAdminDashboardUnresolvedSchema: (count: number) => Promise<void>
  seedMeetings: (seed?: MockMeetingsSeed) => Promise<void>
  seedUnregisteredMeeting: () => Promise<void>
}

const STANDALONE_BASE = `http://127.0.0.1:${MOCK_API_PORT}`

async function postControl(path: string, body?: unknown): Promise<void> {
  await ensureMockApi()
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  }
  if (body !== undefined) init.body = JSON.stringify(body)
  const res = await fetch(`${STANDALONE_BASE}${path}`, init)
  if (!res.ok) throw new Error(`mock control ${path} failed with ${res.status}`)
}

async function waitForMockApiReady(): Promise<void> {
  const deadline = Date.now() + 5_000
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${STANDALONE_BASE}/__test__/health`)
      if (res.ok) return
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw lastError instanceof Error ? lastError : new Error('mock api did not become ready')
}

const state: MockApiState = { pendingRequests: {}, meetingsSeed: defaultAttendanceSeed() }
let serverPromise: Promise<void> | null = null
let server: Server | null = null

function response(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function profileBody() {
  return {
    profile: {
      sections: [],
      attendance: [],
      attendanceMeta: { hasMore: false, nextCursor: null },
    },
    statusSummary: {
      publicConsent: 'consented',
      rulesConsent: 'consented',
      publishState: 'public',
      isDeleted: false,
    },
    editResponseUrl: 'https://forms.example.test/edit',
    fallbackResponderUrl: 'https://forms.example.test/responder',
    pendingRequests: state.pendingRequests,
  }
}

function adminDashboardBody() {
  return {
    totals: {
      totalMembers: 128,
      publicMembers: 76,
      untaggedMembers: 9,
      unresolvedSchema: state.adminDashboardUnresolvedSchema ?? 0,
    },
    recentActions: [
      {
        auditId: 'audit_001',
        actorEmail: 'admin@example.test',
        action: 'admin.member.status_updated',
        targetType: 'member',
        targetId: 'mem_alpha',
        createdAt: '2026-05-10T01:00:00.000Z',
      },
      {
        auditId: 'audit_002',
        actorEmail: 'system@example.test',
        action: 'admin.member.note_created',
        targetType: 'member',
        targetId: 'mem_beta',
        createdAt: '2026-05-10T00:30:00.000Z',
      },
    ],
    generatedAt: '2026-05-10T01:05:00.000Z',
  }
}

function publicMembersBody() {
  return {
    items: [buildMember({ memberId: 'sample-001', fullName: '佐藤 サンプル' })],
    pagination: { total: 1, page: 1, limit: 50, totalPages: 1, hasNext: false, hasPrev: false },
    appliedQuery: { q: '', zone: 'all', status: 'public', tags: [], sort: 'recent', density: 'comfy' },
    generatedAt: '2026-05-12T00:00:00.000Z',
  }
}

function publicMemberProfileBody() {
  return {
    memberId: 'sample-001',
    summary: {
      fullName: '佐藤 サンプル',
      nickname: 'sample',
      location: '兵庫県神戸市',
      occupation: '事業開発',
      ubmZone: 'Kobe',
      ubmMembershipType: 'regular',
    },
    publicSections: [
      {
        key: 'profile',
        title: 'プロフィール',
        fields: [
          {
            stableKey: 'member_display_name',
            label: '表示名',
            value: '佐藤 サンプル',
            kind: 'shortText',
            visibility: 'public',
            source: 'forms',
          },
        ],
      },
    ],
    attendance: [{ sessionId: 'session_task18', title: '2026年5月 定例会', heldOn: '2026-05-12' }],
    attendanceMeta: { hasMore: false, nextCursor: null },
    tags: [{ code: 'kobe', label: 'Kobe', category: 'zone' }],
  }
}

function adminMembersBody(query: URLSearchParams) {
  const q = query.get('q') ?? ''
  const attendanceMembers =
    process.env.PLAYWRIGHT_EVIDENCE_TASK === '07c-followup-002'
      ? state.meetingsSeed.members.map((member) => ({
          memberId: member.memberId,
          responseEmail: `${member.memberId}@example.test`,
          fullName: member.fullName,
          publicConsent: 'consented',
          rulesConsent: 'consented',
          publishState: 'public',
          isDeleted: member.isDeleted === true,
          lastSubmittedAt: '2026-05-09T12:00:00.000Z',
        }))
      : []
  const baseMembers = [
    ...attendanceMembers,
    {
      memberId: 'mem_alpha',
      responseEmail: 'alpha@example.test',
      fullName: '青木 太郎',
      publicConsent: 'consented',
      rulesConsent: 'consented',
      publishState: 'public',
      isDeleted: false,
      lastSubmittedAt: '2026-05-09T12:00:00.000Z',
    },
    {
      memberId: 'mem_beta',
      responseEmail: 'beta@example.test',
      fullName: '兵庫 花子',
      publicConsent: 'consented',
      rulesConsent: 'consented',
      publishState: 'hidden',
      isDeleted: false,
      lastSubmittedAt: '2026-05-08T12:00:00.000Z',
    },
    {
      memberId: 'mem_gamma',
      responseEmail: 'gamma@example.test',
      fullName: '神戸 次郎',
      publicConsent: 'unknown',
      rulesConsent: 'consented',
      publishState: 'member_only',
      isDeleted: false,
      lastSubmittedAt: '2026-05-07T12:00:00.000Z',
    },
  ]
  const members = q === 'zzzzz' ? [] : baseMembers
  return {
    total: members.length,
    page: 1,
    pageSize: 50,
    members,
  }
}

function adminTagsQueueBody(query: URLSearchParams) {
  const status = query.get('status')
  const items = [
    {
      queueId: 'tag_q_001',
      memberId: 'mem_alpha',
      responseId: 'res_alpha',
      status: 'queued' as const,
      suggestedTagsJson: JSON.stringify(['founder', 'kobe']),
      reason: 'playwright fixture',
      createdAt: '2026-05-12T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
    },
    {
      queueId: 'tag_q_dlq',
      memberId: 'mem_beta',
      responseId: 'res_beta',
      status: 'dlq' as const,
      suggestedTagsJson: JSON.stringify(['review-required']),
      reason: 'retry limit exceeded',
      createdAt: '2026-05-12T00:10:00.000Z',
      updatedAt: '2026-05-12T00:20:00.000Z',
    },
  ]
  const filtered = status
    ? items.filter((it) => it.status === status)
    : items
  return { total: filtered.length, items: filtered }
}

function meetingsListBody() {
  return {
    total: state.meetingsSeed.meetings.length,
    items: state.meetingsSeed.meetings.map((meeting) => ({
      sessionId: meeting.sessionId,
      title: meeting.title,
      heldOn: meeting.heldOn,
      note: meeting.note,
      createdAt: meeting.createdAt,
      attendance: meeting.attendees,
    })),
  }
}

function meetingDetailBody(sessionId: string) {
  const meeting = state.meetingsSeed.meetings.find((item) => item.sessionId === sessionId)
  if (!meeting) return null
  return {
    sessionId: meeting.sessionId,
    title: meeting.title,
    heldOn: meeting.heldOn,
    candidates: meeting.candidates,
    attendees: meeting.attendees,
  }
}

function updateAttendance(sessionId: string, memberId: string, attended: boolean): {
  status: number
  body: unknown
} {
  const meeting = state.meetingsSeed.meetings.find((item) => item.sessionId === sessionId)
  if (!meeting) return { status: 404, body: { error: 'meeting_not_found' } }
  const candidate = meeting.candidates.find((item) => item.memberId === memberId)
  if (!candidate) return { status: 404, body: { error: 'member_not_found' } }
  if (candidate?.isDeleted) return { status: 422, body: { error: 'member_deleted' } }
  const exists = meeting.attendees.some((item) => item.memberId === memberId)
  if (attended && exists) {
    return { status: 409, body: { error: 'attendance_already_recorded' } }
  }
  if (attended) {
    meeting.attendees = [
      ...meeting.attendees,
      { memberId, assignedAt: '2026-05-15T00:00:00.000Z', assignedBy: 'admin-1' },
    ]
    return { status: 200, body: { ok: true, attended: true } }
  }
  meeting.attendees = meeting.attendees.filter((item) => item.memberId !== memberId)
  return { status: 200, body: { ok: true, attended: false } }
}

type ImportRow = { memberId?: string; email?: string }

function importAttendance(sessionId: string, rows: ImportRow[], dryRun: boolean): {
  status: number
  body: unknown
} {
  const meeting = state.meetingsSeed.meetings.find((item) => item.sessionId === sessionId)
  if (!meeting) return { status: 404, body: { ok: false, error: 'session_not_found' } }
  if (rows.length > 500) {
    return { status: 413, body: { ok: false, error: 'payload_too_large', maxRows: 500 } }
  }
  const seen = new Set<string>()
  const results = rows.map((row, index) => {
    const memberId = row.memberId?.trim()
    const email = row.email?.trim().toLowerCase()
    const resolvedId = memberId || email?.replace(/@example\.test$/, '')
    const candidate = resolvedId
      ? meeting.candidates.find((item) => item.memberId === resolvedId)
      : undefined
    if (!resolvedId) return { index, status: 'invalid', message: 'memberId_or_email_required' }
    if (!candidate) return { index, status: 'unknown_member', message: 'member_not_found' }
    if (candidate.isDeleted) {
      return { index, status: 'deleted_member', memberId: candidate.memberId }
    }
    if (meeting.attendees.some((item) => item.memberId === candidate.memberId) || seen.has(candidate.memberId)) {
      return { index, status: 'duplicate', memberId: candidate.memberId }
    }
    seen.add(candidate.memberId)
    return { index, status: 'ok', memberId: candidate.memberId }
  })
  const summary = {
    total: results.length,
    ok: results.filter((row) => row.status === 'ok').length,
    duplicate: results.filter((row) => row.status === 'duplicate').length,
    deletedMember: results.filter((row) => row.status === 'deleted_member').length,
    unknownMember: results.filter((row) => row.status === 'unknown_member').length,
    invalid: results.filter((row) => row.status === 'invalid').length,
  }
  const committed = !dryRun && summary.ok === summary.total && summary.total > 0
  if (committed) {
    meeting.attendees = [
      ...meeting.attendees,
      ...results
        .filter((row): row is { index: number; status: 'ok'; memberId: string } => row.status === 'ok')
        .map((row) => ({
          memberId: row.memberId,
          assignedAt: '2026-05-15T00:00:00.000Z',
          assignedBy: 'admin-1',
        })),
    ]
  }
  return {
    status: 200,
    body: { ok: true, summary, rows: results, dryRun, committed },
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += String(chunk)
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function adminMemberDetailBody(memberId: string) {
  return {
    identityMemberId: memberId,
    identityEmail: `${memberId}@example.test`,
    status: {
      publicConsent: 'consented',
      rulesConsent: 'consented',
      publishState: 'public',
      isDeleted: false,
    },
    audit: [
      {
        occurredAt: '2026-05-10T01:00:00.000Z',
        actor: 'admin@example.test',
        action: 'admin.member.status_updated',
        note: 'fixture',
      },
    ],
  }
}

async function ensureMockApi(): Promise<void> {
  if (serverPromise) return serverPromise
  serverPromise = new Promise((resolve, reject) => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${MOCK_API_PORT}`)
      if (req.method === 'GET' && url.pathname === '/__test__/health') {
        response(res, 200, { ok: true })
        return
      }
      if (req.method === 'GET' && url.pathname === '/me') {
        response(res, 200, {
          user: {
            memberId: 'm-1',
            responseId: 'r-1',
            email: 'm-1@example.test',
            isAdmin: false,
            authGateState: 'active',
          },
          authGateState: 'active',
        })
        return
      }
      if (req.method === 'GET' && url.pathname === '/me/profile') {
        response(res, 200, profileBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/public/stats') {
        response(res, 200, buildStats({ generatedAt: '2026-05-12T00:00:00.000Z' }))
        return
      }
      if (req.method === 'GET' && url.pathname === '/public/members') {
        response(res, 200, publicMembersBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/public/members/sample-001') {
        response(res, 200, publicMemberProfileBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/public/form-preview') {
        response(res, 200, buildPreview())
        return
      }
      if (req.method === 'GET' && url.pathname === '/admin/dashboard') {
        response(res, 200, adminDashboardBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/admin/members') {
        response(res, 200, adminMembersBody(url.searchParams))
        return
      }
      if (req.method === 'GET' && url.pathname === '/admin/meetings') {
        response(res, 200, meetingsListBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/admin/tags/queue') {
        response(res, 200, adminTagsQueueBody(url.searchParams))
        return
      }
      const meetingDetailMatch = url.pathname.match(/^\/admin\/meetings\/([^/]+)$/)
      if (req.method === 'GET' && meetingDetailMatch?.[1]) {
        const detail = meetingDetailBody(decodeURIComponent(meetingDetailMatch[1]))
        response(res, detail ? 200 : 404, detail ?? { error: 'meeting_not_found' })
        return
      }
      const attendanceMatch = url.pathname.match(/^\/admin\/meetings\/([^/]+)\/attendances$/)
      if (req.method === 'POST' && attendanceMatch?.[1]) {
        readJson(req)
          .then((body) => {
            const parsed = body as { memberId?: string; attended?: boolean }
            if (!parsed.memberId || typeof parsed.attended !== 'boolean') {
              response(res, 400, { error: 'invalid_attendance_body' })
              return
            }
            const result = updateAttendance(
              decodeURIComponent(attendanceMatch[1]),
              parsed.memberId,
              parsed.attended,
            )
            response(res, result.status, result.body)
          })
          .catch(() => response(res, 400, { error: 'invalid_json' }))
        return
      }
      const attendanceImportMatch = url.pathname.match(
        /^\/admin\/meetings\/([^/]+)\/attendance\/import$/,
      )
      if (req.method === 'POST' && attendanceImportMatch?.[1]) {
        readJson(req)
          .then((body) => {
            const parsed = body as { rows?: ImportRow[] }
            if (!Array.isArray(parsed.rows)) {
              response(res, 400, { ok: false, error: 'invalid_payload' })
              return
            }
            const result = importAttendance(
              decodeURIComponent(attendanceImportMatch[1]),
              parsed.rows,
              url.searchParams.get('dryRun') !== 'false',
            )
            response(res, result.status, result.body)
          })
          .catch(() => response(res, 400, { ok: false, error: 'invalid_json' }))
        return
      }
      if (req.method === 'POST' && url.pathname === '/__test__/seed-meetings') {
        readJson(req)
          .then((body) => {
            state.meetingsSeed = body as MockMeetingsSeed
            response(res, 200, { ok: true })
          })
          .catch(() => response(res, 400, { error: 'invalid_json' }))
        return
      }
      if (req.method === 'POST' && url.pathname === '/__test__/reset') {
        state.pendingRequests = {}
        delete state.visibilityPost
        delete state.adminDashboardUnresolvedSchema
        state.meetingsSeed = defaultAttendanceSeed()
        response(res, 200, { ok: true })
        return
      }
      const memberDetailMatch = url.pathname.match(/^\/admin\/members\/([^/]+)$/)
      if (req.method === 'GET' && memberDetailMatch?.[1]) {
        response(res, 200, adminMemberDetailBody(memberDetailMatch[1]))
        return
      }
      if (
        (req.method === 'PATCH' || req.method === 'POST') &&
        url.pathname.startsWith('/admin/members/')
      ) {
        response(res, 200, { ok: true })
        return
      }
      if (req.method === 'POST' && url.pathname === '/me/visibility-request') {
        if (state.visibilityPost) {
          response(res, state.visibilityPost.status, state.visibilityPost.body)
          return
        }
        let raw = ''
        req.on('data', (chunk) => {
          raw += String(chunk)
        })
        req.on('end', () => {
          const parsed = raw ? JSON.parse(raw) as { reason?: string } : {}
          if (parsed.reason === '__invalid__') {
            response(res, 422, { error: 'INVALID_REQUEST' })
            return
          }
          if (parsed.reason === '__server__') {
            response(res, 500, { error: 'UPSTREAM_500' })
            return
          }
          state.pendingRequests.visibility = {
            queueId: 'q1',
            status: 'pending',
            createdAt: '2026-05-09T00:00:00.000Z',
            desiredState: 'hidden',
          }
          response(res, 202, {
            queueId: 'q1',
            type: 'visibility_request',
            status: 'pending',
            createdAt: state.pendingRequests.visibility.createdAt,
          })
        })
        return
      }
      if (req.method === 'POST' && url.pathname === '/me/delete-request') {
        state.pendingRequests.delete = {
          queueId: 'q2',
          status: 'pending',
          createdAt: '2026-05-09T00:00:00.000Z',
        }
        response(res, 202, {
          queueId: 'q2',
          type: 'delete_request',
          status: 'pending',
          createdAt: state.pendingRequests.delete.createdAt,
        })
        return
      }
      response(res, 404, { error: 'MOCK_API_NOT_FOUND', path: url.pathname })
    })
    server.once('error', async (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        try {
          await waitForMockApiReady()
          resolve()
        } catch (error) {
          reject(error)
        }
        return
      }
      reject(err)
    })
    server.listen(MOCK_API_PORT, '127.0.0.1', () => {
      waitForMockApiReady().then(resolve, reject)
    })
  })
  return serverPromise
}

const mockApi: MockApi = {
  reset: async () => {
    state.pendingRequests = {}
    delete state.visibilityPost
    delete state.adminDashboardUnresolvedSchema
    state.meetingsSeed = defaultAttendanceSeed()
    await postControl('/__test__/reset')
  },
  setVisibilityPending: async (createdAt = '2026-05-09T00:00:00.000Z') => {
    state.pendingRequests.visibility = {
      queueId: 'q1',
      status: 'pending',
      createdAt,
      desiredState: 'hidden',
    }
    await postControl('/__test__/seed-pending', {
      visibility: { desiredState: 'hidden' },
    })
  },
  setDeletePending: async (createdAt = '2026-05-09T00:00:00.000Z') => {
    state.pendingRequests.delete = {
      queueId: 'q2',
      status: 'pending',
      createdAt,
    }
    await postControl('/__test__/seed-pending', { delete: true })
  },
  setVisibilityError: (status, body) => {
    state.visibilityPost = { status, body }
  },
  setAdminDashboardUnresolvedSchema: async (count) => {
    state.adminDashboardUnresolvedSchema = count
    await postControl('/__test__/admin-dashboard', { unresolvedSchema: count })
  },
  seedMeetings: async (seed = defaultAttendanceSeed()) => {
    state.meetingsSeed = seed
    await postControl('/__test__/seed-meetings', seed)
  },
  seedUnregisteredMeeting: async () => {
    const seed = unregisteredAttendanceSeed()
    state.meetingsSeed = seed
    await postControl('/__test__/seed-meetings', seed)
  },
}

async function signSession(payload: {
  adminUserId?: string
  memberId?: string
}): Promise<string> {
  const memberId = payload.memberId ?? payload.adminUserId ?? 'admin-1'
  return signSessionJwt(E2E_AUTH_SECRET, {
    memberId: memberId as MemberId,
    email: `${memberId}@example.test`,
    isAdmin: Boolean(payload.adminUserId),
  })
}

async function addSessionCookie(
  ctx: BrowserContext,
  payload: { adminUserId?: string; memberId?: string },
  baseURL?: string,
): Promise<void> {
  const url = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  await ctx.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: await signSession(payload),
      url,
    },
  ])
}

export async function adminLogin(ctx: BrowserContext): Promise<void> {
  await addSessionCookie(ctx, { adminUserId: 'admin-1' })
}

export async function memberLogin(ctx: BrowserContext): Promise<void> {
  await addSessionCookie(ctx, { memberId: 'm-1' })
}

export const test = base.extend<AuthFixtures>({
  mockApi: async ({}, use) => {
    await ensureMockApi()
    await mockApi.reset()
    await use(mockApi)
    await mockApi.reset()
  },
  adminContext: async ({ browser, baseURL, mockApi }, use) => {
    void mockApi
    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'x-ubm-auth-secret': E2E_AUTH_SECRET },
    })
    await addSessionCookie(ctx, { adminUserId: 'admin-1' }, baseURL)
    await use(ctx)
    await ctx.close()
  },
  memberContext: async ({ browser, baseURL, mockApi }, use) => {
    void mockApi
    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'x-ubm-auth-secret': E2E_AUTH_SECRET },
    })
    await addSessionCookie(ctx, { memberId: 'm-1' }, baseURL)
    await use(ctx)
    await ctx.close()
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage()
    await use(page)
  },
  memberPage: async ({ memberContext }, use) => {
    const page = await memberContext.newPage()
    await use(page)
  },
  anonymousPage: async ({ browser }, use) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect }
