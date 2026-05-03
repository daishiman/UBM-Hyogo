# Phase 2 成果物 — ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: pending（実装フェーズで実測 capture）
- purpose: 設計
- evidence: <TBD: 実装・実測時に capture。仕様書作成時点では placeholder>

## 設計サマリ

7 ファイル別テストケース表 + mock 戦略 + test helper 配置を確定。既存 lib コードは原則非改変。

## テストケース表（要約）

### auth.ts → auth.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| AUTH-001 | happy | fetchSessionResolve 200 → ok:true |
| AUTH-002 | token-missing | 200+user=null → reason:no-user |
| AUTH-003 | token-invalid | 401 → reason:unauthorized |
| AUTH-004 | network-fail | reject → reason:network |
| AUTH-005 | happy | buildAuthConfig providers 確認 |
| AUTH-006 | callback signIn allow | admin allowed → true |
| AUTH-007 | callback signIn deny | domain mismatch → false |
| AUTH-008 | callback jwt | first sign-in role 付与 |
| AUTH-009 | callback session | role 一致 |
| AUTH-010 | getAuth lazy | 1 回のみ初期化 |

### magic-link-client.ts → magic-link-client.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| ML-001 | happy | POST 200 |
| ML-002 | error | 400+state JSON |
| ML-003 | error | 500 plain |
| ML-004 | network-fail | reject |
| ML-005/006 | predicate | isLoginGateState true/false |

### oauth-client.ts → oauth-client.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| OA-001 | happy | signIn("google",{callbackUrl:"/"}) |
| OA-002 | happy | redirect=/me |
| OA-003 | error | reject re-throw |

### session.ts → session.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| SES-001 | happy | auth() ok → SessionUser |
| SES-002 | null | auth() null → null |
| SES-003 | error | auth() reject 挙動 |

### fetch/authed.ts → authed.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| FA-001 | 200 | T 返却 + Cookie 転送 |
| FA-002 | 401 | AuthRequiredError |
| FA-003 | 403 | FetchAuthedError(403) |
| FA-004 | 5xx | FetchAuthedError(500) |
| FA-005 | network | FetchAuthedError |
| FA-006 | edge | json() throw |

### fetch/public.ts → public.test.ts

| ID | 種別 | 概要 |
| --- | --- | --- |
| FP-001 | 200 SB | service-binding 経路 |
| FP-002 | 200 fetch | 通常 fetch 経路 |
| FP-003 | 404 | OrNotFound → FetchPublicNotFoundError |
| FP-004 | 404 | fetchPublic throw |
| FP-005 | 5xx | throw |
| FP-006 | network | throw |

## mock 戦略

| 対象 | 戦略 |
| --- | --- |
| auth.ts | DI（fetchImpl/providerFactories）+ vi.mock("@opennextjs/cloudflare") + vi.stubEnv |
| magic-link-client.ts | global fetch mock |
| oauth-client.ts | vi.mock("next-auth/react") |
| session.ts | vi.mock("./auth") |
| fetch/authed.ts | vi.mock("next/headers") + global fetch mock |
| fetch/public.ts | vi.mock("@opennextjs/cloudflare") + global fetch mock |

## test helper

- `apps/web/src/test-utils/fetch-mock.ts` 新規作成
- API: `installFetchMock()` / `mockJsonResponse(status, body)` / `mockNetworkError()`

## 変更対象ファイル

- 新規 test 6 + helper 1（+ AC-4 採用ルートで `me-types.test-d.ts`）
- 既存実装: 変更なし

## 次 Phase への引き継ぎ

テストケース表 / mock 戦略 / helper API / 変更対象ファイル一覧 / 関数シグネチャを Phase 3 レビューへ。
