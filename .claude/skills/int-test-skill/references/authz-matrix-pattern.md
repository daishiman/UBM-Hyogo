# Authorization Matrix Test Pattern

> role × resource × action の組合せを網羅する authz テスト pattern。
> 08a タスク（`docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`）の `apps/api/src/__tests__/authz-matrix.test.ts` を canonical 例とする。

## 設計原則

1. **代表 matrix を 1 ファイル集約 + 個別 endpoint は route test に委譲**: 全 endpoint × 全 role の総当たりを単一ファイルに詰めると保守不能になる。代表として「公開 / 認証必須 / admin only」の 3 層分類を 1 ファイル集約し、resource × action の細かい matrix は route 個別 test に委譲する。
2. **positive / negative path は必ずペア生成**: `admin が admin route を叩ける` だけでなく `non-admin が admin route で 403 を受ける` を必ず観測。片方だけだと middleware が抜けても気付かない。
3. **fixture は最小生成、shared session helper を使う**: JWT / Auth.js cookie session の fixture を test ごとに inline 生成しない。共通 helper（`createAdminSession()` / `createMemberSession()` / `createUnauthenticated()`）を 1 箇所に集約する。
4. **role 軸の網羅性を 1 ファイルで担保、resource × action は route 側**: `authz-matrix.test.ts` は role 軸の漏れ（role を 1 つ追加したのに matrix 更新を忘れた）を検出する責務に特化する。

## 役割の 3 層分類

| 層 | 認証 | role | 例 endpoint |
|---|---|---|---|
| 公開 | 不要 | none | `GET /` / `GET /members` / `GET /members/:id` / `POST /register` |
| 認証必須（一般会員） | 必要 | member | `GET /me` / `GET /me/profile` / `GET /me/attendance` |
| admin only | 必要 + admin gate | admin | `GET /admin/*` / `POST /admin/*` / `DELETE /admin/*` |

## 代表 matrix の構造

```ts
// apps/api/src/__tests__/authz-matrix.test.ts
const PUBLIC_ENDPOINTS = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/members' },
  // ...
];
const MEMBER_ENDPOINTS = [
  { method: 'GET', path: '/me' },
  // ...
];
const ADMIN_ENDPOINTS = [
  { method: 'GET', path: '/admin/members' },
  // ...
];

describe('authz: 公開 endpoint', () => {
  for (const ep of PUBLIC_ENDPOINTS) {
    it(`${ep.method} ${ep.path}: unauthenticated でも 200 / 404 / 422 等の non-401`, async () => { /* ... */ });
  }
});

describe('authz: 認証必須 endpoint', () => {
  for (const ep of MEMBER_ENDPOINTS) {
    it(`${ep.method} ${ep.path}: unauthenticated は 401`, async () => { /* ... */ });
    it(`${ep.method} ${ep.path}: member は 200 / 404 等の non-401/403`, async () => { /* ... */ });
  }
});

describe('authz: admin only endpoint', () => {
  for (const ep of ADMIN_ENDPOINTS) {
    it(`${ep.method} ${ep.path}: unauthenticated は 401`, async () => { /* ... */ });
    it(`${ep.method} ${ep.path}: member は 403`, async () => { /* ... */ });
    it(`${ep.method} ${ep.path}: admin は 200 / 404 等の non-401/403`, async () => { /* ... */ });
  }
});
```

## fixture の最小生成

```ts
// apps/api/src/__tests__/__helpers__/sessions.ts
export function createUnauthenticated(): RequestInit {
  return { headers: {} };
}

export function createMemberSession(memberId = 'member-001'): RequestInit {
  // Auth.js の cookie session fixture
  return { headers: { Cookie: signCookie({ memberId, role: 'member' }) } };
}

export function createAdminSession(memberId = 'admin-001'): RequestInit {
  return { headers: { Cookie: signCookie({ memberId, role: 'admin' }) } };
}
```

`signCookie` は test 用の固定 secret で署名し、production secret は触らない。

## positive / negative ペアの必須化

| pair | positive | negative |
|---|---|---|
| 公開 endpoint | unauthenticated でアクセス可 | （該当なし。401 を返してはならない） |
| 認証必須 endpoint | member でアクセス可 | unauthenticated → 401 |
| admin only endpoint | admin でアクセス可 | unauthenticated → 401, member → 403 |

negative のうち unauthenticated → 401 と member → 403 が両方落ちることを必ず観測する。`require-admin` middleware が誤って member を通すバグは positive のみでは検出できない。

## アンチパターン

- ❌ admin endpoint で `it('admin can access', ...)` のみ書いて member denial を検証しない
- ❌ JWT fixture を test ごとに inline 生成（drift の温床）
- ❌ 401 と 403 を区別しない assert（`expect(res.status).toBeGreaterThanOrEqual(400)`）
- ❌ matrix を array literal で書かず、各 it を個別記述（role 追加時に漏れる）
- ❌ session fixture に production secret を埋め込む

## 関連 reference

- [api-contract-test-pattern.md](api-contract-test-pattern.md) — contract test の status / shape 観測
- [d1-mock-factory-setup.md](d1-mock-factory-setup.md) — D1 binding mock
- [patterns.md](patterns.md) — 汎用実行パターン集
