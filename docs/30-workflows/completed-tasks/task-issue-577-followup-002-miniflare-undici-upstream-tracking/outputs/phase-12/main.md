# Phase 12 outputs / main

## 目的

Phase 11 結果をドキュメント反映し、unassigned placeholder を `docs/30-workflows/completed-tasks/` 配下へ移動して consumed trace 化、aiworkflow-requirements 同期、changelog 更新。

## 必須 7 ファイル

- main.md（本ファイル）
- implementation-guide.md
- phase12-task-spec-compliance-check.md
- system-spec-update-summary.md
- skill-feedback-report.md
- unassigned-task-detection.md
- documentation-changelog.md

## 更新対象

1. **unassigned placeholder の completed-tasks 移動 + consumed trace 化** — 元 `docs/30-workflows/unassigned-task/task-issue-577-followup-002-miniflare-undici-upstream-tracking.md` を本 workflow へ統合し、`docs/30-workflows/completed-tasks/task-issue-577-followup-002-miniflare-undici-upstream-tracking/` 配下に配置。consumed trace ヘッダー（CONSUMED / consumed_at / consumed_by / source_issue=#616）を付与
2. **aiworkflow-requirements** — current task inventory に本 workflow 追加 + `pnpm indexes:rebuild`
3. **changelog** — `outputs/phase-12/documentation-changelog.md`
4. **system spec**（A/B 採用時のみ） — `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の軸B 記述更新

## 不変条件再確認

- AC-6: `git diff --stat apps/api/src apps/api/migrations` = 0
- #5 D1 不変
- CONST_007 先送り禁止 — 検知時は今回サイクルで A/B 完了済み

## 完了条件

- [x] 7 ファイル全存在
- [x] completed-tasks/ 配下へ移動 + consumed trace ヘッダー付与済み
- [x] indexes 登録済み
- [x] changelog 反映済み
- [x] （A/B 採用時のみ）system spec 更新ルール定義済み

## 次フェーズ

Phase 13 PR 作成（user 承認後）。
