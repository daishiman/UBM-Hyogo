# Phase 11: Manual Test（手動テスト）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-10-final-review.md（全 AC PASS） |
| 区分 | `[実装区分: 実装仕様書]` / **NON_VISUAL** |
| workflow_state | `implemented_local_evidence_captured` |
| 目的 | 依存アップグレード（Vite 5.4.21 → 7.x）の完了を、自動テスト結果・deprecation 警告ログ・バージョン整合ログで実証する |

> 2026-06-13 JST の実装サイクルで root `package.json` に `vite ^7.0.0` を追加し、`pnpm-lock.yaml` を再生成した。Phase 11 証跡は canonical manifest `outputs/phase-11/canonical-paths.json` と `outputs/phase-11/evidence/*.log` に固定名で保存し、詳細ログを `outputs/phase-11/*.txt` に補足保存する。

## NON_VISUAL 宣言（WEEKGRD-03）

Phase 11 の証跡集約ファイル冒頭に、以下 3 項目から成る **NON_VISUAL 宣言** を明記する。

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（Vite 5.4.21 → 7.x。root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加 + `pnpm-lock.yaml` 再生成） |
| 非視覚的理由 | テストツールチェーン（Vite はテスト時の `vitest` / `@vitejs/plugin-react` の基盤）の version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。`apps/web` 本番ビルドは `next build --webpack`（OpenNext Workers）で Vite 非依存のため、ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | 全 shard（api-unit / api-d1 / web / og / packages / scripts / infra）の自動テスト結果（shard 別 green）+ deprecation 警告ログ（0 件）+ バージョン整合ログ（`pnpm why vite` が単一 7.x 解決） |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001 / Feedback 4）

- 本タスクは **実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可** である。理由は、変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。
- したがって手動テストは「実地操作の代わりに自動テスト結果と各種ログを採取・確認する」形で実施した。
- スクリーンショットは作成しない。理由は **UI/UX 変更がゼロ** であり、視覚的に比較・記録すべき差分が存在しないため（後述「スクリーンショットを作らない理由」参照）。

## 代替証跡の主ソース

| 証跡カテゴリ | 主ソース（採取対象） | PASS の合図 |
| --- | --- | --- |
| 自動テスト結果 | 全 shard（web / api-unit / api-d1 / og / packages / scripts / infra）の実行結果 | 各 shard で fail 0 件・skip 非増加 |
| deprecation 警告ログ | vitest 実行時の stderr / stdout（V4: Vite 6/7 で削除/非推奨 API） | `splitVendorChunkPlugin` / CJS Node API / `legacy` 等の未対応警告が 0 件 |
| バージョン整合ログ | `pnpm why vite` | vite が単一 `7.x` で解決され、5 系と 7 系の併存（重複）がない（V1/V7） |
| 型・lint ログ | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | exit 0 |
| apps/web sanity ビルド | `mise exec -- pnpm build`（V8） | OpenNext bundle 健全・`[project]/...` 仮想 specifier 混入なし。blocker ではない |

## source-level PASS と環境ブロッカーの分離（WEEKGRD-01）

証跡記録時は、テスト内容の合否（source-level PASS）と、実行環境起因の停止（環境ブロッカー）を **別カテゴリ** で記録する。両者を混同すると「アップグレードのコード品質」の判定が環境ノイズで汚染されるため。

| カテゴリ | 定義 | 記録例 |
| --- | --- | --- |
| source-level PASS | spec 自体がアップグレード後の Vite 7.x で green になった結果 | shard 別 green 件数 / 修正した V2〜V4 該当 spec・config |
| 環境ブロッカー | esbuild arch mismatch（V5）/ worktree isolation / index.lock / CPU 飽和 flake 等、テスト内容と無関係な環境起因の停止 | 発生有無・復旧手順（`pnpm install --force` / `pnpm verify:vitest-runtime` / `scripts/cf.sh` の `ESBUILD_BINARY_PATH` / issue-747 runbook）・復旧後の再実行結果 |

> 環境ブロッカーが発生した場合は、CLAUDE.md の「Vitest / esbuild runtime トラブル時」および `issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` に従い復旧してから再実行し、source-level PASS を確定する。特に V5（`pnpm.overrides.esbuild=0.27.3` と Vite 7 の esbuild レンジ整合）は環境ブロッカー側で扱い、source-level の合否と分離する。

## 証跡ファイル名の事前固定（FB-02）

以下のファイル名を固定で使用する（命名のブレを防ぐ）。本実装サイクルで `manual-test-result.md`、canonical manifest、canonical evidence logs、補足コマンドログ（`.txt`）を present にした。

| ファイル | 役割 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/manual-test-result.md` | 代替証跡の集約（NON_VISUAL 宣言・実地操作不可明記・source PASS / 環境ブロッカー分離・各ログへの参照） | present |
| `outputs/phase-11/canonical-paths.json` | Phase 11 canonical evidence path manifest | present |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm typecheck` の canonical 要約 | present |
| `outputs/phase-11/evidence/lint.log` | `pnpm lint` の canonical 要約 | present |
| `outputs/phase-11/evidence/test.log` | shard / focused rerun の canonical 要約 | present |
| `outputs/phase-11/evidence/build.log` | `pnpm build` sanity の canonical 要約 | present |
| `outputs/phase-11/evidence/grep-gate.log` | `pnpm why vite` + deprecation grep の canonical 要約 | present |
| `outputs/phase-11/typecheck-local.txt` | `pnpm -r typecheck` の補足出力要約 | present |
| `outputs/phase-11/lint-local.txt` | `pnpm lint` の補足出力要約 | present |
| `outputs/phase-11/vitest-shard-results.txt` | shard 別 vitest 実行結果（件数・green/fail）の詳細 | present |
| `outputs/phase-11/deprecation-grep.txt` | deprecation 警告 grep 結果（0 件の確認）の詳細 | present |
| `outputs/phase-11/version-parity.txt` | `pnpm why vite` の出力（単一 7.x 解決）の詳細 | present |

> **`screenshots/.gitkeep` は不要**: 本タスクは NON_VISUAL であり、`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない。この旨を `manual-test-result.md` に明記する。

## スクリーンショットを作らない理由（明文化必須）

`manual-test-result.md` に以下を逐語で記載する。

> 本タスクは Vite（テスト実行基盤の依存）のメジャーバージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。`apps/web` 本番ビルドは `next build --webpack` で Vite 非依存のため、視覚的に比較・記録すべき差分が存在しない。よってスクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

## 完了条件

- [x] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）が証跡集約ファイル冒頭に明記される方針が記載されている
- [x] 実地操作不可が明記され、自動テスト結果 + deprecation 警告ログ + バージョン整合ログを代替証跡とする方針が記載されている
- [x] 証跡の主ソース（全 shard 別 green / `pnpm why vite` 単一 7.x）が記載されている
- [x] source-level PASS と環境ブロッカー（V5 esbuild 整合含む）を別カテゴリで記録する方針（WEEKGRD-01）が記載されている
- [x] 証跡ファイル名が事前固定（FB-02）され、コマンドログが present・`screenshots/.gitkeep` 不要が明記されている
- [x] スクリーンショットを作らない理由が逐語で記載されている
- [x] 実装サイクルの実測値と環境ブロッカーを分離して記録している
