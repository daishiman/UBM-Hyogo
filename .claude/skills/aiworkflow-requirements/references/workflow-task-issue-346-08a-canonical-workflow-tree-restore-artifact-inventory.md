# Artifact Inventory: issue-346 08a canonical workflow tree restore

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/` |
| Task type | docs-only / NON_VISUAL / canonical-tree-restore |
| State | spec_created |
| Phase status | Phase 1-12 completed / Phase 13 pending_user_approval |
| Adopted resolution | A. canonical tree 復元（08a current/partial canonical root を維持し、本タスクは A restore trace） |
| Issue | #346 (CLOSED at spec time — `Refs #346` only, never `Closes #346`) |
| Source unassigned-task | `docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md` |
| 08a canonical root (preserved) | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| Downstream gate | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |

## Acceptance Evidence

| AC | Evidence |
| --- | --- |
| 08a canonical root index existence | `outputs/phase-11/evidence/file-existence.log` |
| aiworkflow-requirements state diff | `outputs/phase-11/evidence/aiworkflow-state-diff.log` |
| 09c → 08a targeted link integrity | `outputs/phase-11/evidence/09c-targeted-link-check.log` |
| Unassigned-task source still grep-able | `outputs/phase-11/evidence/unassigned-grep.log` |
| `pnpm indexes:rebuild` drift 0 | `outputs/phase-11/evidence/verify-indexes.log` |
| Secret hygiene on docs-only diff | `outputs/phase-11/evidence/secret-hygiene.log` |

## Phase 12 Artifacts

| Artifact | Path |
| --- | --- |
| Close-out summary | `outputs/phase-12/main.md` |
| Implementation guide | `outputs/phase-12/implementation-guide.md` |
| System spec update summary | `outputs/phase-12/system-spec-update-summary.md` |
| Documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| Unassigned task detection | `outputs/phase-12/unassigned-task-detection.md` |
| Skill feedback report | `outputs/phase-12/skill-feedback-report.md` |
| Compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Elegant review (optional) | `outputs/phase-12/elegant-review-30-methods.md` |

## Skill / Spec Sync Targets

| Target | Update |
| --- | --- |
| `SKILL.md` CHANGELOG | `v2026.05.02-issue-346-08a-canonical-tree-restore` 行追加 |
| `indexes/resource-map.md` | current canonical set に Issue #346 row 追加 |
| `references/legacy-ordinal-family-register.md` | unassigned-task → restore root の trace 行追加 |
| `references/task-workflow-active.md` | `issue-346-...` 行追加（spec_created / docs-only / NON_VISUAL） |
| `indexes/quick-reference.md` | Issue #346 quick-reference エントリ追加 |
| `references/lessons-learned-issue-346-08a-canonical-workflow-tree-restore-2026-05.md` | 苦戦箇所 + skill feedback の知見化 |

## Deferred / Blocked

- Phase 13 commit / push / PR は user 明示承認まで blocked。
- `task-workflow-active.md` で `spec_created` 登録されている `09a-` / `09b-` の物理不在は本 wave の検出事項。08a スコープ外のため新規 unassigned-task 化は保留し、必要時に Issue #346 と同型の restore task を別途起票する。
