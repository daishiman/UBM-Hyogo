# Phase 11: Manual Test（手動テスト）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-10-final-review.md（全 AC PASS） |
| 区分 | `[実装区分: 実装仕様書]` / **NON_VISUAL** |
| 目的 | 依存アップグレードの完了を、自動テスト結果・deprecation 警告ログ・バージョン整合ログで実証する |

## NON_VISUAL 宣言（WEEKGRD-03）

後続実装者は Phase 11 の証跡集約ファイル冒頭に、以下 3 項目から成る **NON_VISUAL 宣言** を必ず明記する。

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（vitest 2.1.9 → 3.2.6 / @vitest/coverage-v8 同期） |
| 非視覚的理由 | テストランナーの version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | 全 651 spec の自動テスト結果（shard 別 green）+ deprecation 警告ログ（0 件）+ バージョン整合ログ（vitest と coverage-v8 が 3.2.6 で一致） |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001 / Feedback 4）

- 本タスクは **実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可**である。理由は、変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。
- したがって手動テストは「実地操作の代わりに自動テスト結果と各種ログを採取・確認する」形で実施する。
- スクリーンショットは作成しない。理由は **UI/UX 変更がゼロ**であり、視覚的に比較・記録すべき差分が存在しないため（後述「スクリーンショットを作らない理由」参照）。

## 代替証跡の主ソース

| 証跡カテゴリ | 主ソース（採取対象） | PASS の合図 |
| --- | --- | --- |
| 自動テスト結果 | 全 651 spec の実行結果（shard: web / api-unit / api-d1 / packages / og） | 各 shard で fail 0 件・skip 非増加 |
| deprecation 警告ログ | vitest 実行時の stderr / stdout | `deps.inline` / `workspace` 等の未対応警告が 0 件 |
| バージョン整合ログ | `pnpm why vitest` / `pnpm why @vitest/coverage-v8` | 両者が 3.2.6 系で完全一致 |
| 型・lint ログ | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | exit 0 |

## source-level PASS と環境ブロッカーの分離（WEEKGRD-01）

証跡記録時は、テスト内容の合否（source-level PASS）と、実行環境起因の停止（環境ブロッカー）を **別カテゴリ** で記録する。両者を混同すると「アップグレードのコード品質」の判定が環境ノイズで汚染されるため。

| カテゴリ | 定義 | 記録例 |
| --- | --- | --- |
| source-level PASS | spec 自体がアップグレード後の vitest 3.2.6 で green になった結果 | shard 別 green 件数 / 修正した C1〜C8 該当 spec |
| 環境ブロッカー | esbuild arch mismatch / worktree isolation / index.lock 等、テスト内容と無関係な環境起因の停止 | 発生有無・復旧手順（`pnpm install --force` / `pnpm verify:vitest-runtime` / issue-747 runbook）・復旧後の再実行結果 |

> 環境ブロッカーが発生した場合は、CLAUDE.md の「Vitest / esbuild runtime トラブル時」および `issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` に従い復旧してから再実行し、source-level PASS を確定する。

## 証跡ファイル名の事前固定（FB-02）

後続実装者は以下のファイル名を固定で使用する（命名のブレを防ぐ）。

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | 代替証跡の集約（NON_VISUAL 宣言・実地操作不可明記・source PASS / 環境ブロッカー分離・各ログへの参照） |
| `outputs/phase-11/typecheck-local.txt` | `mise exec -- pnpm typecheck` の出力ログ |
| `outputs/phase-11/lint-local.txt` | `mise exec -- pnpm lint` の出力ログ |
| `outputs/phase-11/vitest-shard-results.txt` | shard 別 vitest 実行結果（件数・green/fail） |
| `outputs/phase-11/deprecation-grep.txt` | deprecation 警告 grep 結果（0 件の確認） |
| `outputs/phase-11/version-parity.txt` | `pnpm why vitest` / `pnpm why @vitest/coverage-v8` の出力 |

> **`screenshots/.gitkeep` は不要**: 本タスクは NON_VISUAL であり、`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない。この旨を `manual-test-result.md` に明記する。

## スクリーンショットを作らない理由（明文化必須）

`manual-test-result.md` に以下を逐語で記載する。

> 本タスクは vitest（テスト実行基盤）の依存バージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。視覚的に比較・記録すべき差分が存在しないため、スクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

## 完了条件

- [ ] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）が証跡集約ファイル冒頭に明記される方針が記載されている
- [ ] 実地操作不可が明記され、自動テスト結果 + deprecation 警告ログ + バージョン整合ログを代替証跡とする方針が記載されている
- [ ] 証跡の主ソース（自動テスト名/件数=651 spec、shard 別 green）が記載されている
- [ ] source-level PASS と環境ブロッカーを別カテゴリで記録する方針（WEEKGRD-01）が記載されている
- [ ] 証跡ファイル名が事前固定（FB-02）され、`screenshots/.gitkeep` 不要が明記されている
- [ ] スクリーンショットを作らない理由が逐語で記載されている
