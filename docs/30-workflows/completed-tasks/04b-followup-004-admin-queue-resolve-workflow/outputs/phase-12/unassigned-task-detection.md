# Unassigned Task Detection

| # | 候補 | 判定 | follow-up |
|---|------|------|-----------|
| 1 | 依頼処理後の member 通知（メール / Magic Link） | formalized | `docs/30-workflows/unassigned-task/task-04b-admin-request-notification-001.md` |
| 2 | bulk resolve（複数依頼の一括処理） | unassigned | 件数が増えた段階で別タスク化検討 |
| 3 | `/admin/audit` との連携（admin request audit target taxonomy） | formalized | `docs/30-workflows/unassigned-task/task-04b-admin-request-audit-target-taxonomy-001.md` |
| 4 | request_status の filter / sort 拡張（resolved/rejected 表示） | unassigned | admin の「過去依頼閲覧」ニーズが出たら別タスク化 |
| 5 | delete_request 承認後の物理削除ジョブ（retention policy） | formalized | `docs/30-workflows/unassigned-task/task-04b-admin-request-retention-physical-delete-001.md` |
| 6 | resolutionNote の必須化判定 / 文字数制限の見直し | unassigned | 運用後フィードバック次第 |
| 7 | pending 件数の sidebar バッジ | unassigned | UX 改善タスクとして別 issue 化候補 |
| 8 | `/admin/requests` staging visual evidence | formalized | `docs/30-workflows/unassigned-task/task-04b-admin-queue-resolve-staging-visual-evidence-001.md` |

## 結論
本タスク完了境界外として 8 件の未タスク候補を記録し、影響が大きい 4 件は同一 wave で formalize 済み。残りは運用需要が出た時点で起票する。
