# Phase 8 — DRY 化

## 単一化したもの

- env 参照経路は `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` のみ。下流コードは `process.env.*` / `getCloudflareContext()` の直接呼び出しを行わない。
- zod schema は `EnvSchema` 一本。`PublicEnvSchema` は `EnvSchema.pick(...)` で派生し、定義の二重化を防止。
- raw env 読み出しは `readRawEnv()` 内に Workers/Node 分岐を閉じ、`getEnv()` / `getPublicEnv()` 双方が同じ source を共有。

## type narrowing

- `Env = z.infer<typeof EnvSchema>` を export。下流タスクは `Env["AUTH_URL"]` 等で個別 string 型を再定義せず参照する。
- `getPublicEnv()` の戻り値は `Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">` で narrowing 済。

## 重複排除

- `apps/web` 配下の grep（AC-5 / AC-6）で `127.0.0.1:8888` ／ `process.env.NEXT_PUBLIC_API_BASE_URL` 直参照は 0 件 → 移行漏れなし。
