# task-21 W2 par Screen Blueprints Admin Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | `task-21-w2-par-screen-blueprints-admin` |
| Workflow root | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/` |
| Spec source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-21-w2-par-screen-blueprints-admin.md` |
| Primary spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| Status | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| Sync date | 2026-05-07 |

## Canonical contract

- 09g は admin 8 routes（`/admin/dashboard`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit`）の screen blueprint を保持する正本仕様。
- API 表は `references/api-endpoints.md` の admin current surface（`/admin/dashboard`, `/admin/tags/queue/:queueId/resolve`, `/admin/schema/aliases`, identity `merge` / `dismiss` を含む）と一致させる。
- 色は `apps/web/src/styles/tokens.css` (task-09) の OKLch token 正本に従い HEX literal を持たない。
- AdminSidebar は task-15/16/17 が追加する既存 route（`/admin/dashboard/attendance` 系）と blueprint 対象 8 routes の境界を §1.2 / §99.3 で明記する。

## Workflow artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/index.md` | workflow overview |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/artifacts.json` | root artifact ledger（full mirror） |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/phase-01.md` 〜 `phase-13.md` | phase specifications |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/phase-11/` | NON_VISUAL readiness evidence (`main.md`, `manual-smoke-log.md`, `link-checklist.md`) |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/phase-12/` | strict 7-file Phase 12 close-out set |
| `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/artifacts.json` | mirror（root と `cmp_exit=0`） |
| `scripts/verify-09g-screen-blueprints-admin.sh` | 09g 構造 / mermaid / sidebar / line count を検証する grep gate |

## Phase 12 strict outputs

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present (open=0) |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present (PASS) |

## Verification

```text
09g verification
lines=775
sections=10
sidebar=1
mermaid=8
derived=4
PASS

cmp -s docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/artifacts.json docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/outputs/artifacts.json
cmp_exit=0
```

## Downstream ownership

| task | 関係 |
| --- | --- |
| task-15 | consumes 09g §2 (dashboard) / §3 (members) |
| task-16 | consumes 09g §4 (tags) / §5 (meetings) / §7 (requests) |
| task-17 | consumes 09g §6 (schema) / §8 (identity-conflicts) / §9 (audit) |
| task-22 | verifies 09a/09b/09c/09d anchors（cross-reference） |

## Same-wave sync targets

- `docs/00-getting-started-manual/specs/00-overview.md` に 09g link 登録
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` task-21 entry
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` canonical entry
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` Phase 12 completed / 13 blocked_pending_user_approval
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` task-21 同期記録
- `.claude/skills/aiworkflow-requirements/changelog/20260507-task21-admin-blueprint.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-21-09g-admin-blueprint-2026-05.md`

## Related Resources

- 旧 draft 1779 行 / stale API / HEX literal を撤回した経緯は lessons-learned-task-21 を参照
- prototype 正本順位は CLAUDE.md "UI prototype alignment / MVP recovery" 節に従う
