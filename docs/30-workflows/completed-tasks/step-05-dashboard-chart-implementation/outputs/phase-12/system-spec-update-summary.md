# System Spec Update Summary

## 影響範囲

Admin dashboard UI/API contract specification. D1 schema, environment variables, and branch protection are unchanged.

## 更新箇所

- `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 更新内容

`/admin` dashboard の公開ステータス表示は、既存 `GET /admin/dashboard` endpoint が返す `byStatus` を使う。`byStatus` が populated の場合に SVG bar chart と chip list を表示し、未提供の場合に placeholder を維持する。
