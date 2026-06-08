# Phase 4: テスト作成（TDD Red 設計）

## 1. 目的

`apps/web/src/lib/sentry/extension-noise-filter.ts`（pure module）の関数群と
定数の振る舞いを単体テストで先に固定する。実装はまだ存在しないため、
この時点では import エラー・未定義参照で**全ケースが fail（TDD Red）する**ことを期待値とする。

テストファイル: `apps/web/src/lib/sentry/extension-noise-filter.spec.ts`（colocated, `*.spec.ts`）

## 2. テスト方針

- テスト対象は副作用のない pure 関数（`isExtensionUrl` / `eventHasExtensionFrame` / `filterExtensionNoise`）と定数（`EXTENSION_IGNORE_ERRORS` / `EXTENSION_DENY_URLS` / `EXTENSION_PROTOCOL_PREFIXES`）。
- **Sentry SDK は起動しない**。`Sentry.init()` を呼ばず、`@sentry/core` からは `import type { ErrorEvent, EventHint }` の**型のみ**を借りる（AC-5）。SDK のモックは不要。
- 各 `ErrorEvent` は**最小の plain object literal** で構築する。`@sentry/core` の `ErrorEvent` 型に対し、テストで必要な部分フィールド（`exception.values[].stacktrace.frames[]`・`request.url`・`culprit`）だけを持つオブジェクトを `satisfies` か局所ヘルパで組み立てる。
- 全関数が `export` されているため、private method への型キャスト（`as unknown as ...` でのアクセス）は**不要**。壊れた shape を渡すケースのみ、意図的な不正値投入として `as ErrorEvent` キャストを使う。
- import 形態:
  ```ts
  import { describe, expect, it } from "vitest";
  import type { ErrorEvent } from "@sentry/core";
  import {
    EXTENSION_DENY_URLS,
    EXTENSION_IGNORE_ERRORS,
    eventHasExtensionFrame,
    filterExtensionNoise,
    isExtensionUrl,
  } from "./extension-noise-filter";
  ```

## 3. テストケース表

### 3.1 `isExtensionUrl`

| ケースID | 入力 | 期待値 | 対応AC |
|---------|------|--------|--------|
| URL-01 | `undefined` | `false` | AC-6 |
| URL-02 | `null` | `false` | AC-6 |
| URL-03 | `""`（空文字） | `false` | AC-6 |
| URL-04 | `"chrome-extension://abcdef/content.js"` | `true` | AC-1 |
| URL-05 | `"https://members.ubm-hyogo.example/app.js"` | `false` | AC-2 |
| URL-06 | `"moz-extension://uuid/inject.js"` | `true` | AC-1 |
| URL-07 | `"safari-web-extension://GUID/script.js"` | `true` | AC-1 |
| URL-08 | `"safari-extension://com.vendor/script.js"` | `true` | AC-1 |
| URL-09 | `"CHROME-EXTENSION://ABCDEF/X.JS"`（大文字混在） | `true` | AC-1 |
| URL-10 | `"  chrome-extension://abc/x.js"`（前方空白）※実装で trim する場合のみ true / しない場合は false。実装方針に合わせ Phase 5 確定値を採用 | 実装方針に従う | AC-6 |

> URL-10 は「prefix の小文字化比較」のみ行い trim はしない方針なら `false`。
> Phase 5 の確定実装に合わせて期待値を 1 つに固定すること（曖昧さを残さない）。

### 3.2 `eventHasExtensionFrame`

各 event は最小 plain object で構築する。

| ケースID | event の形 | 期待値 | 対応AC |
|---------|-----------|--------|--------|
| FRAME-01 | `exception.values[0].stacktrace.frames[]` に `filename: "chrome-extension://..."` を1件含む | `true` | AC-1 |
| FRAME-02 | frames がすべてアプリ URL（`https://.../app.js`）のみ | `false` | AC-2 |
| FRAME-03 | `{}`（空 event） | `false` | AC-6 |
| FRAME-04 | `undefined` を渡す（`as ErrorEvent`） | `false`（throw しない） | AC-6 |
| FRAME-05 | frame に `filename` 無し・`abs_path: "moz-extension://..."` のみ | `true` | AC-1 |
| FRAME-06 | `request.url: "chrome-extension://..."`（frames 無し） | `true` | AC-1 |
| FRAME-07 | `culprit: "chrome-extension://uuid/bg.js"` | `true` | AC-1 |
| FRAME-08 | `exception.values` が配列でない（`values: "broken"`）壊れた shape | `false`（throw しない） | AC-6 |
| FRAME-09 | `stacktrace.frames` が配列でない（`frames: 42`） | `false`（throw しない） | AC-6 |

### 3.3 `filterExtensionNoise`

| ケースID | 入力 event | 期待値 | 対応AC |
|---------|-----------|--------|--------|
| FILTER-01 | 拡張 frame を含む event | `null`（drop） | AC-1 |
| FILTER-02 | アプリ frame のみの event | **同一参照の event を返す** | AC-2 |
| FILTER-03 | 壊れた event（`values` が非配列） | **event を返す**（fail-open） | AC-2 / AC-6 |
| FILTER-04 | `undefined` を渡す（`as ErrorEvent`） | throw せず、引数で渡したもの（= `undefined`）を返す（fail-open） | AC-6 |
| FILTER-05 | `request.url` が拡張の event | `null` | AC-1 |
| FILTER-06 | `hint` を第2引数で渡してもアプリ event は素通し | event を返す | AC-2 |

> FILTER-02 は `expect(filterExtensionNoise(ev)).toBe(ev)`（参照一致）で固定する。

### 3.4 `EXTENSION_IGNORE_ERRORS`（観測メッセージのマッチ確認）

`EXTENSION_IGNORE_ERRORS` の各要素（`string | RegExp`）が、実際に観測された拡張由来メッセージにマッチすることをテストする。
ヘルパ `matchesAnyIgnore(message: string): boolean` をテスト内に定義し、
`EXTENSION_IGNORE_ERRORS.some(p => typeof p === "string" ? message.includes(p) : p.test(message))` で判定する。

| ケースID | メッセージ | 期待 | 対応AC |
|---------|-----------|------|--------|
| IGN-01 | `"Could not establish connection. Receiving end does not exist."` | マッチ（true） | AC-3 |
| IGN-02 | `"No tab with id: 1234"` | マッチ | AC-3 |
| IGN-03 | `"Cannot read properties of undefined (reading 'mapKeyRegistry')"` | マッチ | AC-3 |
| IGN-04 | `"Cannot read properties of undefined (reading 'useVimLikeEscape')"` | マッチ | AC-3 |
| IGN-05 | `"Access to storage is not allowed from this context"` | マッチ | AC-3 |
| IGN-06 | `"ResizeObserver loop completed with undelivered notifications."` | マッチ | AC-3 |
| IGN-07 | `"TypeError: members.map is not a function"`（アプリ実エラー） | **マッチしない（false）** | AC-2 |

> IGN-07 が最重要の fail-open 回帰確認。アプリ実エラー文言が誤って ignore 対象にならないことを固定する。

### 3.5 `EXTENSION_DENY_URLS`（URL マッチ確認）

| ケースID | URL | 期待 | 対応AC |
|---------|-----|------|--------|
| DENY-01 | `"chrome-extension://abc/x.js"` が `EXTENSION_DENY_URLS` のいずれかにマッチ | true | AC-4 |
| DENY-02 | `"moz-extension://abc/x.js"` | true | AC-4 |
| DENY-03 | `"safari-web-extension://abc/x.js"` | true | AC-4 |
| DENY-04 | `"safari-extension://abc/x.js"` | true | AC-4 |
| DENY-05 | `"https://members.ubm-hyogo.example/app.js"`（アプリ URL） | **どれにもマッチしない** | AC-2 |

判定ヘルパ: `EXTENSION_DENY_URLS.some(re => re.test(url))`。

## 4. テストヘルパ（最小 event ビルダ）

実 SDK に依存せず最小 event を作るためのローカルヘルパ例（spec 内に定義する想定。実ファイルには本コードは置かない）:

```ts
function frameEvent(filenames: Array<{ filename?: string; abs_path?: string }>): ErrorEvent {
  return {
    exception: {
      values: [{ stacktrace: { frames: filenames } }],
    },
  } as ErrorEvent;
}
```

## 5. TDD Red の期待

- この Phase 完了時点では `extension-noise-filter.ts` が未作成のため、
  `import { ... } from "./extension-noise-filter"` が解決できず、
  **全テストが fail / collection error になる**。これが正しい Red 状態。
- Phase 5 で実装を追加した後、本 spec の全ケースが green になることを Phase 7 で確認する。

## 6. 実行コマンド

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts
```

> vitest は root `vitest.config.ts` を用い、`--root=../..` で apps 配下を解決する既存慣習に従う。
