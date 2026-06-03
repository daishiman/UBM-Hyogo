# Artifact Inventory: issue-1030-member-photo-transcode-resize-variant-pipeline

## Workflow

| Artifact | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/` | active（親 #983 と同階層・implementation_reviewed_local。completed-tasks 移動は user-gated close-out で未実施） |
| root artifacts | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/artifacts.json` | present |
| output artifacts | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/artifacts.json` | present |
| Phase 1-13 specs | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/phase-*.md` | present |
| Phase outputs | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-{1,2,3,4,5,6,7,8,9,10,11,12}/` | present |
| Phase 12 strict 7 | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-12/` | present |

## Contract Boundary

| Artifact | Path | Status |
| --- | --- | --- |
| parent workflow | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` | dependency / implemented_local_runtime_pending |
| target migration | `apps/api/migrations/0023_member_photos_variants.sql` | local implementation present / remote apply user-gated |
| API target | `apps/api/src/routes/admin/members.ts` | local implementation present: multipart display/thumb, `photoThumbUrl`, DELETE both keys |
| repository target | `apps/api/src/repository/memberPhotos.ts` | local implementation present: variant metadata columns |
| shared target | `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts` | local implementation present: optional `photoThumbUrl` |
| web targets | `apps/web/src/lib/admin/image-resize.ts`, `MemberDrawer.tsx`, `MemberAvatar.tsx` | local implementation present: client Canvas variants and thumb consumption |

## Evidence Boundary

| Artifact | Path | Status |
| --- | --- | --- |
| Phase 11 plan | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-11/screenshot-plan.json` | present |
| Phase 11 manual result | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-11/manual-test-result.md` | present / local implementation review |
| screenshots | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-11/screenshots/member-avatar-variant-fallback-local.png` | local visual harness present |
| authenticated screenshots | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/outputs/phase-11/screenshots/*.png` | pending staging deploy |
| local code evidence | targeted vitest / typecheck / lint | in review |

## User-Gated Items

Remote D1 migration apply, staging deploy, authenticated screenshot capture, commit, push, PR creation, and Issue #1030 mutation remain user-gated. Issue #1030 is CLOSED and PR text must use `Refs #1030` only.

## Lessons

実装の苦戦箇所・知見は [`lessons-learned/lessons-learned-issue-1030-member-photo-variant-pipeline-2026-05.md`](../lessons-learned/lessons-learned-issue-1030-member-photo-variant-pipeline-2026-05.md)（L-I1030-001..008）に集約。要点:

- L-I1030-001: 無料枠 invariant 下では server-side 画像処理を却下し client-side Canvas resize を根本解にする。
- L-I1030-002: ADD COLUMN のみ + 旧 single-file upload を `original_fallback` で受理し非破壊にする。
- L-I1030-003: D1 適用を伴う新規 repository spec は vitest hook timeout を 60s に延長する。
- L-I1030-004: D1 route contract spec は root unit config では拾われず `vitest.d1.config.ts` で実行する。
- L-I1030-005: shared viewmodel の optional 追加は `.strict()` 維持、Avatar は size 別 src + 3 段 fallback。
- L-I1030-006: `content_hash` は記録のみ・R2 dedup / retina 2x は過剰設計として除外。
- L-I1030-007: implementation_reviewed_local は親 #983 と同階層に置き、completed-tasks 移動を mover で先走らせない。
- L-I1030-008: gate-metadata の `gates[].status` enum は `pending`/`passed`/`failed`/`waived` のみ。local nuance は notes へ。
