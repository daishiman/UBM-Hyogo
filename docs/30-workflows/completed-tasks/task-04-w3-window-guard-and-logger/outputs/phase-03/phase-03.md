[実装区分: 実装仕様書]

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md

# Phase 3: 詳細設計（モジュール俯瞰）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Phase 番号 | 3 / 13 |
| 上流 Phase | 2 (アーキテクチャ設計) |
| 下流 Phase | 4 (テスト戦略) |
| 状態 | completed |

## 1. 変更対象ファイル一覧

source §3 を Phase 3 の正本として転記:

| # | path | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/lib/is-browser.ts` | C（新規） | `isBrowser()` / `whenBrowser(fn)` |
| 2 | `apps/web/src/lib/logger.ts` | C（新規） | 構造化 logger（debug/info/warn/error + child） |
| 3 | `apps/web/src/lib/__tests__/is-browser.test.ts` | C（新規） | jsdom / node 双方の判定 |
| 4 | `apps/web/src/lib/__tests__/logger.test.ts` | C（新規） | JSON 出力 / Sentry 連携 / child マージ |
| 5 | `apps/web/eslint.config.mjs` | M | `no-restricted-globals` 追加 + overrides |
| 6 | `apps/web/src/**/*.{ts,tsx}` | M（最小） | `window.xxx` 直参照を `isBrowser()` 経由に書換（grep 検出分の最小修正） |

種別: **C** = create（新規追加）/ **M** = modify（既存編集）

## 2. 関数 / 型シグネチャ完全版

### 2.1 `apps/web/src/lib/is-browser.ts`

source §4.1 を Phase 3 仕様として固定:

```ts
/**
 * Server Components / Edge runtime / Workers ランタイム互換のブラウザ判定。
 *
 * - SSR / Workers: false
 * - Browser (jsdom 含む): true
 *
 * 直接 `typeof window !== 'undefined'` を書くと ESLint で弾かれる
 * （task-04 で導入する no-restricted-globals）。
 */
export const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * `requestIdleCallback` 等のブラウザ専用 API を安全に呼ぶヘルパ。
 * SSR / Workers では noop。
 */
export function whenBrowser(fn: () => void): void {
  if (isBrowser()) fn();
}
```

不変条件:

- 本ファイル自身は ESLint overrides で `no-restricted-globals: 'off'` 対象（§4 参照）。
- `typeof` 演算子経由参照のため Workers の strict mode でも throw しない。
- side-effect-free / pure。Tree-shaking で SSR bundle から除外可能。

### 2.2 `apps/web/src/lib/logger.ts`

source §4.2 を整形して Phase 3 仕様化:

```ts
import { isBrowser } from './is-browser';
import { captureException, captureMessage } from './sentry/capture';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  /** 業務イベント名 (例: "members.list.fetch.start") */
  event: string;
  /** trace 紐付け用 */
  requestId?: string;
  userId?: string;
  /** Next.js error digest（task-05 error.tsx が渡す） */
  digest?: string;
  /** 自由 fields。秘匿情報を入れない */
  [key: string]: unknown;
}

export interface Logger {
  debug(fields: LogFields): void;
  info(fields: LogFields): void;
  warn(fields: LogFields): void;
  /** error 時は内部で captureException を呼ぶ */
  error(fields: LogFields & { err?: unknown }): void;
  /** 共通 fields を持つ子 logger を生成 */
  child(base: Partial<LogFields>): Logger;
}

/** runtime tag 判定: browser → workers/edge/nodejs */
function runtimeTag(): 'browser' | 'edge' | 'nodejs' | 'workers' {
  if (isBrowser()) return 'browser';
  const env = (globalThis as { process?: { env?: Record<string, string> } })
    .process?.env;
  const nr = env?.NEXT_RUNTIME;
  if (nr === 'edge') return 'edge';
  if (nr === 'nodejs') return 'nodejs';
  return 'workers';
}

function safeStringify(payload: unknown): string {
  try {
    return JSON.stringify(payload);
  } catch {
    return JSON.stringify({ level: 'error', event: 'logger.stringify.fail' });
  }
}

function emit(
  level: LogLevel,
  base: Partial<LogFields>,
  fields: LogFields & { err?: unknown },
): void {
  const payload = {
    level,
    ts: new Date().toISOString(),
    runtime: runtimeTag(),
    ...base,
    ...fields,
  };

  // Workers では JSON 一行が wrangler tail で最も読みやすい
  // eslint-disable-next-line no-console -- logger 自身が console を集約する
  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.info;
  fn(safeStringify(payload));

  // Sentry breadcrumb / capture（warn / error のみ）
  try {
    if (level === 'error') {
      captureException(fields.err ?? new Error(fields.event), {
        level: 'error',
        tags: { event: fields.event, runtime: payload.runtime },
        extras: payload as Record<string, unknown>,
      });
    } else if (level === 'warn') {
      captureMessage(fields.event, {
        level: 'warning',
        tags: { event: fields.event, runtime: payload.runtime },
        extras: payload as Record<string, unknown>,
      });
    }
  } catch {
    // logger 自身は決して throw しない
  }
}

function build(base: Partial<LogFields>): Logger {
  return {
    debug: (f) => emit('debug', base, f),
    info: (f) => emit('info', base, f),
    warn: (f) => emit('warn', base, f),
    error: (f) => emit('error', base, f),
    child: (more) => build({ ...base, ...more }),
  };
}

export const logger: Logger = build({});
```

#### 2.2.1 入力 / 出力 / 副作用 / 失敗時挙動

| 種別 | 内容 |
| --- | --- |
| 入力 | `LogFields`（`event` 必須、自由フィールド） |
| 出力 | `console.{debug,info,warn,error}` への JSON 一行 |
| 副作用 | level=error → `captureException` 1 回 / level=warn → `captureMessage` 1 回 |
| 失敗時 | Sentry capture が throw しても `try/catch` で握り潰す。`JSON.stringify` 循環は `safeStringify` で fallback |
| 不変条件 | logger は決して throw しない / circular import 禁止（`logger → capture` の単方向） |

#### 2.2.2 runtime tag 判定の優先順位

| 順位 | 条件 | 戻り値 |
| --- | --- | --- |
| 1 | `isBrowser() === true` | `'browser'` |
| 2 | `process.env.NEXT_RUNTIME === 'edge'` | `'edge'` |
| 3 | `process.env.NEXT_RUNTIME === 'nodejs'` | `'nodejs'` |
| 4 | 上記いずれでもない | `'workers'` |

判定ロジックは `globalThis.process?.env` 経由で参照し、Workers ランタイムで `process` が無い場合に ReferenceError を出さない。

### 2.3 ESLint 強制ルール定義

source §4.3 を Phase 3 仕様として整形:

```js
// apps/web/eslint.config.mjs（差分のみ）
export default [
  // ...既存設定...
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message:
            'Use isBrowser() from @/lib/is-browser instead of bare window reference.',
        },
        {
          name: 'document',
          message: 'Wrap document access with isBrowser() guard.',
        },
      ],
    },
  },
  {
    // 例外: Sentry SDK init / is-browser ヘルパ自身 / テスト
    files: [
      'src/instrumentation-client.ts',
      'src/lib/sentry/**',
      'src/lib/is-browser.ts',
      'src/**/__tests__/**',
    ],
    rules: { 'no-restricted-globals': 'off' },
  },
];
```

不変条件:

- 例外はファイル単位 `eslint-disable` ではなく **`overrides`（flat config の追加ブロック）方式**（grep diff 最小化）。
- `typeof window` は `no-restricted-globals` の検出対象外（ESLint コアルール仕様）。よって `is-browser.ts` の判定式は overrides なしでも合法だが、明示的に overrides に含めて意図を表す。

## 3. 利用例

source §5.1 を再掲:

```ts
import { logger } from '@/lib/logger';

export async function listMembers(req: { requestId: string }) {
  const log = logger.child({ requestId: req.requestId });
  try {
    log.info({ event: 'members.list.fetch.start' });
    const res = await fetch('/api/public/members');
    log.info({ event: 'members.list.fetch.ok', status: res.status });
    return await res.json();
  } catch (err) {
    log.error({ event: 'members.list.fetch.fail', err });
    throw err;
  }
}
```

下流 task-05 想定（`app/error.tsx`）:

```tsx
'use client';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logger.error({
    event: 'error.boundary.caught',
    err: error,
    digest: error.digest,
  });
  return <button onClick={reset}>retry</button>;
}
```

## 4. 既存 `window` 参照の書換パターン（俯瞰）

source §6 を Phase 3 仕様化:

| Before | After |
| --- | --- |
| `const w = window.innerWidth;` | `const w = isBrowser() ? window.innerWidth : 0;` |
| RSC 内での `window.location` | client component に切り出し or `useEffect` 内で取得 |
| `if (window.matchMedia)` | `if (isBrowser() && window.matchMedia)` |
| `'use client'` event handler 内 `window.open()` | そのまま（ハンドラはクライアント実行のため） |

## 5. モジュール俯瞰（依存図）

```text
apps/web/src/lib/
├─ is-browser.ts        (C, no deps)
├─ logger.ts            (C, depends on: is-browser, sentry/capture)
├─ sentry/
│   └─ capture.ts       (task-03 が provide。本 task は import only)
└─ __tests__/
    ├─ is-browser.test.ts (vitest, jsdom env)
    └─ logger.test.ts     (vitest, mock sentry/capture)

apps/web/eslint.config.mjs  (M, no-restricted-globals + overrides)
apps/web/src/**/*.{ts,tsx}  (M minimal, isBrowser() ラップのみ)
```

依存方向は **logger → capture の単方向のみ**（capture からは logger を import しない / Phase 1 §5 R5 緩和策）。

## 6. テスト方針（俯瞰）

詳細は Phase 4 で確定するが、本 Phase で予約するケース:

| ファイル | ケース | 期待値 |
| --- | --- | --- |
| `is-browser.test.ts` | jsdom env で `isBrowser()` が `true` | `true` |
| `is-browser.test.ts` | node env で `isBrowser()` が `false` | `false` |
| `is-browser.test.ts` | `whenBrowser(fn)` が SSR では noop / browser では fn 実行 | spy 検証 |
| `logger.test.ts` | `logger.info({event:'x'})` が console.info に JSON 1 行 | `JSON.parse(spy.calls[0][0]).event === 'x'` |
| `logger.test.ts` | `logger.error({event:'y', err})` が `captureException` 1 回 | mock spy.callCount === 1 |
| `logger.test.ts` | `logger.warn` が `captureMessage(level:'warning')` | mock 引数検証 |
| `logger.test.ts` | `logger.child({userId:'u1'})` の payload に `userId` 付与 | JSON 検証 |
| `logger.test.ts` | capture が throw しても logger は throw しない | `expect(...).not.toThrow()` |
| `logger.test.ts` | 循環参照 payload で `safeStringify` フォールバック | console.error が `logger.stringify.fail` を含む JSON を出力 |

## 7. ローカル実行・検証コマンド

source §8 を再掲:

```bash
# 依存解決
mise exec -- pnpm install

# window 参照検出（is-browser.ts / instrumentation-client.ts 以外で 0 件）
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | (! grep .)

# lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 型 / 単体
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/

# build（SSR で window 触ると落ちる→ガード漏れの一発検出）
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 8. 完了条件

- [ ] §1 変更対象ファイル一覧が source §3 と一致
- [ ] §2.1〜§2.3 の関数 / 型シグネチャが TypeScript として完全
- [ ] §2.2.2 の runtime tag 判定が browser / edge / nodejs / workers の 4 値を網羅
- [ ] §3 利用例 + §4 書換パターン + §6 テスト方針が記載
- [ ] `outputs/phase-03/phase-03.md` に同内容が複製済み

## 9. 次 Phase

- 次: Phase 4（テスト戦略）
- 引き継ぎ: §6 のテストケース、§7 の検証コマンド、`apps/web/src/**` 配下の `window` grep 結果
- ブロック条件: 上流 task-03 capture API の最終確定が未了

## 目的

`is-browser.ts`、`logger.ts`、ESLint rule、テストファイルの詳細設計を実装前に固定する。

## 実行タスク

1. 変更対象ファイルを確定する。
2. API シグネチャと logger の non-throw 契約を固定する。
3. window 直参照の grep gate を Phase 9 へ引き継ぐ。

## 参照資料

| 種別 | パス |
| --- | --- |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
| task-03 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md` |

## 成果物

| 種別 | パス |
| --- | --- |
| Phase 3 仕様 | `phase-03.md` |
| Phase 3 output | `outputs/phase-03/phase-03.md` |
