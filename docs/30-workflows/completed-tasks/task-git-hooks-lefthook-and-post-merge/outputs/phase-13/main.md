# Phase 13 — 完了確認

## Status

pending_user_approval

## 概要

本タスク `task-git-hooks-lefthook-and-post-merge`（implementation / NON_VISUAL）は Phase 1〜12 を全て完了した。Phase 13 は `user_approval_required=true` のため、ユーザーの承認をもって完了とする。

## ユーザー承認待ちステータス

- 全 Phase outputs の執筆が完了している（`outputs/phase-12/phase12-task-spec-compliance-check.md` 参照）
- artifacts.json と outputs ファイルは 1:1 で対応している
- acceptance_criteria 4 件は全て satisfied
- global skill sync は `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` と両 skill の `LOGS.md` に反映済み
- 実装コード作成は本タスク内で完了済み。CI `verify-indexes-up-to-date` job のみ正式未タスクとして分離済み

承認操作は以下のいずれか：

1. ユーザーが outputs を確認し「承認」と明示する
2. PR を起票する場合は `outputs/phase-13/pr-template.md` のテンプレを使用する

## 重要な運用ルール（AI エージェント遵守事項）

> **未承認で commit / push / PR を作らない。**
>
> 本タスクの Phase 13 はユーザー承認をブロッキングゲートとする。AI エージェント（Claude Code 含む）はユーザーから明示的な承認を受け取るまで以下を **絶対に実行しない**：
>
> - `git commit`（Phase 12 で書いた docs を含む全変更）
> - `git push`
> - `gh pr create`
>
> 承認後、ユーザーが具体的に「コミットして PR を作って」と指示した時点で初めて実行する。

## 後続アクション

| アクション | 主体 | タイミング |
| --- | --- | --- |
| outputs レビュー | ユーザー | 任意 |
| 承認 → コミット | ユーザー指示 → AI 実行 | 承認後 |
| PR 起票 | ユーザー指示 → AI 実行 | 承認後 |
| CI `verify-indexes-up-to-date` job の起票 | platform / devex オーナー | `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md` を入力に実施 |
| 既存 worktree への lefthook 再配布 | platform / devex オーナー | `doc/00-getting-started-manual/lefthook-operations.md` の runbook に従って実施 |

## 完了条件

- [x] Phase 1-12 outputs 全て執筆完了
- [x] artifacts.json との突合 OK
- [x] acceptance_criteria 4 件 satisfied
- [ ] **ユーザー承認**（本 Phase 13 のブロッカー）
