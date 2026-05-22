[実装区分: 実装仕様書]

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md

# Phase 2: アーキテクチャ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Phase 番号 | 2 / 13 |
| 上流 Phase | 1 (要件定義) |
| 下流 Phase | 3 (詳細設計) |
| 状態 | completed |

## 1. DAG 座標

| 項目 | 値 |
| --- | --- |
| Wave | W3 |
| 直前依存 | task-01（gate） / task-03（`captureException` / `captureMessage` の export） |
| 直後依存 | task-05（`app/error.tsx` が `logger.error()` を呼ぶ）/ task-09 以降全画面（`window` 参照修正済み前提） |
| 並列性 | task-02（`apps/web/src/lib/env.ts`）とは別ファイルで衝突なし。task-03 の `apps/web/src/lib/sentry/capture.ts` 確定後に着手 |

```text
task-01 (gate)
   │
   ▼
task-02 (env)  ──┐
                 │（独立）
task-03 (sentry init + capture)
   │
   ▼
task-04 (本タスク: is-browser + logger)  ◀── 本 Phase 範囲
   │
   ▼
task-05 (error.tsx + smoke)
   │
   ▼
task-09..17 (画面 task: window 参照箇所の本格書換)
```

## 2. 競合ファイル早見表（`apps/web/src/lib/`）

| path | 種別 | 触る Wave / task | 衝突可能性 |
| --- | --- | --- | --- |
| `apps/web/src/lib/env.ts` | task-02 が新設 | W2 | 無（別ファイル） |
| `apps/web/src/lib/sentry/capture.ts` | task-03 が新設 | W2 | 無（本 task は import のみ） |
| `apps/web/src/lib/sentry/index.ts` 等 | task-03 | W2 | 無 |
| `apps/web/src/instrumentation.ts` | task-03 | W2 | 無 |
| `apps/web/src/instrumentation-client.ts` | task-03 | W2 | 本 task が ESLint overrides で **読み取り参照のみ**。書き換えなし |
| `apps/web/src/lib/is-browser.ts` | **本 task が新設** | W3 | - |
| `apps/web/src/lib/logger.ts` | **本 task が新設** | W3 | - |
| `apps/web/eslint.config.mjs` | **本 task が拡張（M）** | W3 | task-02/03 と編集領域が異なれば衝突しない（merge marker は Phase 5 で解消） |
| `apps/web/src/**/*.{ts,tsx}` | 本 task が `window` 直参照のみ最小修正 | W3 | 画面 task との分担はチェックリスト化で吸収 |

## 3. 既存 `window` 参照箇所の grep 戦略

### 3.1 検出コマンド（Phase 5 ランブックでも再利用）

```bash
# A. 直接参照（メソッド呼び出し / プロパティ）
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/

# B. typeof window（許容: ESLint 検出対象外だが集約推奨）
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'typeof\s+window' src/

# C. 文字列 / コメント混入（false positive 候補）
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n "['\"]window['\"]" src/
```

### 3.2 分類ポリシー

| 種別 | 例 | 対処 |
| --- | --- | --- |
| RSC / util / hook 内の `window.xxx` | `window.innerWidth` | `isBrowser()` ガードで囲む（SSR 時 fallback 値を返す） |
| `'use client'` component の lifecycle 外 | `const w = window.matchMedia(...)` | `useEffect` 内に移動 |
| `'use client'` の event handler 内 | `onClick={() => window.open()}` | そのまま許容（ハンドラはクライアント実行） |
| Sentry SDK init | `instrumentation-client.ts` | overrides で `no-restricted-globals: 'off'` |
| `typeof window` 判定 | 散在する直書き | `is-browser.ts` の `isBrowser()` に置換 |

### 3.3 ESLint 例外配置

source §0.6 に従い、ファイル単位 disable comment ではなく **`overrides` セクション**で例外化:

```js
{
  files: [
    'src/instrumentation-client.ts',
    'src/lib/sentry/**',
    'src/lib/is-browser.ts',
    'src/**/__tests__/**',
  ],
  rules: { 'no-restricted-globals': 'off' },
}
```

## 4. 並列性の根拠

- task-04 は **新設ファイル 4 本 + ESLint config 拡張 + 画面側最小修正**。task-02/03 と編集 path が分離されている（competing files: 早見表 §2）。
- 実行順序の制約は **task-03 の `captureException` シグネチャ確定**のみ。task-03 の Phase 3（詳細設計）が完了した時点で本 task は着手可能。
- W3 内では task-04 単独。task-05 は本 task の `logger` を import するので W4 に直列化。

## 5. 上流 task-03 から受け取るシグネチャ

source §0.6 に基づき:

```ts
// apps/web/src/lib/sentry/capture.ts （task-03 が provide）
export type CaptureContext = {
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
};

export function captureException(
  error: unknown,
  ctx?: CaptureContext,
): string | undefined;

export function captureMessage(
  message: string,
  ctx?: CaptureContext,
): string | undefined;
```

- 二重 init ガード変数 `__ubmSentryInitialized__`（globalThis 上）は **logger からは触らない**。logger は capture API のみを呼び、init 状態は capture 側がハンドルする（Sentry が未 init なら capture は no-op で string|undefined を返す前提）。
- capture 関数は **throw しない**。logger 側の `try/catch` は最小限。

## 6. 下流 task-05 へ渡すシグネチャ

source §0.7 に基づき本 task が公開する surface:

```ts
// apps/web/src/lib/is-browser.ts
export function isBrowser(): boolean;
export function whenBrowser(fn: () => void): void;

// apps/web/src/lib/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogFields {
  event: string;
  requestId?: string;
  userId?: string;
  digest?: string;       // task-05 error.tsx が渡す Next.js error digest
  [key: string]: unknown;
}
export interface Logger {
  debug(fields: LogFields): void;
  info(fields: LogFields): void;
  warn(fields: LogFields): void;
  error(fields: LogFields & { err?: unknown }): void;
  child(base: Partial<LogFields>): Logger;
}
export const logger: Logger;
```

下流呼び出しパターン（task-05 想定）:

```ts
import { logger } from '@/lib/logger';
logger.error({ event: 'error.boundary.caught', err: error, digest });
```

予約 event 名（task-05 が利用）:

| event | 用途 |
| --- | --- |
| `error.boundary.caught` | route segment error.tsx |
| `error.global-boundary.caught` | global-error.tsx |
| `error.not-found` | not-found.tsx |

## 7. 依存マトリクス

| 成果物 | 依存元 | 依存先 |
| --- | --- | --- |
| `is-browser.ts` | なし | `logger.ts`、`apps/web/src/**` 各所 |
| `logger.ts` | `is-browser.ts`、`sentry/capture.ts`（task-03） | `app/error.tsx`（task-05）、画面 task |
| `eslint.config.mjs` 拡張 | `is-browser.ts` 配置 | 全 `apps/web/src/**/*.{ts,tsx}` |
| tests | 上記すべて | CI lint / typecheck / unit |

## 8. アーキテクチャ判断

| 判断 | 採用 | 棄却案 |
| --- | --- | --- |
| `window` ガード集約 | ヘルパ 1 関数（`isBrowser()`）+ ESLint 強制 | (A) 直書き許容（→ false negative）/ (C) `globalThis.window` フォールバック（→ Workers でも window が undefined になるので不要） |
| logger 出力形式 | JSON 一行（wrangler tail / Sentry extras 双方で読める） | (A) text 形式（パース困難）/ (B) protobuf（Workers 互換性低） |
| Sentry 連携 | `error` → `captureException` / `warn` → `captureMessage` / それ以外 console のみ | 全 level capture（rate-limit リスク） |
| ESLint 例外 | overrides セクション | ファイル単位 disable comment（grep diff 増加） |
| runtime tag | `isBrowser()` → `NEXT_RUNTIME` → `'workers'` | `globalThis.constructor.name` 等の脆い判定 |

## 9. 実行タスク

1. competing file 表と grep 結果（仮）を Phase 3 の詳細設計入力にする。
2. ESLint overrides の `files` glob を確定（§3.3）。
3. 上流 task-03 の `CaptureContext` 型を Phase 3 で再掲し、logger 内呼び出しコードに反映。
4. 下流 task-05 用 event 名 enum を Phase 3 で文字列 union として定義候補化。

## 10. 完了条件

- [ ] DAG 座標 / 競合ファイル早見表 / 並列性根拠が確定
- [ ] grep 戦略コマンドが実行可能な形で記述
- [ ] 上流 / 下流シグネチャが完全な TypeScript 型として固定
- [ ] `outputs/phase-02/phase-02.md` に同内容が複製済み

## 11. 次 Phase

- 次: Phase 3（詳細設計 / 関数シグネチャ / モジュール俯瞰）
- 引き継ぎ: §5/§6 のシグネチャ、§3.3 の overrides 配置、§6 の予約 event 名
- ブロック条件: 上流 task-03 の capture シグネチャ未確定

## 目的

task-03 から受け取る capture API と task-05 へ渡す logger API の境界を固定する。

## 参照資料

| 種別 | パス |
| --- | --- |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
| upstream | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |
| downstream | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md` |

## 成果物

| 種別 | パス |
| --- | --- |
| Phase 2 仕様 | `phase-02.md` |
| Phase 2 output | `outputs/phase-02/phase-02.md` |
