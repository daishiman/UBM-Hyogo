# E2E Quality Uplift Backlog

| ID | Source | Priority | Target | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| RB-01 | 3a / parent Stage 3 | low | Stage 4 | open | Share build output between Lighthouse and PR build jobs once both gates exist. |
| RB-02 | 3a / parent Stage 3 | mid | Stage 4 | open | Introduce a composite setup action only after repeated setup duplication is proven across 3a / 3b. |
| RB-03 | 3a / parent Stage 3 | mid | Stage 4 | open | Add a docs-only PR skip strategy for expensive quality gates without bypassing code-affecting changes. |
| RB-04 | 3a / parent Stage 3 | low | Stage 5+ | open | Re-evaluate LHCI Server hosting after filesystem artifacts prove insufficient. |
| EXT-X1 | 3a Lighthouse CI | mid | Stage 4 | closed-by-issue #630 / implemented-local-runtime-pending successor | Authenticated `/profile` Lighthouse measurement implemented under `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/`; Issue #630 is already CLOSED, so PR uses `Refs #630` and CI runtime evidence remains user-gated. |
| OBS-01 | 3a / 3c governance | mid | governance drift workflow | open | Reconcile `enforce_admins` drift through the branch-protection workflow; no mutation without explicit user approval. |
