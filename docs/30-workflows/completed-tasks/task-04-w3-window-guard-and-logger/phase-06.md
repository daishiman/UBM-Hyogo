# Phase 6: 実装手順詳細

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Phase 番号 | 6 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | Phase 5（環境準備）|
| 下流 Phase | Phase 7（単体テスト計画）|
| 状態 | completed |

---

## 0. 目的

Phase 4 で分解した 6 ステップを、**完全コード付き**で実装手順に落とし込む。元仕様書 §4.1〜4.3 のコードを忠実に引用し、書換パターン・例外化方針・circular import 回避を明記する。

---

## 1. 変更対象ファイル一覧（再掲）

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/lib/is-browser.ts` | C | `typeof window !== 'undefined'` を一箇所に集約 |
| `apps/web/src/lib/logger.ts` | C | 構造化 logger（`info` / `warn` / `error` / `debug`）|
| `apps/web/eslint.config.mjs` | M | `no-restricted-globals` で `window` 素手参照禁止 |
| `apps/web/src/**/*.{ts,tsx}` | M（最小）| 既存未ガード `window` を `isBrowser()` でラップ |

> テスト 2 ファイルの実装は Phase 7 に分離する。

---

## 2. Step 1: `apps/web/src/lib/is-browser.ts` 実装

### 2.1 ファイル全文（元仕様 §4.1 忠実引用）

```ts
/**
 * Server Components / Edge runtime / Workers ランタイム互換のブラウザ判定。
 *
 * - SSR / Workers: false
 * - Browser (jsdom 含む): true
 *
 * 直接 `typeof window !== 'undefined'` を書くと ESLint で弾かれる（task-04 で導入）。
 */
export const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * `requestIdleCallback` 等のブラウザ専用 API を安全に呼ぶ。
 * SSR / Workers では noop。
 */
export function whenBrowser(fn: () => void): void {
  if (isBrowser()) fn();
}
```

### 2.2 設計上の注意

- **`typeof window` は ESLint `no-restricted-globals` の対象外**（typeof 演算子下のグローバル参照は ESLint コア仕様で許容）。本ファイルは `no-restricted-globals` の **唯一の正規参照点**として ignores に列挙される（§4.3 参照）。
- **leaf module**（import 0）に保つ。logger も sentry/capture も import しない。Tree-shaking で SSR bundle から除去可能性を最大化する。
- `isBrowser` を **arrow function const** で定義しているのは、関数式として閉じて `whenBrowser` 内のインライン呼び出しコストを最小にするため。

### 2.3 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
```

---

## 3. Step 2: `apps/web/src/lib/logger.ts` 実装

### 3.1 ファイル全文（元仕様 §4.2 忠実引用）

```ts
import { isBrowser } from "./is-browser";
import { captureException, captureMessage } from "./sentry/capture";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  /** 業務イベント名 (例: "members.list.fetch") */
  event: string;
  /** trace 紐付け用 */
  requestId?: string;
  userId?: string;
  /** 自由 fields。秘匿情報を入れない */
  [key: string]: unknown;
}

export interface Logger {
  debug: (fields: LogFields) => void;
  info: (fields: LogFields) => void;
  warn: (fields: LogFields) => void;
  error: (fields: LogFields & { err?: unknown }) => void;
  /** 子 logger を作成し、共通 fields をマージする */
  child: (base: Partial<LogFields>) => Logger;
}

const RUNTIME_TAG = (): string => {
  if (isBrowser()) return "browser";
  if (typeof process !== "undefined" && (process as { env?: Record<string, string> }).env?.NEXT_RUNTIME) {
    return (process as { env: Record<string, string> }).env.NEXT_RUNTIME;
  }
  return "workers";
};

function emit(level: LogLevel, base: Partial<LogFields>, fields: LogFields & { err?: unknown }) {
  const payload = {
    level,
    ts: new Date().toISOString(),
    runtime: RUNTIME_TAG(),
    ...base,
    ...fields,
  };

  // Workers では JSON 一行が wrangler tail で最も読みやすい
  // eslint-disable-next-line no-console
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.info;
  fn(JSON.stringify(payload));

  // Sentry breadcrumb / capture。観測系の失敗をユーザー画面へ伝播させない。
  try {
    if (level === "error") {
      void captureException(fields.err ?? new Error(fields.event), {
        level: "error",
        tags: { event: fields.event, runtime: payload.runtime },
        extras: payload,
      });
    } else if (level === "warn") {
      void captureMessage(fields.event, { level: "warning", tags: { event: fields.event }, extras: payload });
    }
  } catch {
    // capture 側が同期 throw しても logger は throw しない。
  }
}

function build(base: Partial<LogFields>): Logger {
  return {
    debug: (f) => emit("debug", base, f),
    info: (f) => emit("info", base, f),
    warn: (f) => emit("warn", base, f),
    error: (f) => emit("error", base, f),
    child: (more) => build({ ...base, ...more }),
  };
}

export const logger: Logger = build({});
```

### 3.2 設計上の不変条件

| 不変条件 | 実装上の保証 |
| --- | --- |
| logger 自身が落ちない | Sentry capture を `try/catch` で包み、capture 側が同期 throw しても logger から伝播させない |
| circular import 禁止 | logger → capture **単方向のみ**。`apps/web/src/lib/sentry/capture.ts` から logger を import しない |
| runtime tag | `browser` / `nodejs` / `edge`（NEXT_RUNTIME=`edge` 時）/ `workers`（fallback） |
| Sentry breadcrumb 過多防止 | `info` / `debug` は console のみ。`warn` / `error` のみ Sentry 送信 |
| PII redaction | 本 task 最小実装では redaction 関数を logger 内に持ち、`email` / `name` / `token` / `secret` / `dsn` を含む key の値を `***` に置換してから console / Sentry extras に渡す |

### 3.3 `safeStringify` の追記要否判断

元仕様 §10 リスク表で「Workers でも JSON.stringify が循環で落ちる」として `lib/json-safe.ts` の追加余地が示されている。**本 PR では追加しない**判断とする。理由:

- 現状の `LogFields` は `event` / `requestId` / `userId` + 任意フィールドであり、呼び出し側が明示的に渡す値のみ。React element / DOM Node のような循環参照を持つ値が渡る経路は閉じている。
- `error` の `err` には `Error` インスタンスが入るのが基本ケースで、`Error` 自体は循環しない。
- 後段 task（task-05 error.tsx）で循環参照が現実化したら、`json-safe.ts` の追加と `JSON.stringify(payload, replacer)` 差し替えを別 PR 化する。

### 3.4 ESLint disable コメントの最小化

`emit` 内 `console.error` / `console.warn` 等の使用は、`no-console` rule への対応として **行内 disable** を 1 行のみに集約する（`const fn = ...` の直前）。複数行 disable は禁止。

### 3.5 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
```

---

## 4. Step 4: `apps/web/eslint.config.mjs` 修正

### 4.1 差分（flat config 形式 / 元仕様 §4.3 を flat 化）

`apps/web/eslint.config.mjs` の既存 export 配列に **新規ブロックを追加**する。

```js
// apps/web/eslint.config.mjs（差分。配列の末尾近くに追加）
export default [
  // ...既存設定...

  // task-04: window/document 素手参照禁止
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/is-browser.ts",
      "src/instrumentation-client.ts",
      "src/lib/sentry/**",
      "src/**/__tests__/**",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message: "Use isBrowser() from @/lib/is-browser instead of bare window reference.",
        },
        {
          name: "document",
          message: "Wrap document access with isBrowser() guard.",
        },
      ],
    },
  },
];
```

### 4.2 例外化方針（仕様 §0.6 準拠）

| 対象 | 方針 | 理由 |
| --- | --- | --- |
| `src/instrumentation-client.ts` | `ignores` で off | Sentry browser SDK init は `window` 直接参照が必須 |
| `src/lib/sentry/**` | `ignores` で off | runtime 判定で `typeof window !== 'undefined'` を使うが、typeof は本来 rule 対象外。明示 off で意図を残す |
| `src/lib/is-browser.ts` | `ignores` で off | 唯一の正規参照点 |
| `src/**/__tests__/**` | `ignores` で off | jsdom env で `window` を直接触るテストを許容 |

> **行末 `eslint-disable` コメント方式は禁止**。仕様 §0.6 で明示されているとおり、grep diff 最小化のため **overrides（flat config では追加ブロック）方式** を取る。

### 4.3 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

Step 4 単独では既存違反が残るので **fail することを許容**する。Step 5 完了後に green を確認する。

---

## 5. Step 5: 既存 `window` 参照箇所の `isBrowser()` ラップ

### 5.1 検出コマンド（Phase 5 §6 で取得済みベースライン）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | grep -v 'src/lib/sentry/'
```

### 5.2 書換パターン（元仕様 §6 忠実引用）

#### パターン (a): `'use client'` component 内 → `useEffect` / event handler 内に移動

```tsx
// before（SSR 500 を引き起こす）
const w = window.innerWidth;
```

```tsx
// after: client component 化
"use client";
import { useEffect, useState } from "react";
function useWidth() {
  const [w, setW] = useState(0);
  useEffect(() => setW(window.innerWidth), []);
  return w;
}
```

> `useEffect` 内は client 専用実行が保証されているため `window` 直接参照可。ESLint は `useEffect` 内も検出するので、対象ファイルだけ override を追加する判断は採用せず、`useEffect(() => { if (isBrowser()) ... })` でラップする。

#### パターン (b): RSC / util → `isBrowser()` で囲う

```ts
// before
const w = window.innerWidth;
```

```ts
// after
import { isBrowser } from "@/lib/is-browser";
const w = isBrowser() ? window.innerWidth : 0;
```

#### パターン (c): server で参照したい状態は logger に reportable error

```ts
import { logger } from "@/lib/logger";
import { isBrowser } from "@/lib/is-browser";

if (!isBrowser()) {
  logger.error({ event: "ssr.unexpected.window.access", err: new Error("window accessed in SSR context") });
  return null;
}
```

### 5.3 修正粒度ガード

- 本 task では **既存検出箇所のみ** 修正する。新機能追加・コンポーネント書換は禁止。
- 1 ファイル 1 commit で粒度を守る（diff scope 規律 §400-407）。
- 画面実装 task（11-17）と差分が衝突しそうな大規模ファイルは、修正を最小行に留め、コメントで「task-04 minimal wrap」と注記する。

### 5.4 検証

```bash
# 検出件数 0 を確認
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | grep -v 'src/lib/sentry/' \
  | (! grep .)

# lint 全 pass
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

---

## 6. Step 6: `pnpm build` SSR 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
```

期待: exit 0 / `ReferenceError: window is not defined` ゼロ。失敗時は build ログから対象ファイルを特定し Step 5 の書換パターンを適用する。

---

## 7. circular import 回避の構造ガード

| from → to | 許可 |
| --- | --- |
| `lib/logger.ts` → `lib/is-browser.ts` | OK |
| `lib/logger.ts` → `lib/sentry/capture.ts` | OK |
| `lib/sentry/capture.ts` → `lib/logger.ts` | **禁止**（循環）|
| `lib/sentry/capture.ts` → `lib/is-browser.ts` | OK（runtime 判定を共通化する場合のみ） |
| `lib/is-browser.ts` → 任意 | **禁止**（leaf module 維持）|

検出コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '@/lib/logger|"./logger"|"\\./logger"' src/lib/sentry/
# → ヒット 0 であること
```

---

## 8. I/O / 副作用の最終確認

| 種別 | 内容 |
| --- | --- |
| 入力 | logger 呼び出し側が渡す `LogFields` / `LogFields & { err? }` |
| 出力 | `console.{debug,info,warn,error}(JSON.stringify(payload))` |
| 副作用 | `error` で `captureException` 1 回 / `warn` で `captureMessage(level: "warning")` 1 回 |
| 失敗時挙動 | Sentry 側 throw は `void` でフォールバック swallow（logger は throw しない）|

---

## 9. 実装後の DoD（仕様 §9 準拠）

- [ ] `apps/web/src/lib/is-browser.ts` / `logger.ts` 新設済み
- [ ] `pnpm --filter @ubm-hyogo/web exec rg '\bwindow\.' src/` の検出件数が ignores 対象以外で **0**
- [ ] `pnpm --filter @ubm-hyogo/web lint` が `no-restricted-globals` 違反 0 で pass
- [ ] `pnpm --filter @ubm-hyogo/web build` が SSR 警告なしで pass
- [ ] logger の出力が JSON 一行
- [ ] logger → capture の単方向 import を grep で確認

---

## 10. 成果物（本 phase）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-06/phase-06.md` | 実装手順詳細（本ファイルと同内容）|
| 実装ファイル | `apps/web/src/lib/is-browser.ts` | Step 1 |
| 実装ファイル | `apps/web/src/lib/logger.ts` | Step 2 |
| 実装ファイル | `apps/web/eslint.config.mjs` | Step 4（修正）|
| 修正ファイル群 | `apps/web/src/**/*.{ts,tsx}` | Step 5（最小ラップ）|

---

## 11. 完了条件

- [ ] §9 DoD 全項目 green
- [ ] §7 circular import 検出コマンドが 0 件

---

## 12. 次 Phase

- 次: Phase 7（単体テスト計画）
- 引き継ぎ事項: `is-browser.ts` / `logger.ts` の export 形と Sentry mock 戦略
- ブロック条件: §9 DoD のいずれかが red

## 実行タスク

1. `is-browser.ts` を新設する。
2. `logger.ts` を non-throw / redaction 契約で新設する。
3. ESLint の `no-restricted-globals` 設定を追加する。
4. 既存 `window.` 直参照を最小修正する。

## 参照資料

| 種別 | パス |
| --- | --- |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
| Phase 5 | `phase-05.md` |
