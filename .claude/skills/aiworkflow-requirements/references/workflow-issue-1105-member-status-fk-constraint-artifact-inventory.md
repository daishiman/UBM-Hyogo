# Artifact Inventory: issue-1105-member-status-fk-constraint

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / local_verification_pass` |
| issue | #1105 CLOSED（reopen / mutation なし） |
| parent | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` |
| source unassigned-task | `docs/30-workflows/completed-tasks/unassigned-task/admin-member-detail-status-404-fix-followup-002-member-status-fk-constraint.md` |
| implementation | `apps/api/migrations/0026_member_status_fk_constraint.sql`, `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`, existing D1 test fixtures fixture追従, `apps/api/src/repository/__tests__/_setup.ts` full regression安定化 |
| invariant | endpoint surface / apps web / public API response shape unchanged |
| evidence | focused D1 Vitest 1 file / 6 tests PASS; apps/api D1 full regression 109 files / 937 tests PASS; API typecheck PASS; `verify:d1-migrations` PASS; `apps/web` diff 0 |
| user gate | remote D1 apply, commit, push, PR |

## Phase Artifacts

| Artifact | Path |
| --- | --- |
| index | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/outputs/artifacts.json` |
| Phase 11 | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/outputs/phase-11/manual-test-result.md` |
| Phase 12 main | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/outputs/phase-12/main.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Notes

- `member_status` rebuild keeps the current schema, including `notification_opt_out` from `0020_notification_channel_and_opt_out.sql`.
- The migration copies rows with `PRAGMA foreign_keys = ON`, so a leftover orphan status row fails the migration instead of being preserved.
- `idx_member_status_public(public_consent, publish_state, is_deleted)` is recreated after table replacement.

## Lessons Learned

| ID | Lesson |
| --- | --- |
| L-I1105-001 | SQLite/D1 は `ALTER TABLE ADD CONSTRAINT` 非対応のため、FK 後付けは「新テーブルを FK 宣言付きで作成 → 全カラム明示 `INSERT ... SELECT` → 旧 DROP → RENAME → INDEX 再作成」のテーブル再構築が唯一の方法。`INSERT ... SELECT` は列順 drift を避けるため全カラムを明示する。 |
| L-I1105-002 | DROP TABLE で associated INDEX は自動消失する。`idx_member_status_public` を `CREATE INDEX IF NOT EXISTS` で再作成し冪等性を確保する。再構築後 schema の DEFAULT は `0002_admin_managed.sql` / `0020_notification_channel_and_opt_out.sql`（特に `notification_opt_out INTEGER NOT NULL DEFAULT 0`）と完全一致させ、非回帰を担保する。 |
| L-I1105-003 | `PRAGMA foreign_keys` は per-connection 設定。コピー段階は ON のままにして 0025 backfill 未完（orphan 残存）なら migration を fail-fast させ、DROP/RENAME の一時的不整合中だけ OFF にし、末尾で ON に戻す。3 段階の ON/OFF 切替が必要。 |
| L-I1105-004 | FK 制約導入は既存 test fixture に連鎖的に波及する。親 `member_identities` を seed していない fixture が `FOREIGN KEY constraint failed` で落ちるため、7 fixture（repository 2 + contract 5）に親行 seed を追加。`session-resolve.contract.spec.ts` は orphan status fixture を削除し期待値を FK 前提（`memberId: null` / `gateReason: "rules_declined"`）へ変更した。FK 導入時は `git grep -l "INSERT INTO member_status"` で fixture を事前スキャンする。 |
| L-I1105-005 | full D1 regression（109 files）で各 test が独立に全 migration を適用すると Miniflare 共有 D1 の fetch socket が枯渇する。`setupD1()` の migration 適用を worker 内 1 回に制限（`migrationsApplied` static flag）し、以後は truncate のみで test isolation を保つ。 |
