> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

# Phase 8: 統合テスト計画（logger × Sentry × runtime）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3 |
| 実行種別 | sequential（task-03 後着手 / 単一 worktree） |
| Phase 番号 | 8 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | 7（unit / spy 単体テスト計画） |
| 下流 Phase | 9（静的検証 / Lint / 型 / grep gate） |
| 状態 | completed |

## 目的

`apps/web/src/lib/logger.ts` と task-03 が確定した `apps/web/src/lib/sentry/capture.ts` を実結線した状態で、SSR / Workers / Browser の 3 ランタイム想定でロガーが落ちず、観測経路が成立することを統合的に検証する計画を確定する。Phase 7 が単体（capture を mock）だったのに対し、Phase 8 は **capture を実モジュールとして読み込み、Sentry SDK 側だけを mock** する境界で行う。

## 実行タスク

1. 統合テストスコープ確定（unit / integration の境界）
2. テストファイル新設提案: `apps/web/src/lib/__tests__/logger.integration.test.ts`
3. Vitest workspace project 構成の前提確認
4. SSR / Workers ランタイム別の logger 出力検証戦略
5. task-05 (`app/error.tsx`) との結線想定の事前ドキュメント化（次 task で実テスト）
6. Sentry SDK 未 init / DSN 欠如時の non-throw 契約検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md §0.6 / §0.7 | capture API 契約 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-*.md（Sentry init） | DSN 欠如時の swallow 設計 |
| 推奨 | apps/web/vitest.config.ts | env 切替 / setupFiles |
| 推奨 | CLAUDE.md `apps/web` env アクセス不変条件 | `getEnv()` 経路 |

## 統合テストスコープ（unit との境界）

| レイヤ | 責務 | mock 方針 | 配置 |
| --- | --- | --- | --- |
| unit | logger の emit 形 / level dispatch / `child` 合成 | `sentry/capture` 全体を vi.mock | `__tests__/logger.test.ts` |
| **integration** | logger → capture（実体） → Sentry SDK（mock） の貫通 | `@sentry/nextjs` のみ vi.mock | `__tests__/logger.integration.test.ts` |
| smoke | wrangler tail での JSON 一行 | 手動 | Phase 10 |

## テストケース（integration）

| # | ケース | 期待 |
| --- | --- | --- |
| 1 | `logger.error({event,err})` が `Sentry.captureException` を 1 回呼ぶ | spy 1 回 / event tag 一致 |
| 2 | `SENTRY_DSN_WEB` 未設定で `logger.error` が throw しない | resolves / promise 解決 |
| 3 | `Sentry.captureException` が内部 throw しても logger は throw しない | swallow / promise 解決 |
| 4 | `logger.warn` が `captureMessage(level:"warning")` を呼ぶ | spy 引数検証 |
| 5 | `logger.info` / `debug` は capture を **呼ばない** | spy 0 回 |
| 6 | `runtime` フィールドが `process.env.NEXT_RUNTIME` で `nodejs` / `edge` を反映 | payload assertion |
| 7 | jsdom env では `runtime: "browser"` | payload assertion |
| 8 | 循環参照を含む `err` でも `JSON.stringify` がフォールバックで落ちない | console spy 検証 |

## Vitest workspace 前提

- `apps/web/vitest.config.ts` を 1 ファイルに保つ。projects 分割は本タスクでは行わない（task-04 のスコープ外）。
- 環境切替は `// @vitest-environment node` / `jsdom` のテストファイル先頭 pragma を使う。
- `setupFiles` で `vi.stubGlobal('process', ...)` 等は **行わない**（runtime 判定の副作用を温存）。
- `@sentry/nextjs` は `vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn(), init: vi.fn() }))` を各テストの先頭で宣言。

## SSR / Workers 検証戦略

| ランタイム | 検証方法 | logger 期待出力 |
| --- | --- | --- |
| Browser (jsdom) | `// @vitest-environment jsdom` | `runtime: "browser"` / console.* に JSON 一行 |
| Node SSR | `// @vitest-environment node` + `process.env.NEXT_RUNTIME = 'nodejs'` | `runtime: "nodejs"` |
| Workers Edge | `process.env.NEXT_RUNTIME = 'edge'` | `runtime: "edge"` |
| Workers (env 未定義) | env 削除 | `runtime: "workers"`（fallback） |

> Workers 実機相当の `@cloudflare/vitest-pool-workers` 採用は本タスクでは見送る（task-03 / task-15 で採否を再検討）。logger は `globalThis.console` のみに依存しており Workers 互換性は静的に担保できる。

## task-05（error.tsx）との結線想定

Phase 8 では実テストは書かない。次 task の前提として以下を擬似コードで残す:

```ts
// task-05 想定
"use client";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error({ event: "error.boundary.caught", err: error, digest: error.digest });
  }, [error]);
  // ...
}
```

→ task-05 側で `Sentry.captureException` が boundary 経由で 1 回呼ばれることを統合テストする。task-04 では `logger.error` のシグネチャが `digest?: string` を受け入れることだけ Phase 7 / 8 で固定する。

## CONST_005 該当項目

- **CONST_005-1（既存 API のみ接続）**: 統合テストで `apps/api` 側の log 受信 endpoint を新設しない。capture は Sentry SaaS 経路のみ。
- **CONST_005-4（D1 直接アクセス禁止）**: テスト fixture / mock に D1 binding を持ち込まない。
- **CONST_005-5（secret 不混入）**: テストでは `SENTRY_DSN_WEB` を `dummy@sentry.io/0` で stub し、実 DSN を直書きしない。
- CONST_005-2 / -3 は本 phase 対象外（UI 影響なし）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | スコープ境界決定（unit vs integration） | 8 | completed |
| 2 | `logger.integration.test.ts` 配置とテスト一覧 | 8 | completed |
| 3 | runtime 別 env pragma 戦略 | 8 | completed |
| 4 | task-05 結線想定の擬似コード | 8 | completed |
| 5 | outputs/phase-08/phase-08.md 配置 | 8 | completed |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/phase-08.md |
| ドキュメント | docs/30-workflows/task-04-w3-window-guard-and-logger/outputs/phase-08/phase-08.md |

## 完了条件

- [ ] integration / unit の境界がテーブル化されている
- [ ] テストケース 8 件が列挙されている
- [ ] runtime 別検証マトリクスがある
- [ ] task-05 へ渡すシグネチャ前提が明記されている

## 次 Phase

- 次: Phase 9（静的検証 / Lint / 型 / grep gate）
- 引き継ぎ事項: integration テスト一覧、`@sentry/nextjs` mock 方針
- ブロック条件: capture API シグネチャ（task-03 §0.7）が未確定
