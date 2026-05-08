# Phase 4: タスク分解 / 実装ステップ計画

> 関連 source: docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md
> 実装区分: 実装仕様書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-04-w3-window-guard-and-logger |
| Wave | W3（W2 の task-03 完了後） |
| 実行種別 | sequential（task-03 完了待ち）|
| Phase 番号 | 4 / 13 |
| 作成日 | 2026-05-08 |
| 上流 Phase | Phase 3（設計レビュー）|
| 下流 Phase | Phase 5（環境準備）|
| 状態 | completed |

---

## 0. 目的

task-04 の実装スコープを **1 機能 = 1 PR-able commit 単位**に分解し、各ステップの完了条件・検証コマンド・blocker を確定する。本 phase の出力は Phase 5（環境準備） / Phase 6（実装） / Phase 7（テスト）の起点として機能する。

実装スコープは以下 2 ファイル新設・1 ファイル修正・最小範囲の `window` ラップで構成される（元仕様 §3 変更対象ファイル表）:

- `apps/web/src/lib/is-browser.ts`（C / 新設）
- `apps/web/src/lib/logger.ts`（C / 新設）
- `apps/web/src/lib/__tests__/logger.test.ts`（C / 新設）
- `apps/web/src/lib/__tests__/is-browser.test.ts`（C / 新設）
- `apps/web/eslint.config.mjs`（M / 修正）
- `apps/web/src/**/*.{ts,tsx}`（M / 最小ラップ）

---

## 1. blocker と前提

| 項目 | 内容 |
| --- | --- |
| 直前依存 task | task-03 sentry-workers-sdk-unify |
| blocker 解除条件 | `apps/web/src/lib/sentry/capture.ts` が存在し、`captureException(error, ctx?)` / `captureMessage(message, ctx?)` を export している |
| blocker 確認コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n 'export (async )?function (captureException\|captureMessage)' src/lib/sentry/capture.ts` |
| 並列可否 | task-02 とは別ファイルに閉じるため並列可。画面 task（11-17）には先行する必要あり |

> task-03 が未完了の場合、Phase 5 へ進まず本 task は pending 維持。logger の Sentry 結線が宙づりになるため、stub を作って先行着手するのは禁止する（capture API シグネチャが phase-3 で確定する前に固定すると task-03 完了時に書換差分が拡散する）。

---

## 2. 実装ステップ分解（PR-able commit 単位）

各ステップは「単独で commit できる粒度」かつ「直後の Phase / Step が green でなくても本ステップ単独でテストが pass する」境界で切る。

### Step 1: `is-browser.ts` 新設

| 項目 | 値 |
| --- | --- |
| 目的 | `typeof window !== 'undefined'` ガードを 1 関数に集約し、ESLint `no-restricted-globals` 導入の前提を作る |
| 変更対象 | `apps/web/src/lib/is-browser.ts`（C）|
| 関数シグネチャ | `export const isBrowser = (): boolean` / `export function whenBrowser(fn: () => void): void` |
| 完了条件 | tsc --noEmit が通る / ファイルが import なしの leaf module |
| 検証コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit` |
| commit message 例 | `feat(web): add isBrowser guard helper for SSR/Workers safety` |

### Step 2: `logger.ts` 新設（capture 結線まで）

| 項目 | 値 |
| --- | --- |
| 目的 | 構造化 logger を新設し、`error` / `warn` レベルで task-03 の Sentry capture API を呼ぶ |
| 変更対象 | `apps/web/src/lib/logger.ts`（C）|
| 公開 API | `LogLevel` / `LogFields` / `Logger` / `logger` / `logger.child(base)` |
| 完了条件 | tsc が通る / `import { captureException, captureMessage } from "./sentry/capture"` が解決する |
| 検証コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit` |
| 不変条件 | logger → capture の単方向 import のみ（capture からは logger を import しない / circular 禁止） |
| commit message 例 | `feat(web): add structured logger with Sentry capture integration` |

### Step 3: logger / is-browser 単体テスト追加

| 項目 | 値 |
| --- | --- |
| 目的 | logger の JSON 出力 / Sentry mock 連携 / child フィールドマージ / runtime tag を担保する |
| 変更対象 | `apps/web/src/lib/__tests__/is-browser.test.ts` / `apps/web/src/lib/__tests__/logger.test.ts`（C）|
| 完了条件 | 7 ケース以上 pass / `vi.mock('@/lib/sentry/capture')` で capture を全件モック |
| 検証コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/logger.test.ts src/lib/__tests__/is-browser.test.ts` |
| commit message 例 | `test(web): cover logger and isBrowser unit tests` |

### Step 4: ESLint `no-restricted-globals` 設定追加

| 項目 | 値 |
| --- | --- |
| 目的 | 未ガードの `window` / `document` 直参照を CI で構造的に防止する |
| 変更対象 | `apps/web/eslint.config.mjs`（M）|
| 設定差分 | `no-restricted-globals` を `error` で `window` / `document` に設定。`overrides` で `src/instrumentation-client.ts` / `src/lib/sentry/**` を例外化 |
| 完了条件 | `pnpm --filter @ubm-hyogo/web lint` が新規違反 0 で pass（既存違反は Step 5 で解消）|
| 検証コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web lint` |
| 注意 | overrides 方式（ファイル単位 disable comment は使わない）。grep diff 最小化のため |
| commit message 例 | `chore(web): forbid bare window/document via no-restricted-globals` |

### Step 5: 既存 `window` 参照箇所の `isBrowser()` ラップ

| 項目 | 値 |
| --- | --- |
| 目的 | grep で検出した未ガード `window` 参照を 1 件ずつ最小修正で `isBrowser()` 経由に書換える |
| 変更対象 | `apps/web/src/**/*.{ts,tsx}`（M / 最小）|
| 検出コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n '\bwindow\.' src/ \| grep -v 'is-browser.ts' \| grep -v 'instrumentation-client.ts' \| grep -v 'src/lib/sentry/'` |
| 書換パターン | (a) `'use client'` component 内 → `useEffect` / event handler 内に移動 (b) RSC / util → `isBrowser()` で囲う (c) どうしても server で参照したい場合は logger に reportable error |
| 完了条件 | 検出件数が `is-browser.ts` / `instrumentation-client.ts` / `src/lib/sentry/**` 以外で **0** |
| 検証コマンド | 上記 rg コマンド + `mise exec -- pnpm --filter @ubm-hyogo/web lint` |
| 注意 | 画面実装 task（11-17）と diff 衝突しないよう、本 task では既存検出箇所のみに修正を限定する。新規実装の `window` 参照混入は画面 task 側で防ぐ |
| commit message 例 | `fix(web): wrap remaining bare window references with isBrowser()` |

### Step 6: `pnpm build` SSR 検証

| 項目 | 値 |
| --- | --- |
| 目的 | SSR / Workers ランタイムでの `window is not defined` を build 段階で一発検出する |
| 変更対象 | なし（検証のみ）|
| 完了条件 | `apps/web` build が警告なしで exit 0 / Next.js の `ReferenceError: window is not defined` がゼロ |
| 検証コマンド | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| 失敗時アクション | スタックトレースから該当ファイルを特定し Step 5 に戻る |
| commit | （build 成果物は commit 不要。CI 実行ログのみ確認）|

---

## 3. ステップ間依存関係（DAG）

```
Step 1 (is-browser.ts) ──┐
                         ├─→ Step 3 (test) ─→ Step 4 (eslint) ─→ Step 5 (window ラップ) ─→ Step 6 (build 検証)
Step 2 (logger.ts) ──────┘
```

- Step 1 と Step 2 は **並列可**（共通 import なし）。
- Step 3 は Step 1 + 2 完了後に着手（テスト対象 import が解決する必要があるため）。
- Step 4 は Step 1 完了後（is-browser.ts を ignores に列挙する必要があるため）。
- Step 5 は Step 4 完了後（lint で違反箇所を機械的に列挙するため）。
- Step 6 は Step 5 完了後（build は最終チェックゲート）。

---

## 4. 各ステップの DoD（Definition of Done）

| Step | DoD |
| --- | --- |
| 1 | `apps/web/src/lib/is-browser.ts` 存在 / tsc 通過 |
| 2 | `apps/web/src/lib/logger.ts` 存在 / tsc 通過 / capture import 解決 |
| 3 | logger / is-browser test が 7 ケース以上 pass |
| 4 | `eslint.config.mjs` に `no-restricted-globals` rule + overrides 追加 / lint pass（Step 5 後）|
| 5 | rg で `is-browser` / `instrumentation-client` / `lib/sentry` 以外に `\bwindow\.` 0 件 |
| 6 | `pnpm --filter @ubm-hyogo/web build` exit 0 |

---

## 5. リスクと緩和（Step 別）

| Step | リスク | 緩和 |
| --- | --- | --- |
| 2 | task-03 の capture API シグネチャ未確定 | task-03 完了を blocker として待つ。stub 先行着手は禁止 |
| 3 | jsdom と node env を 1 ファイルで切替える Vitest 設定 | `// @vitest-environment` pragma をテストファイル冒頭に明記 |
| 4 | 文字列 `window` を含むコメントで false positive | `no-restricted-globals` は `typeof` 演算子下では発火しない。それでも誤検知時は overrides 追加で対処（行末 disable は最終手段）|
| 5 | grep 結果が膨大 | 本 task では検出と最小修正までに留め、画面実装は所有 task（11-17）に分担 |
| 6 | build 失敗が `window` 以外の原因 | 失敗ログを切り分け、本 task 範囲外のエラーは別 issue 化 |

---

## 6. 成果物（本 phase）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-04/phase-04.md` | 実装ステップ計画（本ファイルと同内容）|

---

## 7. 完了条件

- [ ] 全 6 Step の完了条件・検証コマンドが本ドキュメントに記載されている
- [ ] task-03 完了待ち blocker が明示されている
- [ ] DAG が Step 間依存を網羅している

---

## 8. 次 Phase

- 次: Phase 5（環境準備 / 前提セットアップ）
- 引き継ぎ事項: Step 一覧と blocker 解除条件
- ブロック条件: task-03 の `apps/web/src/lib/sentry/capture.ts` 未生成

## 実行タスク

1. Phase 6〜10 の実装・検証 step を実行順に分解する。
2. task-03 gate と task-05 downstream の blocker を明示する。

## 参照資料

| 種別 | パス |
| --- | --- |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md` |
| Phase 3 | `phase-03.md` |
