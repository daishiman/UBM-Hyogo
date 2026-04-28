# task-lefthook-multi-worktree-reinstall-runbook - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-LEFTHOOK-MWR |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| ディレクトリ | docs/30-workflows/task-lefthook-multi-worktree-reinstall-runbook |
| Wave | post-lefthook（task-git-hooks-lefthook-and-post-merge の baseline 派生） |
| 実行種別 | serial（既存 worktree 群への副作用を伴うため一斉並列を禁止） |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only / runbook-spec（runbook 文書化と検証手順の固定。スクリプト実装は本タスクの仕様書記述に留め、コード生成は別 Wave で実施する） |
| visualEvidence | NON_VISUAL |
| 既存タスク組み込み | なし（task-git-hooks-lefthook-and-post-merge baseline B-1 を formalize） |
| 組み込み先 | doc/00-getting-started-manual/lefthook-operations.md |
| GitHub Issue | #138 (CLOSED — クローズ済みのままタスク仕様書を作成する方針) |

## 目的

`task-git-hooks-lefthook-and-post-merge` で post-merge 自動 indexes 再生成を廃止し、hook 管理を lefthook に統一した。一方で `git worktree list` 上に 30+ 件存在する既存 worktree それぞれには `pnpm install` の `prepare` script 経由でしか `lefthook install` が走らない。本タスクは、その「全 worktree 一巡 install」の運用責任を runbook として固定し、再現性のある一括再インストール手順・検証手順・運用記録の様式を整備する。

## 真の論点

- 「lefthook install を 30+ worktree で動かすこと」ではなく、「**hook 層が暗黙にスキップされる worktree をゼロにし、それを継続的に保証する運用を定義する**」ことが本質。
- 副次論点として、新規 worktree 作成手順（`scripts/new-worktree.sh`）・既存 worktree への遡及適用・CI で検出すべきドリフト（`.git/hooks/` の lefthook 由来でないファイル残存）の境界を分けて記述する必要がある。

## スコープ

### 含む

- 既存 worktree 群への lefthook 一括再インストール runbook 仕様（実行手順・前提・順序・並列禁止理由）
- `pnpm install --prefer-offline` を使う一括再 install スクリプトの仕様（実装は本タスク内ではコード化しない）
- 各 worktree で `lefthook version` が PASS することの検証手順
- `.git/hooks/post-merge` 等の旧 hook 残存を検出する点検手順
- `doc/00-getting-started-manual/lefthook-operations.md` への運用手順反映の差分仕様
- 運用記録（実行ログ）の保存場所と書式
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）

### 含まない

- lefthook 採用判断の ADR 化（baseline B-2 で別タスク）
- CI `verify-indexes-up-to-date` job の実装（C-1 で別タスク化済み）
- 実スクリプト（`scripts/reinstall-lefthook-all-worktrees.sh` 等）のコード実装（本タスクは仕様書のみ。実装は別 Wave）
- pnpm store の並列書き込み問題そのものの解決（既知制約として継承）
- husky / pre-commit / git-hooks 等の他 hook ツール導入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-git-hooks-lefthook-and-post-merge（completed） | lefthook 採用 / post-merge 廃止 / `lefthook.yml` 構成が確定済みであること |
| 上流 | doc/00-getting-started-manual/lefthook-operations.md | 既存運用ガイドを差分更新するための baseline |
| 並列 | scripts/new-worktree.sh | 新規 worktree 作成時の `pnpm install` 自動実行ポリシーと整合させる |
| 下流 | task-verify-indexes-up-to-date-ci（unassigned） | 一括再 install 後に古い indexes の PR を検出する CI gate と運用上ペアになる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md | 派生元（runbook 仕様の原典） |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md | baseline B-1 の派生根拠 |
| 必須 | doc/00-getting-started-manual/lefthook-operations.md | 既存運用ガイド（差分追記対象） |
| 必須 | lefthook.yml | hook 定義の正本 |
| 必須 | package.json | `prepare` script による `lefthook install` 配置経路 |
| 必須 | scripts/new-worktree.sh | 新規 worktree セットアップの正本 |
| 必須 | CLAUDE.md | 「Git hook の方針」セクションとの整合確認 |
| 参考 | https://github.com/evilmartians/lefthook | lefthook 公式（install 仕様の確認用） |

## 受入条件 (AC)

- AC-1: `git worktree list --porcelain` から prunable を除外した有効 worktree 群を抽出する手順が runbook に明記されている
- AC-2: 各 worktree で `mise exec -- pnpm install --prefer-offline` を逐次実行する手順が並列禁止理由（pnpm store 競合）と共に記述されている
- AC-3: 各 worktree で `mise exec -- pnpm exec lefthook version` が成功することを検証する手順がある
- AC-4: `.git/hooks/post-merge` 等の旧 hook が残存しないことを点検する手順がある
- AC-5: 実行ログを `outputs/phase-11/manual-smoke-log.md` に記録する書式が定義されている（worktree path / lefthook version / PASS/FAIL）
- AC-6: `doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容が specify されている
- AC-7: 新規 worktree 作成時の自動 install 経路（`scripts/new-worktree.sh`）と一括再 install runbook の責務境界が明記されている
- AC-8: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である
- AC-9: 苦戦箇所が「pnpm store の並列書き込み禁止」「detached HEAD worktree」「prunable worktree の除外」「Apple Silicon バイナリ rebuild」を含めて 4 件以上記載されている
- AC-10: Phase 12 で本仕様書の `documentation-changelog.md`、`unassigned-task-detection.md`、`skill-feedback-report.md` を全て出力する（0 件でも出力必須）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/runbook-design.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-05/runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化・整合性 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/implementation-guide.md |
| 13 | PR作成 | phase-13.md | approval_required | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価含む） |
| 設計 | outputs/phase-02/runbook-design.md | 一括再 install runbook の構成・順序・冪等性設計 |
| レビュー | outputs/phase-03/main.md | 代替案 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | dry-run / 単 worktree smoke / 全件 smoke の検証戦略 |
| 実装 | outputs/phase-05/runbook.md | 一括再 install スクリプト仕様（コード化前段の擬似実装） |
| 異常系 | outputs/phase-06/failure-cases.md | pnpm store 競合・detached HEAD・prunable・bin rebuild 失敗 |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 仕様セクション のトレーサビリティ |
| QA | outputs/phase-09/main.md | 文書品質ゲート（line budget / link / mirror parity） |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・blocker 一覧 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | runbook の dry-run 実行ログ書式（NON_VISUAL 代替 evidence） |
| 証跡 | outputs/phase-11/link-checklist.md | 内部リンクの dead link 検証 |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け） + Part 2（運用者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート（0件でも出力） |
| ガイド | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| 該当なし | docs/CLAUDE.md の主要不変条件（フォーム schema 固定回避 / D1 アクセス境界 等）に直接抵触しない | runbook 文書化のみのため、business invariant には影響しない |
| 派生 | CLAUDE.md「Git hook の方針: lefthook.yml が hook の正本」 | 本 runbook はこの方針を前提にし、`.git/hooks/*` 手書きを禁止する立場を継承する |
| 派生 | CLAUDE.md「indexes 再生成は post-merge から廃止」 | runbook 完了後の indexes 再生成は `pnpm indexes:rebuild` の明示実行で行う旨を継承する |

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | hook 層の暗黙スキップを撲滅でき、lefthook 採用の前提が全 worktree で揃う。手動運用コストの正本化により、誤って `--no-verify` 化される事故を防げる |
| 実現性 | PASS | 既存 `pnpm install` の `prepare` script を流用するだけで実現でき、新規ツール導入が不要 |
| 整合性 | PASS | `lefthook.yml` 正本主義 / post-merge 廃止 / new-worktree.sh と矛盾せず、CLAUDE.md の方針を強化する |
| 運用性 | PASS | `outputs/phase-11/manual-smoke-log.md` の書式を固定することで、再 install の証跡を後から監査可能 |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-10 が Phase 7 / 10 で完全トレースされる
- 4条件が全て PASS
- Phase 12 で `implementation-guide.md`、`system-spec-update-summary.md`、`documentation-changelog.md`、`unassigned-task-detection.md`、`skill-feedback-report.md` の 5 種が揃う
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見（事前棚卸し）

**1. pnpm store の並列書き込み禁止**
複数 worktree で `pnpm install` を並列実行すると pnpm の content-addressable store が壊れる。runbook では逐次（`while read` ループ）で回す方針を必ず採る。

**2. detached HEAD / prunable worktree の扱い**
`git worktree list` には `prunable` フラグが付いた古い worktree や detached HEAD の作業ツリーも含まれる。runbook では `--porcelain` の出力を parse し、prunable は対象外にする手順を明記する。

**3. Apple Silicon でのバイナリ不一致**
`pnpm rebuild lefthook` が必要なケースが `lefthook-operations.md` トラブルシュート表にある。runbook 内で `lefthook version` 失敗時の自動 retry / 手動 fallback の境界を明確化する。

**4. `.git/hooks/post-merge` 等の旧 hook 残存**
post-merge 廃止前の worktree には旧 hook が `.git/hooks/post-merge` として残ったままになっている可能性がある。`lefthook install` は同名 hook を上書きするが、worktree が古い場合は確認手順を runbook 末尾に置く。

**5. `lefthook install` のべき等性確認**
同 worktree への複数回実行が壊れないことは公式仕様だが、runbook では「再実行可」を明記して、運用者が安心して実行できるようにする。

## 関連リンク

- 上位 README: ../README.md
- 派生元: ../completed-tasks/task-git-hooks-lefthook-and-post-merge/index.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/138
- 運用ガイド更新対象: ../../../doc/00-getting-started-manual/lefthook-operations.md
