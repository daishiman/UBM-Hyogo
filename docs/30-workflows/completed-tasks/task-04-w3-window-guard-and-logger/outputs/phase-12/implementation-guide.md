> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書
> 生成 phase: phase-12

# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

ブラウザには `window` という「教室の中にある道具箱」のようなものがある。ところが、サーバー側や Cloudflare Workers ではその道具箱が置かれていない。道具箱がない場所で中身を取り出そうとすると、ページを作る途中で止まってしまう。

### 何をするか

道具箱を開ける前に、必ず `isBrowser()` で「今ここはブラウザか」を確認する。ブラウザでなければ何もしない。これを全員が同じ方法で書けるように、`apps/web/src/lib/is-browser.ts` に集約する。

### 今回作ったもの

- `is-browser.ts`: ブラウザかどうかを確認する小さな部品。
- `logger.ts`: 起きたことを一行で記録し、エラーを Sentry に渡す部品。
- テスト計画: node とブラウザ風の環境で同じ約束を確認する。

### logger とは

logger は、サイトで起きたことを同じ書式で残すノート。普通の出来事は一行 JSON で出し、エラーや警告は Sentry にも送る。ただし、秘密の合言葉や個人情報はノートにそのまま書かない。

### 用語セルフチェック

| 用語 | 日常語での説明 |
| --- | --- |
| SSR | ページを利用者に見せる前にサーバー側で組み立てること |
| Workers | Cloudflare 上で動く軽いサーバー |
| Sentry | エラーを集めて後で確認できる記録箱 |
| JSON 一行 | 決まった形で一行にまとめたメモ |
| ESLint | 書き方のミスを機械的に止める先生役 |

## Part 2: 技術者向け仕様

### APIシグネチャ

```ts
export function isBrowser(): boolean;
export function whenBrowser(fn: () => void): void;

export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogFields {
  event: string;
  requestId?: string;
  userId?: string;
  digest?: string;
  [key: string]: unknown;
}
export interface Logger {
  debug(fields: LogFields): void;
  info(fields: LogFields): void;
  warn(fields: LogFields): void;
  error(fields: LogFields & { error?: unknown; err?: unknown }): void;
  child(base: Partial<LogFields>): Logger;
}
```

### 使用例

```ts
import { isBrowser, whenBrowser } from "@/lib/is-browser";
import { logger } from "@/lib/logger";

if (isBrowser()) {
  logger.info({ event: "window.guard.browser" });
}

whenBrowser(() => {
  window.requestAnimationFrame(() => {
    logger.debug({ event: "window.guard.raf" });
  });
});

logger.error({ event: "error.boundary.caught", error: new Error("boom"), digest: "d1" });
```

### NON_VISUAL / screenshot

この task は `apps/web/src/lib/*`、ESLint gate、テスト、focus-trap の SSR guard を対象にした NON_VISUAL 変更であり、route component / CSS / design token / layout を変更しない。したがって Phase 11 screenshot evidence は不要で、`outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` を視覚証跡の代替とする。

### Runtime Matrix

| runtime | `isBrowser()` | logger runtime tag |
| --- | --- | --- |
| Browser / jsdom | true | `browser` |
| Node SSR | false | `nodejs` when `NEXT_RUNTIME=nodejs` |
| Workers / Edge | false | `edge` or `workers` fallback |

### エラーハンドリング

`logger.error()` と `logger.warn()` は `captureException` / `captureMessage` を `try/catch` で包む。Sentry 側が同期 throw しても logger は throw しない。

### エッジケース

| case | 扱い |
| --- | --- |
| `window` が存在しない SSR / Workers | `isBrowser()` が false を返し、`whenBrowser()` は noop |
| Sentry capture が同期 throw | logger 内の `try/catch` で吸収 |
| `NEXT_RUNTIME` 未設定 | `workers` fallback |
| 秘密値を含む payload key | redaction 後に console / Sentry extras へ渡す |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| 許可 runtime tag | `browser` / `edge` / `nodejs` / `workers` |
| Sentry capture level | `error` / `warning` のみ |
| redaction key fragment | `email` / `name` / `token` / `secret` / `dsn` |
| grep allow-list | `is-browser.ts` / `instrumentation-client.ts` |

### テスト構成

| file | environment | 目的 |
| --- | --- | --- |
| `is-browser.test.ts` | jsdom | browser 判定と `whenBrowser()` 実行 |
| `is-browser.node.test.ts` | node | SSR / Workers 判定と noop |
| `logger.test.ts` | jsdom | JSON 一行、Sentry mock、child merge |
| `logger.runtime.test.ts` | node | `nodejs` / `workers` runtime tag |

### Redaction

`email` / `name` / `token` / `secret` / `dsn` を含む key の値は console / Sentry extras へ渡す前に `***` に置換する。D1 SQL、binding、Cloudflare secret 値は payload に含めない。

### Tree-shaking 観点

`apps/web/src/lib/is-browser.ts` と `apps/web/src/lib/logger.ts` は **named export only / pure module** を不変条件にする。top-level での side-effect（`window.addEventListener` 等）を持たず、`Sentry.init` 系 import も runtime 内のみに閉じ込めることで、未使用 export は bundler が drop できる。default export を作らないこと、re-export 集約 module（barrel）を経由しないことを ESLint と code review で維持する。これにより SSR / Workers / Browser いずれの bundle にも logger / is-browser が二重展開しない。

### ESLint override 方針

`apps/web/eslint.config.mjs` で `no-restricted-globals` を有効化し、`window` / `document` / `history` / `navigator` の直接参照を error にする。例外として allow-list を以下 4 経路に固定する: `apps/web/src/lib/is-browser.ts` / `apps/web/src/instrumentation-client.ts` / `apps/web/src/lib/sentry/**` / `apps/web/src/**/__tests__/**`。allow-list 経路は overrides ブロックで `no-restricted-globals` を `off` に倒し、それ以外の `apps/web/src/**` は default rule で禁止する。allow-list の追加は `09-ui-ux.md` の正本 4 経路を改訂してから行う。

### PII redaction allow-list 方式の最小実装

`logger.ts` 内部の `redactPII(value)` は payload を再帰的に走査し、key が `/email|token|password|cookie|authorization/i` に match した値を文字列 `[REDACTED]` に置換する。`Error` instance に達した時点で短絡し、`message` / `name` / `stack` のみ保持する（循環参照と stack の二重 redact を避けるため）。allow-list 方式（落とすキーをホワイトリスト管理）ではなく **deny-pattern + Error 短絡** で最小コードを保ち、新キー追加時のみ正規表現を更新する運用にする。redaction は console と Sentry extras の両方で同じ前処理を通る。

### 後続 task 取り込みチェックリスト（task-05 / task-11..17）

| task | 取り込み内容 | 検証 |
| --- | --- | --- |
| task-05 | `app/error.tsx` の error boundary から `logger.error({ event, error, digest })` を呼び、Sentry capture と一行 JSON 出力を統合する | task-05 Phase 11 evidence で `logger.error` 呼び出しを grep |
| task-11..17 | 各画面で `whenBrowser()` / `browserHistory()` / `browserDocument()` / `browserNavigator()` を採用し、`window.` / `document.` / `history.` / `navigator.` 直書きを残置しない | per-screen task の Phase 11 grep gate（`is-browser.ts` / `instrumentation-client.ts` / `sentry/**` / `__tests__/**` 以外で 0 件）で検出 |
