# Phase 8: リファクタリング

## 8.1 変更内容テーブル（Feedback RT-03）

| 対象                                      | Before                                       | After                                            | 理由                                              |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `authed.ts` の env 参照                   | `process.env["INTERNAL_API_BASE_URL"]` / `process.env["PUBLIC_API_BASE_URL"]` | `getApiBaseEnv().INTERNAL_API_BASE_URL` / `getApiBaseEnv().PUBLIC_API_BASE_URL` | 不変条件「`apps/web` の env 参照は env.ts accessor 経由のみ」 |
| `FALLBACK_INTERNAL_API`                   | `"http://127.0.0.1:8787"`                    | （削除）                                          | CLAUDE.md「127.0.0.1 リテラル禁止」                |
| env 解決失敗時の挙動                       | localhost fallback                            | throw（fail-fast）                                | silent fallback 事故防止                          |
| `profile/page.tsx` の `/me` error 経路    | `try/catch` + `throw err;`（SCR ハードクラッシュ）| `safeServerFetch(..., { rethrowOn: [AuthRequiredError] })` + SectionError UI | 既存 `/me/profile` と一貫化、SCR digest 化を防止 |

## 8.2 重複・navigation drift 削減

- `apps/web/src/lib/fetch/public.ts` には `apps/web/src/lib/fetch/authed.ts` と類似の env 参照が残る可能性があるが、本タスクの直接原因（`/profile` の SCR error）ではないため新規未タスク化せず、既存境界として維持する。
- `safeServerFetch` の既存実装は本タスクで変更しない（既存契約を踏襲）。

## 8.3 navigation drift スキャン

```bash
grep -rn "process\.env\[" apps/web/src/lib/fetch/authed.ts
# 期待: 0

grep -rn "127\.0\.0\.1" apps/web/src/lib/fetch/authed.ts
# 期待: 0

grep -rn "process\.env\[" "apps/web/app/(member)/profile/page.tsx"
# 期待: 0
```
