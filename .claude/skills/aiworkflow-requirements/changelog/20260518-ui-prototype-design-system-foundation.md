# UI Prototype Design System Foundation Sync (2026-05-18 / parallel-02 close-out 2026-05-19)

## Summary

Synced `docs/30-workflows/ui-prototype-design-system-foundation/` as
`implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING`.
2026-05-19 update: closed out the `parallel-02-prototype-css-rules-port`
sub-workflow with full Phase 11 evidence and 7 follow-up proto-specs.
`spec_created / implementation / VISUAL / spec_readiness_pass`, with
`parallel-01-globals-css-rhythm` advanced to `runtime_pending` after local CSS
selector implementation and admin shell width alignment.

## Changes (2026-05-18)

- Added workflow-local `PROTOTYPE-COVERAGE.md` SSOT.
- Added root / outputs `artifacts.json` parity and root + parallel-02 Phase 12 strict 7 outputs.
- Fixed `/profile` to remain at `apps/web/app/profile/**`.
- Corrected stale `apps/web/src/app` references in 09a / 09h.
- Added minimal `apps/web` hooks for AppShell data attributes and normalized parallel-02 G3 marker CSS for member-card hover, tag-pill, and `data-visibility`.
- Added minimal `apps/web` hooks for AppShell data attributes, member-card hover, tag-pill, `data-visibility`, parallel-01 P1-1〜P1-5 `globals.css` selectors, and admin shell width `272px`.
- Synced parallel-01 Phase 11 artifacts to all required evidence files and marked serial-07 screenshots as delegated pending rather than completed.
- Synced quick-reference, resource-map, task-workflow-active, artifact inventory, SKILL.md, SKILL-changelog, and LOGS.

## Changes (2026-05-19, parallel-02 close-out)

- Implementation: `apps/web/src/styles/globals.css` G3-1 / G3-2 / G3-3 start/end marker blocks, `apps/web/src/components/public/MemberFilters.client.tsx` (`data-component="tag-pill"` + `aria-selected`), `apps/web/app/visual-harness/[name]/{page.tsx,VisualScenarios.client.tsx}`, `apps/web/playwright/tests/visual/parallel-02-css-rules.spec.ts`.
- Evidence: Phase 11 9 screenshots + 5 logs (Status=present), canonical 9 headings PASS, strict 7 outputs (root + sub) all present.
- Follow-up unassigned: 7 proto-specs added under `docs/30-workflows/unassigned-task/UT-DSF-01..07-*.md` (parallel-01 globals-css rhythm / parallel-03 AppShell / parallel-04 page chrome / serial-05 route blueprint binding / serial-06 form response binding / serial-07 regression evidence / runtime production-equivalent screenshots).
- Lessons learned: new `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-02-prototype-css-rules-port-2026-05.md` (L-P02-001..007 + OP-P02-1..7).
- Indexes: quick-reference adds `VISUAL_RUNTIME_PENDING` status-vocabulary table and shared `globals.css` parallel-edit marker convention; resource-map refreshes the entry to 2026-05-19 with lessons-learned + changelog cross-links; topic-map adds the new lessons-learned section index and an explicit topic "parallel CSS rules port / shared globals.css 並列編集規約".
- references: artifact inventory adds parallel-02 close-out table, follow-up unassigned table, and difficulties summary (7 items); task-workflow-active reflects parallel-02 implementation files, follow-up list, and lessons-learned cross-link.
- LOGS / SKILL-changelog: added 2026-05-19 entries summarising the close-out.

## Key knowledge captured

1. Shared `globals.css` parallel-edit marker convention: `/* === parallel-XX <subid> <intent> (start/end) === */`, first-merged wins, `merge=union` forbidden.
2. Status vocabulary: `VISUAL_RUNTIME_PENDING` formally registered for "local screenshot present but production-equivalent runtime visual remains user-gated".
3. Phase 11 evidence two-tier ledger: `Status=present` is validator-checked; `Status=pending` is inventory-only.
4. `apps/web/src/styles/globals.css` is explicitly excluded from `.gitattributes` `merge=union` and from `pnpm sync:resolve` targets (CSS cascade semantics).
5. Proto-spec promotion path: single-file `unassigned-task/UT-DSF-NN-*.md` → on pickup, expanded to Phase 1-13 spec via task-specification-creator, then `consumed_to:` close-out.
6. Design-token fallback rule: `var(--ubm-dur-fast, .15s)` / `var(--ubm-ease-standard, ease)` etc. always carry inline fallback to decouple from parallel-01 merge order.
7. Canonical 9 headings: heading identity is SSOT across root and sub-workflows; body density may differ (sub-workflows may shorten 1.x explanatory sections via parent reference).

## Boundary

Runtime production-equivalent screenshots, full 19-route blueprint binding,
commit, push, and PR remain user-gated.
Runtime screenshots, full 19-route blueprint binding, commit, push, and PR remain user-gated.

## Phase-12 Retrospective Sync (2026-05-18)

`parallel-01-globals-css-rhythm` の local 実装完了（CSS selector P1-1〜P1-5 +
admin shell width 272px）に伴い、aiworkflow-requirements skill を同一 wave で
追補した。

### 追加した lessons-learned

[[lessons-learned-ui-prototype-design-system-foundation-globals-css-rhythm-2026-05]]
を新規作成し、苦戦箇所と再発防止策を 5 項目で記録:

- **L-UIPROTO-001**: tokens.css / globals.css の `@import` 構成は維持（Tailwind v4 `@theme inline` build order 仮説の実機検証）
- **L-UIPROTO-002**: OKLch 正本（09b）と globals.css 内 `var(--ubm-*)` 参照統一（`verify-design-tokens` CI gate との連携）
- **L-UIPROTO-003**: AppShell admin grid 240px → 272px（09h を SSOT、prototype `styles.css` は参照値）
- **L-UIPROTO-004**: `tokens.css`（色責務）と `globals.css`（rhythm / typography / data-attr selector 責務）の SRP 明文化
- **L-UIPROTO-005**: `09a-prototype-map.md` 物理配置（`apps/web/app/**`）と `data-theme` 採用方針補正、09 spec > prototype の正本順位

### keywords.json 追加 (12 件)

`typographic-rhythm`, `data-section-rhythm`, `data-text`, `data-card-tone`,
`data-shell`, `globals-css-rhythm`, `admin-shell-272px`, `typographic-scale`,
`eyebrow-text`, `prototype-driven-css`, `oklch-token-responsibility-split`,
`appshell-admin-public-shared` を
[[workflow-ui-prototype-design-system-foundation-artifact-inventory]] および
本 lessons-learned に紐付け。

### artifact inventory 追記

[[workflow-ui-prototype-design-system-foundation-artifact-inventory]] の
Implementation Boundary に tokens.css / globals.css SRP と admin shell 272px の
SSOT 順位を明記し、「P1-1〜P1-5 Selector ↔ Token ↔ 09 Spec Mapping」表 +
review-cycle 共有 selector hooks 表を追加。

### task-workflow-active.md ステータス更新

parallel-01 行を `runtime_pending` → `local_implementation_complete (CSS
selector + admin width 272px)` に昇格し、parallel-02..N / serial-07 visual
evidence は TBD として明示。lessons-learned cross-link を追加。

### SKILL-changelog.md

同期完了 entry を SKILL-changelog.md 先頭に 1 行追加。
