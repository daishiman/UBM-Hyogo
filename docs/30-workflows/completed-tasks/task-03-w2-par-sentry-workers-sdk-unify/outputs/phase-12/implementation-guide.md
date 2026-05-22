# Implementation Guide

## Part 1: 中学生レベル

なぜ必要かというと、UBM-Hyogo の web はサーバー側（Workers）とブラウザ側で動く場所が違い、同じ Sentry SDK を両方に置くとサーバー側でブラウザ専用の部品を呼んでしまうからである。たとえば学校の連絡帳のように、Sentry は「いつ・どこで・どんなエラーが起きたか」を残す仕組みである。

### 今回作ったもの

この cycle では、サーバー用 SDK とブラウザ用 SDK を別々の入口に置く実装まで行った。エラー記録の宛先も server secret と browser public var に分け、サーバー側でブラウザ専用部品を読まないようにした。

| 用語 | 意味 |
| --- | --- |
| Sentry | エラーの連絡帳 |
| SDK | 便利な部品セット |
| Workers | サーバー側で動く場所 |
| Browser | ユーザーの端末側で動く場所 |
| DSN | Sentry へ送る宛先 |
| Secrets | 大事な値を置く金庫 |

## Part 2: 技術者向け

| Runtime | Entry | SDK | DSN |
| --- | --- | --- | --- |
| Workers / Node SSR / Edge | `apps/web/src/instrumentation.ts` | `@sentry/cloudflare` | `getEnv().SENTRY_DSN_WEB` |
| Browser | `apps/web/src/instrumentation-client.ts` | `@sentry/nextjs` | `NEXT_PUBLIC_SENTRY_DSN` |

`captureException(error, ctx?)` / `captureMessage(message, ctx?)` / `register()` の契約は `phase-03.md` を正本とする。実装後は `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` を必ず取得する。

`apps/web/src/lib/env.ts` は Cloudflare runtime binding を優先し、local test/dev では `process.env` に fallback する。`SENTRY_DSN_WEB` の直接読み取りはこの helper に閉じる。

### TypeScript 型定義

```ts
export type CaptureContext = {
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  user?: { id?: string; email?: string };
};
```

### APIシグネチャ

```ts
export function captureException(
  error: unknown,
  ctx?: CaptureContext,
): Promise<string | undefined>;

export function captureMessage(
  message: string,
  ctx?: CaptureContext,
): Promise<string | undefined>;

export function register(): Promise<void>;
```

### 使用例

```ts
import { captureException } from "@/lib/sentry/capture";

await captureException(error, {
  tags: { boundary: "global-error" },
  level: "error",
});
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js
```

### エラーハンドリング

SDK 未 init、DSN 未設定、dynamic import 失敗はすべて fail-soft とし、アプリ本体へ例外を伝播しない。capture wrapper は `undefined` を返し、runtime 500 を観測層の失敗で増やさない。

### エッジケース

- `@sentry/nextjs` が Workers bundle に推移混入した場合は grep gate G-1b で検出する。
- `SENTRY_DSN_WEB` が未設定の場合は server init を skip する。
- `NEXT_PUBLIC_SENTRY_DSN` は公開前提のため secret として扱わない。

### 設定項目と定数一覧

| Key / Constant | Purpose |
| --- | --- |
| `SENTRY_DSN_WEB` | Web server Sentry DSN Cloudflare Secret |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser Sentry DSN public var |
| `SENTRY_ENVIRONMENT` | server environment tag |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | browser environment tag |
| `__ubmSentryInitialized__` | double init guard |

### テスト構成

| Evidence | Path |
| --- | --- |
| typecheck | `outputs/phase-11/evidence/typecheck.log` |
| lint | `outputs/phase-11/evidence/lint.log` |
| test | `outputs/phase-11/evidence/test.log` |
| build | `outputs/phase-11/evidence/build.log` |
| grep gate | `outputs/phase-11/evidence/grep-gate.log` |
