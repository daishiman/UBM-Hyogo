# task-04 window-guard-and-logger

> 02-runtime / 実装タスク仕様書
> 改訂日: 2026-05-07
> 関連 phase-3: §4.4「task-04 window-guard-and-logger」(`outputs/phase-3/phase-3.md` L304-L308) / §1.2 task-04 行
> 関連 phase-2: §1 task-04 / §3 DAG / §4.3 競合ファイル早見表
> 関連 phase-1: §6 リスク（`window` 参照 SSR エラー）

---

## 0. 自己完結コンテキスト

このセクションは **task-04 を単独で読んでも実装に必要な前提が揃う**ことを保証するための自己完結ブロックである。phase-1〜3 / CLAUDE.md / 既存 `apps/web/src/**` を横断参照しなくても、本タスクの境界・依存・成果物が判断できる粒度で記述する。

### 0.1 上位ゴール（phase-1 要約）

UBM 兵庫支部会メンバーサイト全 19 routes を Cloudflare Workers ランタイム上で **SSR / RSC / Server Action エラー 0** にする（phase-1 §1.1）。本タスクはその基盤として、phase-1 §6 リスクで列挙された **未ガード `window` 参照による SSR / Workers エッジ実行時例外**を構造的に撲滅し、観測層（logger）を Sentry と接続する役割を持つ。

### 0.2 本タスクの DAG 座標

- **依存元**: task-03 (sentry-workers-sdk-unify) — `captureException` / `captureMessage` の export を logger が import する
- **依存先**: task-05 (error-boundary-and-staging-smoke) — `app/error.tsx` が logger を呼ぶ
- **並列性**: **直列**。task-03 の §0.7 で確定する Sentry capture API シグネチャに依存するため、task-03 完了後に着手する。task-02 とは別ファイルに閉じるので並列可能だが、`window` 参照箇所の修正は画面 task (11-17) に部分的に伝播するため、画面 task 着手前に本 task を完了させる。

### 0.3 触れるファイル群（再掲）

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/lib/is-browser.ts` | C | `typeof window !== 'undefined'` ガードヘルパ |
| `apps/web/src/lib/logger.ts` | C | 構造化 logger（info / warn / error / debug） |
| `apps/web/src/lib/__tests__/logger.test.ts` | C | logger 出力 / Sentry 連携テスト |
| `apps/web/src/lib/__tests__/is-browser.test.ts` | C | SSR / browser 判定テスト |
| `apps/web/eslint.config.mjs` | M | `no-restricted-globals` で `window` 素手参照禁止 |
| `apps/web/src/**/*.{ts,tsx}` | M（最小） | 既存未ガード `window` 参照の `isBrowser()` ラップ |

### 0.4 既存 API endpoint（不変条件）

`apps/api/src/routes/{auth,me,public,admin}/*` — **新規追加禁止**。logger は client / server 双方の log を `console` + Sentry へ送るのみで、`apps/api` 側に独自 log endpoint を追加することは非ゴール。

### 0.5 重要な不変条件（CLAUDE.md より該当抜粋）

1. **D1 への直接アクセスは `apps/api` に閉じる**。logger のフィールドに D1 SQL / binding 情報を含めない。
2. **`apps/web` から D1 への直接アクセス禁止**。logger 経由でも例外なし。
3. **ランタイムシークレットは Cloudflare Secrets**。logger に DSN や AUTH_SECRET の値を流さない（PII / secret redaction を実装する）。
4. **平文 `.env` 禁止**。logger の出力先 URL を `.env` に直書きしない（task-02 の `getEnv()` 経由）。

### 0.6 上流タスクから受け取るシグネチャ

- **task-03 が確定した Sentry init 構成**:
  - `apps/web/src/instrumentation.ts` の `register()`: `export async function register(): Promise<void>`
  - 二重 init ガード変数名: **`__ubmSentryInitialized__`**（globalThis に格納）。logger からは触らない（参照のみ）。
  - capture API: `captureException(error: unknown, ctx?: CaptureContext): string | undefined` / `captureMessage(message: string, ctx?: CaptureContext): string | undefined`（`apps/web/src/lib/sentry/capture.ts` から import）
- **ESLint `no-restricted-globals: window` 導入時に Sentry init で残る `window` 参照箇所の例外化**:
  - `apps/web/src/instrumentation-client.ts`（Browser 用 SDK init）: ファイル冒頭に `/* eslint-disable no-restricted-globals -- Sentry browser SDK init は window 直接参照が必須 */` を付与。
  - `apps/web/src/lib/sentry/capture.ts`: runtime 判定で `typeof window !== 'undefined'` を使うが、これは ESLint の `no-restricted-globals` の検出対象外（typeof 演算子参照は許容）。
  - 例外化はファイル単位 disable comment ではなく **`overrides` セクション** で `files: ['src/instrumentation-client.ts', 'src/lib/sentry/**']` の rule を `'off'` にする方式を取る。grep diff を最小化するため。

### 0.7 下流タスクへ渡すシグネチャ

本タスクが **`apps/web/src/lib/logger.ts`** および **`apps/web/src/lib/is-browser.ts`** から export する公開 API：

```ts
// apps/web/src/lib/is-browser.ts
export function isBrowser(): boolean;

// apps/web/src/lib/logger.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogPayload = {
  event: string;          // 例: 'error.boundary.caught'
  error?: unknown;        // throw された Error / unknown
  digest?: string;        // Next.js error digest
  [key: string]: unknown; // 追加フィールド（PII redaction 対象外のもの）
};

export const logger: {
  debug(payload: LogPayload): void;
  info(payload: LogPayload): void;
  warn(payload: LogPayload): void;
  /** error 時は内部で captureException を呼ぶ */
  error(payload: LogPayload): void;
};
```

下流（task-05）は `logger.error({ event, error, digest })` の引数仕様で呼び出す。`event` は `error.boundary.caught` / `error.global-boundary.caught` / `error.not-found` 等を本 task で定義する enum 風 string union として export 予約する。

### 0.8 用語

- **`isBrowser()`**: `typeof window !== 'undefined'` を 1 関数に集約したガード。Tree-shaking で SSR bundle から除外可能。
- **構造化 logger**: JSON-line 形式で `{ level, ts, event, ...payload }` を `console` に書き、`error` は同時に Sentry へ送る薄ラッパ。
- **`no-restricted-globals`**: ESLint コアルール。`window` / `document` などのグローバル直参照を CI で禁止する。
- **PII redaction**: `email` / `name` 等を logger 出力前に `***` 置換する仕組み。本 task では最小実装（key 名 allow-list）で良い。

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Platform（SSR 安全 & 観測） |
| 推定工数 | 0.5 人日 |
| 直前依存 | task-01（gate）, task-03（logger が Sentry hook を呼ぶ） |
| 直後依存 | task-05（`error.tsx` が logger を使う）, task-09 以降の全画面（`window` 参照箇所が修正済み前提） |
| wave | W2（task-02/03/05 と並列可、ただし task-03 の `captureException` API 確定後に logger 結線） |
| 並列可否 | 別ファイル（`lib/logger.ts` 新設）なので `instrumentation.ts` と並列可 |
| 関連 phase-3 行 | §4.4 / §1.2 task-04 行 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `apps/web/src/**` 配下で **`window` を直接参照する全箇所**を grep 列挙し、`typeof window !== 'undefined'` ガード（または `useEffect` への移動）を入れる。
2. ガード集約のため `apps/web/src/lib/is-browser.ts` を新設し、ボイラープレートを 1 行に圧縮する。
3. Workers 互換の **軽量 logger** `apps/web/src/lib/logger.ts` を新設。Sentry が落ちても観測できる構造化ログを `console` フォールバックで出す。
4. logger の `error` / `warn` は **task-03 の `captureException` / `captureMessage` を breadcrumb / capture として呼ぶ**。
5. ESLint カスタムルール（`no-restricted-globals` ベース）で **未ガードの `window` 参照を CI で防止**する。

### 2.2 非ゴール

- 全画面の `window` 参照箇所を画面 task で書き直すこと（本タスクは grep + 修正の **検出と最小修正**まで。後続画面 task と分担）。
- パフォーマンスメトリクス（Web Vitals）の収集（別 workflow）。
- localStorage / sessionStorage のラッパ（必要なら別 task）。
- Sentry SDK の init（task-03 の責務）。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/lib/is-browser.ts` | C | `typeof window !== 'undefined'` を一箇所に集約 |
| `apps/web/src/lib/logger.ts` | C | 構造化 logger。`info` / `warn` / `error` / `debug` |
| `apps/web/src/lib/__tests__/logger.test.ts` | C | logger の構造化出力 / Sentry 連携の単体テスト |
| `apps/web/src/lib/__tests__/is-browser.test.ts` | C | ガードヘルパの SSR / browser 判定 |
| `apps/web/eslint.config.mjs` | M | `no-restricted-globals` で `window` の素手参照を禁止、`is-browser` 経由を強制 |
| `apps/web/src/**/*.{ts,tsx}` | M（最小） | 既存の未ガード `window` 参照箇所を `isBrowser()` でラップ |

---

## 4. 関数 / 型シグネチャ

### 4.1 `apps/web/src/lib/is-browser.ts`

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

### 4.2 `apps/web/src/lib/logger.ts`

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

  // Sentry breadcrumb / capture
  if (level === "error") {
    void captureException(fields.err ?? new Error(fields.event), {
      level: "error",
      tags: { event: fields.event, runtime: payload.runtime },
      extras: payload,
    });
  } else if (level === "warn") {
    void captureMessage(fields.event, { level: "warning", tags: { event: fields.event }, extras: payload });
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

### 4.3 ESLint 強制（`apps/web/eslint.config.mjs` 抜粋）

```js
// apps/web/eslint.config.mjs（差分）
export default [
  // ...既存設定...
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/is-browser.ts",
      "src/instrumentation-client.ts",
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

---

## 5. 入力 / 出力 / 副作用

| 種別 | 内容 |
|------|------|
| 入力 | logger 呼び出し側の `LogFields`、Sentry hook |
| 出力 | `console.{debug,info,warn,error}` への JSON 一行 + Sentry capture |
| 副作用 | Sentry SDK が未 init でも throw しない（task-03 §5.3 の swallow 設計） |
| 失敗時挙動 | logger 自身が落ちないことが最優先。例外時は無条件 swallow |

### 5.1 利用例

```ts
import { logger } from "@/lib/logger";

export async function listMembers(req: { requestId: string }) {
  const log = logger.child({ requestId: req.requestId });
  try {
    log.info({ event: "members.list.fetch.start" });
    const res = await fetch("/api/public/members");
    log.info({ event: "members.list.fetch.ok", status: res.status });
    return await res.json();
  } catch (err) {
    log.error({ event: "members.list.fetch.fail", err });
    throw err;
  }
}
```

---

## 6. window 参照箇所の検出と対処手順

```bash
# 1. 検出（コメント / 文字列含む素手の window 参照）
mise exec -- pnpm --filter @repo/web exec rg -n '\bwindow\.' src/

# 2. 件数 0 でなければ各箇所を確認し以下のいずれかに直す
#    a) `'use client'` の component 内なら useEffect / event handler 内に移動
#    b) RSC や util 内なら isBrowser() で囲う
#    c) どうしても server で参照したい状態は logger と Sentry に reportable error
```

代表的な書換パターン:

```ts
// before（SSR 500 を引き起こす）
const w = window.innerWidth;

// after
import { isBrowser } from "@/lib/is-browser";
const w = isBrowser() ? window.innerWidth : 0;

// または client component 化
"use client";
import { useEffect, useState } from "react";
function useWidth() {
  const [w, setW] = useState(0);
  useEffect(() => setW(window.innerWidth), []);
  return w;
}
```

---

## 7. テスト方針

| ファイル | ケース | 期待値 |
|---------|--------|--------|
| `apps/web/src/lib/__tests__/is-browser.test.ts` | jsdom env で `isBrowser()` が `true` | `true` |
| 同上 | node env で `isBrowser()` が `false` | `false` |
| `apps/web/src/lib/__tests__/logger.test.ts` | `logger.info({event:"x"})` が JSON 一行を console.info に出す | spy で payload 検証 |
| 同上 | `logger.error({event:"y", err})` が `captureException` を 1 回呼ぶ | mock spy 1 回 |
| 同上 | `logger.warn` が `captureMessage` を `level:"warning"` で呼ぶ | mock spy 1 回 |
| 同上 | `logger.child({userId:"u1"})` が `userId` を全 emit に付与する | payload 検証 |
| 同上 | Sentry が throw してもロガー自体は throw しない | resolves / no-throw |

---

## 8. ローカル実行・検証コマンド

```bash
# 依存解決
mise exec -- pnpm install

# window 参照検出（0 件であること）
mise exec -- pnpm --filter @repo/web exec rg -n '\bwindow\.' src/ \
  | grep -v 'is-browser.ts' \
  | grep -v 'instrumentation-client.ts' \
  | (! grep .)  # → 検出されなければ exit 0

# lint（カスタム規則の効きを確認）
mise exec -- pnpm --filter @repo/web lint

# 型 / 単体
mise exec -- pnpm --filter @repo/web exec tsc --noEmit
mise exec -- pnpm --filter @repo/web test src/lib/__tests__/logger.test.ts src/lib/__tests__/is-browser.test.ts

# build（SSR で window 触ると落ちるので一発検出）
mise exec -- pnpm --filter @repo/web build
```

---

## 9. DoD

- [ ] `apps/web/src/lib/is-browser.ts` / `logger.ts` が新設されている
- [ ] `apps/web/src/lib/__tests__/{logger,is-browser}.test.ts` が pass
- [ ] `pnpm --filter @repo/web exec rg '\bwindow\.' src/` の検出件数が `is-browser.ts` / `instrumentation-client.ts` 以外で 0
- [ ] `pnpm --filter @repo/web lint` が `no-restricted-globals` の違反 0 で通過
- [ ] `pnpm --filter @repo/web build` が SSR 警告なしで通過
- [ ] logger の `error` 呼び出しで Sentry に event が記録される（手動 smoke）
- [ ] logger の出力が JSON 一行（`{"level":"info","ts":"...","event":"..."}`）になっている

---

## 10. リスクと緩和

| リスク | 影響 | 緩和 |
|--------|------|------|
| 既存コードに大量の `window` 参照が残存 | grep 結果が膨大 | 本 task では検出と修正方針確定まで。修正は所有 task（11-17）と分担しチェックボックス化 |
| ESLint ルールの誤検出（文字列 `window` を含むコメント等） | false positive | `ignores` に test / 文字列ファイル列挙、必要なら `ESLint disable` を行末コメントで限定許容 |
| Sentry breadcrumb 過多で rate-limit | event ロス | `logger.warn` のみ capture、`info`/`debug` は console のみ |
| Logger が circular import（`sentry/capture` ↔ `logger`） | runtime error | logger → capture の単方向のみ。capture からは logger を import しない |
| Workers でも JSON.stringify が循環で落ちる | 観測欠落 | `safeStringify` でフォールバック（必要なら util を `lib/json-safe.ts` に追加） |


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
