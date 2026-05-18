# Phase 12 Documentation Changelog

## Updated In This Cycle

| Path | Change |
| --- | --- |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/index.md` | `implemented_local_evidence_captured` へ再分類し、local test / visual evidence を追記 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/artifacts.json` | root artifact manifest を実装済み状態へ更新 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/artifacts.json` | outputs artifact manifest を root と同一内容で更新 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-02.md` | 実在する design token command へ補正 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-03.md` | `useAdminMutation` successMessage mapper を実装対象へ追加 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-04.md` | shared schema import と hook 拡張設計を補正 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-05.md` | implementation step と検証 command を補正 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-07.md` | idempotent UX review gate を明文化 |
| `docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-12/` | strict 7 files を実体化 |
| `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx` | rejected submit の stale toast を ref 同期で修正 |
| `apps/web/src/components/admin/__tests__/TagsQueueResolveDrawer.spec.tsx` | same tick successMessage regression test を追加 |
| `apps/web/src/lib/admin/server-fetch.ts` | Phase 11 terminal disabled screenshot 用 DLQ fixture row を追加 |
| `apps/web/playwright/tests/admin-tags-resolve-drawer.spec.ts` | Phase 11 5 screenshot capture spec を追加 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md` | superseded trace を追記 |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | drawer extraction / useAdminMutation / terminal status contract を同期 |
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | `useAdminMutation('/api/admin/*')` を hook-level mutation boundary として同期 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow root を quick lookup に登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | admin-tags-queue-resolver-drawer 早見を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow entry を追加 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-tags-queue-resolver-drawer-2026-05.md` | lessons L-ATQRD-001〜005 を追加 |
| `.claude/skills/aiworkflow-requirements/changelog/20260517-admin-tags-queue-resolver-drawer.md` | changelog fragment を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | v2026.05.17 entry を追加 |

## Validation Notes

- `git status` / `git diff --stat` で実変更を確認する。
- JSON は `node -e` で parse 検証する。
- `pnpm --filter @ubm-hyogo/web test -- ...` は対象 spec を含む apps/web 全体で PASS（626 passed / 1 skipped）。
- Playwright screenshot capture は `apps/web/playwright/tests/admin-tags-resolve-drawer.spec.ts` で PASS（1 passed、5 PNG、axe 0）。
- `pnpm --filter @ubm-hyogo/web typecheck` / `lint` / `verify-design-tokens` は PASS。
