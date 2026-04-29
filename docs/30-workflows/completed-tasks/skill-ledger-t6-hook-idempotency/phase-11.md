# Phase 11: 手動 smoke test (4 worktree 検証)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | hook 冪等化と 4 worktree 並列 smoke 実走 (skill-ledger-t6-hook-idempotency) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test (4 worktree 検証) |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | template_created_not_executed |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

NON_VISUAL タスクの代替 evidence として、2 worktree 事前 smoke と 4 worktree full smoke の手順・記録テンプレを固定する。本ワークフローでは実走せず、`git ls-files --unmerged | wc -l = 0` の実値証跡は後続 implementation タスクで採取する。

## 実行タスク

1. 2 worktree 事前 smoke の実走手順を定義する。
2. PASS 時のみ 4 worktree full smoke に進む gate を定義する。
3. `wait $PID` ごとの return code と `unmerged=0` の記録欄を作成する。
4. リンク・成果物チェックリストを作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-02.md | smoke コマンド系列 |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | NON_VISUAL evidence |
| 必須 | .claude/skills/task-specification-creator/references/phase-11-test-report-template.md | ログ形式 |

## 実行手順

1. 2 worktree で `pnpm indexes:rebuild` を並列実行し、return code を個別集約する。
2. `unmerged=0` を確認できた場合のみ 4 worktree に拡張する。
3. 失敗時は Phase 6 / 9 へ戻し、部分 JSON リカバリを実施する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 証跡とリンクチェック結果 |

## 多角的チェック観点（AIが判断）

- 4 worktree だけを先に実行して原因分離不能にしていないか。
- 失敗 PID とリカバリ対象 JSON が追跡可能か。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 2 worktree smoke 手順 | completed | gate 雛形 |
| 2 | 4 worktree smoke 手順 | completed | full smoke 雛形 |
| 3 | manual-smoke-log テンプレ作成 | completed | evidence 雛形 |
| 4 | link-checklist 作成 | completed | Phase 12 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| smoke サマリー | outputs/phase-11/main.md | 実走結果まとめ |
| smoke ログ | outputs/phase-11/manual-smoke-log.md | コマンド・PID・return code・unmerged 件数 |
| リンク確認 | outputs/phase-11/link-checklist.md | 成果物リンク確認 |

## 完了条件

- [x] 2 worktree 事前 smoke 手順が定義されている
- [x] 4 worktree full smoke 手順が定義されている
- [x] `unmerged=0` の記録欄がある
- [x] link-checklist が作成済み

## タスク100%実行確認【必須】

- [x] 本ワークフロー範囲のテンプレ作成タスク（4 件）が completed
- [x] Phase 11 代替 evidence 成果物が配置済み

## 次Phase

- 次 Phase: 12 (ドキュメント更新)
