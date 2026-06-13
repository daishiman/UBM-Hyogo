# Phase 11 代替証跡集約 — vitest 3→4 メジャーアップグレード

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| status | **partial**（実装レビュー実測。full shard green は arm64 Node 環境で再実行が必要） |
| 本ファイルの位置づけ | 実装レビュー時点の代替証跡集約。Node arch guard が `process.arch=x64` を検出したため、full shard green は pending として分離記録する |

## NON_VISUAL 宣言（WEEKGRD-03）

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（vitest 3.2.6 → 4.1.8 / `@vitest/coverage-v8` 同期 / `@vitejs/plugin-react` ^5.2.0） |
| 非視覚的理由 | テストランナーの version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | バージョン整合ログ（`pnpm why` ×4）と focused 実行は採取済み。全 693 spec の shard 別 green + deprecation 警告ログは arm64 Node 環境で再実行する |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001）

本タスクは実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可である。変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。手動テストは自動テスト結果と各種ログの採取・確認をもって実施する。

## スクリーンショットを作らない理由

> 本タスクは vitest（テスト実行基盤）の依存バージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。視覚的に比較・記録すべき差分が存在しないため、スクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない（NON_VISUAL のため不要）。

## 証跡ファイル（FB-02 固定名・事前宣言）

実装サイクルで以下 5 ファイルを `outputs/phase-11/` に採取する。現時点ではチャット実行ログとして採取済みの値を本ファイルに集約し、固定ログファイル化は full shard 再実行時に行う。

| ファイル | 内容 | 状態 |
| --- | --- | --- |
| `typecheck-local.txt` | `mise exec -- pnpm typecheck` の出力 | source-level PASS（チャット実行ログ） |
| `lint-local.txt` | `mise exec -- pnpm lint` の出力 | pending |
| `vitest-shard-results.txt` | shard 別 vitest 結果（件数・green/fail・skip・obsolete snapshot 有無）+ coverage 集約閾値 | partial |
| `deprecation-grep.txt` | deprecation 警告 grep 結果（v4.1 系統の 0 件 or 分類記録の確認） | pending |
| `version-parity.txt` | `pnpm why` ×4（vitest / `@vitest/coverage-v8` / vite / `@vitejs/plugin-react`） | source-level PASS（チャット実行ログ） |

## source-level PASS（spec 自体の合否）

以下は 2026-06-13 の実装レビュー実測。baseline は Phase 4 RED 採取値。

| shard | files | tests | 結果 |
| --- | --- | --- | --- |
| api-unit | not run | not run | pending |
| api-d1 | focused | 5 passed (`apps/api/src/env.spec.ts`); 13 passed (`notificationOutbox.repository.spec.ts` with D1 timeout 180s) | focused PASS |
| web | focused | 31 passed (`IdentityConflictRow.spec.tsx`, `RequestQueueDetail.spec.tsx`, `server-fetch.env.spec.ts` with `--maxWorkers=1`) | focused PASS |
| og | not run | not run | pending |
| packages | not run | not run | pending |
| scripts | not run | not run | pending |
| infra | not run | not run | pending |

あわせて以下を記録する。

- RED（v3→v4 破壊的変更による実テスト失敗）の件数と C1-C8（v4 版）分類: focused web 修正 3 ファイル（Mock 型 / `matchMedia` stub / `restoreAllMocks` 履歴）。
- typecheck: PASS (`pnpm typecheck` exit 0). lint: pending.
- coverage 集約閾値の判定結果と C2（AST remapping）実測 diff: pending.
- バージョン整合: PASS. `vitest@4.1.8`, `@vitest/coverage-v8@4.1.8`, `vite@7.3.5`, `@vitejs/plugin-react@5.2.0` all single-version resolution.
- deprecation 警告の件数と対応分類: pending.
- obsolete snapshot の件数（0 件であること）: pending.
- skip 件数の baseline 比較（非増加であること）: pending.

## 環境ブロッカー（WEEKGRD-01 / テスト内容と無関係な環境起因）

| 事象 | 真因 | 復旧・再確認 |
| --- | --- | --- |
| `verify:vitest-runtime` failed | `process.arch=x64`, expected `arm64`（Volta Node `/Users/dm/.volta/tools/image/node/24.15.0/bin/node`） | arm64 Node 環境で再実行が必要 |
| initial Vitest startup failed | esbuild host/binary mismatch `0.27.3` vs `0.28.1` | `pnpm install --force` で node_modules を再同期し、`pnpm exec esbuild --version` / package version とも `0.27.3` を確認 |
| focused web multi-file run initially failed | forks worker startup timeout without worker cap | `--maxWorkers=1` で changed web specs 3 files / 31 tests PASS。full web shard は arm64 Node 環境で再実行 |
| api-d1 cold migration timeout | x64 Node 環境で初回 `setupD1()` が 120s を超過 | `vitest.d1.config.ts` に D1 専用 180s timeout を反映し、`notificationOutbox.repository.spec.ts` 13 tests PASS を確認。full shard は arm64 Node 環境で再実行が必要 |

## Phase 11 完了判定

**partial**。version parity と typecheck は PASS、focused tests は一部 PASS。full shard green / coverage / deprecation grep は Node arch guard を満たす arm64 Node 環境で再実行して確定する。
