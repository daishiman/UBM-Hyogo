# architecture.md — provider / callback / admin gate の構造図

## 全体フロー（Mermaid）

```mermaid
flowchart LR
  Browser[ブラウザ]

  subgraph WebWorker[apps/web Cloudflare Worker]
    WebPages[Pages /login /profile /admin/*]
    Authjs[Auth.js v5 instance]
    GoogleProv[GoogleProvider]
    MWEdge[middleware.ts edge runtime]
    SessionResolveClient[session-resolve client]
  end

  subgraph ApiWorker[apps/api Cloudflare Worker Hono]
    AuthRoute[/auth/session-resolve/]
    InternalAuth[internal-auth middleware]
    RequireAuth[requireAuth middleware]
    RequireAdmin[requireAdmin middleware]
    AdminEndpoints[/admin/* endpoints/]
    MeEndpoints[/me/* endpoints/]
    RepoIdent[(member_identities + member_status)]
    RepoAdmin[(admin_users)]
  end

  Google[Google OAuth 2.0]
  D1[(Cloudflare D1)]
  SessionJWT[(JWT memberId isAdmin email)]

  Browser -->|signIn google| WebPages
  WebPages --> Authjs
  Authjs --> GoogleProv
  GoogleProv -->|OAuth redirect| Google
  Google -->|callback profile.email| Authjs
  Authjs -->|signIn callback| SessionResolveClient
  SessionResolveClient -->|GET email + X-Internal-Auth| AuthRoute
  AuthRoute --> InternalAuth
  InternalAuth --> RepoIdent
  InternalAuth --> RepoAdmin
  RepoIdent --> D1
  RepoAdmin --> D1
  AuthRoute -->|memberId isAdmin gateReason| SessionResolveClient
  SessionResolveClient --> Authjs
  Authjs -->|jwt callback HS256 AUTH_SECRET| SessionJWT
  SessionJWT --> Browser

  Browser -->|/admin/* page request cookie| MWEdge
  MWEdge -->|verify JWT + isAdmin| SessionJWT
  MWEdge -->|isAdmin true| WebPages
  MWEdge -->|isAdmin false| Login[redirect /login?gate=admin_required]

  Browser -->|/admin/* API call cookie or Bearer| RequireAdmin
  RequireAdmin --> RequireAuth
  RequireAuth -->|verify JWT| SessionJWT
  RequireAdmin -->|isAdmin true| AdminEndpoints
  RequireAdmin -->|isAdmin false| Forbidden[401/403]
  AdminEndpoints --> D1

  Browser -->|/me/* API call cookie or Bearer| RequireAuth
  RequireAuth --> MeEndpoints
  MeEndpoints --> D1
```

## レイヤー分離

| レイヤー | 配置 | 責務 |
| --- | --- | --- |
| UI / OAuth client | apps/web | Auth.js GoogleProvider, callback, JWT 発行, edge middleware |
| Internal Auth boundary | apps/web ↔ apps/api | Worker-to-Worker 認証（INTERNAL_AUTH_SECRET） |
| Identity resolution | apps/api | member_identities lookup, admin_users lookup |
| Data access | apps/api → D1 binding | 不変条件 #5（apps/web から D1 直接禁止） |

## sign-in シーケンス

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as apps/web Auth.js
  participant G as Google OAuth
  participant A as apps/api /auth/session-resolve
  participant D as D1

  B->>W: GET /api/auth/signin/google
  W->>G: OAuth redirect (client_id, scope=email,profile)
  G-->>B: consent screen
  B->>G: approve
  G-->>W: callback with profile (email, email_verified, name)
  W->>W: signIn callback fires
  W->>A: GET /auth/session-resolve?email=... (X-Internal-Auth)
  A->>D: SELECT member_identities JOIN member_status WHERE response_email=?
  D-->>A: { memberId, isDeleted, rulesConsent } | null
  alt 未登録
    A-->>W: { memberId: null, gateReason: "unregistered" }
    W-->>B: redirect /login?gate=unregistered
  else 削除済
    A-->>W: { memberId: null, gateReason: "deleted" }
    W-->>B: redirect /login?gate=deleted
  else 規約未同意
    A-->>W: { memberId: null, gateReason: "rules_declined" }
    W-->>B: redirect /login?gate=rules_declined
  else 全条件 OK
    A->>D: SELECT * FROM admin_users WHERE email=? AND active=1
    D-->>A: AdminUserRow | null
    A-->>W: { memberId, isAdmin, gateReason: null }
    W->>W: jwt callback → token = {memberId, isAdmin, email, name}
    W->>W: session callback → session.user = SessionUser
    W-->>B: Set-Cookie session JWT (HS256, exp=24h) + redirect /profile
  end
```

## /admin/* page access シーケンス（middleware）

```mermaid
sequenceDiagram
  participant B as Browser
  participant M as apps/web/middleware.ts (edge)
  participant J as JWT verifier (Web Crypto)
  participant P as Admin Pages

  B->>M: GET /admin/members (cookie: session)
  M->>J: getToken({ secret: AUTH_SECRET, raw: false })
  alt no cookie / invalid signature
    J-->>M: null
    M-->>B: 302 /login?gate=admin_required
  else valid JWT but isAdmin=false
    J-->>M: { memberId, isAdmin: false }
    M-->>B: 302 /login?gate=admin_required
  else valid JWT and isAdmin=true
    J-->>M: { memberId, isAdmin: true }
    M->>P: next()
    P-->>B: 200 admin page HTML
  end
```

## /admin/* API access シーケンス（requireAdmin）

```mermaid
sequenceDiagram
  participant B as Browser / Server Action
  participant H as Hono /admin/*
  participant RA as requireAdmin middleware
  participant E as endpoint handler

  B->>H: POST /admin/members/:id/publish (cookie or Authorization: Bearer)
  H->>RA: middleware chain
  RA->>RA: extract JWT (cookie or Bearer)
  alt no token
    RA-->>B: 401 unauthorized
  else verify fail
    RA-->>B: 401 unauthorized (signature mismatch)
  else valid but isAdmin=false
    RA-->>B: 403 forbidden
  else valid and isAdmin=true
    RA->>E: c.set("user", { memberId, isAdmin }); next()
    E-->>B: 200 OK
  end
```

## 不変条件カバレッジ

| 不変条件 | 図中の対応箇所 |
| --- | --- |
| #5 (apps/web→D1 直接禁止) | apps/web は session-resolve 経由のみ、D1 への矢印は apps/api からのみ |
| #7 (responseId と memberId 分離) | JWT には memberId のみ、responseId 矢印無し |
| #9 (`/no-access` 不依存) | gateReason に応じた `/login?gate=...` redirect のみ |
| #10 (無料枠) | sessions テーブル無し、JWT のみ |
| #11 (admin gate 二段) | UI middleware と API requireAdmin の両方を経由 |
