# Phase 11: Manual Test（手動テスト）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-10-final-review.md（全 AC PASS） |
| 区分 | `[実装区分: 実装仕様書]` / **NON_VISUAL** |
| 目的 | 依存アップグレードの完了を、自動テスト結果・deprecation 警告ログ・バージョン整合ログで実証する |

## NON_VISUAL 宣言（WEEKGRD-03）

後続実装者は Phase 11 の証跡集約ファイル冒頭に、以下 3 項目から成る **NON_VISUAL 宣言** を必ず明記する。

| 宣言項目 | 内容 |
| --- | --- |
| タスク種別 | 依存アップグレード（vitest 3.2.6 → 4.1.8 / `@vitest/coverage-v8` 同期 / `@vitejs/plugin-react` ^5.2.0） |
| 非視覚的理由 | テストランナーの version bump であり、UI / UX / 画面描画・ユーザー導線に変更が一切ない。ブラウザ上で観測可能な振る舞いの変化が存在しない |
| 代替証跡 | 全 693 spec の自動テスト結果（shard 別 green）+ deprecation 警告ログ（0 件 or 分類記録）+ バージョン整合ログ（vitest と coverage-v8 が同一 4.1.x で一致 / `pnpm why` ×4） |

## 実地操作不可の明記（Feedback BEFORE-QUIT-001）

- 本タスクは **実地のブラウザ操作（画面遷移・フォーム入力・クリック導線確認）が不可**である。理由は、変更対象がテスト実行基盤の依存バージョンであり、アプリケーションの実行時挙動・画面に変化を生まないため。
- したがって手動テストは「実地操作の代わりに自動テスト結果と各種ログを採取・確認する」形で実施する。
- スクリーンショットは作成しない。理由は **UI/UX 変更がゼロ**であり、視覚的に比較・記録すべき差分が存在しないため（後述「スクリーンショットを作らない理由」参照）。

## 代替証跡の主ソース

| 証跡カテゴリ | 主ソース（採取対象） | PASS の合図 |
| --- | --- | --- |
| 自動テスト結果 | 全 693 spec の実行結果（shard: web / api-unit / api-d1 / packages / og + 補助 suite: scripts / alerts / sentry-alerts / infra） | 各 shard で fail 0 件・skip 非増加・obsolete snapshot 0 件 |
| deprecation 警告ログ | vitest 実行時の stderr / stdout | v4.1 deprecation（`vitest/*` エントリポイント / spy `toBe*` 系 / `vi.mock` トップレベル外）の未対応警告が 0 件 or 対応不要の分類記録あり |
| バージョン整合ログ | `mise exec -- pnpm why vitest` / `@vitest/coverage-v8` / `vite` / `@vitejs/plugin-react`（×4） | vitest と coverage-v8 が同一 4.1.x で完全一致（exact pin）。vite ^6/^7/^8 範囲。plugin-react peer 警告なし |
| 型・lint ログ | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` | exit 0 |
| D1 直列化完走 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1` | port exhaustion（hang / EADDRINUSE）なく完走（`maxWorkers: 1`、`isolate: false` 不採用の v4 表現で） |

## source-level PASS と環境ブロッカーの分離（WEEKGRD-01）

証跡記録時は、テスト内容の合否（source-level PASS）と、実行環境起因の停止（環境ブロッカー）を **別カテゴリ** で記録する。両者を混同すると「アップグレードのコード品質」の判定が環境ノイズで汚染されるため。

| カテゴリ | 定義 | 記録例 |
| --- | --- | --- |
| source-level PASS | spec 自体がアップグレード後の vitest 4.1.x で green になった結果 | shard 別 green 件数 / 修正した C1-C8（v4 版）該当 spec |
| 環境ブロッカー | esbuild arch mismatch / worktree isolation / index.lock / CPU 飽和起因の timeout 等、テスト内容と無関係な環境起因の停止 | 発生有無・復旧手順（`pnpm install --force` / `pnpm verify:vitest-runtime` / issue-747 runbook）・復旧後の再実行結果 |

> 環境ブロッカーが発生した場合は、CLAUDE.md の「Vitest / esbuild runtime トラブル時」および `issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` に従い復旧してから再実行し、source-level PASS を確定する。親 workflow（v2→v3）では CPU 飽和起因の flake（birpc timeout / hookTimeout 超過）が観測されており、同種事象は低負荷時の再実行で切り分ける。

## 証跡ファイル名の事前固定（FB-02）

後続実装者は以下のファイル名を固定で使用する（命名のブレを防ぐ。前身 v2→v3 と同一の 6 点固定）。

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | 代替証跡の集約（NON_VISUAL 宣言・実地操作不可明記・source PASS / 環境ブロッカー分離・各ログへの参照）。**spec_created 時点で placeholder shell を配置済み**であり、実装サイクルで結果を記入する |
| `outputs/phase-11/typecheck-local.txt` | `mise exec -- pnpm typecheck` の出力ログ |
| `outputs/phase-11/lint-local.txt` | `mise exec -- pnpm lint` の出力ログ |
| `outputs/phase-11/vitest-shard-results.txt` | shard 別 vitest 実行結果（件数・green/fail・skip・obsolete snapshot 有無） |
| `outputs/phase-11/deprecation-grep.txt` | deprecation 警告 grep 結果（0 件 or 分類記録の確認） |
| `outputs/phase-11/version-parity.txt` | `pnpm why` ×4（vitest / @vitest/coverage-v8 / vite / @vitejs/plugin-react）の出力 |

> **`screenshots/.gitkeep` は不要**: 本タスクは NON_VISUAL であり、`outputs/phase-11/screenshots/` ディレクトリおよび `.gitkeep` は作成しない。この旨を `manual-test-result.md` に明記する。

## スクリーンショットを作らない理由（明文化必須）

`manual-test-result.md` に以下を逐語で記載する。

> 本タスクは vitest（テスト実行基盤）の依存バージョン更新であり、アプリケーションの UI / UX / 画面描画・ユーザー導線に一切の変更を加えない。視覚的に比較・記録すべき差分が存在しないため、スクリーンショットは作成しない。証跡は自動テスト結果・deprecation 警告ログ・バージョン整合ログをもって代替する。

## 完了条件

- [ ] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）が証跡集約ファイル冒頭に明記される方針が記載されている
- [ ] 実地操作不可が明記され、自動テスト結果 + deprecation 警告ログ + バージョン整合ログを代替証跡とする方針が記載されている
- [ ] 証跡の主ソース（自動テスト = 693 spec、shard 別 green、obsolete snapshot 0 件、D1 直列化完走）が記載されている
- [ ] source-level PASS と環境ブロッカーを別カテゴリで記録する方針（WEEKGRD-01）が記載されている
- [ ] 証跡ファイル名が事前固定（FB-02 / 前身と同一の 6 点）され、`screenshots/.gitkeep` 不要が明記されている
- [ ] スクリーンショットを作らない理由が逐語で記載されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `artifacts.json` mutation commands, NON_VISUAL evidence rules
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-11-manual-test.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
