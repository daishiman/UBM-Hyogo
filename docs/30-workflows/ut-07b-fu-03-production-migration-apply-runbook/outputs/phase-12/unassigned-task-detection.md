# Unassigned Task Detection

## Summary

3 candidates remain outside this runbook formalization task. The HIGH operational execution candidate is formalized in this wave; the MEDIUM / LOW candidates are existing formalized tasks or duplicate of existing follow-ups.

| Candidate | Status | Priority | Reason |
| --- | --- | --- | --- |
| Production migration apply execution | open / formalized | HIGH | Formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md`. The actual `0008_schema_alias_hardening.sql` production apply requires post-merge user approval and fresh runtime evidence. |
| Queue / cron split for large back-fill | open / existing | MEDIUM | Already formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md`; gated by staging evidence. |
| Admin UI retry label | open / existing | LOW | Already formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-02-admin-schema-alias-retry-label.md`; separate from production migration runbook creation. |

## Decision

Do not fold these into UT-07B-FU-03. Keeping them separate preserves the runbook task boundary and avoids claiming production execution as documentation completion. The HIGH execution task is now a formal unassigned task rather than an informal future candidate.

## Issue 起票方針（HIGH 候補のみ）

候補 1（`Production migration apply execution`, HIGH）は本 runbook 確定後の運用実行タスクとして必須。タスク仕様は同 wave で `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` に formalize 済み。Phase 13 PR が merge された時点で、ユーザーから production apply 承認を取得した直後に **新規 GitHub Issue を起票** する（Issue #363 を再オープンしない方針 = `outputs/phase-12/main.md` 「判定結果」参照）。

| 項目 | 値 |
| --- | --- |
| 起票タイミング | Phase 13 PR merge 後、ユーザー apply 承認文言を取得した直後 |
| Issue タイトル案 | `IMPL: UT-07B production migration apply 実行（0008_schema_alias_hardening.sql）` |
| Issue 本文必須項目 | 対象 commit SHA / 対象 DB 名（`ubm-hyogo-db-prod`）/ runbook パス（`docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md`）/ 承認者 / 承認日時 / `Refs #363` |
| 起票しないと起きる問題 | 運用実行が「誰が・いつ・どの runbook を根拠に」実施したか追跡不能になり、evidence の起点 Issue が欠落する |

候補 2 / 3（MEDIUM / LOW）は既存 formalized task へ委譲済み。本 runbook 確定時点では重複起票しない。
