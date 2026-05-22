# Phase 5: テスト戦略

## 目的

`apps/web/src/lib/__tests__/sentry-capture.test.ts` を中心に、runtime 分岐 / 二重 init ガード / fail-soft 挙動の単体テストを設計する。元タスク §8 のテスト方針表をケース単位に展開し、各ケースの mock 戦略・期待値・実行コマンドを確定する。staging smoke は task-05 の責務として委譲。

## テスト Matrix（元タスク §8 を展開）

| # | ファイル | ケース | 前提 / mock | 操作 | 期待値 |
| --- | --- | --- | --- | --- | --- |
| T-01 | `sentry-capture.test.ts` | server runtime（Node, `typeof window === 'undefined'`）で `captureException` が `@sentry/cloudflare` を呼ぶ | `vi.mock('@sentry/cloudflare', () => ({ captureException: vi.fn(() => 'evt-cf-1'), captureMessage: vi.fn() }))` | `await captureException(new Error('x'), { tags: { foo: 'bar' } })` | mock の `captureException` が 1 回呼ばれ、戻り値 `'evt-cf-1'` |
| T-02 | 同上 | client runtime（jsdom, `typeof window !== 'undefined'`）で `captureException` が `@sentry/nextjs` を呼ぶ | `// @vitest-environment jsdom` + `vi.mock('@sentry/nextjs', ...)` | 同上 | `@sentry/nextjs.captureException` が 1 回呼ばれる |
| T-03 | 同上 | SDK 未 init / DSN 未設定でも throw しない | mock を import 失敗（`vi.mock('@sentry/cloudflare', () => { throw new Error('not installed') })`）に差し替え | `await captureException(new Error('x'))` | resolve、戻り値 `undefined`、`console.error` が 1 回 |
| T-04 | 同上 | `captureMessage` で server runtime 経路 | T-01 と同条件 | `await captureMessage('hello', { level: 'warning' })` | mock の `captureMessage('hello', 'warning')` が 1 回 |
| T-05 | 同上 | `CaptureContext` の旧 `extra` フィールド互換 | T-01 条件 | `await captureException(err, { extra: { a: 1 } })` | mock 引数の `extra` が `{ a: 1 }` |
| T-06 | 同上 | `level` 未指定時の既定値 | T-04 条件 | `await captureMessage('m')` | mock の第 2 引数 `'info'` |
| T-07 | `instrumentation.test.ts`（任意） | `register()` 2 回呼出で `Sentry.init` が 1 回のみ | `vi.mock('@sentry/cloudflare', () => ({ init: vi.fn(), ... }))` + `process.env.NEXT_RUNTIME = 'nodejs'` + `getEnv` mock で `SENTRY_DSN_WEB` 設定 | `await register(); await register();` | `Sentry.init` の call count = 1、`globalThis.__ubmSentryInitialized__ === true` |
| T-08 | 同上 | DSN 未設定時 `init` を呼ばない | `getEnv` mock で `SENTRY_DSN_WEB: undefined` | `await register()` | `Sentry.init` call count = 0、`globalThis.__ubmSentryInitialized__` は `true` に settled（重複呼出 skip 用） |

## mock 戦略

- **vitest 既定**: `vi.mock` をファイル冒頭で hoist。runtime 切替は `// @vitest-environment node` / `// @vitest-environment jsdom` をテストファイル先頭で指定。
- **runtime 別ファイル分割**: ケース T-01〜T-06 のうち server / client は **同一ファイルに `describe` ブロックで分離**するか、`@vitest-environment` の制約で分けたい場合は `sentry-capture.server.test.ts` / `sentry-capture.client.test.ts` の 2 ファイルへ分割する選択肢を提示（実装時に判断）。
- **dynamic import の mock**: `vi.doMock('@sentry/cloudflare', () => ({ ... }))` の使用、または top-level `vi.mock` を `factory` 引数で動的 import に対応させる。
- **`getEnv` の mock**: `vi.mock('@/lib/env', () => ({ getEnv: vi.fn(() => ({ SENTRY_DSN_WEB: 'https://x@y/1', SENTRY_ENVIRONMENT: 'staging', SENTRY_TRACES_SAMPLE_RATE: 0.1 })) }))`。

## grep gate（build 出力検証）

| gate | コマンド | 期待 |
| --- | --- | --- |
| G-1 | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback' apps/web/.open-next/` | 0 件（exit 1） |
| G-1b | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js` | 0 件（server worker bundle への browser SDK 固有 token 混入なし） |
| G-2 | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg "@sentry/nextjs" apps/web/src/instrumentation.ts` | 0 件 |
| G-3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg "@sentry/cloudflare" apps/web/src/instrumentation-client.ts` | 0 件 |
| G-4 | `find apps/web -maxdepth 2 -name 'sentry.*.config.*'` | 0 件 |
| G-5 | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg "process\\.env\\.SENTRY_DSN" apps/web/src` | 0 件（`getEnv()` 経由のみ） |

> G-1 は `pnpm build` 後に `.open-next/worker.js` への Browser SDK 推移混入を検査する **本 task の最重要 gate**（AC-4）。

## 実行コマンド（local）

```bash
# 単体テスト
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/sentry-capture.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web test src/__tests__/instrumentation.test.ts  # 任意

# 全テスト + lint + typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test

# build → grep gate G-1
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback' apps/web/.open-next/ && echo "FAIL" || echo "OK"
mise exec -- pnpm --filter @ubm-hyogo/web exec rg '@sentry/nextjs|replayIntegration|captureRouterTransitionStart' apps/web/.open-next/worker.js && echo "FAIL" || echo "OK"
```

## 実行タスク（チェックリスト）

- [ ] T-01〜T-08 の各ケースを `sentry-capture.test.ts` / `instrumentation.test.ts` に実装する設計を Phase 6 に引き継ぎ
- [ ] mock 戦略（`vi.mock` factory / `@vitest-environment` ヘッダ）を確定
- [ ] grep gate G-1〜G-5（G-1b を含む）を Phase 11 evidence の検証コマンドに転記
- [ ] coverage の target を `captureException` / `captureMessage` / `register` の分岐網羅に設定
- [ ] CI 上での実行（`pnpm test`）が他 task のテストと干渉しないよう `apps/web/src/lib/__tests__/` に閉じる

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク §8 / §9、Phase 3 凍結シグネチャ |
| 出力 | テスト Matrix・mock 戦略・grep gate コマンド |

## 参照資料

- 元タスク §8「テスト方針」, §9「ローカル実行・検証コマンド」
- vitest 公式: `vi.mock` / `@vitest-environment`

## 成果物

- 本 phase-05.md（テスト Matrix が確定）
- `outputs/phase-05/main.md`（executed 時のみ）

## 完了条件（DoD）

- [ ] T-01〜T-08 が mock 戦略付きで列挙されている
- [ ] grep gate G-1〜G-5 のコマンドが実行可能な形式で記述
- [ ] 単体テストの実行コマンドが `mise exec --` 経由で示されている
- [ ] runtime 分岐の境界（server / client）がテストファイル分割方針として記述

## 統合テスト連携

- 本 Phase の T-01〜T-08 は Phase 11 の `outputs/phase-11/evidence/test.log` に集約する。
- G-1 / G-1b / G-2〜G-5 は `outputs/phase-11/evidence/grep-gate.log` に集約し、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` では未実行 template、実装後は local PASS evidence として扱う。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 5
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
