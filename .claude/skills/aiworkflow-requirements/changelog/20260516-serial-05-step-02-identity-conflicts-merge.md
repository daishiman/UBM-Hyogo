# 2026-05-16 serial-05-step-02 identity-conflicts merge UI

- Registered `docs/30-workflows/serial-05-step-02-identity-conflicts-merge/` as `implemented_local_visual_evidence_captured / implementation / VISUAL`.
- Synced the UI contract for `/admin/identity-conflicts` from stale `/resolve` wording to existing `IdentityConflictRow` with `/merge` and `/dismiss`.
- Recorded local visual evidence for inline confirmation open, success toast, 409 error, and 400 error.
- Added operator-facing error mapping for `ALREADY_MERGED`, `TARGET_MEMBER_MISMATCH`, and `ALREADY_DISMISSED` without changing the `useAdminMutation` signature.
- Commit, push, PR, and authenticated staging / production evidence remain user-gated.
