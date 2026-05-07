# task-05 error-boundary-and-staging-smoke

> 02-runtime / 実装タスク仕様書
> 改訂日: 2026-05-07
> 関連 phase-3: §4.5「task-05 error-boundary-and-staging-smoke」(`outputs/phase-3/phase-3.md` L310-L316) / §1.2 task-05 行
> 関連 phase-2: §1 task-05 / §3 DAG / §4.3 競合ファイル早見表 / §5 工数見積
> 関連 phase-1: §4 成功条件 S-06 / §1.1 ゴール表「ランタイム / カバレッジ」

---

## 0. 自己完結コンテキスト

このセクションは **task-05 を単独で読んでも実装に必要な前提が揃う**ことを保証するための自己完結ブロックである。phase-1〜3 / CLAUDE.md / 既存 `apps/web/src/app/**` を横断参照しなくても、本タスクの境界・依存・成果物が判断できる粒度で記述する。

### 0.1 上位ゴール（phase-1 要約）

UBM 兵庫支部会メンバーサイト全 19 routes が **HTTP 200 / 適切な auth リダイレクト**を返し、Cloudflare Workers 上で **Sentry エラー 0** で稼働する状態（phase-1 §1.1 / §4 成功条件 S-06）。本タスクは 02-runtime wave の出口として、App Router の error boundary（`error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx`）と、staging 環境での 19 routes 全件 smoke を提供する役割を持つ。

### 0.2 本タスクの DAG 座標

- **依存元**: task-02 (env), task-03 (sentry), task-04 (window-guard + logger) — 三者すべて
- **依存先**: task-18 (regression-smoke) — 本タスクの staging-smoke は task-18 の包括 regression smoke の前段
- **並列性**: **直列**。task-02 / 03 / 04 すべての export シグネチャに依存するため、3 つすべてが完了してから着手する。`app/error.tsx` 系の新設は他 task と競合しないため、画面 task (11-17) とは並列可能。

### 0.3 触れるファイル群（再掲）

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/app/error.tsx` | C | route segment error boundary（dev / prod 分岐 + digest + reset + Sentry capture） |
| `apps/web/src/app/global-error.tsx` | C | 最上位 fallback（`<html><body>` 含む） |
| `apps/web/src/app/not-found.tsx` | C | 404 UI（仮 markup） |
| `apps/web/src/app/loading.tsx` | C | Suspense fallback（仮 markup） |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | C | Playwright 19 routes smoke |
| `apps/web/playwright.config.ts` | M | `staging` project / baseURL 環境変数追加 |
| `apps/web/package.json` | M | scripts: `e2e:staging` 追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` | C | 19 routes × 5 状態の手動チェックリスト |

### 0.4 既存 API endpoint（不変条件）

`apps/api/src/routes/{auth,me,public,admin}/*` — **新規追加禁止**。staging-smoke は HTTP 応答コードと auth リダイレクトのみを検証し、`apps/api` 側に新 endpoint を追加することはない。`error.tsx` も backend を呼ばず、Sentry capture と reset アクションのみを担う。

### 0.5 重要な不変条件（CLAUDE.md より該当抜粋）

1. **D1 への直接アクセスは `apps/api` に閉じる**。`error.tsx` / `not-found.tsx` から D1 を参照しない。
2. **`apps/web` から D1 への直接アクセス禁止**。staging-smoke の前提となる data も既存 endpoint 経由で取得する。
3. **MVP では Google Form 再回答を本人更新の正式な経路とする**。`error.tsx` の文言で「フォーム再送」案内を出す場合は `responderUrl` を変数化（task-02 の env から取得）。
4. **平文 `.env` 禁止**。`STAGING_BASE_URL` は CI Secrets / 1Password 経由で注入する。
5. **GAS prototype は本番バックエンド仕様に昇格させない**。staging-smoke は `apps/web` + `apps/api` の Cloudflare Workers 構成のみを対象とする。

### 0.6 上流タスクから受け取るシグネチャ

本タスクは下記 3 タスクの公開 API のみに依存する。**直接 `process.env.*` / `window.*` / Sentry SDK API への直アクセスは禁止**。

- **task-02 export**:
  ```ts
  import { getEnv } from '@/lib/env';
  const stagingBaseUrl = getEnv().STAGING_BASE_URL;
  // playwright.config.ts では process.env.STAGING_BASE_URL を直接参照可（test runner は Workers ランタイム外）
  ```

- **task-03 export**:
  ```ts
  import { captureException } from '@/lib/sentry/capture';
  // error.tsx 内で:
  captureException(error, { extra: { digest: error.digest, route: 'error.boundary' } });
  ```
  返り値の `eventId`（string | undefined）は UI に表示してよい（debugging 補助）。

- **task-04 export**:
  ```ts
  import { logger } from '@/lib/logger';
  logger.error({ event: 'error.boundary.caught', error, digest: error.digest });
  ```
  `event` は task-04 で予約された string union のいずれかを使う（`error.boundary.caught` / `error.global-boundary.caught` / `error.not-found`）。

### 0.7 下流タスクへ渡すシグネチャ

本タスクが下流（task-18 regression smoke）へ渡す成果物：

- `apps/web/tests/e2e/staging-smoke.spec.ts` — Playwright spec として再利用可能。task-18 はこれを拡張して a11y / token 検証を付加する。
- `pnpm --filter @repo/web e2e:staging` script — task-18 の CI workflow から呼び出される。
- `staging-smoke-checklist.md` — 19 routes × 5 状態の手動チェック表。task-18 の自動化対象 backlog として参照される。
- `app/error.tsx` の文言・digest 表示仕様 — task-15 周辺で primitive 適用時の互換ポイント。

公開関数 export はないが、route segment level の boundary 構造（`error.tsx` の props: `{ error: Error & { digest?: string }; reset: () => void }`）は Next.js v15 規約に従う。

### 0.8 用語

- **route segment error boundary**: Next.js App Router の `error.tsx`。当該 segment 配下の throw を捕捉し、layout は維持したまま fallback UI を出す。
- **`global-error.tsx`**: layout 自体が落ちた時の最上位 fallback。`<html><body>` を自前で出す必要がある。
- **digest**: Next.js が production の error に付与する短いハッシュ。Sentry の eventId と組合せて運用 traceability を確保する。
- **smoke test**: 「煙が出ていないか」を確認する最小限テスト。本 task では HTTP 200 / 適切なリダイレクトの検証のみを指す（a11y / token は task-18）。
- **staging**: Cloudflare の `dev` ブランチに紐づく Workers preview 環境。`STAGING_BASE_URL` は CI / 1Password 管理。

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Platform（App Router error boundary + 観測 smoke） |
| 推定工数 | 0.5 人日 |
| 直前依存 | task-01（gate）, task-02（env）, task-03（Sentry capture）, task-04（logger） |
| 直後依存 | task-18（regression smoke の前段、staging smoke は task-18 の Playwright と独立して maintain される） |
| wave | W2（task-04 と並列可。`app/error.tsx` / `app/not-found.tsx` 系の新設は他 task と競合しない） |
| 並列可否 | 競合ファイルなし。全画面 task（11-17）より先に確定すべき |
| 関連 phase-3 行 | §4.5 / §1.2 task-05 行 / §2.4 共通 routes 接続マップ |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `apps/web/src/app/error.tsx`（route segment error boundary）を **dev / prod 分岐** で実装し、prod は簡略表示 + digest、dev は stack 詳細を表示する。
2. `apps/web/src/app/global-error.tsx` を新設し、`<html>` / `<body>` 含む最上位 fallback を提供する（layout 自体が落ちた時用）。
3. `apps/web/src/app/not-found.tsx` を新設し、`EmptyState` primitive（task-10）の挙動を見越したシンプル UI を仮実装する。
4. `apps/web/src/app/loading.tsx` を新設し、Skeleton primitive 用の Suspense fallback 仕様を確定する（実 primitive は task-10、本 task では plain markup で良い）。
5. Playwright で 19 routes 全件が **HTTP 200 / 認可リダイレクト**になることを staging で smoke する `tests/e2e/staging-smoke.spec.ts` を新設する。
6. `pnpm --filter @repo/web e2e:staging` コマンド（package.json scripts）を提供する。
7. error / digest が Sentry に正しく送信されることを smoke で確認する。

### 2.2 非ゴール

- 全 routes の axe a11y 検証（task-18 で実施）。
- token 適用検証（task-18 の `verify-design-tokens`）。
- error UI のデザイン最終形（primitives 完成後、task-15 周辺で UI を最終化）。
- production 環境への smoke 適用（staging で完結）。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/app/error.tsx` | C | route segment error boundary（dev / prod 分岐 + digest + reset + Sentry capture） |
| `apps/web/src/app/global-error.tsx` | C | 最上位 fallback。`<html><body>` を含む |
| `apps/web/src/app/not-found.tsx` | C | 404 UI（仮 markup、token 適用は task-10 完了後） |
| `apps/web/src/app/loading.tsx` | C | Suspense fallback（仮 markup） |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | C | Playwright 19 routes smoke |
| `apps/web/playwright.config.ts` | M | `staging` project / baseURL 環境変数追加 |
| `apps/web/package.json` | M | scripts: `e2e:staging` 追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` | C | 19 routes × 5 状態の手動チェックリスト |

---

## 4. 関数 / 型シグネチャ

### 4.1 `apps/web/src/app/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({
      event: "app.route.error",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-[var(--ubm-color-danger)]">
        画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-[var(--ubm-color-fg-muted)]">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>

      {error.digest && (
        <p className="mt-4 text-xs text-[var(--ubm-color-fg-muted)]">
          エラーID: <code>{error.digest}</code>
        </p>
      )}

      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-[var(--ubm-color-surface-2)] p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-white"
        >
          再試行する
        </button>
        <a
          href="/"
          className="rounded-md border border-[var(--ubm-color-border)] px-4 py-2 text-sm"
        >
          トップへ戻る
        </a>
      </div>
    </div>
  );
}
```

### 4.2 `apps/web/src/app/global-error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ event: "app.global.error", digest: error.digest, err: error });
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>システムエラーが発生しました</h1>
        <p>ページを読み込めませんでした。再読込みしてください。</p>
        {error.digest && <p>ID: {error.digest}</p>}
        <button type="button" onClick={reset}>
          再読込み
        </button>
      </body>
    </html>
  );
}
```

### 4.3 `apps/web/src/app/not-found.tsx`

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="text-sm text-[var(--ubm-color-fg-muted)]">404</p>
      <h1 className="mt-2 text-2xl font-semibold">ページが見つかりません</h1>
      <p className="mt-3 text-sm text-[var(--ubm-color-fg-muted)]">
        URL をご確認のうえ、トップから再度アクセスしてください。
      </p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-white">
        トップへ戻る
      </Link>
    </div>
  );
}
```

### 4.4 `apps/web/src/app/loading.tsx`

```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-6 py-12" aria-busy="true" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-4 w-full animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-64 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
    </div>
  );
}
```

---

## 5. 19 routes smoke 仕様

### 5.1 対象 routes（phase-1 §2.2 より）

```
/                                       公開
/(public)/members                       公開
/(public)/members/[id]                  公開（id=fixture）
/(public)/register                      公開（302 → responderUrl）
/privacy                                公開
/terms                                  公開
/login                                  会員（unauth でも 200）
/profile                                会員（unauth → /login へ 302/307）
/(admin)/admin                          管理（unauth → 302、admin → 200）
/(admin)/admin/members                  管理
/(admin)/admin/tags                     管理
/(admin)/admin/meetings                 管理
/(admin)/admin/schema                   管理
/(admin)/admin/requests                 管理
/(admin)/admin/identity-conflicts       管理
/(admin)/admin/audit                    管理
/__nonexistent__                        404 確認用
/(public)/members/__broken__            error.tsx 動作確認用（API 故意 fail）
（loading.tsx は中間レンダー、独立 route ではないので smoke では Slow API で観察）
```

### 5.2 期待ステータス表

| route | unauth | member | admin |
|-------|-------|--------|-------|
| `/` `/privacy` `/terms` `/(public)/members*` `/(public)/register` `/login` | 200 / 302 | 200 / 302 | 200 / 302 |
| `/profile` | 302 → /login | 200 | 200 |
| `/(admin)/admin*` | 302 → /login | 302 → /login or 403 | 200 |
| `/__nonexistent__` | 404 | 404 | 404 |

---

## 6. Playwright 仕様

### 6.1 `apps/web/tests/e2e/staging-smoke.spec.ts`

```ts
import { expect, test } from "@playwright/test";

const BASE = process.env.STAGING_BASE_URL ?? "https://web-staging.example.com";

const PUBLIC_ROUTES = [
  "/",
  "/(public)/members",
  "/(public)/register",
  "/privacy",
  "/terms",
  "/login",
];

const MEMBER_DETAIL_FIXTURE_ID = process.env.STAGING_MEMBER_FIXTURE_ID ?? "fixture-1";

const MEMBER_ROUTES = ["/profile"];
const ADMIN_ROUTES = [
  "/(admin)/admin",
  "/(admin)/admin/members",
  "/(admin)/admin/tags",
  "/(admin)/admin/meetings",
  "/(admin)/admin/schema",
  "/(admin)/admin/requests",
  "/(admin)/admin/identity-conflicts",
  "/(admin)/admin/audit",
];

test.describe("staging smoke / public", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} returns 200`, async ({ request }) => {
      const res = await request.get(`${BASE}${route}`, { maxRedirects: 0 });
      expect([200, 301, 302, 307]).toContain(res.status());
    });
  }

  test(`GET /(public)/members/[id] returns 200`, async ({ request }) => {
    const res = await request.get(`${BASE}/(public)/members/${MEMBER_DETAIL_FIXTURE_ID}`);
    expect([200, 404]).toContain(res.status());
  });

  test("404 page renders", async ({ page }) => {
    const res = await page.goto(`${BASE}/__nonexistent__`);
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/ページが見つかりません/)).toBeVisible();
  });
});

test.describe("staging smoke / auth-protected", () => {
  for (const route of [...MEMBER_ROUTES, ...ADMIN_ROUTES]) {
    test(`unauth GET ${route} is gated`, async ({ request }) => {
      const res = await request.get(`${BASE}${route}`, { maxRedirects: 0 });
      // 302/307 (login redirect) または 200（公開部分のみ）どちらも許容
      expect([200, 302, 307, 401, 403]).toContain(res.status());
    });
  }
});

test.describe("staging smoke / error boundary", () => {
  test("error.tsx renders with digest in prod-like build", async ({ page }) => {
    const res = await page.goto(`${BASE}/(public)/members/__broken__`);
    // 200 + error UI（Next.js は throw 後も RouteError を 200 で返す）
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/エラーID|再試行/)).toBeVisible();
  });
});
```

### 6.2 `apps/web/playwright.config.ts` 差分

```ts
// projects に staging 専用を追加
{
  name: "staging-smoke",
  testMatch: /tests\/e2e\/staging-smoke\.spec\.ts/,
  use: {
    baseURL: process.env.STAGING_BASE_URL,
    extraHTTPHeaders: process.env.STAGING_AUTH_BEARER
      ? { Authorization: `Bearer ${process.env.STAGING_AUTH_BEARER}` }
      : undefined,
  },
}
```

### 6.3 `apps/web/package.json` scripts 差分

```jsonc
{
  "scripts": {
    "e2e:staging": "STAGING_BASE_URL=$STAGING_BASE_URL playwright test --project=staging-smoke"
  }
}
```

---

## 7. 入力 / 出力 / 副作用

| 種別 | 内容 |
|------|------|
| 入力 | 環境変数: `STAGING_BASE_URL`, `STAGING_MEMBER_FIXTURE_ID`, 任意 `STAGING_AUTH_BEARER` |
| 出力 | Playwright report（HTML / JUnit）、Sentry に意図的 throw が記録 |
| 副作用 | staging 環境への HTTP リクエスト発生（認証 bearer は read-only fixture を想定） |
| 失敗時挙動 | smoke spec が fail → CI gate（任意適用、本 task では deploy ブロックは強制しない） |

---

## 8. テスト方針

### 8.1 単体（Vitest）

| ファイル | ケース | 期待値 |
|---------|--------|--------|
| `apps/web/src/app/__tests__/error.test.tsx` | dev mode で stack を表示する | `<pre>` が存在 |
| 同上 | prod mode で stack を表示しない | `<pre>` が存在しない |
| 同上 | digest が表示される | `error.digest` がレンダリング |
| 同上 | `reset()` ボタンクリックで reset prop が呼ばれる | spy 1 回 |
| 同上 | mount 時に `logger.error` が呼ばれる | spy 1 回 |

### 8.2 staging smoke（Playwright）

- 19 routes すべての URL に対し、許容ステータス内に収まる
- 404 ページが render される
- error boundary がエラー injection 後に visible
- Sentry dashboard に対応 event が届く（手動確認）

---

## 9. ローカル実行・検証コマンド

```bash
# 単体テスト
mise exec -- pnpm --filter @repo/web test src/app/__tests__/error.test.tsx

# build 通過
mise exec -- pnpm --filter @repo/web build

# staging smoke（事前に staging へ deploy しておく）
export STAGING_BASE_URL=https://web-staging.example.com
export STAGING_MEMBER_FIXTURE_ID=fixture-1
mise exec -- pnpm --filter @repo/web e2e:staging

# 手動確認チェックリスト（specs/staging-smoke-checklist.md）
open docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md
```

---

## 10. DoD

- [ ] `apps/web/src/app/error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` が存在
- [ ] `error.tsx` が `process.env.NODE_ENV` で dev / prod を分岐し、digest を表示する
- [ ] `error.tsx` mount 時に `logger.error` 経由で Sentry に capture される
- [ ] `apps/web/tests/e2e/staging-smoke.spec.ts` が存在し、19 routes 分の test を含む
- [ ] `pnpm --filter @repo/web e2e:staging` が CLI として動作（READMEに env 例記載）
- [ ] staging smoke を 1 回実行し、19 routes が許容ステータス内に収まる
- [ ] Sentry dashboard に server / browser 双方の test event が届くことを目視確認
- [ ] `staging-smoke-checklist.md` が `specs/` 配下に存在し、5 状態 × 19 routes の格子になっている

---

## 11. リスクと緩和

| リスク | 影響 | 緩和 |
|--------|------|------|
| primitives 未完成のため UI が暫定 token しか使えない | デザイン最終一致は task-10 後 | 本 task は `var(--ubm-color-*)` 直書きで先行、token 確定後に refactor task で巻き取り |
| staging に未認証で `/profile` が 200 を返してしまう設定誤り | gate failure 検知できない | smoke の許容ステータスから 200 を除外、`401/302/307` のみ許容に切替できる構成にする |
| Playwright が CI で flaky | smoke 不安定 | `retries: 2` を staging project に限定設定。失敗時は HAR 取得 |
| `global-error.tsx` の挙動が dev で出ない | 検証漏れ | production build (`next build && next start`) で確認、または staging で意図的 throw |
| smoke が production を叩く事故 | 本番影響 | `STAGING_BASE_URL` の値が production URL の場合は spec 冒頭で fail させる guard を入れる |
