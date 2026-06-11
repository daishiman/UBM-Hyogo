# Phase 11 代替証跡集約 — vitest 2→3 メジャーアップグレード

## NON_VISUAL 宣言（WEEKGRD-03）

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（vitest 2.1.9 → 3.2.6 / `@vitest/coverage-v8` 同期） |
| 非視覚的理由 | テストランナーの version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | 全 651 spec 相当の自動テスト結果（shard 別 green）+ deprecation 警告ログ（0 件）+ バージョン整合ログ（vitest と coverage-v8 が 3.2.6 で一致） |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001 / Feedback 4）

本タスクは実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可である。変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。手動テストは自動テスト結果と各種ログの採取・確認をもって実施した。

## スクリーンショットを作らない理由

> 本タスクは vitest（テスト実行基盤）の依存バージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。視覚的に比較・記録すべき差分が存在しないため、スクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない（NON_VISUAL のため不要）。

## 証跡ファイル（FB-02 固定名）

| ファイル | 内容 |
| --- | --- |
| [`typecheck-local.txt`](typecheck-local.txt) | `pnpm typecheck` 出力（7 workspace Done / exit 0） |
| [`lint-local.txt`](lint-local.txt) | `pnpm lint` 出力（全 workspace Done / exit 0） |
| [`vitest-shard-results.txt`](vitest-shard-results.txt) | shard 別 vitest 結果 + coverage 集約閾値 |
| [`deprecation-grep.txt`](deprecation-grep.txt) | deprecation / 非推奨 API 検出（vitest config 由来 0 件） |
| [`version-parity.txt`](version-parity.txt) | `pnpm why vitest` / `@vitest/coverage-v8`（3.2.6 一致） |

## source-level PASS（spec 自体の合否）

| shard | files | tests | 結果 |
| --- | --- | --- | --- |
| api-unit | 87 | 561 | passed |
| api-d1 | 115 | 1007 | passed（port exhaustion なし） |
| web | 244 | 1773（+1 skip 既存） | passed |
| og | 6 | 23 | passed |
| packages | 33 | 335 | passed |
| scripts | 58 | 478 | passed |
| infra | 10 | 56 | passed |

- **RED（v2→v3 破壊的変更による実テスト失敗）: 0 件。** C1（エラー比較厳格化）/ C2（spy・mockReset）/ C3（fakeTimers）に該当する spec 修正はゼロ。
- typecheck / lint: exit 0。
- coverage 集約閾値（`coverage-guard --no-run`）: exit 0・全 7 パッケージ ≥ 80% PASS（C6 由来の閾値割れなし）。
- バージョン整合: vitest と `@vitest/coverage-v8` が 3.2.6 完全一致（C7 解消）。
- deprecation: vitest config 由来（deps.inline / workspace）の警告 0 件（AC-6）。残る `Vite CJS Node API deprecated` は上流 Vite 由来で本 upgrade と無関係。

## 環境ブロッカー（WEEKGRD-01 / テスト内容と無関係な環境起因）

実行マシンが外部要因で高負荷（load average 130〜260）になった時間帯に観測したノイズ。いずれも低負荷時の再実行で green を確認しており、vitest 3 の回帰ではない。

| 事象 | 真因 | 復旧・再確認 |
| --- | --- | --- |
| scripts フルディレクトリ実行が exit 1 | forks プールの birpc 60s RPC タイムアウト（`Timeout calling "onTaskUpdate"`・vitest issue #8164・v2 から存在しバージョン非依存） | `--no-file-parallelism` で再実行 → exit 0 / 478 passed / Errors 0。CI は scripts をファイル単位実行のため非影響 |
| api-d1 coverage で hook/test timeout | 高負荷下で Miniflare 起動（`setupD1` hook）が hookTimeout 30s を超過 | CLI 一時フラグ `--hookTimeout=120000 --testTimeout=120000`（config 不変条件は変更せず）で再実行 → 115 files/1007 tests passed・exit 0 |
| web coverage で `BulkActionBar TC-BAB-CAT-11` 1 件 fail | real timer の `waitFor`（既定 1000ms）が高負荷下で 2384ms 超過（fakeTimers 不使用 = C3 非該当） | 低負荷時（load 8.59）に単独再実行 → 22 tests passed・exit 0。web shard 全体も再実行で 244 files/1773 tests passed・exit 0 |

> 環境ブロッカーはいずれも esbuild arch / worktree isolation（issue-747 runbook 対象）ではなく、CPU 飽和起因のタイミング系。source-level PASS は上表のとおり全 shard green で確定。

## Phase 11 完了判定

NON_VISUAL タスクの代替証跡（自動テスト結果・deprecation ログ・バージョン整合ログ）をすべて採取し、source-level PASS（全 shard green / RED 0 件）と環境ブロッカー（CPU 飽和起因 flake・再実行で green）を分離記録した。視覚証跡は不要。
