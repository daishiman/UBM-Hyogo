# Documentation Changelog

## Workflow-local 同期（本ワークフロー内）

| Date | Step | Change |
| --- | --- | --- |
| 2026-05-30 | 1-A | 完了タスク記録: issue-998 production rollout workflow を `implemented_local_runtime_pending` として確定。親 workflow `members-not-displaying-form-sync-investigation` を参照元として記録。 |
| 2026-05-30 | 1-B | 実装状況テーブル記録: Task A は local flag applied + regression PASS、Task B/C は runtime user-gated pending として記録。コード変更は `apps/api/wrangler.toml` production flag 1 点のみ。 |
| 2026-05-30 | 1-C | 関連タスク記録: 親 workflow / follow-up-001 / 関連 CLOSED issue #956-#959 / 本 issue #998（CLOSED / Refs only）を記録。 |
| 2026-05-30 | Step 2 | 新規インターフェース追加: **該当なし（N/A）**。flag 値変更のみ。新規 endpoint / 関数 / 型 / schema / migration 追加なし。 |
| 2026-05-30 | docs | Phase 11 evidence inventory（VISUAL_ON_EXECUTION・runtime pending）、Phase 12 strict 7、Phase 13 commit/PR draft（user-gated）を作成。 |
| 2026-05-30 | docs | 公開フィルタの参照パスを verified path `apps/api/src/repository/publicMembers.ts` へ正規化（index/architecture の shorthand `routes/public/publicMembers.ts` を実体に整合）。 |

## Global skill sync（aiworkflow-requirements ledger）

| Date | Target | Change |
| --- | --- | --- |
| 2026-05-30 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 該当なし（本サイクルは spec docs 確定。ledger 登録は同 wave で実施予定）。skill 定義変更は不要。 |
| 2026-05-30 | `.claude/skills/aiworkflow-requirements/indexes/*` | 該当なし（新規 keyword / resource なし。flag-only コード変更のため index drift なし）。 |
| 2026-05-30 | skill definition（task-specification-creator / aiworkflow-requirements） | 該当なし。closed-issue + parent-implemented runtime-ops runbook パターン（L-RUNBOOK）に準拠し既存ルールで covered。 |

## 備考

- 本サイクルでは新規 system spec ファイル（`docs/00-getting-started-manual/specs/*`）の更新は **該当なし**。公開フィルタ・auto-publish policy・diagnostics の契約は親ワークフローで既に記録済みで不変。
- runtime ops 実行後（Gate-C）に取得する evidence は Phase 11 inventory に登録済み。実行は user-gated。
