# E2E Quality Uplift Backlog

| ID | Source | Priority | Target | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| RB-01 | 3a / parent Stage 3 | low | Stage 4 | implemented-local-runtime-pending | Integrated locally into pr-build-test.yml lighthouse-ci job sharing the next-build-* artifact (Refs #626). PR dry-run / merge-time runtime evidence and Phase 13 close-out remain user-gated. |
| RB-02 | 3a / parent Stage 3 | mid | Stage 4 | open | Introduce a composite setup action only after repeated setup duplication is proven across 3a / 3b. |
| RB-03 | 3a / parent Stage 3 | mid | Stage 4 | open | Add a docs-only PR skip strategy for expensive quality gates without bypassing code-affecting changes. |
| RB-04 | 3a / parent Stage 3 | low | Stage 5+ | open | Re-evaluate LHCI Server hosting after filesystem artifacts prove insufficient. |
| EXT-X1 | 3a Lighthouse CI | mid | Stage 4 | open | Add authenticated `/profile` Lighthouse measurement with an auth fixture; current 3a gate covers unauthenticated redirect behavior only. |
| OBS-01 | 3a / 3c governance | mid | governance drift workflow | open | Reconcile `enforce_admins` drift through the branch-protection workflow; no mutation without explicit user approval. |
