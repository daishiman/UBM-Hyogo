# spec-02: middleware 構造化ログ + env.ts AUTH_SECRET zod 必須検証

[実装区分: 実装仕様書]

## 1. 目的

ランタイムで `AUTH_SECRET` が falsy になった場合、構造化ログで即座に検知可能にし、加えて boot 時 zod 検証で deploy 直後の health-check で early-fail させる。

## 2. 変更対象ファイル

| 種別 | path |
|------|------|
| 編集 | `apps/api/src/middleware/require-admin.ts` |
| 編集 | `apps/api/src/env.ts` |
| 編集 | `apps/api/src/middleware/require-admin.authz.spec.ts` |
| 編集 | `apps/api/src/env.spec.ts` |
| 編集 | `apps/api/src/routes/admin/members.contract.spec.ts` |

## 3. 関数・型シグネチャ

### 3.1 `require-admin.ts`

既存の falsy 分岐を小さな helper に寄せ、`logError` 呼出を追加（throw しない、500 return は維持）。

```ts
import { logError } from "../lib/logger";

const getAuthSecretOrRespond = (secret: string | undefined, phase: "requireAuth" | "requireAdmin"): string | null => {
  if (typeof secret === "string" && secret.trim().length > 0) return secret;
  logError({
    code: "UBM-AUTH-SECRET-MISSING",
    phase,
    bindingPresent: typeof secret === "string",
  });
  return null;
};
```

- `requireAdmin` と `requireAuth` 両方の同分岐に適用（DRY のため helper 抽出可）
- `logError` の値そのものは**出力しない**（phase と binding presence のみ）

### 3.2 `env.ts`

`apps/api/src/env.ts` は現在 interface 正本であり、全 env loader は存在しない。blast radius を避け、AUTH_SECRET 専用の狭い validator を追加する。

```ts
import { z } from "zod";

export const AuthSecretEnvSchema = z.object({
  AUTH_SECRET: z.string().trim().min(32, "AUTH_SECRET must be at least 32 characters"),
});

export type AuthSecretEnv = z.infer<typeof AuthSecretEnvSchema>;

export function validateAuthSecretEnv(env: Pick<Env, "AUTH_SECRET">): AuthSecretEnv {
  return AuthSecretEnvSchema.parse(env);
}
```

- parse 失敗時は throw。現時点では focused contract test と将来の boot/deploy gate 用 contract として使う。

## 4. 入出力・副作用・エラー

| 関数 | 入力 | 出力 | 副作用 | エラー |
|------|------|------|--------|--------|
| `requireAdmin` (改修部分) | `c.env.AUTH_SECRET` | 500 + body / next() | `logError` console 出力 | なし（throw しない） |
| `validateAuthSecretEnv` | `Pick<Env, "AUTH_SECRET">` | `AuthSecretEnv` | なし | zod parse error throw |

## 5. テスト方針（Phase 4 TC 対応）

### `require-admin.authz.spec.ts`
- TC-MW-01: `c.env.AUTH_SECRET = undefined` → 500 + body + logError 1 回呼出（`code` 検証）
- TC-MW-02: `c.env.AUTH_SECRET = ""` → 同上
- TC-MW-03: `c.env.AUTH_SECRET = "x".repeat(32)` + 有効 JWT → next() に進む

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
// logError を stub
vi.spyOn(logger, "logError").mockImplementation(() => {});
```

### `env.spec.ts`
- TC-ENV-01: AUTH_SECRET 未設定 → `validateAuthSecretEnv()` throw
- TC-ENV-02: AUTH_SECRET = "" → throw（min length 違反）

### `members.contract.spec.ts`
- TC-CONTRACT-01: middleware で AUTH_SECRET falsy 時の body shape `{error:"auth misconfigured"}` を厳密 assert

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/middleware/require-admin.authz.spec.ts apps/api/src/env.spec.ts
```

## 7. DoD

- TC-MW-01〜03 / TC-ENV-01〜02 / TC-CONTRACT-01 すべて PASS
- typecheck / lint exit 0
- `logError` 呼出に AUTH_SECRET 実値が含まれていない（grep で値漏洩なし）
- 既存 admin endpoint の 200 path は破壊されていない

## 8. 実装読込みで確定した前提

- `apps/api/src/env.ts` は interface 正本。今回の zod は AUTH_SECRET 専用 validator として追加する。
- `logError` は `apps/api/src/lib/logger.ts` の export を `../lib/logger` で import する。
- `/me/*` は runtime smoke の既存 3 route で user-gated evidence として確認する。
