# Phase 4: テスト戦略

## 1. テスト対象 / 非対象

| 種別 | 対象 |
| --- | --- |
| 単体テスト | `apps/web/src/lib/env.ts` の Sentry env parse |
| 契約テスト | なし（route 追加なし） |
| ランタイム検証 | curl HTTP 200 / Sentry event 受信 / grep gate / secret list |
| 非対象 | `instrumentation.ts` / `instrumentation-client.ts` / `capture.ts` の単体テスト（親 task-03 で完了済） |

## 2. 単体テスト追加（FR-1 検証）

### 2.1 `apps/web/src/lib/__tests__/env.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { EnvSchema } from "@/lib/env"; // 既存 export 想定。未 export なら getEnv 経由で fixture 検証

describe("env Sentry keys", () => {
  it("accepts undefined Sentry keys (local dev)", () => {
    const env = { /* required minimal env */ };
    expect(() => EnvSchema.parse(env)).not.toThrow();
  });

  it("accepts valid SENTRY_DSN_WEB url", () => {
    const env = { /* required */, SENTRY_DSN_WEB: "https://public.example.invalid/456" };
    expect(() => EnvSchema.parse(env)).not.toThrow();
  });

  it("rejects malformed SENTRY_DSN_WEB", () => {
    const env = { /* required */, SENTRY_DSN_WEB: "not-a-url" };
    expect(() => EnvSchema.parse(env)).toThrow();
  });

  it("accepts SENTRY_TRACES_SAMPLE_RATE in [0,1]", () => {
    const env = { /* required */, SENTRY_TRACES_SAMPLE_RATE: "0.1" };
    expect(() => EnvSchema.parse(env)).not.toThrow();
  });

  it("rejects SENTRY_TRACES_SAMPLE_RATE out of range", () => {
    const env = { /* required */, SENTRY_TRACES_SAMPLE_RATE: "1.5" };
    expect(() => EnvSchema.parse(env)).toThrow();
  });

  it("rejects unknown SENTRY_ENVIRONMENT", () => {
    const env = { /* required */, SENTRY_ENVIRONMENT: "preview" };
    expect(() => EnvSchema.parse(env)).toThrow();
  });
});
```

> 既存テストファイルがある場合は append。`EnvSchema` が直接 export されていない場合は `getEnv(env)` 関数経由で同等検証する。

## 3. ランタイム検証戦略（Phase 11 で実行）

| 検証項目 | コマンド / 手順 | 期待値 | evidence |
| --- | --- | --- | --- |
| secret 投入確認 | `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging` | `SENTRY_DSN_WEB` が name のみ表示 | `evidence/secret-list-staging.log` |
| staging deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | success + version id 出力 | `evidence/deploy-staging.log` |
| curl `/` | `curl -sSf -o /dev/null -w '%{http_code}\n' https://<staging>/` | `200` | `evidence/curl-staging.log` |
| curl `/(public)/members` | 同上 | `200` | 同上 |
| Sentry server event | dashboard `environment:staging` + `runtime:server`（または equivalent tag） | 1 件以上 | `evidence/sentry-staging-server-event.png` |
| Sentry browser event | dashboard `environment:staging` + `runtime:browser` | 1 件以上 | `evidence/sentry-staging-browser-event.png` |
| grep gate (`requestIdleCallback`) | `rg -n 'requestIdleCallback' apps/web/.open-next/` | 0 件 | `evidence/grep-gate-runtime.log` |
| grep gate (`@sentry/nextjs`) | `rg -n '@sentry/nextjs' apps/web/.open-next/` | 0 件 | `evidence/grep-gate-runtime.log`（追記） |

## 4. 既存テストへの影響

| テスト | 影響 | 対応 |
| --- | --- | --- |
| 親 task-03 の `apps/web/src/lib/__tests__/sentry-capture.test.ts` | env schema 拡張に依存しない（mock import 検証のみ） | 影響なし |
| `apps/web` の vitest 全体 suite | env schema 追加で fixture が optional 受理に変わる | 既存テストは `SENTRY_DSN_WEB` 未設定で動作するので影響なし |
| `apps/web` の build / typecheck | wrangler.toml vars 追加 → typegen 再走 | `pnpm --filter @ubm-hyogo/web typecheck` 通過確認 |

## 5. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/__tests__/env.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 6. テストカバレッジ目標

env schema parse 周りに新規 6 ケース追加。本タスクは coverage 型タスクではないため delta% 監視は不要（`spec_created` workflow_state）。
