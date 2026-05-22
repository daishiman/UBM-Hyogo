[実装区分: 実装仕様書]

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md

# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3（task-03 完了後に着手） |
| 実行種別 | parallel（task-02 と並列、task-03 確定後） |
| Phase 番号 | 1 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | なし（task-03 が DAG 上流） |
| 下流 Phase | 2 (アーキテクチャ設計) |
| 状態 | completed |
| 実装区分 | Platform（SSR 安全 & 観測） |
| 推定工数 | 0.5 人日 |
| 関連 source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |

## 1. 上位ゴール

UBM 兵庫支部会メンバーサイト全 19 routes を Cloudflare Workers ランタイム上で **SSR / RSC / Server Action エラー 0** にする上位ゴール（ui-prototype-alignment-mvp-recovery / phase-1 §1.1）を実現する基盤として、本タスクは次の 2 点を達成する。

1. 未ガードの `window` 直接参照に起因する SSR / Workers エッジ実行時例外を、構造的（grep 検出 + ESLint 強制）に撲滅する。
2. Workers 互換の構造化 logger を導入し、上流 task-03 の Sentry capture API へ橋渡しする。観測の正本を `apps/web/src/lib/logger.ts` に集約する。

## 2. スコープ

### 2.1 含む

- `apps/web/src/lib/is-browser.ts` 新設（`isBrowser()` / `whenBrowser(fn)` の 2 export）。
- `apps/web/src/lib/logger.ts` 新設（`logger.debug/info/warn/error` + `child(base)` ＋ runtime tag 判定）。
- `apps/web/src/lib/__tests__/{is-browser,logger}.test.ts` 新設。
- `apps/web/eslint.config.mjs` に `no-restricted-globals` 追加（`window` / `document` 素手参照禁止）。
- `apps/web/src/**/*.{ts,tsx}` の **既存未ガード `window` 参照箇所**を `isBrowser()` 経由に最小修正。
- 上流 task-03 の `captureException` / `captureMessage` の logger 連結。

### 2.2 含まない

- 全画面（task-09 以降）の `window` 参照箇所の網羅的書換（本 task は検出 + 最小修正まで。修正は所有 task と分担）。
- Web Vitals / パフォーマンスメトリクス収集（別 workflow）。
- localStorage / sessionStorage の wrapper（別 task）。
- Sentry SDK の init 自体（task-03 の責務）。
- API 側 (`apps/api`) への独自 log endpoint 追加。

## 3. 真の論点

- **issue 1**: `typeof window !== 'undefined'` を全箇所に直書きするか、ヘルパに集約するか → ESLint で強制するためには 1 箇所集約が前提。
- **issue 2**: ESLint `no-restricted-globals` の例外をファイル単位 disable comment にするか overrides セクションにするか → grep diff 最小化のため `overrides` 採用（source §0.6）。
- **issue 3**: Sentry init 失敗時に logger が連鎖 throw しないこと（observability の自己防衛）。
- **issue 4**: Workers / Browser / Node の 3 ランタイムを 1 ロガーで吸収するための runtime tag 判定方式。
- **issue 5**: `info` / `debug` を Sentry breadcrumb に流すと rate-limit を圧迫するため、capture は `warn` / `error` のみ。

## 4. 受け入れ条件（DoD）

source §9 を Phase 1 の正本 DoD として転記する:

- [ ] `apps/web/src/lib/is-browser.ts` / `logger.ts` が新設されている
- [ ] `apps/web/src/lib/__tests__/{logger,is-browser}.test.ts` が pass
- [ ] `pnpm --filter @ubm-hyogo/web exec rg '\bwindow\.' src/` の検出件数が `is-browser.ts` / `instrumentation-client.ts` 以外で 0
- [ ] `pnpm --filter @ubm-hyogo/web lint` が `no-restricted-globals` 違反 0 で通過
- [ ] `pnpm --filter @ubm-hyogo/web build` が SSR 警告なしで通過
- [ ] logger の `error` 呼び出しで Sentry に event が記録される（手動 smoke）
- [ ] logger の出力が JSON 一行（`{"level":"info","ts":"...","event":"..."}`）になっている

## 5. リスク列挙

source §10 を引用して整形:

| # | リスク | 影響 | 緩和 |
| --- | --- | --- | --- |
| R1 | **`window` 参照 SSR エラー**（phase-1 §6 の中核リスク） | 公開 / 会員 / 管理画面のいずれかが Cloudflare Workers SSR で 500 を返す | grep + ESLint で構造的に検出 / `isBrowser()` ガードで囲む / `useEffect` 内 or `'use client'` 化 |
| R2 | 既存コードに大量の `window` 参照が残存 | grep 結果が膨大で本 task のスコープを超える | 本 task は検出 + 最小修正まで。残箇所は所有 task（task-09 以降）にチェックリスト化 |
| R3 | ESLint 誤検出（コメント / 文字列内の `window`） | false positive で lint fail | `ignores` に test / sentry init 列挙、行末 `eslint-disable-next-line` を限定許容 |
| R4 | Sentry breadcrumb 過多 → rate-limit | event ロス | logger.warn / error のみ capture、info / debug は console のみ |
| R5 | 循環 import (`logger` ↔ `sentry/capture`) | runtime error / build error | `logger` → `capture` の単方向のみ。capture からは logger import 禁止 |
| R6 | `JSON.stringify` 循環参照 | 観測欠落 / throw | `safeStringify` フォールバック（必要に応じ `lib/json-safe.ts` を別途追加） |
| R7 | runtime tag 誤判定（Edge / Node / Browser） | `runtime` フィールドが不正確 | `isBrowser()` → `process.env.NEXT_RUNTIME` → `"workers"` フォールバック順 |

## 6. 不変条件マッピング（CLAUDE.md 抜粋）

| 不変条件 | CLAUDE.md 該当箇所 | 本 task での具体化 |
| --- | --- | --- |
| #5 D1 直接アクセスは `apps/api` に閉じる | 「重要な不変条件」 #5 | logger payload に D1 SQL / binding 情報を含めない（PII redaction の延長） |
| シークレット禁止流出 | 「シークレット管理」 | logger に DSN / AUTH_SECRET / API Token を流さない（key 名 allow-list） |
| ランタイム env 不変条件 | task-02 wrangler-env-injection | logger 出力先 URL を `.env` 直書きせず、出力先設定を追加する場合は `getEnv()` 経由 |
| 平文 `.env` 禁止 | 「シークレット管理」 | logger 経由で .env 値を ToDoc 出力しない |
| `apps/web` env アクセスは `getEnv()` 経由のみ | task-02 不変条件 | logger 内部で `process.env.*` を直接参照しない（`NEXT_RUNTIME` 判定のみ例外） |

## 7. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | task-05 / 画面 task のブロックを解除できるか | PASS | logger と isBrowser を確定すれば task-05 `error.tsx` が結線可能 |
| 実現性 | Workers / Browser 双方で動くか | PASS | `console` + `captureException` の薄ラッパのみ |
| 整合性 | branch / env / runtime / data / secret が矛盾しないか | PASS | `getEnv()` 経由のみ、shared types に新規追加なし |
| 運用性 | rollback / handoff が成立するか | PASS | 新設ファイルのみで revert 容易、ESLint ルール導入は別 commit に分離可 |

## 8. 実行タスク

1. source spec の §0.1〜0.8 を再読し、上流 task-03 の API 表面 (`captureException` / `captureMessage`) シグネチャを Phase 2 へ持ち込む。
2. `apps/web/src/**` 配下の `window` 参照を grep し、件数と分布を Phase 2 で把握する。
3. ESLint `overrides` 配置候補（`src/instrumentation-client.ts` / `src/lib/sentry/**` / `src/lib/is-browser.ts` / `src/**/__tests__/**`）を Phase 2 で確定する。
4. PII redaction の最小実装方針（key 名 allow-list）を Phase 3 で関数シグネチャに反映する。

## 9. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md | 本タスクの正本 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md | 上流 task-03（capture API） |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md | 下流 task-05（logger 利用） |
| 必須 | CLAUDE.md | 不変条件 / env / secret 規律 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md | 19 routes / 4 不変条件 |

## 10. 完了条件（Phase 1）

- [ ] 上位ゴール / スコープ / DoD / リスク / 不変条件マッピングが本ファイル内で完結
- [ ] `outputs/phase-01/phase-01.md` に同内容が複製済み
- [ ] artifacts.json の Phase 1 が `pending`（実行時に `in_progress`/`completed` 更新）

## 11. 次 Phase

- 次: Phase 2（アーキテクチャ設計 / DAG / 競合ファイル / 既存コード調査）
- 引き継ぎ: 上流 task-03 の `captureException` / `captureMessage` シグネチャ、ESLint overrides 配置候補、`window` grep 戦略
- ブロック条件: source spec 未読 / Phase 1 出力未配置

## 目的

SSR / Workers 上で `window` 直参照による実行時例外を防ぎ、logger の観測契約を task-03 / task-05 間で接続する。

## 成果物

| 種別 | パス |
| --- | --- |
| Phase 1 仕様 | `phase-01.md` |
| Phase 1 output | `outputs/phase-01/phase-01.md` |
