# Phase 4: テスト作成（TDD Red）

## 4.1 追加・更新テストファイル

| パス | 種類 | 目的 |
| --- | --- | --- |
| `apps/web/src/lib/fetch/authed.spec.ts` | unit (vitest) | 既存 spec を更新し、`getApiBaseEnv()` 経路で base URL を解決すること、`process.env` 直接参照が無いこと、env 未解決時に throw することを固定 |
| `apps/web/app/(member)/profile/page.spec.tsx`（または既存 `apps/web/app/(member)/profile/page.spec.tsx` へ追記） | unit (vitest) | `/me` 5xx 時に throw せず SectionError UI を返すこと、`/me` 401 時に `/login?redirect=/profile` へ redirect することを固定 |

## 4.2 TDD Red 期待

実装前は:

1. `authed.ts` が `process.env["INTERNAL_API_BASE_URL"]` を使うため、`getApiBaseEnv()` mock 経由 URL の assertion が fail
2. `profile/page.tsx` が初回 `/me` 失敗時に `throw err;` するため、SectionError UI 返却の assertion が fail

## 4.3 ケース表

| ID | 対象 spec | ケース | 期待 |
| --- | --- | --- | --- |
| TC-A1 | `authed.spec.ts` | `getApiBaseEnv()` mock が `INTERNAL_API_BASE_URL` を返す | `fetchAuthed` が当該 base URL に対して fetch する |
| TC-A2 | `authed.spec.ts` | `getApiBaseEnv()` mock が INTERNAL 未設定で PUBLIC のみ返す | PUBLIC 側を採用 |
| TC-A3 | `authed.spec.ts` | `getApiBaseEnv()` mock が両方未設定 / throw | `fetchAuthed` が throw（fail-fast、localhost fallback には進まない） |
| TC-A4 | `authed.spec.ts` | grep / static assertion | spec 内で `expect(authedSource).not.toContain("process.env[")` および `expect(authedSource).not.toContain("127.0.0.1")` を fixture として固定 |
| TC-P1 | `profile/page.spec.tsx` | `/me` が `FetchAuthedError(500)` を throw | SectionError UI が描画される（`throw` しない） |
| TC-P2 | `profile/page.spec.tsx` | `/me` が `AuthRequiredError` を throw | `/login?redirect=/profile` へ redirect |
| TC-P3 | `profile/page.spec.tsx` | `/me` 成功 + `/me/profile` 成功 | 既存 profile UI 描画（regression） |

## 4.4 Phase 2 命名規則整合チェック

- ファイル名: `*.spec.ts` / `*.spec.tsx`（`*.test.*` 禁止）
- mock 戦略: `vi.mock("@/lib/env")`、`vi.mock("@/lib/fetch/authed")`、`vi.mock("next/navigation")`
- regression 対象: `fetchAuthed()` public behavior 経由で private env resolver を観測、`ProfilePage` server component の return 値を観測

## 4.5 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  "apps/web/app/(member)/profile/page.spec.tsx"
```
