# Phase 6: テスト拡充（fail path / regression guard）

## 6.1 追加テストケース

| ID    | 対象                                     | ケース                                                                        |
| ----- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| TC-E1 | `authed.spec.ts`                          | `getApiBaseEnv()` mock が両方 undefined → `fetchAuthed("/me")` が throw（fail-fast） |
| TC-E2 | `authed.spec.ts`                          | API レスポンスが 500 のとき `fetchAuthed` が `FetchAuthedError` を throw      |
| TC-E3 | `authed.spec.ts`                          | API レスポンスが 401 のとき `AuthRequiredError` を throw                       |
| TC-E4 | `authed.spec.ts`                          | source 静的検査で `process.env[` 0 件、`127.0.0.1` 0 件を fixture として固定  |
| TC-P1 | `profile/page.spec.tsx`        | `/me` 500 → SectionError UI 返却（throw しない）                              |
| TC-P2 | `profile/page.spec.tsx`        | `/me` 401 → `/login?redirect=/profile` redirect                                |
| TC-P3 | `profile/page.spec.tsx`        | `/me` 成功 + `/me/profile` 失敗 → 既存 SectionError UI（regression）          |

## 6.2 grep gate（CI 固定）

`apps/web/src/lib/fetch/authed.ts` 内で以下を 0 件固定する:

```bash
grep -c "process\.env\[" apps/web/src/lib/fetch/authed.ts
# 期待: 0

grep -c "127\.0\.0\.1" apps/web/src/lib/fetch/authed.ts
# 期待: 0
```

spec ファイル内に `readFileSync` で source を読み、`expect(source).not.toContain("process.env[")` と `expect(source).not.toContain("127.0.0.1")` を assertion として組み込む。

## 6.3 fixture / production parity 確認

| 経路                          | 確認                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| Node test runtime + mocked env | `vi.mock("@/lib/env")` で `getApiBaseEnv()` を制御し各分岐を検証 |
| Workers runtime + 実 API      | `getApiBaseEnv()` 経由で `https://ubm-hyogo-api-staging...` に到達 |
| Workers runtime + 不正 binding | env 解決 throw → `/profile/error.tsx` で digest 表示       |
