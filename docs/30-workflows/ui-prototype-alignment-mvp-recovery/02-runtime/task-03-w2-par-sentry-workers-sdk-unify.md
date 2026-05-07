# task-03 sentry-workers-sdk-unify

> 02-runtime / 実装タスク仕様書
> 改訂日: 2026-05-07
> 関連 phase-3: §4.3「task-03 sentry-workers-sdk-unify」(`outputs/phase-3/phase-3.md` L297-L302) / §1.2 task-03 行 / §5 依存パッケージ
> 関連 phase-2: §1 task-03 / §3 DAG / §4.3 競合ファイル早見表 / §5 工数見積
> 関連 phase-1: §5.1 技術制約 / §6 リスク（Sentry 二重初期化）

---

## 0. 自己完結コンテキスト

このセクションは **task-03 を単独で読んでも実装に必要な前提が揃う**ことを保証するための自己完結ブロックである。phase-1〜3 / CLAUDE.md / 既存 `instrumentation*.ts` を横断参照しなくても、本タスクの境界・依存・成果物が判断できる粒度で記述する。

### 0.1 上位ゴール（phase-1 要約）

UBM 兵庫支部会メンバーサイト全 19 routes の Cloudflare Workers ランタイム稼働を **Sentry production / staging エラー 0** で達成する（phase-1 §1.1）。本タスクはその観測基盤として、Workers / Browser で SDK を分離した二重 init 排除構成を確定し、phase-1 §6 リスクの **「`window.requestIdleCallback` 由来 RSC 500」**を構造的に解消する役割を持つ。

### 0.2 本タスクの DAG 座標

- **依存元**: なし（02-runtime wave 最上流の 1 つ。task-01 scope-gate 通過後、task-02 と並列で着手可能）
- **依存先**: task-04 (window-guard-and-logger), task-05 (error-boundary-and-staging-smoke)
- **並列性**: **task-02 (wrangler-env-injection) と並列実行可能**。本 task は `apps/web/src/instrumentation*.ts` および `apps/web/src/lib/sentry/*` のみを触り、`wrangler.toml` の編集は task-02 に集約する。task-04 が import する `captureException` の API シグネチャを **task-03 が確定**してから task-04 が結線するため、本 task の §0.7 export を凍結することが下流の前提となる。

### 0.3 触れるファイル群（再掲）

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/instrumentation.ts` | M / C | Workers / Node SSR 用 init（`@sentry/cloudflare`） |
| `apps/web/src/instrumentation-client.ts` | C | Browser 用 init（`@sentry/nextjs`） |
| `apps/web/sentry.{server,edge,client}.config.ts` | D | 旧 init 設定の削除（存在すれば） |
| `apps/web/src/lib/sentry/capture.ts` | C | `captureException` / `captureMessage` 薄ラッパ |
| `apps/web/src/lib/__tests__/sentry-capture.test.ts` | C | 二重 init ガード / runtime 判定テスト |
| `apps/web/package.json` | M | `@sentry/cloudflare` 追加 |
| `apps/web/next.config.ts` | M（最小） | `experimental.instrumentationHook` / Sentry webpack plugin |

### 0.4 既存 API endpoint（不変条件）

`apps/api/src/routes/{auth,me,public,admin}/*` — **新規追加禁止**。本タスクは `apps/web` 側の観測 SDK 統一に閉じる。Sentry のエラー収集対象として `apps/api` に Sentry を追加する作業は本タスクの非ゴール（phase-1 §1.2 / 別 workflow）。

### 0.5 重要な不変条件（CLAUDE.md より該当抜粋）

1. **D1 への直接アクセスは `apps/api` に閉じる**。Sentry に送る breadcrumb / context に D1 接続情報・SQL を含めない。
2. **ランタイムシークレットは Cloudflare Secrets**。Sentry DSN は `[vars]` または Cloudflare Secrets 経由で注入し、コードに焼かない。
3. **GAS prototype は本番バックエンド仕様に昇格させない**。GAS 由来の error reporting 仕様を引きずらない。
4. **平文 `.env` 禁止**。本 task で追加する env キーは task-02 の `.dev.vars.example` に `op://...` 参照のみを書く。

### 0.6 上流タスクから受け取るシグネチャ（あれば）

- **task-02 確定の env**:
  - `getEnv().SENTRY_DSN`（Workers / Server 用、optional）
  - `getEnv().SENTRY_ENVIRONMENT`（`'local' | 'staging' | 'production'`）
  - `getEnv().NEXT_PUBLIC_SENTRY_DSN`（Browser 用、optional・別キー推奨）
- 取得経路は `apps/web/src/lib/env.ts` の `getEnv(ctx)` のみ。`process.env.SENTRY_DSN` の直接参照は CI で grep gate される。

### 0.7 下流タスクへ渡すシグネチャ

本タスクが **`apps/web/src/lib/sentry/capture.ts`** から export する公開 API：

```ts
// apps/web/src/lib/sentry/capture.ts
export type CaptureContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  user?: { id?: string; email?: string };
};

/** runtime（workers / node / browser）に応じて適切な SDK の captureException を呼ぶ */
export function captureException(error: unknown, ctx?: CaptureContext): string | undefined;

/** message capture。logger.warn から呼ばれる */
export function captureMessage(message: string, ctx?: CaptureContext): string | undefined;
```

また `instrumentation.ts` は Next.js v15 規約に従い:

```ts
// apps/web/src/instrumentation.ts
export async function register(): Promise<void>;
```

を export する。**二重 init ガード変数名は `__ubmSentryInitialized__`（globalThis に格納）** とし、task-04 / task-05 が import 不要で参照可能な形にする。

### 0.8 用語

- **二重 init**: Next.js の Server / Edge / Client 各 runtime で同一 SDK が複数回 `init()` され、`window.requestIdleCallback` などが SSR 側に巻き込まれる事象。phase-1 §6 リスク参照。
- **`@sentry/cloudflare`**: Cloudflare Workers ランタイム向け Sentry SDK。`window` を参照しない。
- **`@sentry/nextjs`**: Browser + Node 兼用 SDK。本タスクでは Browser のみに限定使用する。
- **runtime 判定**: `typeof EdgeRuntime !== 'undefined'` / `typeof window !== 'undefined'` / それ以外（Node SSR）の三分岐。

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Platform（観測基盤統一） |
| 推定工数 | 0.75 人日 |
| 直前依存 | task-01（gate）, task-02（`SENTRY_DSN` env 注入が前提） |
| 直後依存 | task-04（logger が Sentry breadcrumb を呼ぶ）, task-05（`error.tsx` が `captureException` を呼ぶ） |
| wave | W2（task-02 と直列推奨。task-04/05/06/07/08 と並列可） |
| 並列可否 | `wrangler.toml` 編集は task-02 に集約させ、本 task は instrumentation 系のみ触る |
| 関連 phase-3 行 | §4.3 / §1.2 task-03 行 / §5 依存（`@sentry/cloudflare`, `@sentry/nextjs`） |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. Sentry SDK を **`@sentry/cloudflare` 系（Workers 用）と `@sentry/nextjs`（Browser 用）** の 2 経路に明確分離し、二重初期化を完全排除する。
2. `window.requestIdleCallback` を呼ぶ Browser SDK が **SSR / Edge ランタイムで読み込まれない**よう、エントリポイントを分離する。
3. Cloudflare Workers 側の `scheduleIdleCleanup` 由来の RSC 500（phase-1 §6 リスク参照）を解消する。
4. Cloudflare Workers での DSN 取扱い（Cloudflare Secrets → env binding → `init()`）を明文化する。
5. 二重 init ガード（`isInitialized` フラグ + runtime 判定）を実装する。

### 2.2 非ゴール

- Sentry の release tag 自動化（CI 側の責務 / 別 workflow）。
- カスタム performance monitoring（task 範囲外）。
- logger との結線（task-04 の責務）。
- `error.tsx` の UI 設計（task-05 の責務、本 task では capture API のみ提供）。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/instrumentation.ts` | M（無ければ C） | Workers / Node SSR 用 init。`@sentry/cloudflare` の `init()` を `register()` から呼ぶ |
| `apps/web/src/instrumentation-client.ts` | C | Browser 用 init。`@sentry/nextjs` の `init()` を呼ぶ。`'use client'` |
| `apps/web/sentry.server.config.ts` | D（旧 / 存在すれば削除） | Workers + Node を `instrumentation.ts` に集約 |
| `apps/web/sentry.edge.config.ts` | D（旧 / 存在すれば削除） | edge は instrumentation で吸収 |
| `apps/web/sentry.client.config.ts` | D（旧 / 存在すれば削除） | `instrumentation-client.ts` に集約 |
| `apps/web/src/lib/sentry/capture.ts` | C | `captureException` / `captureMessage` の薄ラッパ。runtime に応じて分岐 |
| `apps/web/src/lib/__tests__/sentry-capture.test.ts` | C | 二重 init ガードと runtime 判定の単体テスト |
| `apps/web/package.json` | M | `@sentry/cloudflare` 追加、不要なら `@sentry/node` 削除 |
| `apps/web/next.config.ts` | M（最小） | `experimental.instrumentationHook` を v15 系で有効、Sentry の build webpack plugin 配線（必要時のみ） |

> 既存設定の有無を `find apps/web -maxdepth 3 -name "sentry.*.config.*" -o -name "instrumentation*"` で確認し、存在するファイルだけ D / M とする。

---

## 4. 役割分離（重要）

| ランタイム | エントリ | SDK | 主な責務 |
|----------|---------|-----|---------|
| Cloudflare Workers / Node SSR / Edge | `apps/web/src/instrumentation.ts` の `register()` | `@sentry/cloudflare` | server-side error capture、HTTP fetch 計測 |
| Browser | `apps/web/src/instrumentation-client.ts` | `@sentry/nextjs`（client export のみ） | window error / unhandledrejection / replay（任意） |

> **絶対条件**: server / edge entry から `@sentry/nextjs` を import しない。`@sentry/nextjs` は内部で `requestIdleCallback` を参照するため、Workers ランタイムでは TypeError になり RSC 500 を引き起こす。

---

## 5. 関数 / 型シグネチャ

### 5.1 `apps/web/src/instrumentation.ts`

```ts
import { getEnv } from "@/lib/env";

let initialized = false;

export async function register() {
  if (initialized) return;
  initialized = true;

  // Workers / Node 共通: process.env.NEXT_RUNTIME で分岐
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime === "nodejs" || runtime === "edge") {
    const Sentry = await import("@sentry/cloudflare");
    const env = getEnv();
    if (!env.SENTRY_DSN) return; // local 開発などは skip
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
      enabled: env.SENTRY_ENVIRONMENT !== "local",
    });
  }
}
```

### 5.2 `apps/web/src/instrumentation-client.ts`

```ts
"use client";
// Next.js 15 では instrumentation-client.ts が browser bundle に自動 inject される
import * as Sentry from "@sentry/nextjs";

declare global {
  interface Window {
    __ubmSentryInitialized?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__ubmSentryInitialized) {
  window.__ubmSentryInitialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN; // or build-time injected
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "local",
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      // requestIdleCallback / replay は browser のみで安全に有効化
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  }
}
```

### 5.3 `apps/web/src/lib/sentry/capture.ts`

```ts
type CaptureContext = {
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

/**
 * runtime を自動判定し、Workers/Node では @sentry/cloudflare、
 * Browser では @sentry/nextjs を呼ぶ。
 * SDK が未 init ならば silent（throw しない）。
 */
export async function captureException(err: unknown, ctx?: CaptureContext): Promise<void> {
  try {
    if (typeof window === "undefined") {
      const Sentry = await import("@sentry/cloudflare");
      Sentry.captureException(err, { tags: ctx?.tags, extra: ctx?.extras, level: ctx?.level });
    } else {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err, { tags: ctx?.tags, extra: ctx?.extras, level: ctx?.level });
    }
  } catch {
    // Sentry 自体が落ちても観測 fallback として console（task-04 logger 経由を推奨）
    // eslint-disable-next-line no-console
    console.error("[sentry-capture-failed]", err);
  }
}

export async function captureMessage(msg: string, ctx?: CaptureContext): Promise<void> {
  try {
    if (typeof window === "undefined") {
      const Sentry = await import("@sentry/cloudflare");
      Sentry.captureMessage(msg, ctx?.level ?? "info");
    } else {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(msg, ctx?.level ?? "info");
    }
  } catch {
    /* swallow */
  }
}
```

---

## 6. 入力 / 出力 / 副作用

| 種別 | 内容 |
|------|------|
| 入力 | env: `SENTRY_DSN` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE`（task-02 で注入） |
| 出力 | `Sentry.init` 完了後、`captureException` / `captureMessage` が機能 |
| 副作用 | global state: `initialized` フラグ（server）, `window.__ubmSentryInitialized`（client） |
| 失敗時挙動 | DSN なし → silent skip。runtime 不一致 → silent skip。SDK import 失敗 → console fallback |

---

## 7. DSN / Secrets 取扱い

```bash
# 投入（手動 / CI）
bash scripts/cf.sh secret put SENTRY_DSN --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh secret put SENTRY_DSN --config apps/web/wrangler.toml --env production

# 一覧確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
```

`NEXT_PUBLIC_SENTRY_DSN`（client 用）は build 時 inject。Cloudflare Workers の `[vars]` に書く（task-02 §4 表に追加すること）。secret ではなく public DSN として扱う点に注意（Sentry の DSN 設計上、client DSN は公開前提）。

---

## 8. テスト方針

| ファイル | ケース | 期待値 |
|---------|--------|--------|
| `apps/web/src/lib/__tests__/sentry-capture.test.ts` | `captureException` を server runtime で呼ぶと `@sentry/cloudflare` が動く | mock import が呼ばれる |
| 同上 | client runtime（jsdom）で呼ぶと `@sentry/nextjs` が動く | mock import が呼ばれる |
| 同上 | SDK init 前に呼んでも throw しない | `await` が完走する |
| `apps/web/src/__tests__/instrumentation.test.ts`（任意） | `register()` を 2 回呼んでも `init` は 1 回しか走らない | spy 1 回のみ |

### 8.1 e2e（task-05 の staging smoke 連携）

- staging 環境で意図的に `/api/_throw` 等を叩き、Sentry dashboard に server event が 1 件記録される
- ブラウザで `throw new Error('manual')` を実行し、Sentry dashboard に client event が 1 件記録される
- 両 event の `runtime` tag が server / browser に正しく出る

---

## 9. ローカル実行・検証コマンド

```bash
# 依存追加
mise exec -- pnpm --filter @repo/web add @sentry/cloudflare
mise exec -- pnpm --filter @repo/web add @sentry/nextjs

# 旧 config 削除（存在する場合）
rm -f apps/web/sentry.client.config.ts apps/web/sentry.server.config.ts apps/web/sentry.edge.config.ts

# 型チェック / lint
mise exec -- pnpm --filter @repo/web exec tsc --noEmit
mise exec -- pnpm --filter @repo/web lint

# 単体
mise exec -- pnpm --filter @repo/web test src/lib/__tests__/sentry-capture.test.ts

# Workers ランタイムでの起動確認
bash scripts/cf.sh dev --config apps/web/wrangler.toml

# build
mise exec -- pnpm --filter @repo/web build

# staging deploy（dry-run）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run

# 二重 init / window 参照リーク検査（grep）
mise exec -- pnpm --filter @repo/web exec rg 'requestIdleCallback' apps/web/.open-next/ || echo OK
```

---

## 10. DoD

- [ ] `apps/web/src/instrumentation.ts` が `register()` を export し、`@sentry/cloudflare` のみ import している
- [ ] `apps/web/src/instrumentation-client.ts` が `'use client'` 付きで `@sentry/nextjs` のみ import している
- [ ] 旧 `sentry.{client,server,edge}.config.ts` が削除されている（存在しない）
- [ ] `apps/web/src/lib/sentry/capture.ts` が `typeof window` で runtime を分岐している
- [ ] `pnpm --filter @repo/web exec tsc --noEmit` が通過
- [ ] `pnpm --filter @repo/web build` 後の `.open-next/worker.js` に `requestIdleCallback` 参照が含まれない（grep 0 件）
- [ ] staging deploy 後、`/` および `/(public)/members` の RSC が 200（500 が出ない）
- [ ] 意図的 throw 経由で Sentry dashboard に server / browser 双方の event が届く
- [ ] 二重 init ガードのテストが pass

---

## 11. リスクと緩和

| リスク | 影響 | 緩和 |
|--------|------|------|
| `@sentry/cloudflare` が `@sentry/nextjs` の peer に引っ張られて bundle に混入 | RSC 500 再発 | bundle 解析（`pnpm --filter @repo/web exec next build` の出力 / `.open-next/worker.js` を grep）で検証 |
| Sentry SDK の major version 差 | API 不整合 | `@sentry/cloudflare`・`@sentry/nextjs` は同 minor major で揃える |
| client DSN を secret に入れて build に届かない | client capture 不能 | client 用 DSN は wrangler の `[vars]`（NEXT_PUBLIC_SENTRY_DSN）で管理 |
| `instrumentation.ts` が edge ランタイムで dynamic import 失敗 | server capture 不能 | `await import()` を try/catch、未 init 状態でも以降のコードを止めない |
| 旧 config 削除で stale build cache が残る | deploy 失敗 | `rm -rf apps/web/.open-next apps/web/.next` を事前実行 |


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
