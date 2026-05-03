# outputs phase 06: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: planned
- purpose: 異常系チェックリスト
- evidence: `apps/web/coverage/coverage-summary.json` の Branches metric（実測時に capture）

## 異常系チェックリスト

### auth.ts

- [ ] AUTH-E01: INTERNAL_API_BASE_URL 未設定 → unregistered
- [ ] AUTH-E02: INTERNAL_AUTH_SECRET 未設定 → unregistered
- [ ] AUTH-E03: API 4xx → unregistered
- [ ] AUTH-E04: API 5xx → unregistered
- [ ] AUTH-E05: fetch network error → unregistered
- [ ] AUTH-E06: baseUrl invalid → unregistered + log
- [ ] AUTH-E07: signIn provider mismatch → false
- [ ] AUTH-E08: signIn email 空 → /login?gate=unregistered
- [ ] AUTH-E09: signIn email_verified=false → /login?gate=unregistered
- [ ] AUTH-E10: signIn memberId=null → /login?gate=<reason>
- [ ] AUTH-E11: jwt user undefined → token そのまま
- [ ] AUTH-E12..E16: CredentialsProvider authorize 各種 null fallback

### magic-link-client.ts

- [ ] MLC-E01: ok=false かつ status!==202 → MagicLinkRequestError
- [ ] MLC-E02: text() reject → message empty fallback
- [ ] MLC-E03: json() reject → state="sent" fallback
- [ ] MLC-E04: state enum 外 → "sent" fallback
- [ ] MLC-E05: isLoginGateState 型ガード true/false/非 string

### oauth-client.ts

- [ ] OAC-E01: redirect undefined → "/profile"
- [ ] OAC-E02: redirect="//evil" → "/profile"
- [ ] OAC-E03: redirect="https://evil" → "/profile"

### session.ts

- [ ] SES-E01: session=null → null
- [ ] SES-E02: user undefined → null
- [ ] SES-E03: memberId 欠損 → null
- [ ] SES-E04: email 欠損 → null

### fetch/authed.ts

- [ ] FAU-E01: path "/" 始まらない → throw
- [ ] FAU-E02: 401 → AuthRequiredError
- [ ] FAU-E03: 403 → FetchAuthedError(bodyText)
- [ ] FAU-E04: 500 → FetchAuthedError(bodyText)
- [ ] FAU-E05: text() reject → bodyText=""
- [ ] FAU-E06: cookies() 空 → cookie header 未設定
- [ ] FAU-E07: PUBLIC_API_BASE_URL のみ → public 採用
- [ ] FAU-E08: 両方なし → 127.0.0.1:8787 fallback

### fetch/public.ts

- [ ] FPU-E01: service-binding 経由
- [ ] FPU-E02: PUBLIC_API_BASE_URL fetch 経由
- [ ] FPU-E03: 404 → fetchPublicOrNotFound throws FetchPublicNotFoundError
- [ ] FPU-E04: 404 → fetchPublic throw FetchPublicNotFoundError
- [ ] FPU-E05: 500 → throw
- [ ] FPU-E06: revalidate 反映

## fail-closed / redact 規約

- auth.ts は network/4xx/5xx/parse-fail を **すべて unregistered** に統一。
- internal reason はクライアントに漏らさず `/login?gate=` の query 値のみを観測。
