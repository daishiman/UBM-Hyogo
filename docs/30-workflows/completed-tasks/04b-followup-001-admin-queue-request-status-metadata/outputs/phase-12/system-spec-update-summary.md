# System Spec 更新サマリ

## 更新ファイル

- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/30-workflows/unassigned-task/04b-followup-004-admin-queue-resolve-workflow.md`

## 追加内容

「## 申請 queue の状態遷移（admin_member_notes）」節を追加。
- 列定義表（`request_status` / `resolved_at` / `resolved_by_admin_id`）
- Mermaid 状態遷移図（pending → resolved / rejected、再申請許容）
- `hasPendingRequest` の挙動説明
- pending guard による単方向遷移の保証
- 不変条件 #4 / #11 への接触面の明記

## 既存 spec の整合性

- `08-free-database.md` に `admin_member_notes` の `request_status` / `resolved_at` /
  `resolved_by_admin_id` と partial index `idx_admin_notes_pending_requests` を反映済み。
- aiworkflow reference の旧 pending 判定（最新行存在）を `request_status='pending'` 判定へ更新済み。
- 04b-followup-004 の stale dependency（`04b-followup-005`）を canonical
  `04b-followup-001-admin-queue-request-status-metadata.md` へ差し替え済み。
