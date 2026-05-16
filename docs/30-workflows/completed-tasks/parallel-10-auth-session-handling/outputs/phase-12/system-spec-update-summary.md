# System Spec Update Summary

## 更新済み

| パス | 内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/02-auth.md` | 「Client 401 / 403 ハンドリング」セクションを末尾に追加。401 → `useAdminMutation` + `toLoginRedirect`、403 → `"権限がありません"` toast、silent refresh は MVP 不採用 (24h TTL は 401 で吸収) を明記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | parallel-10 Auth Session Handling の早見表を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | auth/admin UI 関連 workflow inventory に parallel-10 を登録 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | `parallel-10-auth-session-handling` を `implemented_local_evidence_captured / implementation / NON_VISUAL` で登録 |

## Boundary

commit / push / PR はユーザー明示承認前の禁止操作のため未実行。外部 mirror (`/Users/dm/.agents/...`) はこの worktree の publish/mirror 運用に従う。
