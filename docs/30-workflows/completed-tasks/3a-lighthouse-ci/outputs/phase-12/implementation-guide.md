# Implementation Guide

3a prepares a PR-to-`dev` Lighthouse CI hard gate. The local implementation is present, but runtime CI evidence remains `runtime_pending` until the user approves push / draft PR creation.

Expected implementation files:

- `.github/workflows/lighthouse.yml`
- `lighthouserc.json`
- `apps/web/package.json`
- `pnpm-lock.yaml`

The workflow waits for `next start` with a deterministic `curl` loop and runs lockfile-resolved LHCI via `pnpm exec lhci`.

The `/profile` route degradation decision is named `Q-02` throughout this subtask. Its current local judgment is `outputs/phase-7/lhci-profile-q02-judgement.md`; PR runtime scores and report screenshots are expected later under `outputs/phase-11/` after user-gated CI execution.
