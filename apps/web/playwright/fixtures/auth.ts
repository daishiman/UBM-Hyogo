import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'
import { signSessionJwt, type MemberId } from '@ubm-hyogo/shared'
import { createServer, type Server, type ServerResponse } from 'node:http'

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
}

type MockApi = {
  reset: () => Promise<void>
  setVisibilityPending: (createdAt?: string) => Promise<void>
  setDeletePending: (createdAt?: string) => Promise<void>
  setVisibilityError: (status: number, body: unknown) => void
  setAdminDashboardUnresolvedSchema: (count: number) => Promise<void>
}

const STANDALONE_BASE = `http://127.0.0.1:${MOCK_API_PORT}`

async function postControl(path: string, body?: unknown): Promise<void> {
  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }
    if (body !== undefined) init.body = JSON.stringify(body)
    await fetch(`${STANDALONE_BASE}${path}`, init)
  } catch {
    // standalone mock 未起動 (local dev) はフォールバック (内蔵 server で処理)
  }
}

const state: MockApiState = { pendingRequests: {} }
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

function adminMembersBody(query: URLSearchParams) {
  const q = query.get('q') ?? ''
  const baseMembers = [
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
      if (req.method === 'GET' && url.pathname === '/admin/dashboard') {
        response(res, 200, adminDashboardBody())
        return
      }
      if (req.method === 'GET' && url.pathname === '/admin/members') {
        response(res, 200, adminMembersBody(url.searchParams))
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
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve()
        return
      }
      reject(err)
    })
    server.listen(MOCK_API_PORT, '127.0.0.1', () => resolve())
  })
  return serverPromise
}

const mockApi: MockApi = {
  reset: async () => {
    state.pendingRequests = {}
    delete state.visibilityPost
    delete state.adminDashboardUnresolvedSchema
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
    await ctx.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: await signSession({ adminUserId: 'admin-1' }),
        url: baseURL ?? 'http://localhost:3000',
      },
    ])
    await use(ctx)
    await ctx.close()
  },
  memberContext: async ({ browser, baseURL, mockApi }, use) => {
    void mockApi
    const ctx = await browser.newContext({
      extraHTTPHeaders: { 'x-ubm-auth-secret': E2E_AUTH_SECRET },
    })
    await ctx.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: await signSession({ memberId: 'm-1' }),
        url: baseURL ?? 'http://localhost:3000',
      },
    ])
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
