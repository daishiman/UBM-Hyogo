# System Spec Update Summary

## aiworkflow-requirements 同期

| ファイル | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-i02-admin-error-type-unify-artifact-inventory.md` | current facts / evidence boundary / user gate |
| `.claude/skills/aiworkflow-requirements/changelog/20260517-i02-admin-error-type-unify.md` | 変更履歴 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow lookup 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | admin mutation error handling 早見表追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 行追加 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドライン追加 |

## 実コード同期

| ファイル | 反映内容 |
| --- | --- |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 401 を `AuthRequiredError`、非 2xx を `FetchAuthedError` へ統一。401 は `toLoginRedirect(currentPath)` 経由で `/login?redirect=...` に接続 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | 401 redirect DI / 403 / 5xx / reset assertion を更新 |

## 仕様境界

API endpoint、D1 schema、`apps/web/src/lib/fetch/errors.ts` の class signature は変更しない。
Phase 13 の commit / push / PR はユーザー明示承認後のみ実行する。
