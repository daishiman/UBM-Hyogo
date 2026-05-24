# Phase 5: 実装（TDD Green）

## 5.1 変更対象ファイル

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | 編集 | runtime env 解決を `getEnv()` 経由へ変更し、`127.0.0.1:8787` fallback を削除 |
| `apps/web/src/lib/env.ts` | 編集 | `INTERNAL_AUTH_SECRET: z.string().min(1).optional()` を `EnvSchema` に追加 |
| `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | 新規 | Cloudflare env binding と missing base URL failure の regression |
| `apps/web/src/lib/__tests__/env.spec.ts` | 編集 | `INTERNAL_AUTH_SECRET` optional schema regression |

## 5.2 実装内容

`server-fetch.ts` は `getEnv().INTERNAL_API_BASE_URL.replace(/\/$/, "")` で base URL を解決する。`FALLBACK_INTERNAL_API` は削除し、設定不備は `EnvSchema.parse` の failure として明示的に落とす。

`resolveInternalSecret()` は `getEnv().INTERNAL_AUTH_SECRET ?? ""` を返す。secret 未投入は schema parse では許容するが、API 側の internal auth で拒否される。

Playwright fixture branch の `process.env["NODE_ENV"]` / `process.env["PLAYWRIGHT_*"]` は Node/test runtime 専用の制御として維持する。Workers runtime の admin fetch 経路では fixture branch に到達しない。

## 5.3 入出力・副作用契約

| 関数 | 入力 | 正常出力 | 異常時挙動 |
| --- | --- | --- | --- |
| `resolveApiBase()` | env binding | base URL（末尾 `/` 除去済み） | `EnvSchema.parse` で throw |
| `resolveInternalSecret()` | env binding | secret 文字列 / 空文字 | `EnvSchema.parse` で throw |
| `fetchAdmin<T>()` | path / opts | T | env 解決失敗、fetch 失敗、または `!res.ok` で throw |

## 5.4 ローカル検証

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
```

Result: PASS (`2 files / 13 tests`).

## 5.5 完了条件

- [x] focused Vitest 13 tests PASS
- [x] `server-fetch.ts` runtime env 解決が `getEnv()` 経由
- [x] `FALLBACK_INTERNAL_API` 削除
- [x] `INTERNAL_AUTH_SECRET` optional schema 追加
- [ ] staging deploy 後、`/admin` が 200 で render される（user-gated）
