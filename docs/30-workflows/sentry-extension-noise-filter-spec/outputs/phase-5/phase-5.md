# Phase 5: 実装手順

## 1. 新規作成 / 修正ファイルパス一覧（必須・FB RT-03）

| 区分 | パス | 内容 |
|------|------|------|
| 新規 | `apps/web/src/lib/sentry/extension-noise-filter.ts` | 拡張由来判定の pure module（定数 + 3 関数） |
| 新規 | `apps/web/src/lib/sentry/extension-noise-filter.spec.ts` | 単体テスト（Phase 4 で設計済。Phase 5 で実装と同時に green 化） |
| 編集 | `apps/web/src/instrumentation-client.ts` | `Sentry.init()` に `ignoreErrors` / `denyUrls` / `beforeSend` を配線 + import 追加 |
| 任意編集 | `apps/web/src/lib/sentry/index.ts` | barrel re-export（任意。配線には不要） |

> **apps/api・D1・Google Form 仕様には一切触れない**。変更は `apps/web` のブラウザ instrumentation 周辺のみ。

## 2. `extension-noise-filter.ts` 実装手順

### 2.1 import（型のみ）

```ts
import type { ErrorEvent, EventHint } from "@sentry/core";
```

- **値 import は禁止**。`import type` のみとすることで、SDK の実体を取り込まずバンドルに影響を与えない。テストでも SDK が起動しない（AC-5）。

### 2.2 定数

```ts
export const EXTENSION_PROTOCOL_PREFIXES: readonly string[] = [
  "chrome-extension://",
  "moz-extension://",
  "safari-web-extension://",
  "safari-extension://",
] as const;

export const EXTENSION_DENY_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-web-extension:\/\//i,
  /^safari-extension:\/\//i,
];

export const EXTENSION_IGNORE_ERRORS: (string | RegExp)[] = [
  "Could not establish connection. Receiving end does not exist.",
  /No tab with id:/,
  /Access to storage is not allowed from this context/,
  /Cannot read properties of undefined \(reading '(mapKeyRegistry|useVimLikeEscape)'\)/,
  /ResizeObserver loop/,
];
```

### 2.3 `isExtensionUrl`

シグネチャ: `export function isExtensionUrl(url: string | undefined | null): boolean`

処理:
1. `if (!url) return false;`（`undefined` / `null` / `""` を弾く）。
2. `const lower = url.toLowerCase();`
3. `return EXTENSION_PROTOCOL_PREFIXES.some((p) => lower.startsWith(p));`

> trim はしない（Phase 4 URL-10 の期待値は「trim しない＝先頭空白付きは false」で確定）。

### 2.4 `eventHasExtensionFrame`

シグネチャ: `export function eventHasExtensionFrame(event: ErrorEvent): boolean`

処理（**判定不能・例外は false に倒す = fail-open 寄り**）:

```ts
export function eventHasExtensionFrame(event: ErrorEvent): boolean {
  try {
    if (!event) return false;

    // 1. exception.values[].stacktrace.frames[] の filename / abs_path
    const values = event.exception?.values;
    if (Array.isArray(values)) {
      for (const value of values) {
        const frames = value?.stacktrace?.frames;
        if (Array.isArray(frames)) {
          for (const frame of frames) {
            if (isExtensionUrl(frame?.filename) || isExtensionUrl(frame?.abs_path)) {
              return true;
            }
          }
        }
      }
    }

    // 2. request.url
    if (isExtensionUrl(event.request?.url)) return true;

    // 3. culprit
    if (isExtensionUrl(event.culprit)) return true;

    return false;
  } catch {
    return false; // 判定不能時は「拡張ではない」に倒す（アプリ error を握り潰さない）
  }
}
```

ポイント:
- `Array.isArray()` ガードで壊れた shape（`values` や `frames` が非配列）に耐える（Phase 4 FRAME-08 / FRAME-09）。
- すべてオプショナルチェーンで undefined を許容。
- 例外時は `false`（拡張と断定できないものは drop しない）。

### 2.5 `filterExtensionNoise`

シグネチャ: `export function filterExtensionNoise(event: ErrorEvent, hint?: EventHint): ErrorEvent | null`

処理:

```ts
export function filterExtensionNoise(
  event: ErrorEvent,
  _hint?: EventHint,
): ErrorEvent | null {
  try {
    if (eventHasExtensionFrame(event)) return null; // 拡張由来 → drop
    return event; // それ以外は素通し（fail-open）
  } catch {
    return event; // 判定で例外 → 残す（fail-open の砦）
  }
}
```

- `hint` は将来拡張用に受けるが現状未使用（`_hint`）。
- 拡張由来でない/判定不能なら**必ず元 event を返す**（AC-2 / AC-6）。throw しない。

## 3. `instrumentation-client.ts` 編集手順

### 3.1 import の追加（alias か相対かの確定手順）

`instrumentation-client.ts` は `apps/web/src/` 直下にあり、対象モジュールは `apps/web/src/lib/sentry/extension-noise-filter.ts`。

import 形式は**実ファイルの既存 import 慣習に合わせて確定する**:
1. `apps/web/src/instrumentation-client.ts` 内の既存 import を確認する（現状は `import * as Sentry from "@sentry/nextjs";` のみ）。
2. `apps/web` 内の `src/` 配下相互参照で `@/` alias が標準採用されているかを確認する（`tsconfig` の `paths` と既存ファイルの import を grep）。
3. alias が標準なら:
   ```ts
   import {
     EXTENSION_DENY_URLS,
     EXTENSION_IGNORE_ERRORS,
     filterExtensionNoise,
   } from "@/lib/sentry/extension-noise-filter";
   ```
   相対が標準なら:
   ```ts
   import {
     EXTENSION_DENY_URLS,
     EXTENSION_IGNORE_ERRORS,
     filterExtensionNoise,
   } from "./lib/sentry/extension-noise-filter";
   ```
4. **既存ファイル群と同一の形式に揃える**（混在させない）。lint（import 順・解決可否）が通る形を採用する。

### 3.2 `Sentry.init()` への 3 行配線

既存 `Sentry.init({ ... })` のオプションに以下 3 つを**追加**する。既存の `dsn` / `environment` / `tracesSampleRate` はそのまま維持。

```ts
Sentry.init({
  dsn,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "local",
  tracesSampleRate: parseSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  ),
  // --- 追加: 拡張由来ノイズフィルタ ---
  ignoreErrors: EXTENSION_IGNORE_ERRORS,
  denyUrls: EXTENSION_DENY_URLS,
  beforeSend: filterExtensionNoise,
});
```

### 3.3 維持すべき既存ガード（破壊しない）

- `typeof window !== "undefined"` ガード。
- `window.__ubmSentryInitialized__` 二重初期化ガード。
- `if (dsn)` の DSN 未設定ガード（DSN 無しなら init しない）。
- `try { ... } catch (err) { console.error("[sentry] client init failed", err); }` の包み。
- `parseSampleRate` ヘルパ。

> `beforeSend` の型は Sentry SDK 側が `(event: ErrorEvent, hint: EventHint) => ErrorEvent | PromiseLike<ErrorEvent | null> | null` を期待する。`filterExtensionNoise` のシグネチャ（`ErrorEvent, hint? => ErrorEvent | null`）はこれに代入可能。型不一致が出る場合のみ、`beforeSend: (event, hint) => filterExtensionNoise(event, hint)` のラップで吸収する。

## 4. `index.ts`（barrel）への re-export（任意）

配線には不要だが、外部から参照したい場合は以下を追記してよい（任意）:

```ts
export {
  EXTENSION_DENY_URLS,
  EXTENSION_IGNORE_ERRORS,
  EXTENSION_PROTOCOL_PREFIXES,
  eventHasExtensionFrame,
  filterExtensionNoise,
  isExtensionUrl,
} from "./extension-noise-filter";
```

- 既存 `capture` の re-export 行は維持する。型 re-export が必要なら `export type { ... }` を併記する。

## 5. 実装後の検証（verify commands を順に実行）

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/sentry/extension-noise-filter.spec.ts
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
```

すべて green であること。

## 6. DoD（Definition of Done）

- [ ] 新規 `extension-noise-filter.ts` と `extension-noise-filter.spec.ts` が存在する。
- [ ] `instrumentation-client.ts` に `ignoreErrors` / `denyUrls` / `beforeSend` が配線され、既存ガード（window / `__ubmSentryInitialized__` / dsn / try-catch）が維持されている。
- [ ] AC-1〜AC-7 をすべて満たす（拡張 event は drop / アプリ error は素通し fail-open / ignoreErrors・denyUrls 登録 / SDK 起動なしで単体テスト可 / filter は throw しない / 各 verify が green）。
- [ ] focused vitest・typecheck・lint がすべて green。
- [ ] 値 import を使わず `import type` のみで SDK 実体をバンドル/テストに持ち込んでいない。
- [ ] **アプリの実エラーが従来通り Sentry に捕捉される（fail-open）**ことが回帰テストで担保されている。
