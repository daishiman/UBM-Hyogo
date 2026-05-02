# Unassigned Task Detection

## Summary

本タスク（UT-07B-FU-03 実装仕様書化）のスコープ外として、最低 3 件以上の関連タスクを残置する。HIGH 1 件 / MEDIUM 1 件 / LOW 2 件。

| Candidate | Status | Priority | Reason |
| --- | --- | --- | --- |
| Production migration apply 運用実行 | open / formalized | HIGH | `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` として formalize 済。本タスク完了後 + ユーザー明示承認後に F4 `apply-prod.sh` を `--env production` で実走し、`.evidence/d1/<ts>/` を取得する別タスク |
| Queue / cron split for large back-fill | open / existing | MEDIUM | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md` として既存 formalize。schema_diff_queue を背景処理に分割。staging evidence 取得済が前提 |
| Admin UI retry label の実装 | open / candidate | LOW | `schema_diff_queue.backfill_status` を admin 画面の retry label として表示するタスク（UT-07B-FU-02 候補）。UI 変更を伴うため別タスク |
| aiworkflow-requirements skill の D1 migration runbook 逆引き index 整備 | open / candidate | LOW | scripts/d1 + CI gate を skill から検索可能にするための reference / indexes 整備候補。本タスク Phase 12 Step 2 の追記候補と関連するが、index 全体構造の改修は別スコープ |

## 起票要否判定

- HIGH（FU-04）: **既 formalize 済、本タスク PR 内で再起票不要**
- MEDIUM（FU-01）: **既 formalize 済、再起票不要**
- LOW（FU-02 admin UI）: 候補。UT-07B-FU-03 の PR merge 後、staging で実 evidence が取得できた段階で formalize 検討
- LOW（skill index 整備）: 候補。本タスクの skill-feedback-report で skill 改善提案として記録済。formalize は skill 全体改修タスクとセットで検討

## 重複排除（上流 UT-07B との整合）

UT-07B（schema-alias-hardening-001）の Phase 12 unassigned-task-detection で列挙された候補と本タスクの候補は同一スコープ系列にある。本タスクは UT-07B が産み出した「production 適用工程」を実装仕様書として切り出した形であり、FU-04（実走）/ FU-01（queue split）/ FU-02（admin UI）は UT-07B 由来の派生候補と一致する。

## Boundary

未タスク候補の自動起票は本タスク内では行わない（solo dev ポリシーにより新規 Issue 起票はユーザー判断）。
