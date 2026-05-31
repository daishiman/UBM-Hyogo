# Phase 12 Main

## Status

`admin-sidebar-public-return-link` was reclassified from `spec_created` to `implemented_local_evidence_captured` in this cycle because the implementation targets were explicit and the local code/test changes are complete.

## Completed Scope

- `AdminSidebar.tsx`: removed the old grouped `/` item labeled `ホーム`.
- `AdminSidebar.tsx`: added one footer-adjacent `<a href="/" data-role="public-return" aria-label="公開サイトに戻る">`.
- `AdminSidebar.spec.tsx`: added DOM/a11y/footer-order regression coverage.
- `AdminSidebar.component.spec.tsx`: removed the skipped legacy test and kept an active supersession pointer.
- `admin-sidebar-public-return-link.spec.ts`: added local Playwright visual fixture and captured overview / hover / focus screenshots.
- `aiworkflow-requirements`: synchronized active workflow, indexes, artifact inventory, changelog, and logs.

## User-Gated Scope

Staging authenticated observation, commit, push, and PR are intentionally not executed in this cycle.
