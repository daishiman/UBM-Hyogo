# env.ts シグネチャ

```ts
// apps/web/src/lib/env.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  AUTH_SECRET: z.string().min(16).optional(),
});
export type Env = z.infer<typeof EnvSchema>;

export function readRawEnv(): Record<string, unknown>;
export function getEnv(rawEnv?: Record<string, unknown>): Env;
export function getPublicEnv(
  rawEnv?: Record<string, unknown>,
): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;
```

## 注入ポリシー

1. `getCloudflareContext().env` を最優先（Workers runtime）
2. throw 時は `process.env` にフォールバック（Node build / vitest）
3. 両方 undefined のときは parse 失敗で `ZodError`（fail fast）
