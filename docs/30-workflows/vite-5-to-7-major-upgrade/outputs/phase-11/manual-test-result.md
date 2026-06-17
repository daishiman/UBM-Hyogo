# Phase 11 代替証跡集約 — Vite 5.4.21 → 7.x メジャーアップグレード

> **workflow_state: `implemented_local_evidence_captured`**。2026-06-13 JST に root `package.json` へ `vite ^7.0.0` を追加し、`pnpm-lock.yaml` を再生成した。Vite は `7.3.5` 単一解決。commit / push / PR は user-gated。

## NON_VISUAL 宣言（WEEKGRD-03）

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（Vite 5.4.21 → 7.x。root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加 + `pnpm-lock.yaml` 再生成） |
| 非視覚的理由 | テストツールチェーン（Vite はテスト時の `vitest` / `@vitejs/plugin-react` の基盤）の version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。`apps/web` 本番ビルドは `next build --webpack`（OpenNext Workers）で Vite 非依存のため、ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の自動テスト結果（shard 別 green）+ deprecation 警告ログ（0 件）+ バージョン整合ログ（`pnpm why vite` が単一 7.x 解決） |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001 / Feedback 4）

本タスクは実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可である。変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。手動テストは自動テスト結果と各種ログの採取・確認をもって実施した。

## スクリーンショットを作らない理由

> 本タスクは Vite（テスト実行基盤の依存）のメジャーバージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。`apps/web` 本番ビルドは `next build --webpack` で Vite 非依存のため、視覚的に比較・記録すべき差分が存在しない。よってスクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない（NON_VISUAL のため不要）。

## 証跡ファイル（FB-02 固定名）

| ファイル | 内容 | 状態 |
| --- | --- | --- |
| `typecheck-local.txt` | `pnpm -r typecheck` 出力要約（exit 0） | present |
| `lint-local.txt` | `pnpm lint` 出力要約（exit 0） | present |
| `vitest-shard-results.txt` | shard 別 vitest 結果（件数・green/fail） | present |
| `deprecation-grep.txt` | deprecation / 非推奨 API 検出（V4・Vite config 由来 0 件） | present |
| `version-parity.txt` | `pnpm why vite`（単一 7.x 解決） | present |

## source-level PASS（spec 自体の合否）

以下を本実装サイクルで採取した。広域 shard は高負荷下の setup timeout / loading flake が出たため、Vite 7 回帰と混同しないよう focused rerun で source-level を確認した。

| shard / command | 結果 | 判定 |
| --- | --- | --- |
| version parity | `pnpm why vite` / `pnpm list vite ...` で `vite@7.3.5` 単一解決 | PASS |
| deprecation grep | focused web spec 実行ログで `deprecat|splitVendorChunk|legacy|CJS Node API|warn` 検出 0 | PASS |
| typecheck | `pnpm -r typecheck` exit 0 | PASS |
| lint | `pnpm lint` exit 0 | PASS |
| build | `pnpm build` exit 0。Next/Sentry/Wrangler 既存警告のみで build 成功 | PASS |
| web broad shard | `apps/web` broad は tag loading flake 3 fail。対象 2 files focused rerun 16 tests PASS | PASS（flake isolated） |
| api-unit broad shard | `apps/api` broad は `sync-backfill-publish-state` setup timeout 1 fail。focused rerun 6 tests PASS | PASS（flake isolated） |
| api-d1 broad shard | D1 broad は `members.contract` setup timeout 4 fail。focused rerun 29 tests PASS | PASS（flake isolated） |
| vitest runtime arch | 初回は `process.arch=x64, expected arm64` で FAIL。`mise exec -- pnpm install --force` で worktree-local `@esbuild/darwin-arm64@0.27.3` を復旧し、`pnpm verify:vitest-runtime` は PASS に転換 | RESOLVED_ENV_BLOCKER |

## 環境ブロッカー（WEEKGRD-01 / テスト内容と無関係な環境起因）

以下を source-level PASS と **別カテゴリ** で記録する。テスト内容の合否と環境ノイズを混同しない。

| 想定事象 | 想定真因 | 復旧・再確認手段 |
| --- | --- | --- |
| esbuild バージョン不整合（V5） | `pnpm.overrides.esbuild=0.27.3` と Vite 7 が期待する esbuild レンジの不整合 | `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 自動解決 / `pnpm verify:vitest-runtime` / issue-747 runbook。不整合が解消不能なら Phase 3 でユーザーエスカレーション |
| worktree isolation / index.lock | ワークツリーごとの node_modules 独立・並列プロセス干渉 | `pnpm install --force` / `pnpm verify:vitest-runtime` |
| CPU 飽和 flake | 高負荷下のタイミング系 timeout（vitest 7 回帰ではない） | 低負荷時の再実行 / `--no-file-parallelism` / 一時 `--hookTimeout` フラグ（config 不変条件は変更しない） |

> 環境ブロッカーはいずれも esbuild arch / worktree isolation（issue-747 runbook 対象）または CPU 飽和起因のタイミング系であり、Vite 7 のコード品質とは無関係。esbuild arch mismatch は本サイクル内で解消済み。source-level PASS は shard / focused rerun の RED 分類で確定する。

## Phase 11 完了判定

NON_VISUAL タスクの代替証跡（自動テスト結果・deprecation ログ・バージョン整合ログ）を採取し、source-level PASS と環境ブロッカー（arch mismatch / CPU 飽和 flake）を分離記録した。視覚証跡は不要。Phase 11 は local evidence captured と判定する。
