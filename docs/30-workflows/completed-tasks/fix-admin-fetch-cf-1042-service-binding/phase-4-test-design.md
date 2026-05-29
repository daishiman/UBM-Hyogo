# Phase 4: テスト作成

## 追加 test ファイル

### `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`（新規）

```ts
// 概要: getCloudflareContext を mock し、env.API_SERVICE.fetch が優先されることを assert
// 参考: apps/web/src/lib/fetch/public.spec.ts の構造
```

**ケース**:

| TC | 期待 |
|----|------|
| TC-B1 | `API_SERVICE` 設定時、`binding.fetch` が `https://service-binding.local/admin/dashboard` 形式の URL で呼ばれる |
| TC-B2 | binding 経路でも `cookie` header / `x-internal-auth` header が伝搬する |
| TC-B3 | binding 経路で 404 + body `error code: 1042` のとき `admin api /admin/dashboard failed: 404 body=error code: 1042` を throw する **(regression guard for CF 1042)** |
| TC-B4 | binding 経路で body が 256 文字超のとき message は 256 文字に truncate される |

### `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`（新規）

```ts
// 概要: API_SERVICE 不在時 / test override 時に従来通り http fetch が呼ばれることを assert
```

**ケース**:

| TC | 期待 |
|----|------|
| TC-H1 | `API_SERVICE` 未設定時、`global.fetch` が `${INTERNAL_API_BASE_URL}/admin/dashboard` URL で呼ばれる |
| TC-H2 | `NODE_ENV=test` かつ `INTERNAL_API_BASE_URL` 明示 + `API_SERVICE` も存在のとき、binding を無視して HTTP fetch する（既存 spec 互換のための backdoor） |
| TC-H3 | HTTP 経路でも `x-internal-auth` / cookie / content-type の header build は binding 経路と同一になる |

## 既存 test の影響

- `apps/web/src/lib/admin/__tests__/server-fetch.spec.ts` (現行): `global.fetch` を mock している既存 spec。`NODE_ENV=test` 経路（TC-H2 と同じ条件）で動作するため、binding 導入後も green を維持できる。**もし test runner で `NODE_ENV=test` でない場合は test setup で明示**。
- `apps/web/src/lib/admin/__tests__/*.contract.spec.ts` 系: 同じく fetch mock 経由。影響なし。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## Phase 5 開始前チェック（FB-MSO-002）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/shared build
```

## DoD（Phase 4 完了条件）

- 上記 7 ケース分の test ファイルが配置されている
- 既存 server-fetch.spec.ts が引き続き存在し fail していない
