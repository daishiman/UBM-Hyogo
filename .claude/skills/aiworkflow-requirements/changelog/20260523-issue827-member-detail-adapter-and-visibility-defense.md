# 2026-05-23 issue827-member-detail-adapter-and-visibility-defense

Issue #827 residual public member detail gap was implemented locally and synchronized as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

Same-wave changes:

- Added web-side pure adapter `apps/web/src/lib/adapters/member-detail.ts`.
- Added focused adapter contract tests and updated `MemberDetailSections` component tests.
- Rewired `/members/[id]` page through `buildMemberDetailViewModel`.
- Tightened the adapter contract so `allSections` passed to `MemberLinks` / `MemberActivity` is also filtered to `visibility="public"`.
- Corrected workflow spec vocabulary to current `FieldKindZ` and `FieldVisibilityZ`.
- Added Phase 12 strict 7 outputs, root/output artifacts parity, quick-reference/resource-map/task-workflow-active entries, and artifact inventory.

User-gated: commit, push, PR, issue mutation, deployment verification.
