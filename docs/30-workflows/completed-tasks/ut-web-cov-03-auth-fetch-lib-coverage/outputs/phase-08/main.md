# outputs phase 08: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装仕様書]

- status: planned
- purpose: DRY decision log
- evidence: `apps/web/src/test-utils/fetch-mock.ts` 配置 + 全 test 緑（実装時に capture）

## 重複検出マトリクス

| mock pattern | 使用 test file | 出現数 | DRY 判定 | 抽出先 |
|---|---|---|---|---|
| fetch spy + Response factory | magic-link-client / authed / public / auth | 4 | ◯ | `test-utils/fetch-mock.ts` |
| `vi.mock("@opennextjs/cloudflare")` | public / authed | 2 | × | inline |
| `vi.mock("next/headers")` cookies | authed | 1 | × | inline |
| `vi.mock("next-auth/react")` | oauth-client | 1 | × | inline |
| Auth.js provider factory | auth | 1 | × | inline |
| `vi.mock("@/lib/auth")` getAuth | session | 1 | × | inline |

判定基準: **3 ファイル以上で同一 pattern**の場合のみ抽出。

## 抽出する helper

`apps/web/src/test-utils/fetch-mock.ts`

```ts
export function mockFetchOnce(status: number, body: unknown, init?: ResponseInit): MockInstance;
export function mockFetchSequence(responses: Array<{ status: number; body: unknown; init?: ResponseInit }>): void;
export function mockFetchNetworkError(message?: string): void;
export function restoreFetch(): void;
```

## 命名・配置規約

- 配置: `apps/web/src/test-utils/<concern>-mock.ts`
- 名詞-mock.ts、named export のみ、default export 禁止。

## 置換差分方針

| test file | 置換前 | 置換後 |
|---|---|---|
| magic-link-client.test.ts | `vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(...))` | `mockFetchOnce(202, { state: "sent" })` |
| fetch/authed.test.ts | 同上 | `mockFetchOnce(401, "")` / `mockFetchNetworkError()` |
| fetch/public.test.ts | 同上 | `mockFetchOnce(200, body)` |
| auth.test.ts | 同上 | `mockFetchOnce(200, { memberId: "m1" })` 等 |

## DoD

- helper 実装済み。
- 4 ファイルが helper 経由に置換済み。
- 全 test 緑、coverage 維持（≥85% / ≥80%）。
- 単一ファイル使用 mock は inline のままで過剰抽出していない。
