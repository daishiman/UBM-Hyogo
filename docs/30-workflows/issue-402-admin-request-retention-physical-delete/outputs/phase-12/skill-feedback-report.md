# Skill Feedback Report — Issue #402

## テンプレ改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| TF-1 | 物理削除のような不可逆操作を伴うタスクで、Phase 10 の rollback 経路に「段階別」テンプレが無い | **今回 workflow 内で反映**: Phase 10 に rollback 3 段（pre-purge / 7 日以内 PITR / 7 日超過は不可逆）の表構造を採用。task-specification-creator 本体への昇格は同種パターンが 2 件目に出た時点で判断 |
| TF-2 | NON_VISUAL evidence の `seed-fixture.sql` / `pre-apply-bookmark.txt` のような「実行前の証拠」項目がテンプレに無い | **今回 workflow 内で反映**: Phase 11 evidence 表に rollback 用 bookmark 行を追加。skill 本体変更は不要 |

## ワークフロー改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| WF-1 | 不可逆操作を伴うタスクは「Gate B = git publish 承認」に加えて「Gate C = production apply 承認」を分離したい | **今回 workflow 内で反映**: Phase 13 ステータスを `blocked_pending_user_approval` とし、`RETENTION_PURGE_MODE=apply` は Phase 13 PR merge 後の user-gated 運用ステップに分離 |
| WF-2 | retention 期間の正本値 (180 日) を CLAUDE.md / SSOT のどちらに置くかが曖昧 | **今回 workflow 内で反映**: SSOT (`data-retention-policy.md`) を正本とし、CLAUDE.md からは参照のみとする方針を Phase 12 system-spec-update-summary に明記 |

## ドキュメント改善

| ID | 内容 | 提案 |
| --- | --- | --- |
| DF-1 | Part 1（中学生レベル）の比喩が他タスクと均質化しない場合がある | **今回 workflow 内で反映**: 「お墓の取り壊しを 180 日後に静かに行う」比喩を採用。比喩の選択基準（「不可逆 + 待機期間 + 段階的復旧」のメタファー）を skill-feedback として残す |
| DF-2 | member 通知文言（メールテンプレ）の SSOT 場所が現状未整理 | **no-op**: 通知テンプレは `apps/api/src/templates/` 配下を運用 SSOT とし、本タスクで新規 SSOT を作る必要はないと判断 |

## routing summary

| 種別 | 件数 | 扱い |
| --- | --- | --- |
| 今回 workflow 内で反映 | 5 | TF-1 / TF-2 / WF-1 / WF-2 / DF-1 |
| no-op（過剰設計回避） | 1 | DF-2 |
| 新規 unassigned-task 化 | 0 | 今回サイクル内で必要な改善は完了済み |
