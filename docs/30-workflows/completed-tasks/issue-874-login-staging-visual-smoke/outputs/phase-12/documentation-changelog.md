**[実装区分: ドキュメント更新履歴]**

# Documentation Changelog

| 日付 | ファイル | 変更 |
| --- | --- | --- |
| 2026-05-24 | `apps/web/playwright/tests/login-smoke.spec.ts` | `PLAYWRIGHT_EVIDENCE_DIR` による screenshot 保存先 override を追加し、未指定時は completed parent workflow の local baseline path を維持 |
| 2026-05-24 | `scripts/run-login-staging-smoke.sh` | staging URL を受け取り `/login` visual smoke を staging project で実行する helper を追加 |
| 2026-05-24 | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-12/*` | strict 7 を正規ファイル名で配置し、runtime evidence pending 境界を明示 |
| 2026-05-24 | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | Issue #874 workflow を検索導線へ追加 |
| 2026-05-24 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #874 workflow を active runtime-pending workflow として登録 |
| 2026-05-24 | `.claude/skills/aiworkflow-requirements/references/workflow-issue-874-login-staging-visual-smoke-artifact-inventory.md` | artifact inventory を追加 |

## Validation Record

local validation の最終実測値は本サイクルの検証ログを参照。staging deploy と staging smoke evidence は user-gated のため、Phase 11 実行後に本 changelog へ追記する。
