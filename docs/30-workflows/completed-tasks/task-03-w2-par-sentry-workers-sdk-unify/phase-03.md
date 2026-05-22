# Phase 3: API / 型契約（凍結）

## 目的

下流タスク（task-04 logger / task-05 error.tsx）が依存する公開 API・型契約を **凍結**する。本 Phase で確定したシグネチャは、本 task の実装中に変更不可とし、変更が必要になった場合は本仕様書を改訂してから下流タスクへ通知する。

## 真の論点 / 設計判断

- **論点**: `captureException` の戻り値を Sentry の event id（`string`）にするか `void` にするか。
- **判断**: 元タスク §0.7 では `string | undefined` で凍結されているが、§5.3 の実装サンプルは `Promise<void>` で書かれている。**正本は §0.7 の `string | undefined`** とし、event id を返す（dashboard へのリンク生成・logger との相関に活用）。実装で動的 import の都合上 `Promise<...>` になる場合は **`Promise<string | undefined>`** に揃える（型整合性・下位互換）。
- 互換維持: 呼び出し側 `await captureException(err)` で event id を捨てて使うパターンが許容される。

## 凍結シグネチャ（元タスク §0.7 + §5.3 を統合した正本）

### 型定義

```ts
// apps/web/src/lib/sentry/capture.ts
export type CaptureContext = {
  /** key=string only な軽量 tag。Sentry dashboard で filterable */
  tags?: Record<string, string>;
  /** 構造化データ。PII / D1 SQL を含めない */
  extras?: Record<string, unknown>;
  /** 互換: 旧 ctx.extra を受け付ける（deprecated, optional） */
  extra?: Record<string, unknown>;
  /** Sentry level */
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  /** user 識別。email は task-04 で sanitize 済を渡す */
  user?: { id?: string; email?: string };
};
```

### 関数シグネチャ

```ts
// apps/web/src/lib/sentry/capture.ts
/**
 * runtime（workers / node / browser）に応じて適切な SDK の captureException を呼ぶ。
 * SDK 未 init / DSN 未設定でも throw せず undefined を返す（fail-soft）。
 */
export function captureException(
  error: unknown,
  ctx?: CaptureContext
): Promise<string | undefined>;

/**
 * message capture。task-04 logger.warn からの呼び出しを想定。
 */
export function captureMessage(
  message: string,
  ctx?: CaptureContext
): Promise<string | undefined>;
```

```ts
// apps/web/src/instrumentation.ts
/**
 * Next.js v15 規約に従う server-side instrumentation hook。
 * @sentry/cloudflare の init() を runtime（nodejs / edge）で実行する。
 * 二重呼び出しは globalThis.__ubmSentryInitialized__ により無視される。
 */
export function register(): Promise<void>;
```

### グローバル状態（型定義）

```ts
// apps/web/src/instrumentation-client.ts 冒頭で declare
declare global {
  interface Window {
    __ubmSentryInitialized__?: boolean;
  }
  // server 側
  // eslint-disable-next-line no-var
  var __ubmSentryInitialized__: boolean | undefined;
}
```

## export 表（下流契約）

| export 名 | 型 | from | 利用元（下流 task） |
| --- | --- | --- | --- |
| `captureException` | `(err, ctx?) => Promise<string \| undefined>` | `apps/web/src/lib/sentry/capture.ts` | task-04 logger / task-05 error.tsx |
| `captureMessage` | `(msg, ctx?) => Promise<string \| undefined>` | `apps/web/src/lib/sentry/capture.ts` | task-04 logger.warn |
| `CaptureContext` | type | 同上 | task-04 logger（型再エクスポート） |
| `register` | `() => Promise<void>` | `apps/web/src/instrumentation.ts` | Next.js framework（直接 import 禁止） |
| `__ubmSentryInitialized__` | `boolean \| undefined` | `globalThis` / `window`（implicit） | task-04 / task-05 が状態確認に使う場合のみ（推奨は使わない） |

## 実行タスク（チェックリスト）

- [ ] §0.7 と §5.3 の型不整合を本 Phase で「`Promise<string | undefined>`」に統一
- [ ] `CaptureContext` の `extra` / `extras` 両受けを `extra` を deprecated として明記
- [ ] export 表を `apps/web/src/lib/sentry/capture.ts` のヘッダコメントに転記する設計を Phase 6 へ引き継ぎ
- [ ] 下流タスク（task-04 / task-05）の仕様書に本 Phase の表を参照させる旨を Phase 9 で結線

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク §0.7（凍結シグネチャ）、§5.3（実装サンプル） |
| 出力 | 本 phase-03.md の凍結シグネチャ・export 表 |

## 参照資料

- 元タスク §0.7 / §5
- task-04 仕様書（`captureException` 呼び出し前提の確認用）
- task-05 仕様書（`error.tsx` からの呼び出し前提）

## 成果物

- 本 phase-03.md（凍結契約として executed 中に変更不可）
- `outputs/phase-03/main.md`（executed 時、本仕様書では未生成）

## 完了条件（DoD）

- [ ] `captureException` / `captureMessage` / `register` の戻り値型が確定
- [ ] `CaptureContext` 型が確定（`tags` / `extras` / `level` / `user` / 旧 `extra`）
- [ ] export 表が `apps/web/src/lib/sentry/capture.ts` 1 ファイルに集約される設計
- [ ] 下流 task-04 / task-05 が依存できるシグネチャ凍結が宣言済

## 統合テスト連携

- `captureException` / `captureMessage` / `register` の export 確認は Phase 11 AC-9 として `grep-gate.log` または `test.log` に記録する。
- 下流 task-04 / task-05 は本 Phase のシグネチャを import 契約として参照し、戻り値型を独自に再定義しない。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 3
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
