# Phase 13: 完了承認ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 種別 | 承認ゲート |
| 入力 | Phase 1-12 すべての成果物 |
| 出力 | ユーザー承認後の commit / push / PR 作成（本 spec の責務外） |

## 目的

Phase 1-12 の成果物がすべて揃った状態でユーザー承認を待ち、承認後にのみ commit / push / PR 作成を実施する。本 spec 自身（タスク仕様書作成）は Phase 12 完了で完結し、Phase 13 は**承認ゲートの宣言**として機能する。

## 承認前チェックリスト（AI 側）

| # | 項目 | 検証コマンド |
| --- | --- | --- |
| G-1 | AC-1〜AC-7 すべて PASS | Phase 8 ログ参照 |
| G-2 | Phase 11 evidence 6 件すべて実在 | `ls outputs/phase-11/evidence/` |
| G-3 | Phase 12 7 必須 outputs すべて実在 | `ls outputs/phase-12/` |
| G-4 | `apps/` dirty diff と Phase 4 変更が一致 | `git diff --stat apps/` |
| G-5 | integration-fixes/index.md / i02 + i02b spec の同期完了 | `git diff -- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/` |
| G-6 | `bash scripts/verify-pr-ready.sh` PASS | コマンド実行 |

## ユーザー承認待ち項目

以下は**ユーザーの明示承認後**にのみ実施する（本 spec のスコープ外）:

- `git add` / `git commit`
- `git push`
- `gh pr create --base dev`

## 承認後のフロー

承認後は CLAUDE.md §PR作成の完全自律フロー（`@.claude/commands/ai/diff-to-pr.md`）に従い、別タスクとして実行する。本タスク仕様書はその時点で `workflow_state: implementation_completed` に更新される。

## 完了条件（本 spec として）

- [x] 上記 G-1〜G-6 すべて PASS
- [x] Phase 13 は `pending` とし、workflow root は `implemented_local_evidence_captured` のまま commit / push / PR 承認待ちであることを明記

## 参照資料

- CLAUDE.md §PR作成の完全自律フロー
- `.claude/commands/ai/diff-to-pr.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase13.md`
- `scripts/verify-pr-ready.sh`

## 実行タスク

- Phase 13 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 13 の検証結果と関連ログ。
