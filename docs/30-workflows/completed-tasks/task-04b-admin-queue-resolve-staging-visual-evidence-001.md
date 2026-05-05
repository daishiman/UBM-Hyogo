# task-04b-admin-queue-resolve-staging-visual-evidence-001

## Metadata

| Field | Value |
| --- | --- |
| Task ID | task-04b-admin-queue-resolve-staging-visual-evidence-001 |
| Source | 04b-followup-004 Phase 11 / Phase 12 review |
| Status | consumed / promoted_to_canonical_workflow |
| Priority | high |
| Type | visual evidence / staging smoke |

## Canonical Status

Canonical workflow: `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/index.md`

Current canonical state is `implementation-prepared`; do not treat as completed evidence. This legacy source record is retained for traceability only. Runtime screenshots, redaction check, cleanup verification, parent evidence link application, commit, push, and PR remain pending explicit user-approved execution.

## Goal

Capture real screenshots for `/admin/requests` using an authenticated admin session and seeded D1 data.

## Scope

- Pending visibility request list
- Pending delete request list
- Detail panel
- Approve confirmation modal
- Reject confirmation modal
- Empty state after all pending items are resolved
- 409 already-resolved toast, if staging can safely simulate it

## Acceptance Criteria

- Screenshots are stored under the workflow Phase 11 evidence directory or the follow-up workflow output directory.
- Evidence links are added back to `docs/30-workflows/04b-followup-004-admin-queue-resolve-workflow/outputs/phase-12/implementation-guide.md`.
- The run records admin account, staging URL, fixture summary, and screenshot timestamp without storing secrets.

## Risk And Mitigation

| Risk | Mitigation |
| --- | --- |
| Admin login cannot be automated locally | Use staging with a real admin account and record manual evidence |
| D1 fixture setup mutates real data | Use staging-only seed rows with reversible identifiers |
| Screenshots expose PII | Use synthetic member IDs and payloads only |

## 苦戦箇所 / Lessons Learned

- **L-04B-RQ-003 由来**: 親タスク 04b-followup-004 Phase 11 で「admin session と D1 fixture が必要な UI」の local screenshot を取得できず、Phase 11 を automated test + delegated staging gate として明記したまま VISUAL completed と書きそうになった。staging visual evidence は別 task として明示的に formalize する必要がある。
- **再発防止**: visual evidence が local で取得不能な場合は、Phase 11 で「delegated to follow-up」と書き、follow-up task をこの仕様書のように同 wave で起票する。Phase 12 で「visual evidence complete」と曖昧に記述しない。
- **依存条件の明示**: staging URL / admin account / D1 seed の 3 点が揃わないと再現できないため、本タスク着手前に staging fixture オーナー・admin 認証情報の保管先（1Password vault）・seed reversibility を確認する。
