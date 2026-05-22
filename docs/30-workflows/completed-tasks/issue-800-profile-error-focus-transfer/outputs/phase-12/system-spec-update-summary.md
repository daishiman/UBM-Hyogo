# Phase 12 — System Spec Update Summary

## aiworkflow-requirements への反映

本タスクは UI 層 a11y hardening の横展開であり、API / D1 / shared schema の structural 変更は伴わない。30種レビューで profile-only のままでは login/admin/hook の漏れが残ると判定したため、root/profile/login/admin error boundary と共通 hook を同一 wave で同期する。

| 対象 | 更新内容 | 必要性 |
|---|---|---|
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #800 active workflow entry を追加 | 必須 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #800 quick lookup を追加 | 必須 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Issue #800 quick lookup を追加 | 必須 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-800-profile-error-focus-transfer-artifact-inventory.md` | workflow artifact inventory を追加 | 必須 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `SKILL-changelog.md` | Issue #800 sync entry を追加 | 必須 |

## 関連 spec への back-link

- `docs/30-workflows/completed-tasks/issue-769-followup-001-use-auto-focus-on-mount-hook.md` → `consumed` + canonical workflow pointer へ更新
- `docs/30-workflows/completed-tasks/issue-769-followup-002-profile-error-focus-transfer.md` → `consumed` + canonical workflow pointer へ更新済み
- `docs/30-workflows/completed-tasks/issue-769-followup-003-admin-error-focus-transfer.md` → `consumed` + canonical workflow pointer へ更新
- `/login/error.tsx` 残差は既存 `integration-fixes-i05-login-loading-and-error-focus.md` / Issue #768 の error focus 部分を本 workflow で追加回収
- `docs/30-workflows/completed-tasks/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` の `/profile/error.tsx` 行 → 本ワークフローへ cross-link 済み

## indexes:rebuild 判定

手動 same-wave sync 後、generated index drift を避けるため `pnpm indexes:rebuild` を実行済み。`indexes/topic-map.md` / `indexes/keywords.json` を再生成した。

## 結論

API / D1 / shared schema の正本変更は不要。workflow / aiworkflow ledgers / source follow-up は同一 wave で同期済み。
