# Phase 8 — Docs Updates

## 更新対象

| パス | patch 方針 | 状態 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | 「client 401/403 handling」セクション追記: 401→`useAdminMutation` の redirector で `toLoginRedirect` に遷移、403→`"権限がありません"` toast(alert)、silent refresh は MVP 不採用 (24h TTL は 401 catch で吸収) | 完了 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UBM-Hyogo Member Login / Profile Pages 早見に client 401/403 handling 導線追加 | 完了 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | auth/admin UI 関連 workflow inventory に本 workflow を登録 | 完了 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | `parallel-10-auth-session-handling` を `implemented_local_evidence_captured / NON_VISUAL` で登録 | 完了 |
| `outputs/phase-12/documentation-changelog.md` | 全変更ファイル列挙 | 完了 |

## 補足

本ワークツリー内の `.claude/skills/aiworkflow-requirements` を same-wave 同期対象として更新済み。外部 mirror (`/Users/dm/.agents/...`) への反映はこの worktree の publish/mirror 運用に従う。
