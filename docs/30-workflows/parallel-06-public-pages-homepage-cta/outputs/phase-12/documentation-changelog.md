# Documentation Changelog

| Date | File | Change | Verification |
| --- | --- | --- | --- |
| 2026-05-15 | `docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/artifacts.json` | Added output artifact mirror for root/output parity. | `cmp -s artifacts.json outputs/artifacts.json` |
| 2026-05-15 | `docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-12/*` | Added Phase 12 strict 7 outputs. | `find outputs/phase-12 -maxdepth 1 -type f` |
| 2026-05-15 | `apps/web/src/components/public/CallToActionCTA.tsx` | Implemented FOR MEMBERS CTA with blueprint copy, dark token variant, and external Google Form CTA. | component spec + screenshots |
| 2026-05-15 | `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` / snapshot | Added snapshot and axe a11y assertions for AC-6. | `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx apps/web/app/__tests__/page.spec.tsx` |
| 2026-05-15 | `apps/web/app/page.tsx` / `apps/web/app/__tests__/page.spec.tsx` | Integrated CTA at HomePage tail and asserted ordering after featured members / as final section when empty. | focused spec + `pnpm test` |
| 2026-05-15 | `apps/web/src/lib/constants.ts`, `register/page.tsx`, `LoginStatus.tsx` | Centralized actual responder URL through `FORM_RESPONDER_URL`. | `outputs/phase-11/evidence/grep-gate.log` |
| 2026-05-15 | `vitest.config.ts` | Added `.spec.ts` exclusion for existing issue-399 seed syntax test to match the already-excluded `.test.ts` path after suffix convergence. | `pnpm test` |
| 2026-05-15 | `outputs/phase-11/**` | Captured screenshots, local command logs, token gate, grep gate, visual-inspection summary, and schema-valid canonical paths. | `find outputs/phase-11 -type f` / `pnpm validate:phase11-paths ...` |
| 2026-05-15 | `artifacts.json`, `outputs/artifacts.json`, `index.md`, Phase 12 outputs | Reclassified from `spec_created` to `implemented_local_evidence_captured / implementation_complete_pending_pr`. | `cmp -s artifacts.json outputs/artifacts.json` |
| 2026-05-15 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added active workflow quick reference. | `rg -n 'parallel-06-public-pages-homepage-cta'` |
| 2026-05-15 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added canonical resource-map row. | `rg -n 'parallel-06-public-pages-homepage-cta'` |
| 2026-05-15 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow row. | `rg -n 'parallel-06-public-pages-homepage-cta'` |
| 2026-05-15 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` and `docs/30-workflows/LOGS.md` | Added same-wave sync log entries. | `rg -n 'parallel-06-public-pages-homepage-cta'` |

## Entry Checklist

`phase-12-documentation-guide.md` 要件: Phase 12 着手時に `git status --porcelain apps/ packages/` の生出力を本セクションへ転記する。

```bash
$ git status --porcelain apps/ packages/
 M apps/web/app/(public)/register/page.tsx
 M apps/web/app/login/_components/LoginStatus.tsx
 M apps/web/app/page.tsx
?? apps/web/app/__tests__/page.spec.tsx
?? apps/web/src/components/public/CallToActionCTA.tsx
?? apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx
?? apps/web/src/components/public/__tests__/__snapshots__/
?? apps/web/src/lib/constants.ts
```

`apps/` 配下に dirty diff あり（CTA 実装本体・テスト・fallback 統一）。`packages/` 配下は dirty 0 件。本 wave で全差分を Phase 12 strict 7 と同期済み。

## Placeholder Token Gate

`phase-12-documentation-guide.md` 要件: 禁止語リスト (`token-sized`, `09b-token-value`, `token-mix`) が CTA 実装と Phase 12 outputs に混入していないことを `rg -n` で検証し、exit code と match 件数を転記する。

```bash
$ rg -n "token-sized|09b-token-value|token-mix" \
    docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-12/ \
    apps/web/src/components/public/CallToActionCTA.tsx
# exit=1 (no matches) — placeholder token literal は混入なし
```

## Commands

```bash
git status --short
git diff --stat
test -f docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/artifacts.json
find docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-11 -type f | sort
find docs/30-workflows/parallel-06-public-pages-homepage-cta/outputs/phase-12 -maxdepth 1 -type f | sort
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm --filter @ubm-hyogo/web verify-design-tokens
```
