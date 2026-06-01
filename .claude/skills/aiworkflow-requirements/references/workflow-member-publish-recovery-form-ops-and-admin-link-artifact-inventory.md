# Workflow Artifact Inventory: member-publish-recovery-form-ops-and-admin-link

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/` |
| root artifacts | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/outputs/phase-11/main.md` |
| Phase 12 compliance | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation targets | `apps/web/app/(admin)/admin/sync-status/page.tsx`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/features/admin/components/_sync/`, `apps/web/src/features/admin/diagnostics/{backfill,manual-sync}.ts`, `apps/web/src/components/public/ReflectionTimingNote.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(member)/profile/page.tsx`, `apps/web/src/components/shell/{shell-config,SidebarNavItem,icons}.tsx`, `apps/web/src/lib/constants/form.ts`, `apps/web/src/lib/env.ts` |
| system spec | `docs/00-getting-started-manual/specs/03-data-fetching.md` |

## Status

`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

Local evidence: `pnpm --filter @ubm-hyogo/web typecheck` PASS and focused Vitest 8 files / 53 tests PASS.

User-gated: production `MEMBERS_AUTO_PUBLISH_ON_CONSENT` flag flip, `SYNC_ADMIN_TOKEN` Cloudflare Secrets injection, staging/production deploy, authenticated runtime screenshots, commit, push, PR.

## Lessons Learned

- **L-MPUB-001**: sync 系 proxy path への server-side Bearer 注入は `needsSyncAdminBearer` の path allowlist（`sync/{schema,responses,backfill-publish-state,diagnostics}`）で限定する。
- **L-MPUB-002**: proxy の `INTERNAL_API_BASE_URL` / `SYNC_ADMIN_TOKEN` は localhost fallback でなく env 別 fail-fast（`*_missing` 500）にする。
- **L-MPUB-003**: 「backend 実装済み・UI 導線欠落」型は endpoint 実在ベースで再スコープし新規 backend 契約を 0 に寄せる。
- **L-MPUB-004**: 同一 page を複数並列タスクが触る場合はパネルを `*.client.tsx` に分離して編集競合を構造排除する。
- **L-MPUB-005**: Google Form 反映 SLA は cron 周期 + ISR revalidate + 最悪値の 3 段で文書化し surface ごとに文言分岐する。
- **L-MPUB-006**: external nav link は `external?` フラグ分岐 + `<a target=_blank rel=noopener noreferrer>` + a11y 補助で実装する。
- **L-MPUB-007**: 救済 backfill は公開 3 条件 AND を UI 文言と skip 分類の両方で一貫させ admin 明示設定を上書きしない。

詳細: [lessons-learned-member-publish-recovery-form-ops-and-admin-link-2026-05.md](lessons-learned-member-publish-recovery-form-ops-and-admin-link-2026-05.md)
