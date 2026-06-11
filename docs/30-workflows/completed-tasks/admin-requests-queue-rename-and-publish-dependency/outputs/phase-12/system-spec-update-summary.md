`[実装区分: 実装仕様書]`

# System Spec Update Summary — admin-requests-queue-rename-and-publish-dependency

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本タスクの code / spec / skill sync は同 wave で完了した。変わったのは「表示名注記」と「会員一覧 API レスポンス shape（フィールド追加）」であり、既存機能定義・route・endpoint・D1 schema は不変。

## Updated system specs

| File | Status | Update |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/11-admin-management.md` | completed | `/admin/requests` の表示名を「会員からの申請」として注記し、会員本人発の申請承認と管理者起点の即時トグルの違い、相互リンク、会員管理の「申請中」バッジを明記した。 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | completed | Admin Member List API に `pendingRequestTypes: ("visibility_request" | "delete_request")[]` を追加し、既存 `admin_member_notes` pending request を相関サブクエリで projection する契約を明記した。 |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | completed | Admin nav label 正本を `/admin/requests` = 「会員からの申請」へ同期した。 |

## Invariant check

| Invariant | Verdict |
| --- | --- |
| `/admin/requests` route path | unchanged |
| Admin request API paths | unchanged |
| `GET /admin/members` endpoint surface | unchanged, response projection extended only |
| D1 schema | unchanged |
| New endpoint | none |
| Web direct D1 access | none |

## Skill discovery sync

| File | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-requests-queue-rename-and-publish-dependency-artifact-inventory.md` | completed |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | completed |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | completed |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | completed |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | completed |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | completed |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | completed |

## Verification

System spec and skill sync are consistent with Phase 11 local evidence: API/shared/web tests, typecheck, lint, seed drift guard, and HEX token grep all PASS. Staging seed apply and authenticated runtime screenshots remain Phase 13 user-gated operations.
