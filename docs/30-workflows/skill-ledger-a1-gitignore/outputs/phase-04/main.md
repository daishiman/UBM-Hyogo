# Phase 4 成果物: テスト一覧（TDD Red 仕様）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 種別 | 仕様（NOT EXECUTED — docs-only / spec_created） |
| 作成日 | 2026-04-28 |

> **NOT EXECUTED 表記の意味**: 本ワークフロー (`task-20260428-170023`) は `taskType=docs-only` であり、テスト本体の実走は行わない。本ファイルは「Phase 5 以降の実装担当者が別 PR で実走する際の入力仕様」として固定されたテスト一覧である。

## 適用範囲

- 対象 lane: lane 1（gitignore）/ lane 2（untrack）/ lane 3（hook guard）/ lane 4（smoke）
- 前提: A-2（task-skill-ledger-a2-fragment）が completed（Phase 3 NO-GO 条件で担保）

## テスト一覧（T1〜T5）

| ID | 種別 | 対象 lane | 検証コマンド | 期待値 | Red 状態（実装前） |
| --- | --- | --- | --- | --- | --- |
| T1 | 静的 | lane 1 | `git check-ignore -v <4 系列パス>` | 全行 hit（exit 0） | 未追記 → exit 1 |
| T2 | 静的 | lane 2 | `git ls-files .claude/skills \| rg "(indexes/.*\.json\|\.cache\.json\|LOGS\.rendered\.md)" \| wc -l` | `0` | tracked N 件残存 |
| T3 | 動的 | lane 3 | `pnpm indexes:rebuild && git status --porcelain` | 出力空 | tracked diff 発生 |
| T4 | 統合 | lane 4 | Phase 2 §「4 worktree smoke 検証コマンド系列」 | `git ls-files --unmerged \| wc -l` => `0` | conflict N 件 |
| T5 | 動的 | lane 3 | `pnpm indexes:rebuild` × 2 + `git write-tree` 比較 | `tree1 == tree2` | tree hash 不一致 |

> 各テストの詳細（失敗時切り分け / 補足）は `phase-04.md` 本体を参照。

## 実態棚卸し（NOT EXECUTED — Phase 5 Step 2 で記入）

```bash
# Phase 5 Step 2 で実走 → ここに件数とパス一覧を貼る
git ls-files .claude/skills \
  | rg "(indexes/.*\.json|\.cache\.json|LOGS\.rendered\.md)" \
  > /tmp/a1-untrack-targets.txt
wc -l /tmp/a1-untrack-targets.txt
```

| 項目 | 値（実装担当者が記入） |
| --- | --- |
| 棚卸し件数 | _NOT EXECUTED_ |
| 内訳（系列別） | _NOT EXECUTED_ |
| 実走日時 | _NOT EXECUTED_ |

## カバレッジ目標（仕様レベル）

| スコープ | 主担当 T |
| --- | --- |
| `.gitignore` 追記行 4 行 × 全 skill | T1 |
| tracked 派生物 0 件 | T2 |
| hook 「存在 → スキップ」「未存在 → 再生成」両分岐 | T3 / T5 |
| 4 worktree merge エンドツーエンド | T4 |

## 完了確認

- [x] T1〜T5 が表化されている（5 件）
- [x] A-2 完了前提が明記されている（参照: phase-04.md §依存タスク順序）
- [x] 検証コマンドが Phase 5 / 11 の入力として再利用可能な粒度
- [x] NOT EXECUTED が明記されている

## 申し送り

- Phase 5 Step 2 で「実態棚卸し」セクションを記入（実装担当者）
- Phase 11 で T4 のコマンド系列を `outputs/phase-11/manual-smoke-log.md` に NOT EXECUTED で保存し、実走証跡は実装 PR 側で追記
- Phase 7 カバレッジ計画の入力として T1〜T5 を渡す
