# Phase 2: 設計

## 1. モジュール topology

```
apps/web/src/instrumentation-client.ts   (SDK 起動・配線のみ / 既存編集)
        │ import
        ▼
apps/web/src/lib/sentry/extension-noise-filter.ts   (純粋判定ロジック / 新規)
        ▲ import (test)
        │
apps/web/src/lib/sentry/extension-noise-filter.spec.ts   (単体テスト / 新規)

apps/web/src/lib/sentry/index.ts   (barrel re-export / 任意編集)
```

責務分離: 判定（pure）と SDK 起動（副作用）を分ける。`extension-noise-filter.ts` は `@sentry/core` の**型のみ** import し、`Sentry.init` を呼ばない＝テスト時に SDK を起動しない。

## 2. 公開 API シグネチャ（`extension-noise-filter.ts`）

```ts
import type { ErrorEvent, EventHint } from "@sentry/core";

/** 拡張スキームの prefix（小文字比較用） */
export const EXTENSION_PROTOCOL_PREFIXES: readonly string[];
// ["chrome-extension://", "moz-extension://", "safari-web-extension://", "safari-extension://"]

/** Sentry denyUrls 用（最終 stack frame の URL でマッチ） */
export const EXTENSION_DENY_URLS: RegExp[];
// [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-web-extension:\/\//i, /^safari-extension:\/\//i]

/** Sentry ignoreErrors 用（message 文字列でマッチ。観測 noise を逐語/部分一致で列挙） */
export const EXTENSION_IGNORE_ERRORS: (string | RegExp)[];

/** URL 文字列が拡張スキームか（undefined/空は false） */
export function isExtensionUrl(url: string | undefined | null): boolean;

/** Sentry event のいずれかの stack frame / request.url / culprit が拡張由来か */
export function eventHasExtensionFrame(event: ErrorEvent): boolean;

/** Sentry.init beforeSend 本体。拡張由来なら null（drop）、それ以外は event を返す（fail-open） */
export function filterExtensionNoise(event: ErrorEvent, hint?: EventHint): ErrorEvent | null;
```

### `EXTENSION_IGNORE_ERRORS` 初期値（観測ノイズ由来）

| パターン | 由来 |
|----------|------|
| `"Could not establish connection. Receiving end does not exist."`（文字列） | 拡張 messaging |
| `/No tab with id:/`（RegExp） | `chrome.tabs` |
| `/Access to storage is not allowed from this context/` | content script storage |
| `/Cannot read properties of undefined \(reading '(mapKeyRegistry\|useVimLikeEscape)'\)/` | Vim 系拡張 |
| `/ResizeObserver loop (limit exceeded\|completed with undelivered notifications)/` | 一般的拡張/ブラウザノイズ（保険） |

> 文字列は部分一致、RegExp は test。Sentry の `ignoreErrors` 仕様に準拠。

## 3. 判定ロジック設計（`eventHasExtensionFrame`）

走査順（いずれか 1 つでもヒットで true）:

1. `event.exception?.values?.[]` の各 `value.stacktrace?.frames?.[]` の `frame.filename`（+ `frame.abs_path`）を `isExtensionUrl` 判定
2. `event.request?.url` を `isExtensionUrl` 判定
3. `event.culprit`（文字列）に拡張 prefix が含まれるか

防御的実装（AC-6 fail-open）:
- `event` が null/undefined → **false**（＝drop しない＝残す）。`filterExtensionNoise` 側で event を返す。
- frames が配列でない／filename が無い → スキップ（その frame は非拡張扱い）
- 例外が起きても `try/catch` で握り、**false 側（＝残す）に倒す**。監視データを失うより重複ノイズを許容。

### `isExtensionUrl` 真理値表

| 入力 | 戻り値 |
|------|--------|
| `undefined` / `null` / `""` | `false` |
| `"chrome-extension://abc/lib/utils.js"` | `true` |
| `"https://ubm-hyogo-web.../profile"` | `false` |
| `"moz-extension://..."` / `"safari-web-extension://..."` / `"safari-extension://..."` | `true` |
| 大文字混在 `"Chrome-Extension://..."` | `true`（小文字化して prefix 比較） |

## 4. `Sentry.init()` 配線（`instrumentation-client.ts` 編集）

```ts
import {
  EXTENSION_DENY_URLS,
  EXTENSION_IGNORE_ERRORS,
  filterExtensionNoise,
} from "@/lib/sentry/extension-noise-filter"; // 既存 import 形式に合わせる

Sentry.init({
  dsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "local",
  tracesSampleRate: parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
  ignoreErrors: EXTENSION_IGNORE_ERRORS,
  denyUrls: EXTENSION_DENY_URLS,
  beforeSend: filterExtensionNoise,
});
```

- 既存の `try/catch` / `dsn` ガード / `__ubmSentryInitialized__` ガードは維持。
- import path は既存ファイルの alias 慣習（`@/` が使えるか相対か）を Phase 5 で実コードに合わせて確定する。

## 5. 多層防御の役割分担（なぜ 3 つとも要るか）

| 機構 | マッチ対象 | カバー範囲 | 穴 |
|------|-----------|-----------|-----|
| `ignoreErrors` | error message | 文字列で判別できる既知ノイズ | message が変わると漏れる |
| `denyUrls` | **最終** stack frame の URL | 拡張スクリプトが throw 元のとき | 拡張 → アプリ呼び出しで最終フレームがアプリだと漏れる |
| `beforeSend`（`filterExtensionNoise`） | **全** stack frame / request.url / culprit | 上記の穴を全走査で補完 | 最終手段。fail-open |

3 機構は重複を許容した defense-in-depth。`beforeSend` だけでも AC-1 は満たすが、`ignoreErrors`/`denyUrls` は Sentry 既定の `InboundFilters` を活かす安価な前段。

## 6. 型の扱い

- `@sentry/core` の `ErrorEvent` / `EventHint` を **型 import**（`import type`）。値 import しない＝バンドルに影響なし・テストで SDK 起動なし。client 初期化側だけが `@sentry/nextjs` を値 import する。
- `beforeSend` の戻り値は `ErrorEvent | null`（Sentry v10 signature）。`PromiseLike` は使わず同期で返す。

## 7. テスト戦略概要（詳細は Phase 4）

- 対象: `extension-noise-filter.ts` の pure function 群のみ（`instrumentation-client.ts` は副作用 import のため単体テスト対象外。配線確認は typecheck + Phase 11 手動確認で代替）。
- 環境: vitest（root `vitest.config.ts`、`apps/web` 配下 colocated spec）。SDK モック不要（型のみ依存）。
- event は最小限の plain object literal を `ErrorEvent` として渡す。

## 8. 既存コンポーネント再利用可否（FB-SDK-07-1）

- 新規 UI なし。既存 `capture.ts` の fail-soft 思想を filter にも適用（throw しない）。再利用すべき既存 util は判定系には無く、新規 pure module が最小実装。
