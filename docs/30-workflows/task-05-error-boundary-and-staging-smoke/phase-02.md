# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

## 変更対象ファイル一覧

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/app/error.tsx` | C | route segment error boundary（dev/prod 分岐 + digest + reset + Sentry capture） |
| `apps/web/app/global-error.tsx` | C | 最上位 fallback（`<html><body>` 含む） |
| `apps/web/app/not-found.tsx` | C | 404 UI（仮 markup） |
| `apps/web/app/loading.tsx` | C | Suspense fallback（仮 markup、aria-busy 付与） |
| `apps/web/app/__tests__/error.test.tsx` | C | Vitest 単体テスト |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | C | Playwright 19 routes smoke |
| `apps/web/playwright.config.ts` | M | `staging-smoke` project / baseURL / retries 追加 |
| `apps/web/package.json` | M | `e2e:staging` script 追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` | C | 19 routes × 5 状態の手動チェックリスト |

## 19 routes source of truth

19 routes の正本は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` とする。Phase 2/4/5/7/11 と Playwright spec は route 表を複製せず、この checklist の 19 行を入力にする。

種別: C=Create / M=Modify / D=Delete

## 関数・型シグネチャ

### `apps/web/app/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props): JSX.Element;
```

### `apps/web/app/global-error.tsx`

```tsx
"use client";
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element;
```

### `apps/web/app/not-found.tsx`

```tsx
export default function NotFound(): JSX.Element;
```

### `apps/web/app/loading.tsx`

```tsx
export default function Loading(): JSX.Element;
```

完全な実装イメージは原典 `task-05-w4-par-error-boundary-and-staging-smoke.md` §4.1〜4.4 を参照（Phase 5 で同一に再掲）。

## データフロー / 副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | Next.js runtime からの `error: Error & { digest? }` / `reset: () => void` props |
| 出力 | React tree（fallback UI）、Sentry event（`logger.error` 経由）、stdout 構造化 log |
| 副作用 | Sentry HTTP 送信、`useEffect` 内 1 回限りの logger 呼び出し |
| 失敗時挙動 | logger / Sentry 内部で例外が起きても再 throw しない（task-04 logger 仕様で握りつぶす） |

## 上流依存の取り込み

| 上流 task | import | 用途 |
| --- | --- | --- |
| task-04 | `import { logger } from "@/lib/logger"` | error mount 時の構造化 log |
| task-03 | `logger.error` 内で `captureException` 委譲済み（直接 import しない） |
| task-02 | `playwright.config.ts` の `process.env.STAGING_BASE_URL` 参照（test runner 側のみ許可） |

`error.tsx` 本体では **`captureException` を直接 import しない**。Sentry 送信は task-04 logger に委譲する設計とすることで上流契約に整合する。

## 19 routes smoke スコープ

phase-1 §2.2 に準拠（公開 6 + 会員 2 + 管理 8 + 404 fixture + error boundary fixture + 一覧 fixture）。詳細表は `staging-smoke-checklist.md` を正本とする。

## staging-only fixture contract

`NODE_ENV !== "production"` は staging fixture の制御に使わない。Cloudflare staging は production build になり得るため、error injection route は `ENABLE_STAGING_SMOKE_FIXTURE=1` の明示フラグがある staging deploy だけで有効化する。production deploy は同フラグが入っていれば fail closed する。

## Sentry event source split

| Event | Source | Evidence |
| --- | --- | --- |
| browser boundary event | `error.tsx` / `global-error.tsx` の client `useEffect` が `logger.error` を呼ぶ | Sentry screenshot + unit test |
| server test event | task-03/04 の server-side logger/capture contract を使う staging smoke helper route or existing server test event command | Sentry screenshot + Phase 11 command log |

## 設計上の判断

| 論点 | 判断 | 理由 |
| --- | --- | --- |
| `error.tsx` から Sentry SDK を直接呼ぶか | 呼ばず logger 経由 | task-03 / task-04 の boundary を一本化。SDK 直叩きの散在を防ぐ |
| token 暫定 / 正本 | `var(--ubm-color-*)` 直書き先行 | task-09 token 確定後に refactor 不要にするため変数経由 |
| smoke の許容ステータス | `[200, 301, 302, 307, 401, 403, 404]` 範囲 | auth gate / public のどちらでも検出漏れを最小化、production 200 流入は spec 冒頭 guard で防ぐ |
| `loading.tsx` を独立 route で smoke するか | しない（Slow API シナリオで観察） | App Router 規約上 loading 単体 URL は存在しないため |

## 完了条件

- [ ] 変更対象ファイル表が原典 §0.3 / §3 と整合
- [ ] 関数シグネチャが Next.js v15 規約（`error.tsx` は `"use client"` + 既定 export）に準拠
- [ ] 上流 task の export のみで実装が完結する設計になっている
