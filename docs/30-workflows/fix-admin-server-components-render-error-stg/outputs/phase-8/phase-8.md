# Phase 8: リファクタリング

## 8.1 変更内容テーブル（Feedback RT-03）

| 対象                                      | Before                                       | After                                            | 理由                                              |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `server-fetch.ts` の env 参照             | `process.env["INTERNAL_API_BASE_URL"]`       | `getEnv().INTERNAL_API_BASE_URL`                  | 不変条件「`apps/web` の env 参照は `getEnv()` 経由のみ」 |
| `server-fetch.ts` の internal secret 参照 | `process.env["INTERNAL_AUTH_SECRET"] ?? ""`  | `getEnv().INTERNAL_AUTH_SECRET ?? ""`             | 同上                                              |
| `FALLBACK_INTERNAL_API`                   | `"http://127.0.0.1:8787"`                    | （削除）                                          | CLAUDE.md「127.0.0.1 リテラル禁止」                |
| `EnvSchema`                               | （`INTERNAL_AUTH_SECRET` 未定義）            | `INTERNAL_AUTH_SECRET: z.string().min(1).optional()` | runtime で `getEnv()` 経由参照を可能にする         |

## 8.2 重複・navigation drift 削減

- `apps/web/src/lib/auth.ts` は既存 `getCloudflareContext().env` / request header injection を持つ認証境界として維持する。
  本タスクの直接原因ではないため、新規未タスク化せず runtime admin fetch の修正に閉じる。

## 8.3 navigation drift スキャン

```bash
grep -rn "process\.env\[" apps/web/src/lib/admin apps/web/src/lib/auth.ts | grep -v "NODE_ENV\|PLAYWRIGHT_"
```

期待: `server-fetch.ts` の runtime env 解決では `process.env["INTERNAL_API_BASE_URL"]` / `process.env["INTERNAL_AUTH_SECRET"]` が 0 件。Playwright fixture 用 `NODE_ENV` / `PLAYWRIGHT_*` は許容。
