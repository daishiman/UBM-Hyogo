# Cross-reference plan (decision: confirmed)

Phase 11 で出所が `confirmed (workflow=backend-ci/deploy-production/Apply D1 migrations)` に確定したため、親 workflow `task-issue-191-production-d1-schema-aliases-apply-001` の Phase 13 evidence へ cross-reference を追記する。**親 workflow の既存記述は改変せず、追記のみで cross-reference を確立する**（本タスクの invariants 準拠）。

## 追記対象 1: `outputs/phase-13/main.md`

末尾に下記セクションを追記する（既存記述には触れない）。

```markdown
## Cross-reference: out-of-band apply audit (Issue #434 / task-issue-359-production-d1-out-of-band-apply-audit-001)

`schema_aliases already exists` 判定を生んだ先行 apply の出所は別タスク `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001` にて read-only に追跡され、`confirmed` に分類された。

| migration | applied_at (UTC) | source workflow run | merge commit |
| --- | --- | --- | --- |
| `0008_schema_alias_hardening.sql` | `2026-05-01 08:21:04` | `.github/workflows/backend-ci.yml` `deploy-production` / run id `25207878876` (push main from PR #364 merge) | `9841e06a` |
| `0008_create_schema_aliases.sql` | `2026-05-01 10:59:35` | `.github/workflows/backend-ci.yml` `deploy-production` / run id `25211958572` (push main from PR #365 merge) | `2ced613d` |

Audit decision evidence: `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-11/attribution-decision.md`。
```

## 追記対象 2: `outputs/verification-report.md`

末尾に下記 1 セクションを追記する（既存検証記述には触れない）。

```markdown
## Cross-reference: source attribution

The `0008_create_schema_aliases.sql` (and the preceding `0008_schema_alias_hardening.sql`) entries observed in the production `d1_migrations` ledger were attributed to the `backend-ci` workflow's `deploy-production` job by the read-only audit `task-issue-359-production-d1-out-of-band-apply-audit-001` (Issue #434). See `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-11/attribution-decision.md` for the single-line decision and `outputs/phase-11/single-record.md` for the consolidated record. No additional production apply was performed by either workflow.
```

## 反映実施

本 wave では上記 2 ファイルへの追記を即時反映する（`Edit` で append）。invariants「親 workflow Phase 13 evidence は本タスクから追記のみ可能」の境界に整合。

## artifact inventory への反映

`.claude/skills/aiworkflow-requirements/references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md` に「audit cross-reference: task-issue-359-production-d1-out-of-band-apply-audit-001 (Phase 11 confirmed)」の 1 行を追記対象とする。
