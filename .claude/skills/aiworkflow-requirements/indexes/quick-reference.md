# クイックリファレンス

## admin-member-detail-status-404-fix（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | admin 会員管理の `GET /admin/members/:memberId` / `PATCH /admin/members/:memberId/status` が `member_status` 欠落 orphan で 404 になる非対称性を apps/api 内で修復 |
| implementation | `ensureMemberStatusRow` / `defaultMemberStatusRow`、builder degraded detail、status PATCH identity-only 404 boundary、Forms sync prevention、migration 0024 backfill |
| evidence | focused D1 Vitest 5 files / 67 tests PASS、typecheck PASS、lint PASS、apps/web diff 0 |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-member-detail-status-404-fix-artifact-inventory.md` |
| user gate | remote D1 migration apply, staging deploy, authenticated admin smoke, commit, push, PR |

## profile-reload-session-404-fix（2026-06-03）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/profile-reload-session-404-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| purpose | `/profile` reload 時の `GET /me` 404 生エラーを API route 正規化・web proxy URL 修正・再ログイン CTA で解消 |
| implementation | `trailingSlashRedirect()` + API mount test、`/api/me/[...path]` empty-path `/me` fix、`SectionError` action link、`/profile` `MEMBER_SESSION_404` CTA |
| evidence | API focused Vitest 9 PASS、web focused Vitest 16 PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-profile-reload-session-404-fix-artifact-inventory.md` |
| user gate | staging authenticated screenshot, commit, push, PR |

## admin-attendance-dashboard-ux（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-attendance-dashboard-ux/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | admin attendance dashboard UI/UX recovery: `.attendance-*` CSS, fixed SVG bar sizing, attendance-zone labels/help, KPI extended-attendance wording, page guide / section intro / empty-state styling |
| implementation | `apps/web/src/styles/globals.css`, `apps/web/src/features/admin/attendance/{components,lib,__tests__}/**` |
| evidence | `outputs/phase-11/manual-test-result.md` records focused Vitest PASS and apps-api unchanged; staging screenshots are user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-attendance-dashboard-ux-artifact-inventory.md` |
| follow-up | `docs/30-workflows/admin-attendance-dashboard-ux/unassigned-task-specs/admin-attendance-analytics-calc-correction.md` |

## sidebar-footer-pinning-and-account-popover-ux（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` |
| parent | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` |
| purpose | unified sidebar shell の footer 固定、collapsed overflow、account popover outside/Escape close、public footer sticky を同一 local cycle で修正 |
| implementation | `apps/web/src/components/shell/{SidebarShell,SidebarUserMenu,SidebarNavItem}.tsx`, `apps/web/src/styles/{globals,legacy-public}.css` |
| tests | `apps/web/src/components/shell/__tests__/{SidebarShell,SidebarUserMenu,SidebarNavItem}.spec.tsx` |
| evidence | focused Vitest 3 files / 22 tests PASS; web typecheck PASS; web verify-design-tokens PASS; web lint PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-sidebar-footer-pinning-and-account-popover-ux-artifact-inventory.md` |
| user gate | staging authenticated screenshots, commit, push, PR |

## issue-1056-kv-alert-policy-binding-drift-detection（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1056-kv-alert-policy-binding-drift-detection/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | `apps/api/wrangler.toml` の KV/R2 binding 活性と Cloudflare alert policy `enabled` 状態の drift を local-only で検知 |
| implementation | `infra/cloudflare-alerts/lib/binding-policy-drift.ts`, `infra/cloudflare-alerts/lib/cli.ts`, `scripts/cf.sh`, `.github/workflows/cloudflare-alerts-drift.yml`, `package.json` |
| command | `pnpm cf:alerts:binding-drift --ci`（Cloudflare API/token 不要、drift 0 は exit 0、drift は exit 2） |
| tests | `infra/cloudflare-alerts/lib/__tests__/binding-policy-drift.spec.ts`, `scripts/__tests__/cf-alerts-cli.spec.ts` |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1056-kv-alert-policy-binding-drift-detection-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-1056-kv-alert-policy-binding-drift-detection-2026-06.md`（L-I1056-001..006） |
| issue | #1056 spec 作成時 OPEN → 本サイクル中 CLOSED（`closedAt: 2026-06-02T03:32:56Z`）。docs を実態整合（reopen せず）、workflow は completed-tasks へ close-out 済 |
| user gate | commit, push, PR, Issue mutation, alert policy apply/enablement |

## issue-1054-wrangler-binding-drift-ci-gate（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1054-wrangler-binding-drift-ci-gate/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #1054 CLOSED（reopen / mutation は user-gated、PR 文脈は `Refs #1054`） |
| purpose | `apps/api/wrangler.toml` binding 宣言、`apps/api/src/env.ts` の `Env` 型、`deployment-cloudflare.md` の Current Cloudflare inventory 表の三者ドリフトを検出する read-only CI gate を追加 |
| implementation | `scripts/verify-wrangler-binding-drift.mjs`, `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`, `.github/workflows/verify-wrangler-binding-drift.yml`, `package.json#verify:wrangler-binding-drift` |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の Current Cloudflare binding inventory を machine-checked SSOT とし、`DB` / `SYNC_ALERTS` / `MEMBER_PHOTOS` 行を追加 |
| evidence | `pnpm verify:wrangler-binding-drift` PASS、focused Vitest PASS、read-only grep gate PASS、Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1054-wrangler-binding-drift-ci-gate-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-1054-wrangler-binding-drift-ci-gate-2026-06.md`（L-I1054-001..008: 自作行パーサ / state 3 値正規化 / env-prefix upsert / 片方向突合 / secrets 除外 / Kind 一致検証 / 現存 drift 同一 wave 是正 / read-only grep gate） |
| user gate | commit, push, PR, GitHub Issue mutation |

## issue-1043-identity-conflicts-row-fade-animation（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #1043 CLOSED（2026-06-02 read-only 再確認。mutation は user-gated） |
| purpose | `/admin/identity-conflicts` の merge optimistic hide を即時 `return null` から exiting fade/collapse → removed へ変更する |
| implementation targets | `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`, `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| evidence | focused Vitest 1 file / 13 tests PASS; web typecheck PASS; web lint PASS; local Playwright desktop 8/8 PASS; Phase 11 screenshots 3 PNG captured |
| invariant | API endpoint / D1 schema / Server Component page / `useAdminMutation` / design tokens / `globals.css` / dismiss behavior unchanged |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1043-identity-conflicts-row-fade-animation-artifact-inventory.md` |
| user gate | commit, push, PR, Issue mutation |

## sidebar-visibility-conditional-and-ux（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / pixel_screenshot_pending_user_gate` |
| purpose | `/login` を shell 外 bare route group `(auth)` へ移し、sidebar 表示条件を route group 正本へ揃え、SSR active path と viewer identity を改善 |
| implementation | `apps/web/app/(auth)/layout.tsx`, `apps/web/app/(auth)/login/**`, `apps/web/middleware.ts`, `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/shell/{SidebarUserMenu,SidebarUserAvatar,SidebarNavItem,user-menu-config}.tsx` |
| tests | `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`, `apps/web/__tests__/middleware.spec.ts`, `apps/web/app/(admin)/layout.spec.tsx`, login/shell focused specs |
| evidence | direct focused Vitest 20 files / 98 tests PASS; web typecheck PASS; web lint PASS; design-token / grep gates PASS; local screenshots 4 PNG |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-sidebar-visibility-conditional-and-ux-artifact-inventory.md` |
| user gate | staging/admin visual baseline, commit, push, PR |

## issue-1030-member-photo-transcode-resize-variant-pipeline（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1030-member-photo-transcode-resize-variant-pipeline/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION / completed-tasks moved` |
| issue | #1030 CLOSED 維持。PR 文脈は `Refs #1030` のみ |
| parent | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` |
| purpose | admin member photo を client-side Canvas で display(512px) + thumb(96px) variant 化し、無料枠を維持したまま小 avatar 配信 bytes を削減する仕様を固定 |
| implementation targets | `apps/api/migrations/0023_member_photos_variants.sql`, `apps/api/src/lib/r2/member-photo-presign.ts`, `apps/api/src/repository/memberPhotos.ts`, `apps/api/src/routes/admin/members.ts`, `packages/shared`, `apps/web/src/lib/admin/image-resize.ts`, `MemberDrawer.tsx`, `MemberAvatar.tsx` |
| contract | display は既存 `members/{memberId}/avatar` key を維持、thumb は `members/{memberId}/thumb`、`photoThumbUrl?` は optional、旧 `file` upload と既存 rows は後方互換 |
| evidence | Phase 1-13 specs present、Phase outputs 1/2/3/4/5/6/7/8/9/10/11/12 present、Phase 12 strict 7 present、root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1030-member-photo-transcode-resize-variant-pipeline-artifact-inventory.md` |
| user gate | remote D1 migration apply、staging deploy、authenticated screenshots、commit、push、PR |

## issue-1042-identity-conflicts-dismiss-optimistic-update（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| purpose | `/admin/identity-conflicts` の dismiss confirm 後、server round-trip 前に row を optimistic 非表示化し、server error 時だけ rollback |
| implementation | `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`, `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| invariant | API endpoint / D1 schema / Server Component page / merge behavior は変更なし。`useAdminMutation` hook 拡張なし |
| evidence | focused Vitest `IdentityConflictRow.spec.tsx` 15 tests PASS; Playwright focused 2 PASS; Phase 11 screenshots 3 PNG |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1042-identity-conflicts-dismiss-optimistic-update-artifact-inventory.md` |
| user gate | commit, push, PR |

## issue-1039-admin-audit-identity-action-presets（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1039-admin-audit-identity-action-presets/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #1039 CLOSED。Issue mutation なし、PR 文脈は `Refs #1039` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/` |
| purpose | `/admin/audit` action filter に `identity.merge` / `identity.dismiss` の native datalist presets を追加し、自由入力と `action` query contract を維持する |
| implementation targets | `apps/web/src/components/admin/AuditLogPanel.tsx`, `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx`, `apps/web/app/(admin)/admin/audit/page.page.spec.ts` |
| evidence | focused component/page regressions PASS; Phase 11 local screenshots present; staging authenticated screenshots remain user-gated |
| Phase 12 | strict 7 present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1039-admin-audit-identity-action-presets-artifact-inventory.md` |
| user gate | staging screenshot, commit, push, PR |

## issue-1035-tag-master-write-endpoints（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1035 CLOSED。PR 文脈は `Refs #1035` のみ |
| parent | `issue-982-drawer-tag-pill-editing` |
| purpose | tag master (`tag_definitions`) の admin CRUD endpoint と pagination/search を追加する |
| implementation | `apps/api/src/repository/tagDefinitions.ts`, `apps/api/src/repository/auditLog.ts`, `apps/api/src/routes/admin/tags.ts`, `apps/api/src/index.ts`, `docs/00-getting-started-manual/specs/01-api-schema.md` |
| tests | `apps/api/src/routes/admin/tags.contract.spec.ts`, `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`, `apps/api/src/routes/admin/members.tags.contract.spec.ts`, `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` |
| evidence | focused D1 Vitest 4 files / 32 tests PASS, API typecheck PASS, repo lint PASS |
| invariant | 不変条件 #13 を第3経路へ再々定義。`code` immutable、DELETE は `active=0`、member_tags row 保持、audit `admin.tag.*` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1035-tag-master-write-endpoints-artifact-inventory.md` |
| user gate | staging runtime smoke, commit, push, PR |

## issue-1042-dismiss-confirm-optimistic-update（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #1042 OPEN。Issue state mutation は user-gated |
| purpose | `/admin/identity-conflicts` dismiss confirm 後に row を optimistic に非表示化し、server error 時に rollback + reason retention する |
| implementation | `apps/web/src/components/admin/IdentityConflictRow.tsx` component-local `optimisticDismissed`; focused component tests; admin identity-conflicts Playwright spec |
| invariant | API / D1 schema / Server Component page / `useAdminMutation` hook / merge behavior は変更なし |
| evidence | focused Vitest 1 file / 14 tests PASS; Playwright desktop 2 tests PASS; Phase 11 screenshots 2 PNG captured |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1042-dismiss-confirm-optimistic-update-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-1042-dismiss-optimistic-2026-06.md`（L-I1042-001..004・#988 L-I988-001..006 継承） |
| user gate | commit, push, PR, Issue #1042 close |

## issue-1031-member-self-photo-upload（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1031-member-self-photo-upload/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | #1031 CLOSED（2026-06-01 実確認）。Issue mutation は行わず、PR 文脈は `Refs #1031` のみ |
| parent | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` |
| purpose | member 本人が `/profile` から自分の avatar を upload/delete できる self-service 経路を実装する |
| implementation | `member_photos.source` additive migration 0023、`POST/DELETE /me/photo`、`GET /me/profile photoUrl?`、web `/api/me/photo` proxy、`PhotoUpload.client.tsx` |
| evidence boundary | focused API/repository/web tests and component screenshot evidence present; remote D1 apply, staging deploy, authenticated runtime visual evidence pending |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1031-member-self-photo-upload-artifact-inventory.md` |
| user gate | remote D1 apply, staging deploy, authenticated screenshots, commit, push, PR |

## issue-1029-public-member-photo-display（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1029-public-member-photo-display/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1029 CLOSED 維持。PR 文脈は `Refs #1029` のみ |
| parent | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` |
| purpose | public member list/profile に optional `photoUrl` を追加し、#983 の `member_photos` + private R2 presign + `Avatar` fallback を再利用する |
| public policy | `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md`。gate は `public_consent='consented'` + `publish_state='public'` + `member_photos` row。写真専用 consent / D1 migration は追加しない |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1029-public-member-photo-display-artifact-inventory.md` |
| implementation | shared `photoUrl?` schema/types、`listMemberPhotosByIds`、public route presign resolver、use-case DI、MemberCard/ProfileHero Avatar src 配線 |
| evidence | focused Vitest 51 PASS、public route contract 12 PASS、shared/api/web typecheck PASS、Playwright public photo 1 PASS、Phase 11 screenshots 3 PNG captured |
| user gate | R2 secrets, staging deploy, real R2 URL capture, commit, push, PR, Issue mutation |

## issue-1027-member-dynamic-og-worker-split（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1027-member-dynamic-og-worker-split/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1027 OPEN 維持。Issue mutation は user-gated |
| purpose | member detail の動的 OG PNG を main web Worker へ戻さず、OG 専用 Worker `apps/og` に分離して Free 3MiB 予算を守る |
| implementation | `apps/og/**`, `apps/web/src/lib/{env.ts,seo/site-metadata.ts}`, `apps/web/app/(public)/members/[id]/page.tsx`, `apps/web/wrangler.toml`, `.github/workflows/og-cd.yml` |
| evidence | OG typecheck PASS; OG Vitest 3 files / 10 tests PASS; web metadata focused Vitest 3 files / 17 tests PASS; OG Wrangler dry-run build PASS; OG size gate gzip 717KiB / 3072KiB PASS (index.js 170KiB + wasm); web typecheck PASS |
| invariant | `apps/web` は `next/og` / `ImageResponse` 禁止を維持。OG Worker は existing `GET /public/members/:memberId` を API_SERVICE first で読む。`OG_IMAGE_BASE_URL` は env accessor 経由 |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1027-member-dynamic-og-worker-split-artifact-inventory.md` |
| user gate | Cloudflare deploy, staging runtime PNG capture, commit, push, PR, Issue #1027 mutation |

## task-d-admin-google-form-responses-link（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| parent | `member-publish-recovery-form-ops-and-admin-link`（PR #1064 / commit `745c95115` で apps 実装 landed 済み） |
| purpose | admin sidebar nav に Google Form 回答編集画面を別タブで開く外部リンク「Form回答」を追加した landed 実装の正本検証 |
| implementation | `apps/web/src/lib/constants/form.ts`, `apps/web/src/components/shell/{shell-config,icons,SidebarNavItem}.tsx` |
| contract | `ShellNavItem.external?` で `<a target="_blank" rel="noopener noreferrer">` に分岐し、`↗` + sr-only「（外部リンク）」を付与、`aria-current` / `data-active` は付けない |
| evidence | focused jsdom / pure function / constant tests; screenshots are admin-auth user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-d-admin-google-form-responses-link-artifact-inventory.md` |
| user gate | staging admin screenshot, external Google Form tab observation, commit, push, PR |

## task-c-reflection-timing-visibility-and-sla-doc（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-c-reflection-timing-visibility-and-sla-doc/` |
| status | `spec_created / implementation / VISUAL / verify_existing` |
| landed implementation | PR #1064 / commit `745c95115` |
| purpose | Google Form 反映タイミングを `/members` と `/profile` に可視化し、`03-data-fetching.md` に反映 SLA を固定 |
| implementation anchors | `apps/web/src/components/public/ReflectionTimingNote.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(member)/profile/page.tsx`, `docs/00-getting-started-manual/specs/03-data-fetching.md` |
| evidence | focused `ReflectionTimingNote.spec.tsx` PASS, Phase 11 output present, Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-c-reflection-timing-visibility-and-sla-doc-artifact-inventory.md` |
| user gate | authenticated runtime screenshots, commit, push, PR |

## task-b-manual-form-resync-admin-ui-spec（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / runtime_visual_pending_user_gate` |
| parent | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` Task B |
| purpose | landed 済み manual Google Form resync admin UI を standalone Phase 1-13 正本仕様へ展開し、回帰確認手順と Phase 11/12 証跡を固定 |
| implementation | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`, `apps/web/src/features/admin/diagnostics/manual-sync.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/lib/env.ts` |
| evidence | focused Vitest PASS, web typecheck PASS, Phase 11 local bundle, Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-b-manual-form-resync-admin-ui-spec-artifact-inventory.md` |
| user gate | `SYNC_ADMIN_TOKEN` secret injection, authenticated runtime screenshots, commit, push, PR |

## publish-state-backfill-admin-ui（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/publish-state-backfill-admin-ui/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| parent | `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/` Task A |
| purpose | `/admin/sync-status` に公開状態 backfill 操作パネル（dry-run 確認 → apply 昇格）を正本化し、PR #1064 / commit `745c95115` で landed 済みの実装を Phase 1-13 仕様へ同期 |
| implementation | `apps/web/src/features/admin/diagnostics/backfill.ts`, `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`, `apps/web/app/(admin)/admin/sync-status/page.tsx`, focused specs under `_sync/__tests__` and `diagnostics/__tests__` |
| system spec | API/D1/Form schema no change; existing endpoint `POST /admin/sync/backfill-publish-state` reused |
| evidence | Phase 11 deterministic plan evidence present; Phase 12 strict 7 present; staging authenticated screenshots pending user gate |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-publish-state-backfill-admin-ui-artifact-inventory.md` |
| user gate | staging authenticated screenshots, commit, push, PR |

## issue-1024-sidebar-collapse-cookie-persistence（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1024 CLOSED（reopen なし、PR は `Refs #1024` 境界） |
| purpose | unified `SidebarShell` の collapsed state を `ubm_shell_collapsed` cookie で永続化し、SSR seed で first-paint flicker を防ぐ |
| implementation | `shell-collapse-cookie.ts`, `useSidebarState.ts`, `SidebarShell.tsx`, `SidebarShell.server.tsx` |
| tests | `shell-collapse-cookie.spec.ts`, `useSidebarState.spec.tsx`, `SidebarShell.server.spec.tsx` |
| boundary | API / D1 / Google Form / auth / design tokens unchanged; commit, push, PR, Issue mutation are user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1024-sidebar-collapse-cookie-persistence-artifact-inventory.md` |

## issue-229-indexes-rebuild-fail-fast（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-229-indexes-rebuild-fail-fast/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #229 CLOSED（reopen / mutation は user-gated） |
| purpose | `pnpm indexes:rebuild` の単一経路 `generate-index.js` に fail-fast / atomic write / decisive log を実装する |
| implementation | `.claude/skills/aiworkflow-requirements/scripts/generate-index.js`, `scripts/__tests__/generate-index-fail-fast.spec.ts` |
| evidence | focused Vitest 1 file / 6 tests PASS; `pnpm indexes:rebuild -- --quiet` PASS; immediate second rebuild idempotent |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-229-indexes-rebuild-fail-fast-artifact-inventory.md` |
| user gate | commit, push, PR, Issue mutation |

## issue-224-public-members-tags-batch-fetch（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | 公開 `GET /public/members?expand=tags` で tags N+1 回帰を防ぐ batch fetch を実装 |
| implementation | `apps/api/src/_shared/search-query-parser.ts`, `apps/api/src/use-cases/public/list-public-members.ts`, `apps/api/src/repository/memberTags.ts`, shared public member tag schema/types |
| invariant | `expand=tags` opt-in 時のみ tags を付与し、未指定時の response shape は不変 |
| evidence | contract/use-case N+1 regression tests PASS; Gate-C は user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-224-public-members-tags-batch-fetch-artifact-inventory.md` |
| user gate | commit, push, PR, Gate-C |

## issue-264-cron-schedule-free-tier-guard（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-264-cron-schedule-free-tier-guard/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| purpose | CLOSED Issue #264 の obsolete Sheets 24h 実測要求を、現行 Forms ベース 3-cron free-tier guard へ再スコープ |
| implementation | `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` |
| invariant | `apps/api/wrangler.toml` の `[triggers]` / `[env.production.triggers]` / `[env.staging.triggers]` は `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` で一致し、3 本以下、legacy `0 * * * *` 不在 |
| evidence | focused Vitest 1 file / 16 tests PASS; package-script apps/api suite 76 files / 481 tests PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-264-cron-schedule-free-tier-guard-artifact-inventory.md` |
| user gate | optional staging cron tail, commit, push, PR, Issue mutation |

## member-publish-recovery-form-ops-and-admin-link（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| purpose | `/members` 公開0件の運用復旧、既存 Form 回答の手動反映、反映 SLA 可視化、admin sidebar から Google Form 回答編集画面への導線を 4 責務で実装 |
| implementation | `apps/web/app/(admin)/admin/sync-status/page.tsx`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/features/admin/components/_sync/`, `apps/web/src/features/admin/diagnostics/{backfill,manual-sync}.ts`, `apps/web/src/components/public/ReflectionTimingNote.tsx`, `apps/web/src/components/shell/{shell-config,SidebarNavItem,icons}.tsx`, `apps/web/src/lib/constants/form.ts`, `apps/web/src/lib/env.ts` |
| system spec | `docs/00-getting-started-manual/specs/03-data-fetching.md` に反映 SLA を追加 |
| evidence | web typecheck PASS, focused Vitest 7 files / 20 tests PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-member-publish-recovery-form-ops-and-admin-link-artifact-inventory.md` |
| user gate | production flag, Cloudflare secret injection, deploy, authenticated screenshots, commit, push, PR |

## issue-1016-sidebar-mobile-drawer-responsive（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | #1016 CLOSED。PR 文脈は `Refs #1016` のみ |
| parent | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` Task E |
| purpose | Unified Sidebar Shell の mobile drawer responsive を実装し、スマホ幅で hamburger → dialog drawer を開けるようにする |
| implementation targets | `apps/web/src/components/shell/SidebarMobileTrigger.tsx`, `SidebarDrawer.tsx`, `useSidebarState.ts`, `SidebarShell.tsx`, `apps/web/src/lib/is-browser.ts`, `apps/web/src/styles/globals.css` |
| evidence | focused Vitest 4 files / 21 tests PASS（`outputs/phase-11/evidence/focused-vitest.log`）+ local screenshots 4 PNG（`outputs/phase-11/screenshots/`） |
| Phase 12 | strict 7 present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1016-sidebar-mobile-drawer-responsive-artifact-inventory.md` |
| user gate | staging visual verification, commit, push, PR |

## issue-57-kv-r2-guardrail-degrade-design（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-57-kv-r2-guardrail-degrade-design/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / external_ops_pending_user_gate` |
| purpose | KV/R2 free-tier guardrail drift を正本化し、application audit_log R2 export を repository variable で即時 pause 可能にする |
| implementation | `scripts/audit-log/export-to-r2.ts` adds `paused` short-circuit; `.github/workflows/audit-log-cold-storage.yml` forwards `AUDIT_COLD_STORAGE_EXPORT_PAUSED`; `apps/api/src/env.ts` / `alert-relay.ts` make `ALERT_DEDUP_KV` optional fail-open |
| specs | `docs/00-getting-started-manual/specs/08-free-database.md`, `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`, `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` |
| user gate | GitHub variable mutation, production scheduled export, commit, push, PR |

## issue-1007-density-toggle-help-hint-hardening（2026-05-30）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | `/members` の `DensityToggle` HelpHint を、複数配置 id 衝突なし・Escape/outside close・Icon system `help` glyph へ堅牢化する |
| implementation targets | `apps/web/src/components/public/DensityToggle.client.tsx`, `apps/web/src/components/ui/Icon.tsx`, `apps/web/src/components/ui/icons.ts` |
| tests | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`（15 passed） |
| specs | `docs/00-getting-started-manual/specs/09-ui-ux.md`, `docs/00-getting-started-manual/specs/09d-icons.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1007-density-toggle-help-hint-hardening-artifact-inventory.md` |
| user gate | runtime screenshots, staging deploy, commit, push, PR |

## issue-1036-bulk-member-tag-assign（2026-06-01）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| issue | #1036 CLOSED。PR 文脈は `Refs #1036` のみ（reopen 禁止）。parent #982（CLOSED）followup-003 |
| purpose | `/admin/members` の BulkActionBar から複数 member × 複数 tag を一括 assign/unassign する（不変条件 #13 第3経路 = bulk admin write） |
| implementation | `apps/api/src/repository/memberTags.ts`（`bulkApplyMemberTagsByAdmin`）, `apps/api/src/routes/admin/members.ts`（`POST /admin/members/tags/bulk` + `GET /admin/tags`）, `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`, `apps/web/src/features/admin/api/members.ts`, `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` |
| contract boundary | 部分失敗も 200 + `{ batchId, results }`。status 5 値（assigned/unassigned/noop/skipped_deleted/tag_not_found）。bulk 冪等は `member_tags` 複合 PK 自然冪等で #913 非依存、`batchId` を audit payload に埋めて相関（`correlation_id` 列なし）。`GET /admin/tags` は read のみで #1035 write と責務分離。route 順序: bulk を `:memberId` route より前に登録 |
| tests | focused API 17（contract 11 + repository 6）+ web 18（component 10 + 既存 8）+ type-level 6 = 41 PASS。typecheck / lint PASS |
| Phase 12 | strict 7 present、root/output `artifacts.json` parity present（共に `implemented_local_runtime_pending`）、Phase 11 local fixture screenshot 4 枚 present、30-method compact evidence present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1036-bulk-member-tag-assign-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-1036-bulk-member-tag-assign-2026-06.md`（L-I1036-001..008） |
| user gate | staging authenticated visual baseline, commit, push, PR |

## issue-1006-members-selected-filters-chip-ux-hardening（2026-05-30）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1006-members-selected-filters-chip-ux-hardening/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | #1006 CLOSED。PR 文脈は `Refs #1006` のみ |
| parent | `docs/30-workflows/completed-tasks/members-list-ux-clarity/` |
| purpose | `/members` SelectedFiltersBar の tag chip 表示名、chip 削除後 focus 復帰、mobile selected-filters overflow を堅牢化 |
| implementation targets | `apps/web/src/components/public/SelectedFiltersBar.client.tsx`, `apps/web/src/components/public/MemberFilters.client.tsx`, `apps/web/src/styles/legacy-public.css` |
| tests | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx`, `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` |
| evidence | focused Vitest 2 files / 17 tests PASS, web typecheck PASS, lint PASS, verify-design-tokens PASS, local Playwright mobile CSS sanity PASS |
| runtime boundary | local `/public/members` returned 500 without AUTH_SECRET/backend auth, so data-backed visual screenshots and staging verification remain runtime pending |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1006-members-selected-filters-chip-ux-hardening-artifact-inventory.md` |
| user gate | staging data-backed visual screenshots, commit, push, PR |

## issue-991-admin-fetch-error-typed-class（2026-05-30）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-991-admin-fetch-error-typed-class/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #991 CLOSED（mutation は user-gated） |
| purpose | admin server-fetch error を `AdminFetchError` typed class へ統一し、structured status priority と PII redacted snippet を提供 |
| implementation | `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/lib/server-fetch/safe-fetch.ts` |
| tests | `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts`, `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`, `server-fetch.binding.spec.ts`, `safe-server-fetch*.spec.ts`, `server-fetch.env.spec.ts` |
| evidence | focused Vitest 6 files / 31 tests PASS, web typecheck PASS, root lint PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-991-admin-fetch-error-typed-class-artifact-inventory.md` |
| user gate | staging runtime observation, commit, push, PR |

## issue-224-public-members-tags-batch-fetch（2026-05-31）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-224-public-members-tags-batch-fetch/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | 公開 `GET /public/members?expand=tags` を既存 batch helper `listTagsByMemberIds`（フラット配列）+ use-case 層 `member_id` groupBy で取得し tags の N+1 回帰を防止 |
| implementation | `apps/api/src/_shared/search-query-parser.ts`（`EXPAND_WHITELIST` opt-in）, `apps/api/src/use-cases/public/list-public-members.ts`（groupBy）, `apps/api/src/repository/memberTags.ts`, `apps/api/src/view-models/public/public-member-list-view.ts`, `packages/shared/src/zod/viewmodel.ts`（`PublicMemberTagZ`/`PublicMemberListItemZ` strict）, `packages/shared/src/types/viewmodel/index.ts` |
| tests | `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`, `apps/api/src/routes/public/index.contract.spec.ts`, `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`, `apps/api/src/repository/__tests__/memberTags.repository.spec.ts`, `packages/shared/src/zod/viewmodel.spec.ts` |
| evidence | NON_VISUAL local test 証跡（contract / use-case / parser / repository / shared zod）, Phase 12 strict 7, root/output artifacts parity |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md`（L-I224-001..010） |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-224-public-members-tags-batch-fetch-artifact-inventory.md` |
| unassigned | U-2 fields N+1 は `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/` で consumed / implemented。U-1 UI tags 表示 = #1006 委譲 |
| user gate | commit / push / PR / Gate-C |

## issue-1059-public-members-fields-batch-fetch-n1-prevention（2026-06-02）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1059-public-members-fields-batch-fetch-n1-prevention/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1059 OPEN（mutation は user-gated） |
| purpose | 公開 members list の summary fields 取得を per-member `listFieldsByResponseId` loop から `listFieldsByResponseIds` の `response_id IN (...)` 1 query へ置換し、fields N+1 を防止 |
| implementation | `apps/api/src/repository/responseFields.ts`, `apps/api/src/use-cases/public/list-public-members.ts`, `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` |
| tests | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` 10 PASS, `apps/api/src/repository/__tests__/responseFields.repository.spec.ts` 5 PASS |
| evidence | Phase 11 manual-test-result, Phase 12 strict 7, root/output artifacts parity |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1059-public-members-fields-batch-fetch-n1-prevention-artifact-inventory.md` |
| boundary | tags / D1 schema / endpoint / Google Form / `apps/web` unchanged; commit / push / PR / Issue mutation user-gated |

## admin-sidebar-public-return-link（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / browser_visual_pending_user_gate` |
| purpose | AdminSidebar の旧「ホーム」導線を、footer 直前の「公開サイトに戻る」リンクへ意味整理する |
| implementation | `apps/web/src/components/layout/AdminSidebar.tsx` removes grouped `/` item and adds one `<a data-role="public-return" href="/" aria-label="公開サイトに戻る">` immediately before the footer |
| tests | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`, `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` |
| evidence | focused Vitest 11 PASS, grep gate PASS, Phase 12 strict 7 present, root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-sidebar-public-return-link-artifact-inventory.md` |
| user gate | authenticated browser screenshots, staging runtime visual, commit, push, PR |

## web-worker-size-limit-fix（2026-05-29）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | OpenNext Worker bundle が gzip 3316KiB > 3072KiB 上限を超過し `[code: 10027]` で deploy fail する問題を、next/og 撤去 + 静的 OG 画像化 + CI size gate で解消する |
| Task A | `apps/web/app/opengraph-image.tsx`(削除), `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`(削除), `apps/web/public/og-default.png`(新規 1200×630), `apps/web/src/lib/seo/site-metadata.ts`, `apps/web/playwright/tests/public-metadata.spec.ts` |
| Task B | `scripts/check-worker-size.sh`(新規), `.github/workflows/web-cd.yml`(両 deploy job に size gate), `apps/web/__tests__/opennext-config-regression.spec.ts`(minify 維持 + next/og 0 件 assert) |
| 閾値 | hard 3072KiB / warn 2800KiB（script・CI・spec・implementation-guide で一貫） |
| 計測対象 | `apps/web/.open-next/server-functions/default/apps/web/handler.mjs` 等の gzip 合算（bootstrap `worker.js` ではない）。実測 gzip 2100KiB |
| OpenNext 注意 | `@opennextjs/cloudflare@1.19.4` に `minify` config key は無く、無効設定を足さず production 既定 minify を維持 |
| knowledge | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`, `docs/00-getting-started-manual/specs/08-free-database.md`（Worker bundle size 制約節） |
| lessons | `.claude/skills/task-specification-creator/lessons-learned/web-worker-size-limit-fix.md`（L-WWSL-001..004） |
| unassigned | `docs/30-workflows/unassigned-task/member-dynamic-og-paid-or-worker-split.md`（Issue #1027 / member 個別動的 OG 再導入は有料 or Worker 分離が前提） |
| user-gated | commit / push / PR / staging deploy / production deploy |

## login-redirect-when-authenticated（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-redirect-when-authenticated/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / local_focused_tests_passed` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` Task D |
| purpose | ログイン済みユーザーが `/login` に到達した場合、server-side で `/profile` または safe な `next` へ redirect する |
| implementation targets | `apps/web/src/lib/url/safe-next.ts`, `apps/web/app/login/page.tsx` |
| tests | `apps/web/src/lib/url/__tests__/safe-next.spec.ts`, `apps/web/app/login/__tests__/page.spec.tsx` |
| evidence | `mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/safe-next.spec.ts apps/web/app/login/__tests__/page.spec.tsx` PASS（2 files / 22 tests） |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-login-redirect-when-authenticated-artifact-inventory.md` |
| user gate | browser/staging runtime confirmation, commit, push, PR |

## admin-identity-conflicts-prototype-alignment-and-404-fix（2026-05-27）
## task-b-root-page-public-header-async（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-b-root-page-public-header-async/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| purpose | root `/` が `getAuthView()` を取得し、`PublicHeader authView` に配線してログイン状態 CTA を正しく出す |
| implementation | `apps/web/src/lib/auth-view/index.ts`, `apps/web/src/components/public/PublicHeader.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/app/page.tsx` |
| tests | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts`, `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`, `apps/web/app/__tests__/page.spec.tsx` |
| evidence | focused Vitest 3 files / 9 tests PASS, typecheck PASS, lint PASS, web build PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-b-root-page-public-header-async-artifact-inventory.md` |
| user gate | Cloudflare staging deploy, authenticated `/` curl, wrangler tail clean evidence, commit, push, PR |

## admin-identity-conflicts-prototype-alignment-and-404-fix（2026-05-27）
## issue-976-admin-fetch-service-binding（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-976-admin-fetch-service-binding/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| purpose | Admin server-fetch を `API_SERVICE` service-binding 優先へ統一し、同一 Cloudflare account の workers.dev 外向き fetch loopback 404 を回避 |
| implementation targets | `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`, `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` |
| local evidence | `outputs/phase-11/local-verification.md` focused Vitest 3 files / 9 tests PASS |
| Phase 12 | strict outputs + root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-976-admin-fetch-service-binding-artifact-inventory.md` |
| user gate | staging deploy, authenticated route proof, `wrangler tail`, commit, push, PR |

## fix-admin-fetch-cf-1042-service-binding（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| purpose | `fetchAdmin` の raw HTTP Worker-to-Worker fetch を Service Binding first に切り替え、staging `/admin` の Cloudflare `error code: 1042` を解消する |
| implementation | `apps/web/src/lib/env.ts`, `apps/web/src/lib/admin/server-fetch.ts` |
| tests | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`, `server-fetch.http-fallback.spec.ts`, `server-fetch-url.spec.ts`, `server-fetch.env.spec.ts` |
| transport | Cloudflare Workers runtime: `env.API_SERVICE.fetch("https://service-binding.local/...")`; test/Playwright explicit `INTERNAL_API_BASE_URL`: HTTP fallback |
| Phase 11 | local unit evidence present; staging deploy, authenticated `/admin` smoke, wrangler tail pending user gate |
| Phase 12 | strict 7 present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-admin-fetch-cf-1042-service-binding-artifact-inventory.md` |
| user gate | staging deploy, runtime smoke, tail, commit, push, PR |

## issue-958-h3-public-filter-ux（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | #958 CLOSED。PR 文脈は `Refs #958` のみ |
| parent | `google-form-reflection-diagnostics` H3 visibility follow-up |
| purpose | `publicConsent=false` / `publishState!=public` による public members 全 hidden 状態を、profile / admin / public の3面で理解・修復可能にする |
| local implementation | `PublicConsentCallout`, `BulkRepublishDrawer`, `useBulkRepublish`, `AllHiddenFallback` |
| API boundary | 新 endpoint なし。`GET /me/profile`, `GET /public/stats`, `PATCH /admin/members/:memberId/status` を利用 |
| Phase 11 | 10 local static visual screenshots present; staging visual pending |
| Phase 12 | strict 7 files present under `outputs/phase-12/`; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-958-h3-public-filter-ux-artifact-inventory.md` |
| user gate | staging verification, commit, push, PR |

## admin-identity-conflicts-prototype-alignment-and-404-fix（2026-05-27）
## issue-956-h1-ingest-recovery（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/` |
| status | `spec_created / docs-only / NON_VISUAL / runtime_pending_user_approval` |
| issue | #956 CLOSED。PR / commit 文脈は `Refs #956` のみ |
| parent | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| source | `docs/30-workflows/completed-tasks/issue-956-h1-ingest-recovery/unassigned-task-specs/google-form-reflection-diagnostics-followup-001-h1-ingest-recovery.md` consumed |
| purpose | production Google Forms → D1 ingest の H1（未稼働・全 error）を、Cloudflare secrets readiness、cron tail、stale `sync_jobs` reset、diagnostics snapshot で復旧確認する runtime ops runbook |
| runtime ops | `bash scripts/cf.sh secret put/list --config apps/api/wrangler.toml --env production`, `cf.sh tail`, `cf.sh d1 execute ubm-hyogo-db-prod --env production`, authenticated `/admin/diagnostics/forms-pipeline` snapshot |
| invariant | secret values are never recorded; runtime PASS is not claimed until `snapshot-after.json` and `snapshot-diff.md` exist |
| Phase 12 | strict 7 present; root/output artifacts mirror present; 30-method compact evidence included |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-956-h1-ingest-recovery-artifact-inventory.md` |
| user gate | production secret mutation, production D1 SELECT/UPDATE, authenticated snapshot capture, cron tail, commit, push, PR |

## admin-identity-conflicts-prototype-alignment-and-404-fix（2026-05-27）
## admin-audit-prototype-alignment（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-audit-prototype-alignment/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | `/admin/audit` を admin prototype design language に整え、staging `admin api /admin/audit?limit=50 failed: 404` を H1〜H5 で切り分けて復旧する |
| implementation targets | `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx`, `apps/web/src/lib/admin/safe-server-fetch.ts`, `apps/api/src/routes/admin/audit.ts` |
| contract | `AdminAuditListResponseZ` / D1 schema / auth middleware は変更しない。`Button` は `polymorphic link rendering` 非対応のため reset link は `buttonVariants` を使う。`Banner` は `tone="warning"`。 |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-audit-prototype-alignment-artifact-inventory.md` |
| local evidence | web suite 158 files / 1158 tests PASS; api suite 66 files / 415 tests PASS; D1 audit contract 10 PASS; Phase 11 screenshots `admin-audit-{default,filtered,empty}.png` |
| user gate | staging deploy, secret mutation, authenticated staging visual baseline, commit, push, PR |

## admin-identity-conflicts-prototype-alignment-and-404-fix（2026-05-27）
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_runtime_pending_user_gate` |
| purpose | `/admin/identity-conflicts` を admin prototype primitives に整合し、staging `ADMIN_FETCH_404` を deploy/env/runtime 境界で切り分ける |
| implementation | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| invariant | API route / D1 schema / admin auth / proxy route は変更しない。SSR list fetch 404 は staging API deploy または `INTERNAL_API_BASE_URL` を first hypothesis として user-gated triage |
| evidence | web typecheck PASS, web Vitest 159 files / 1154 tests PASS, root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-identity-conflicts-prototype-alignment-and-404-fix-artifact-inventory.md` |
| user gate | staging deploy/env verification, authenticated runtime curl, visual screenshots, commit, push, PR |
## unified-sidebar-shell-public-and-admin（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` |
| workflow root | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` |
| status | `spec_created / implementation / VISUAL / implementation_pending` |
| purpose | public / member / admin の shell を単一 collapsible `SidebarShell` primitive に統合する実装仕様 |
| route scope | public 6 routes、member `/profile`、admin 9 routes |
| nav contract | viewer=public 3、member=public 3 + members 1、admin=public 3 + members 1 + admin 9 = total 13 |
| sub-workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/`（standalone `docs/30-workflows/task-A-sidebar-shell-primitive/` から親配下へ統合済み） |
| implementation targets | `apps/web/src/components/shell/**`, `(public)/(member)/(admin)/layout.tsx`, `apps/web/src/styles/tokens.css`, sidebar smoke/visual Playwright specs |
| invariant | API / D1 / Google Form schema / Auth.js middleware / npm package 変更なし。role 判定は `SessionUser.isAdmin` のみ |
| Phase 12 | strict 7 present、root/output `artifacts.json` parity present、30-method compact evidence present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-unified-sidebar-shell-public-and-admin-artifact-inventory.md` |
| user gate | apps/web implementation, local visual capture, CI baseline, commit, push, PR |

## admin-layout-sidebar-shell-migration（2026-05-29）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL`（2026-05-29 実装完了） |
| parent | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` Task D（Task A/B/E も本 wave で実装） |
| purpose | `apps/web/app/(admin)/layout.tsx` を `SidebarShellServer` 消費側へ移行し、旧 `AdminSidebar` ownership を削除（user 承認で Task A/B/E 一括実装・CONST_009） |
| implemented targets | added `apps/web/src/components/shell/**`（15 component + 6 spec）, `apps/web/src/lib/admin/schema-diff-count.ts`(+spec); edited `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/layout.spec.tsx`, `apps/web/src/styles/tokens.css`; deleted old `apps/web/src/components/layout/AdminSidebar*`（grep 0 hit） |
| invariant | API / D1 / Google Form / Auth.js middleware 変更なし。admin auth guard と `/login?next=/admin` / `/login?gate=forbidden` redirect を維持 |
| local evidence | typecheck 6/6 Done / lint OK / web Vitest 1299 passed・1 skipped / AC-2 grep 0 hit |
| Phase 12 | strict 7 present（implemented state）、root/output `artifacts.json` parity present、30-method compact evidence present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-layout-sidebar-shell-migration-artifact-inventory.md` |
| user gate | staging visual capture, commit, push, PR。follow-up FU-ALSSM-001（collapse 永続化 cookie 方式・user 判断待ち） |
| user gate | Task A/B completion, apps/web implementation, focused tests, local visual capture, commit, push, PR |

## task-c-public-member-sidebar-shell-integration（2026-05-29）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/task-c-public-member-sidebar-shell-integration/` |
| status | `spec_created / implementation / VISUAL / implementation_pending` |
| parent | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` Task C |
| purpose | 公開 6 route と会員 `/profile` を共通 `SidebarShell` へ統合し、旧 `PublicHeader` / `MemberHeader` を削除する実装 |
| implementation targets | `apps/web/src/components/shell/**`, `(public)/(member)` layouts, root/legal/login route group moves, profile page header removal, old header components and specs, focused specs |
| dependency boundary | Task A/B/E shell primitives are locally implemented; Task C only mounts `SidebarShellServer` |
| Phase 12 | strict 7 present、root/output `artifacts.json` parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-c-public-member-sidebar-shell-integration-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-c-public-member-sidebar-shell-integration-2026-05.md` |
| user gate | pixel screenshot capture, staging visual baseline, commit, push, PR |

### Task B sub-workflow: user menu and role handling

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/` |
| status | `spec_created / implementation / VISUAL / implementation_pending` |
| parent | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` |
| source task | `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md` |
| purpose | Sidebar left-bottom user menu actions for `viewer` / `member` / `admin` |
| action contract | viewer=login、member=profile/edit-request/signout、admin=profile/edit-request/admin-dashboard/signout |
| strict 7 | parent root owns strict 7; sub owns only `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact parity | root/output `artifacts.json` present |
| user gate | apps/web implementation, focused vitest, local/staging visual, commit, push, PR |

## profile-server-components-render-error（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/profile-server-components-render-error/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging_runtime_pending_user_gate` |
| task | `TASK-FIX-PROFILE-SCR-ERR-STG-001` |
| related | `docs/30-workflows/fix-admin-server-components-render-error-stg/` |
| purpose | staging `/profile` の Server Components render error (`digest=398449091`, `scope=profile`) を、member authed fetch の Workers env 解決是正と `/me` safe degradation で解消する |
| implementation | `apps/web/src/lib/fetch/authed.ts` は env.ts の `getApiBaseEnv()` 経由で `INTERNAL_API_BASE_URL` -> `PUBLIC_API_BASE_URL` を解決し、localhost fallback を禁止。`apps/web/app/(member)/profile/page.tsx` は初回 `/me` を `safeServerFetch` でラップし、AuthRequiredError 以外を SectionError に降格 |
| tests | `apps/web/src/lib/fetch/authed.spec.ts`, `apps/web/app/(member)/profile/page.spec.tsx` |
| evidence | focused Vitest 43 PASS、web typecheck PASS、web lint PASS、`authed.ts` source guard (`process.env[` 0 / `127.0.0.1` 0)、Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-profile-server-components-render-error-artifact-inventory.md` |
| user gate | Cloudflare staging deploy, authenticated `/profile` curl, tail clean evidence, commit, push, PR |

## admin-meetings-prototype-alignment（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_runtime_pending_user_approval` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| purpose | `/admin/meetings` list と `/admin/meetings/[id]` detail を prototype-aligned admin primitives に整流する実装仕様 |
| implementation contract | `MeetingPanel.tsx` 廃止、`apps/web/src/features/admin/components/_meetings/{MeetingsClientShell,MeetingCreateForm,MeetingTimeline,MeetingAttendanceDrawer,meetingStats}` 新設、detail panels を `AdminSectionCard` / `AdminTable` へ整流 |
| invariant | existing admin meetings endpoints only; API response shape / D1 schema / Google Form schema unchanged; OKLch token only; `useAdminMutation` and `safeServerFetch` retained |
| Phase 12 | strict 7 present; root/output artifacts parity present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-meetings-prototype-alignment-artifact-inventory.md` |
| user gate | staging refresh/deploy, staging runtime observation, commit, push, PR |

## admin-ui-task-d-attendance-primitive-conformance（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / implementation_complete_pending_pr` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` Task D |
| purpose | `/admin/dashboard/attendance` を `AdminPageHeader` + `KpiCard` + `AdminTable` へ整流し、旧 inline KPI / 裸 table の孤立島を解消する |
| implementation targets | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`, `apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx`, page-local focused spec, Playwright visual spec, mock API fixture, primitive adoption grep gate |
| boundary | API / D1 / response shape 変更なし。`AdminTable` column 関数は client island 内に閉じる。`KpiGrid` は dashboard totals 固定のため使わない |
| Phase 12 | strict 7 present。root/output `artifacts.json` parity present。Phase 11 screenshot 3 枚 captured |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-task-d-attendance-primitive-conformance-artifact-inventory.md` |
| user gate | commit, push, PR, staging visual baseline |

## admin-dashboard-recovery-and-byZone（2026-05-26）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| source task | `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-B-dashboard-recovery-and-byZone.md` |
| scope | `/admin` dashboard fetch 404 recovery + existing `GET /admin/dashboard` optional `byZone` response extension + prototype-conformant `ZoneDistribution` |
| implementation targets | `packages/shared/src/zod/viewmodel.ts`, `apps/api/src/routes/admin/dashboard.ts`, `apps/api/src/routes/admin/_shared/byZone.ts`, `apps/web/src/lib/admin/admin-dashboard-ui.ts`, `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx`, `apps/web/src/lib/admin/{safe-server-fetch,server-fetch}.ts`, `apps/web/wrangler.toml`, `apps/web/src/styles/tokens.css` |
| Phase 12 | strict 7 outputs + root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-dashboard-recovery-and-byZone-artifact-inventory.md` |
| user gate | staging deploy, wrangler tail, staging curl evidence, commit, push, PR |

## admin-attendance-analytics-redesign（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL / staging_visual_pending` |
| purpose | Existing Admin attendance dashboard を、period/zone filter、trend、zone distribution、session drilldown、absentees、CSV export を含む redesign としてローカル実装 |
| baseline | `ut-02a-followup-002-attendance-dashboard-analytics` は historical baseline。本 workflow が current local redesign implementation |
| implemented API | `/admin/dashboard/attendance/{overview,by-session,ranking,trend,zone-distribution,sessions/:sessionId/attendees,absentees,export}` |
| implementation targets | `apps/api/src/routes/admin/dashboard.ts`, `apps/api/src/repository/attendance-analytics.ts`, `apps/api/src/lib/{csv-export,parse-attendance-filter}.ts`, `packages/shared/src/zod/admin-attendance.ts`, `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`, `apps/web/src/features/admin/attendance/**` |
| Phase 11 | `outputs/phase-11/runtime-evidence.md` records local test/typecheck/lint/build evidence; staging visual pending |
| Phase 12 | strict 7 present under `outputs/phase-12/`; implemented-local state and aiworkflow ledgers synced |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-attendance-analytics-redesign-artifact-inventory.md` |
| user gate | staging deploy, runtime visual capture, CSV runtime verification, commit, push, PR |

## admin-ui-prototype-alignment follow-up 001 members fetch and visual（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-001-members-fetch-and-visual/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` (`implemented_local_runtime_pending`) |
| purpose | `/admin/members` 一覧 + drawer を prototype `pages-admin.jsx` L162-366 に整合し、staging `ADMIN_FETCH_404` を root-cause fix する |
| local implementation | `server-fetch.ts`, `app/api/admin/[...path]/route.ts`, `apps/api/src/routes/admin/members.ts`, `_members/{MembersTable,MembersFilters,MemberDrawer}.tsx`, `members-view-model.ts`, additive ViewModel fields, focused Vitest |
| Phase 11 | runtime screenshots and `/admin/members` 200 trace are pending user-gated staging execution |
| Phase 12 | strict 7 files present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-prototype-alignment-followup-001-members-fetch-and-visual-artifact-inventory.md` |
| user gate | staging deploy, baseline PNG capture, commit, push, PR |

## admin-ui-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-ui-prototype-alignment/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / 11 admin routes` |
| scope | 11 admin routes（dashboard / attendance / members / tags / meetings / meetings/[id] / schema / schema/history / requests / identity-conflicts / audit）の prototype alignment + 共通 component 6 種 + per-section degrade pattern |
| per-section degrade | `apps/web/src/lib/result.ts`（`SafeResult<T>`）+ `apps/web/src/lib/admin/safe-server-fetch.ts` で throw を normalize → `Promise.all` 後に section 毎に `result.ok` 分岐 → `AdminSectionError` で degrade。`error.tsx` は renderer crash 専用に縮小（L-AUIP-001 / 再利用 Pattern 1） |
| 共通 component | `apps/web/src/features/admin/components/_shared/{AdminSectionCard,AdminSectionError,AdminEmptyState,AdminStat,AdminTable,AdminQueuePanel}.tsx` + `index.ts` barrel export |
| import 強制 | barrel 経由のみ。深 path import を ESLint `no-restricted-imports` で deny、grep gate `rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` 0 件を Phase 5 DoD に組込（L-AUIP-003 / 再利用 Pattern 2） |
| design token | 新規 component は OKLch token のみ（`var(--ubm-color-*)`）。既存 `*Panel.tsx` の HEX 移行は別 wave へ分離（L-AUIP-004） |
| server/client boundary | server page = throw-only / view-compute-only、client wrapper = state/event-only の twin principle。`TagsClientShell` / `RequestsClientShell` で state ownership を Phase 2 fix（L-AUIP-005） |
| scope cutoff | Phase 4 test plan に scope lock TC を列挙し、test fail = scope miss として early detect（L-AUIP-006 / 再利用 Pattern 5） |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md`（L-AUIP-001..006 + 再利用可能パターン 5 件） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260523-admin-ui-prototype-alignment.md` |
| 出典 | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `unassigned-task-detection.md` |
| user gate | authenticated runtime screenshots / staging refresh / commit / push / PR |

## admin-ui-task-c-pageheader-token-conformance（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` Task C |
| purpose | 9 admin pages を `AdminPageHeader` へ統一し、`identity-conflicts/page.tsx` の独自 `<main>` と page-layer Tailwind palette literals を撤去する |
| implementation | `apps/web/app/(admin)/admin/{tags,meetings,meetings/[id],schema,schema/history,requests,identity-conflicts,audit,dashboard/attendance}/page.tsx`, `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`, `apps/web/src/components/admin/{MeetingPanel,RequestQueuePanel,AuditLogPanel,SchemaDiffHistoryPanel}.tsx`, `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx`, `apps/web/src/styles/tokens.css` |
| contract | `AdminPageHeader` is the single page-head component; `eyebrow` and `headingId` are additive. Legacy panel h1/chrome can be suppressed from Task C pages via backwards-compatible `showHeading` / `showChrome` props. API / D1 / auth / Google Form schema unchanged. |
| tests | `apps/web/src/__tests__/admin-page-header-adoption.spec.ts`, `apps/web/src/features/admin/components/_layout/__tests__/AdminPageHeader.spec.tsx`, `apps/web/playwright/tests/admin-pageheader-task-c.spec.ts`, token runtime spec, primitive adoption gate |
| Phase 11/12 | 9 local authenticated screenshots present; strict 7 present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-task-c-pageheader-token-conformance-artifact-inventory.md` |
| user gate | staging authenticated screenshots, visual baseline refresh, commit, push, PR |

## admin-shell-topbar-sidebar-integration（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| purpose | Admin shell topbar slot を廃止し、breadcrumb/title/actions を page-local `AdminPageHeader` に集約。Sidebar は prototype 準拠の 3 group / 13 nav items total / active / schema badge / user-chip footer へ刷新する |
| #894/#895 alignment | #894 root breadcrumb slot / #895 topbar actions island は CLOSED 維持。新 workflow は slot 継続ではなく page-head 集約を current contract とする |
| implementation targets | `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx`, `AdminSidebarNavItem.tsx`, `AdminBrandBlock.tsx`, `isActive.ts`, `apps/web/src/lib/admin/server-fetch.ts`, related specs, `apps/web/playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts` |
| Phase 11/12 | local Playwright fixture screenshots captured; strict 7 present; root/output `artifacts.json` parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-shell-topbar-sidebar-integration-artifact-inventory.md` |
| user gate | staging visual baseline, commit, push, PR |

## register-page-prototype-alignment（2026-05-26）
## public-dashboard-prototype-alignment（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/public-dashboard-prototype-alignment/` |
| status | `implementation_reviewed / implementation / VISUAL / phase11_runtime_pending` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/public-dashboard-prototype-alignment-2026-05.md` |
| purpose | public home `/` を prototype `pages-public.jsx` LandingPage に合わせ、Hero / Stats / About+ThreeZones / Featured / Recent Meetings / CTA の実装契約を固定する |
| implementation targets | `apps/web/app/page.tsx`, `apps/web/src/components/public/{Hero,Stats,AboutUbm,ZoneIntro,MemberGrid,Timeline}.tsx`, `apps/web/src/styles/legacy-public.css` |
| invariants | 新規 API endpoint / D1 schema / Google Form / npm package 追加なし。OKLch token 経由、HEX 直書き禁止 |
| Phase 12 | strict 7 present; root/output artifacts mirror present; 30-method compact evidence included |
| Phase 11 | screenshots and manual evaluation are pending, not PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-public-dashboard-prototype-alignment-artifact-inventory.md` |
| user gate | implementation, local visual capture, staging refresh, commit, push, PR |

## login-stale-link-and-profile-me-safe-fetch（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-stale-link-and-profile-me-safe-fetch/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| purpose | `/login` stale `[object Object]` link guard and `/profile` leading `/me` safe fetch degradation |
| implementation | `apps/web/app/(member)/profile/page.tsx`, `apps/web/src/lib/url/safe-redirect.ts`, `apps/web/src/lib/url/login-query.ts`, `apps/web/app/login/page.tsx` |
| tests | `apps/web/app/(member)/profile/page.spec.tsx`, `apps/web/src/lib/url/login-query.spec.ts`, `apps/web/src/lib/url/login-redirect.spec.ts`, `apps/web/src/lib/url/login-state.spec.ts` |
| contract | non-string redirect values fall back to `/profile`; `/me` 401 redirects, non-auth failures render member `SectionError`; `/me/profile` 404 remains `notFound()` |
| Phase 12 | strict 7 present under `outputs/phase-12/`; root/output artifacts parity present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-login-stale-link-and-profile-me-safe-fetch-artifact-inventory.md` |
| user gate | staging deploy, authenticated profile/login screenshots, commit, push, PR |

## login-ui-balance-and-runtime-fix（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | `/login` input/button visual balance, Google brand icon CSS isolation, magic-link internal API env runtime fix, and prototype local serving repair |
| implementation | `apps/web/src/styles/auth.css`, `apps/web/src/styles/legacy-public.css`, `apps/web/app/api/auth/magic-link/{route,verify/route}.ts`, `apps/web/app/api/auth/gate-state/route.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/app/api/me/[...path]/route.ts`, `apps/web/src/lib/auth/verify-magic-link.ts`, `apps/web/src/lib/fetch/authed.ts`, `scripts/verify-no-process-env-internal-api.sh`, `scripts/serve-prototype.sh` |
| contract | production code resolves `INTERNAL_API_BASE_URL` through `apps/web/src/lib/env.ts` accessors; Google SVG remains an image and is excluded from legacy `[data-size]` circular styling |
| Phase 12 | strict 7 present under `outputs/phase-12/`; output artifacts parity present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-login-ui-balance-and-runtime-fix-artifact-inventory.md` |
| user gate | Playwright visual screenshots, staging deploy/smoke, commit, push, PR |

## google-form-reflection-diagnostics（2026-05-26）
## members-not-displaying-form-sync-investigation（2026-05-28）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | staging `/members` 0 件問題の原因特定と local repair implementation |
| API | existing `GET /admin/diagnostics/forms-pipeline`; implemented CLI-safe `GET /admin/sync/diagnostics/forms-pipeline`; implemented `POST /admin/sync/backfill-publish-state` |
| key rules | canonical publish state is `public/member_only/hidden`; public directory requires strict `publish_state='public'`; no `member_status_history` dependency |
| evidence | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/outputs/phase-11/local-verification.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md` |
| user gate | staging deploy, diagnostics, backfill apply, browser smoke, commit, push, PR |

## Issue #924 style-src-attr retirement（2026-05-25）
## admin-visual-baseline-admin-routes-task-e（2026-05-27）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / admin visual baseline` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` Task E |
| scope | 10 required admin routes x 4 viewport = 40 PNG by default; 2 env-gated detail routes enable full 48 PNG only when both seed IDs are present; 44 PNG partial-detail baseline is forbidden |
| implementation targets | `apps/web/playwright/tests/visual/admin-shell/*.spec.ts`, `apps/web/playwright/tests/visual/admin-shell/_helpers.ts`, `apps/web/playwright.config.ts`, `.github/workflows/playwright-smoke.yml` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-visual-baseline-admin-routes-task-e-artifact-inventory.md` |
| Phase 12 | strict 7 present; root/output `artifacts.json` parity present |
| user gate | Linux baseline capture, bot push, empty retrigger commit, branch protection PUT, commit, push, PR |

## admin-ui-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-ui-prototype-alignment/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / 11 admin routes` |
| scope | 11 admin routes（dashboard / attendance / members / tags / meetings / meetings/[id] / schema / schema/history / requests / identity-conflicts / audit）の prototype alignment + 共通 component 6 種 + per-section degrade pattern |
| per-section degrade | `apps/web/src/lib/result.ts`（`SafeResult<T>`）+ `apps/web/src/lib/admin/safe-server-fetch.ts` で throw を normalize → `Promise.all` 後に section 毎に `result.ok` 分岐 → `AdminSectionError` で degrade。`error.tsx` は renderer crash 専用に縮小（L-AUIP-001 / 再利用 Pattern 1） |
| 共通 component | `apps/web/src/features/admin/components/_shared/{AdminSectionCard,AdminSectionError,AdminEmptyState,AdminStat,AdminTable,AdminQueuePanel}.tsx` + `index.ts` barrel export |
| import 強制 | barrel 経由のみ。深 path import を ESLint `no-restricted-imports` で deny、grep gate `rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` 0 件を Phase 5 DoD に組込（L-AUIP-003 / 再利用 Pattern 2） |
| design token | 新規 component は OKLch token のみ（`var(--ubm-color-*)`）。既存 `*Panel.tsx` の HEX 移行は別 wave へ分離（L-AUIP-004） |
| server/client boundary | server page = throw-only / view-compute-only、client wrapper = state/event-only の twin principle。`TagsClientShell` / `RequestsClientShell` で state ownership を Phase 2 fix（L-AUIP-005） |
| scope cutoff | Phase 4 test plan に scope lock TC を列挙し、test fail = scope miss として early detect（L-AUIP-006 / 再利用 Pattern 5） |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md`（L-AUIP-001..006 + 再利用可能パターン 5 件） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260523-admin-ui-prototype-alignment.md` |
| 出典 | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `unassigned-task-detection.md` |
| user gate | authenticated runtime screenshots / staging refresh / commit / push / PR |

## register-page-prototype-alignment（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/` |
| status | `local_static_pass_browser_pending / implementation / VISUAL` |
| issue | #924 CLOSED。PR 文脈は `Refs #924` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/` |
| purpose | `style-src-attr 'unsafe-inline'` を CSP から撤去し、CSP 対象 DOM の React inline style props を禁止する |
| implementation | `apps/web/src/lib/security-headers.ts`, CSP-relevant `apps/web/src` / `apps/web/app` TSX, `apps/web/src/styles/{globals,legacy-public}.css`, `scripts/verify-no-inline-style.sh`, `package.json`, `lefthook.yml` |
| evidence | `bash scripts/verify-no-inline-style.sh` PASS, focused Vitest 59 PASS, web typecheck PASS, static visual sanity screenshot present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-924-style-src-attr-retirement-artifact-inventory.md` |
| boundary | `ImageResponse` routes excluded; browser visual regression, staging verification, commit, push, PR are user-gated |

## Issue #922 production admin runtime smoke gate（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| issue | #922 CLOSED。PR 文脈は `Refs #922` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/` |
| purpose | staging deploy 後の authenticated `/admin` runtime smoke gate を production deploy 後にも対称展開する |
| implementation | `scripts/smoke/runtime-admin-web.sh`, `scripts/smoke/mint-staging-session-cookie.mts`, `.github/workflows/web-cd.yml admin-runtime-smoke-production` |
| tests | `scripts/smoke/__tests__/runtime-admin-web.test.sh`, `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` |
| evidence | shell contract PASS, vitest 9 PASS, Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-922-production-admin-runtime-smoke-gate-artifact-inventory.md` |
| boundary | production-runtime-smoke Environment secrets, real production `/admin` probe, intentional regression evidence, required status check PUT, commit, push, PR are user-gated |

## public-header-my-profile-nav-alignment（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/public-header-my-profile-nav-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / browser_smoke_pending_user_gate` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| purpose | 公開ヘッダのログイン中 CTA を `/profile` の「マイページ」に切り替え、公開層からマイページへ 1 click で到達可能にする |
| implementation | `PublicHeader` は sync presentational、`PublicHeaderWithPath` は `usePathname()` island、`SessionAwarePublicHeader` は `getSession()` server wrapper |
| tests | `PublicHeader.spec.tsx`, `SessionAwarePublicHeader.spec.tsx`, `(public)/layout.spec.tsx` |
| Phase 12 | strict 7 present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-public-header-my-profile-nav-alignment-artifact-inventory.md` |
| boundary | browser/session smoke, commit, push, PR are user-gated |

## admin-tag-queue-ui-and-404-recovery（2026-05-27）

| 項目 | 内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-tag-queue-ui-and-404-recovery/` |
| state | `implemented_local_runtime_pending / implementation / VISUAL` |
| scope | `/admin/tags` prototype alignment + admin fetch 404 recovery hints |
| implementation targets | `apps/web/app/(admin)/admin/tags/page.tsx`, `apps/web/src/components/admin/TagQueuePanel.tsx`, `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`, `apps/web/src/lib/admin/server-fetch.ts` |
| API boundary | existing `GET /admin/tags/queue` + `POST /admin/tags/queue/:queueId/resolve`; no D1/API/schema change |
| local evidence | `docs/30-workflows/completed-tasks/admin-tag-queue-ui-and-404-recovery/outputs/phase-11/local-vitest-summary.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-tag-queue-ui-and-404-recovery-artifact-inventory.md` |
| runtime boundary | staging visual screenshots, deploy, commit, push, and PR are user-gated |

## admin-ui-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-ui-prototype-alignment/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / 11 admin routes` |
| scope | 11 admin routes（dashboard / attendance / members / tags / meetings / meetings/[id] / schema / schema/history / requests / identity-conflicts / audit）の prototype alignment + 共通 component 6 種 + per-section degrade pattern |
| per-section degrade | `apps/web/src/lib/result.ts`（`SafeResult<T>`）+ `apps/web/src/lib/admin/safe-server-fetch.ts` で throw を normalize → `Promise.all` 後に section 毎に `result.ok` 分岐 → `AdminSectionError` で degrade。`error.tsx` は renderer crash 専用に縮小（L-AUIP-001 / 再利用 Pattern 1） |
| 共通 component | `apps/web/src/features/admin/components/_shared/{AdminSectionCard,AdminSectionError,AdminEmptyState,AdminStat,AdminTable,AdminQueuePanel}.tsx` + `index.ts` barrel export |
| import 強制 | barrel 経由のみ。深 path import を ESLint `no-restricted-imports` で deny、grep gate `rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` 0 件を Phase 5 DoD に組込（L-AUIP-003 / 再利用 Pattern 2） |
| design token | 新規 component は OKLch token のみ（`var(--ubm-color-*)`）。既存 `*Panel.tsx` の HEX 移行は別 wave へ分離（L-AUIP-004） |
| server/client boundary | server page = throw-only / view-compute-only、client wrapper = state/event-only の twin principle。`TagsClientShell` / `RequestsClientShell` で state ownership を Phase 2 fix（L-AUIP-005） |
| scope cutoff | Phase 4 test plan に scope lock TC を列挙し、test fail = scope miss として early detect（L-AUIP-006 / 再利用 Pattern 5） |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md`（L-AUIP-001..006 + 再利用可能パターン 5 件） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260523-admin-ui-prototype-alignment.md` |
| 出典 | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `unassigned-task-detection.md` |
| user gate | authenticated runtime screenshots / staging refresh / commit / push / PR |

## register-page-prototype-alignment（2026-05-26）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/register-page-prototype-alignment/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / Phase 13 pending_user_approval` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` task-12 系列 |
| purpose | `/register` を prototype `MemberFormPage` に合わせ、Hero CTA / 3-step flow / collapsible FormPreview / 3 FAQ / bottom CTA へ再構成する |
| implementation | `apps/web/app/(public)/register/page.tsx`, `apps/web/src/components/public/{RegisterHeroCallout,RegisterStepGrid,RegisterFaq,RegisterBottomCTA,FormPreviewSections}.tsx`, focused component specs, `apps/web/playwright/tests/register-prototype-alignment.spec.ts`, `apps/web/src/styles/legacy-public.css` |
| contract | 既存 `/public/form-preview` と `FORM_RESPONDER_URL` のみ使用。D1/API/schema/auth 変更なし。`data-component="register-callout"` / `data-role="register-cta"` は後方互換で維持 |
| Phase 12 | strict 7 present。root/output `artifacts.json` parity present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-register-page-prototype-alignment-artifact-inventory.md` |
| user gate | commit, push, PR, external staging observation |
| workflow root | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| purpose | Google Form 31 項目が admin / profile / public 3 経路で反映されない事象を H1 ingest / H2 identity / H3 visibility / H4 alias に切り分ける |
| implementation | `apps/api/src/diagnostics/*`, `apps/web/app/(admin)/admin/sync-status/page.tsx`, `apps/web/src/features/admin/diagnostics/*`, `apps/web/src/features/admin/components/_members/MemberDiagnosticsPanel.tsx` |
| API | `GET /admin/diagnostics/forms-pipeline`, `GET /admin/diagnostics/member/:memberId` |
| invariant | secret readiness は boolean のみ。`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` / `AUTH_SECRET` の実値・末尾・hash は返さない |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-google-form-reflection-diagnostics-artifact-inventory.md` |
| user gate | staging deploy, authenticated screenshots, Spec-B issue filing, commit, push, PR |

## google-form-reflection-diagnostics-fu-002-h2-identity-rebuild（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics-fu-002-h2-identity-rebuild/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| parent | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| purpose | H2 identity gap: verified Form email exists in `member_responses` but `member_identities` is missing, causing login to fall through as unregistered |
| implementation | migration `0021_backfill_member_identities.sql`, identity auto-link repository helpers, `/auth/session-resolve` integration |
| invariant | `response_email` is matched by `lower(trim(...))`; `tag_assignment_queue(response_id, member_id)` is the only existing member-id bridge; bridge-less auto-link creates `autolink:<uuid>` and still requires `member_status` gates |
| tests | `identities.autolink.spec.ts`, `session-resolve.contract.spec.ts` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild-artifact-inventory.md` |
| user gate | staging/prod D1 backup, migration apply, deployed diagnostics capture, commit, push, PR |

## Issue #901 authenticated profile/admin staging visual（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/` |
| status | `spec_created / implementation / VISUAL / runtime_pending` |
| issue | #901 CLOSED。PR 文脈は `Refs #901` のみ |
| source | `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` consumed |
| parent | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` の `VISUAL_RUNTIME_AUTHENTICATED_PENDING` |
| purpose | `signSessionJwt(secret, input)` 由来の ephemeral storageState で `/profile` member session と `/admin` admin session の authenticated staging visual baseline を取得する実装仕様 |
| implementation targets | `apps/web/playwright/scripts/mint-staging-storage-state.ts`, `apps/web/playwright/tests/visual-staging-authenticated/*.spec.ts`, `apps/web/playwright.config.ts`, `apps/web/app/profile/page.tsx`, `apps/web/app/(admin)/admin/page.tsx`, `apps/web/.gitignore`, `.github/workflows/playwright-staging-visual-authenticated.yml` |
| Phase 11 | contract files present; runtime logs and PNG screenshots are pending, not PASS |
| Phase 12 | strict 7 present under `outputs/phase-12/` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-901-authenticated-profile-admin-staging-visual-artifact-inventory.md` |
| user gate | implementation, staging screenshot capture, parent gate release, commit, push, PR |

## issue-900-workflow-permissions-least-privilege-audit（2026-05-25）

| key | value |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| workflow root | `docs/30-workflows/completed-tasks/issue-900-workflow-permissions-least-privilege-audit/` |
| purpose | all GitHub Actions workflows declare top-level least-privilege token permissions |
| baseline | top-level `permissions: contents: read`; job-level write overrides remain job-scoped |
| guard | `scripts/verify-workflow-top-level-permissions.sh` in `.github/workflows/ci.yml` after actionlint |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-900-workflow-permissions-least-privilege-audit-artifact-inventory.md` |
| user gate | commit, push, PR, remote CI observation |

## issue-894-admin-topbar-breadcrumb-integration（2026-05-25）

| workflow root | `docs/30-workflows/completed-tasks/issue-894-admin-topbar-breadcrumb-integration/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / implementation_complete_pending_pr` |
| issue | #894 CLOSED; PR wording is `Refs #894` only |
| purpose | Move admin root breadcrumb ownership to `AdminTopbar`; page-local breadcrumbs show current page only |
| implementation | `apps/web/app/(admin)/layout.tsx`, 8 `apps/web/app/(admin)/admin/**/page.tsx` breadcrumb consumers, focused layout/Breadcrumb specs, authenticated admin screenshot evidence |
| tests | `apps/web/app/(admin)/layout.spec.tsx` (4 PASS), `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` (2 PASS), workspace typecheck/lint PASS |
| Phase 12 | strict 7 files present under `outputs/phase-12/` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-894-admin-topbar-breadcrumb-integration-artifact-inventory.md` |
| user gate | commit, push, PR, Issue mutation |

## Issue #895 AdminTopbar actions client island（2026-05-25）

| workflow root | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| source | `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md` consumed |
| purpose | `AdminTopbar.actions` に admin global actions client island を注入し、既存 `SignOutButton` を topbar へ集約する |
| implementation | `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx`, `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`, `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/layout.spec.tsx` |
| contract | topbar actions = global admin shell actions; `AdminPageHeader.actions` = page-specific actions. `AdminTopbar` and `(admin)/layout.tsx` remain server components. |
| Phase 12 | strict 7 files present under `outputs/phase-12/`; Phase 11 local evidence present; screenshot N/A (`NON_VISUAL`) |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-895-admin-topbar-actions-client-island-artifact-inventory.md` |
| user gate | commit, push, PR |

## Issue #247 apps/web OpenNext config regression tests（2026-05-26）

| workflow root | `docs/30-workflows/completed-tasks/issue-247-apps-web-opennext-config-regression-tests/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending` |
| issue | #247; commit / push / PR / issue mutation are user-gated |
| purpose | OpenNext Workers wrangler config drift を focused Vitest + CI step で fail-fast にする |
| implementation | `apps/web/__tests__/opennext-config-regression.spec.ts`, `.github/workflows/ci.yml` |
| contract | `pages_build_output_dir` 禁止、`.open-next` assets binding、package deploy script 禁止、`.assetsignore` required lines |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-247-apps-web-opennext-config-regression-tests-artifact-inventory.md` |

## Issue #891 member detail kind exhaustiveness guard（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-891-member-detail-kind-exhaustiveness-guard/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| issue | #891 CLOSED; source follow-up from issue #827 consumed |
| purpose | `FieldKindZ` 全 kind を `KIND_ROUTE` で網羅分類し、分類漏れを typecheck と adapter spec で fail-fast にする |
| implementation | `apps/web/src/lib/adapters/member-detail.ts`, `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`, `apps/web/src/components/public/MemberDetail.tsx` |
| contract | `KIND_ROUTE satisfies Record<FieldKind, KindRoute>`; detail output is derived from `KIND_ROUTE === "detail"` and url links are derived from `KIND_ROUTE === "links"` into `MemberLinks` |
| system specs | `docs/00-getting-started-manual/specs/04-types.md`, `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-891-member-detail-kind-exhaustiveness-guard-artifact-inventory.md` |
| user gate | commit, push, PR, visual baseline update |

## regression-evidence-ci-gate-foundation（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/regression-evidence-ci-gate-foundation/` |
| status | `spec_created / implementation / VISUAL / runtime_pending` |
| canonical role | `ui-prototype-design-system-foundation/serial-07-regression-evidence` の top-level execution root |
| purpose | Playwright visual 4 screens と CI gate 6 件で UI prototype alignment の regression を防ぐ |
| planned visual specs | `apps/web/playwright/tests/visual/{top,members-list,member-detail,admin-dashboard}.spec.ts` |
| Phase 12 | strict 7 files present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-regression-evidence-ci-gate-foundation-artifact-inventory.md` |
| user gate | Playwright visual run, baseline PNG capture, branch protection mutation, commit, push, PR |

## Issue #883 adapter dev warn unknown kind（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-883-adapter-dev-warn-unknown-kind/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| issue | #883 CLOSED。PR 文脈は `Refs #883` のみ |
| parent | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |
| scope | `toMemberDetailProps` に optional `onUnknownKind` callback を追加し、dev 環境のみ page.tsx から `console.warn` を注入 |
| implementation | `apps/web/src/lib/adapters/member-detail.ts`, `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`, `apps/web/app/(public)/members/[id]/page.tsx` |
| evidence | typecheck / lint / adapter spec 10 / apps-web test 1028 / production build / DCE grep `0` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-883-adapter-dev-warn-unknown-kind-artifact-inventory.md` |
| boundary | commit, push, PR are user-gated |

## Issue #882 terms prefetch env validation fix（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-882-terms-prefetch-env-validation-fix/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #882 CLOSED。PR 文脈は `Refs #882` のみ |
| parent/source | parent `docs/30-workflows/completed-tasks/home-page-prototype-alignment/`; source follow-up `docs/30-workflows/completed-tasks/home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md` consumed |
| implementation | `apps/web/src/lib/env.ts` adds `getPublicEnvSafe()`; `apps/web/src/lib/seo/site-metadata.ts` uses metadata-only local fallback + noindex |
| system spec | `docs/00-getting-started-manual/specs/05-pages.md` records the public metadata env fallback contract |
| tests | `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`, `apps/web/playwright/tests/terms-prefetch.spec.ts` |
| evidence | web Vitest 1030 PASS, web typecheck PASS, web lint PASS, Playwright `/terms` prefetch smoke PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-882-terms-prefetch-env-validation-fix-artifact-inventory.md` |
| boundary | `getEnv()` / `getPublicEnv()` throw contract unchanged. commit / push / PR / staging deploy are user-gated |

## admin-ui-prototype-alignment follow-up 002 section error retry（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/` |
| status | `implementation_reviewed / implementation / NON_VISUAL / local evidence PASS` |
| issue | #881 CLOSED。PR 文脈は `Refs #881` のみ |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| purpose | `AdminSectionError` の retry CTA を client boundary 経由で実装する仕様。page server component は維持し、`router.refresh()` は `AdminSectionErrorClient` 内に閉じ込める |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files + local evidence present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-prototype-alignment-followup-002-section-error-retry-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-section-error-retry-2026-05.md`（L-ASR-001..005）、`.claude/skills/task-specification-creator/lessons-learned/rsc-client-boundary-callback-injection.md`（L-RSC-001..005） |
| local evidence | focused Vitest 19+2 PASS including `jest-axe` (AC-3/AC-4 transition assertion 追加); root lint/typecheck PASS; design-token and client-boundary grep PASS |
| user gate | commit, push, PR |

## admin-ui-prototype-alignment follow-up 003 admin members prototype redesign（2026-05-27）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| purpose | `/admin/members` を prototype L162-366 に合わせて in-place rewrite し、local visual evidence を取得 |
| implementation targets | `_members/**`, `_shared/{TagPill,PillNav}.tsx`, `member-hue.ts`, admin members page, `globals.css` mobile admin shell fix |
| Phase 11/12 | focused Vitest 25 PASS, web typecheck PASS, 16 local screenshots present; strict 7 outputs present; root-only `artifacts.json` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign-artifact-inventory.md` |
| user gate | staging deploy, authenticated staging visual baseline, commit, push, PR |

## Issue #913 server idempotency key persistence（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-913-server-idempotency-key-persistence/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #913 CLOSED; PR wording is `Refs #913` |
| parent | `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/` |
| purpose | Persist and replay admin mutation `Idempotency-Key` requests server-side so client retry/header support is actually enforced by apps/api |
| implementation | `apps/api/migrations/0021_idempotency_keys.sql`, `apps/api/src/repository/idempotency.repository.ts`, `apps/api/src/middleware/idempotency.ts`, admin route wiring |
| contract | `(idempotency_key, method, path)` UNIQUE, request fingerprint mismatch 422, in-flight duplicate 409, completed JSON replay, 5xx/non-JSON/64KB+ rollback |
| evidence | api typecheck PASS, api lint PASS, focused middleware Vitest 3 PASS, focused repository Vitest 3 PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-913-server-idempotency-key-persistence-artifact-inventory.md` |
| user gate | D1 migration apply, deploy, staging runtime replay proof, commit, push, PR |

## Issue #880 public segment error/loading boundary（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| issue | #880 OPEN at spec creation; PR/Issue mutation user-gated |
| parent | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/` |
| purpose | Add explicit `(public)` route-group `error.tsx` / `loading.tsx` and Playwright force-throw smoke to resolve serial-06 precondition drift |
| implementation targets | `apps/web/app/(public)/error.tsx`, `apps/web/app/(public)/loading.tsx`, `apps/web/app/(public)/error-boundary-smoke/page.tsx`, `apps/web/playwright/tests/public-error-boundary.spec.ts` |
| Phase 11/12 | screenshot + focused Playwright report captured; strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-880-public-segment-error-loading-boundary-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-880-public-segment-error-loading-boundary-2026-05.md`（L-PUBERR-001 production-guarded smoke route / L-PUBERR-002 worktree webServer timeout 回避 / L-PUBERR-003 scope と route-group 1:1） |
| user gate | commit, push, PR, GitHub issue mutation |

## issue-879 safeServerFetch member/public horizontal expansion（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-879-safe-server-fetch-member-public-horizontal-expansion/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #879 CLOSED。PR body は `Refs #879` |
| implementation | `apps/web/src/lib/server-fetch/safe-fetch.ts`, `apps/web/src/lib/admin/safe-server-fetch.ts`, `apps/web/src/components/{public,member}/SectionError.tsx`, `/profile`, `/members`, `/members/[id]` pages |
| contract | auth redirect and public member 404 remain fatal framework signals; transient member/public fetch failures render SectionError and keep page chrome/filter/backlink visible |
| evidence | focused Vitest 20 PASS, web typecheck PASS, design-token gate PASS, web lint PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-879-safe-server-fetch-member-public-horizontal-expansion-artifact-inventory.md` |
| boundary | commit / push / PR / Issue mutation are user-gated |

## issue-872-google-brand-4tone-icon-and-tokens-exempt（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |
| status | `local_static_pass_browser_pending / implementation / VISUAL` |
| source | Issue #872 / FU-LOGIN-001 from `login-page-prototype-alignment` |
| purpose | Google OAuth button を official 4-tone SVG asset wrapper へ置換する仕様と、`verify-design-tokens` の brand SVG exempt を定義 |
| invariant | HEX literal は `apps/web/src/components/ui/brand-icons/*.svg` のみ exempt。`GoogleBrandIcon.tsx` / nested SVG / `.ts` / `.css` は exempt しない |
| Phase 12 | strict 7 present + validator entry `outputs/phase-12/phase-12.md` |
| Phase 11 | VISUAL auxiliary files present; render PNG present; browser screenshots pending local disk cleanup (`ENOSPC`) |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-872-google-brand-4tone-icon-and-tokens-exempt-artifact-inventory.md` |
| user gate | browser screenshot recapture after disk cleanup, visual baseline update, commit, push, PR |

## issue-871-csp-nonce-migration（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #871 CLOSED; PR should use `Refs #871`; commit / push / PR / issue mutation are user-gated |
| purpose | `apps/web` CSP nonce migration and removal of direct inline fallback from `script-src` / `style-src` |
| implementation | `apps/web/src/lib/security-headers.ts`, `apps/web/middleware.ts`, `apps/web/src/lib/security-headers.spec.ts`, `apps/web/__tests__/middleware.spec.ts`, `apps/web/playwright/tests/security-headers.spec.ts` |
| contract | request-scoped nonce via middleware; `script-src 'self' 'nonce-<n>' 'strict-dynamic'`; `style-src` / `style-src-elem` nonce; `style-src-attr` retired; report-only mode unchanged |
| evidence | `outputs/phase-11/canonical-paths.json`, focused Vitest 17 PASS, unsafe-inline grep 0 hit |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-871-csp-nonce-migration-artifact-inventory.md` |
| user gate | Playwright HTTP smoke execution, staging/production response verification, commit, push, PR |

## awshh-followup-003-csp-reporting-endpoints（2026-05-24）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #868 CLOSED; PR should use `Refs #868`; issue mutation / commit / push / PR are user-gated |
| scope | apps/web CSP report-only observation path。`Reporting-Endpoints`、CSP `report-to`、legacy `report-uri` を出力し、Sentry CSP security endpoint へ集約 |
| implementation | `apps/web/src/lib/security-headers.ts`, `apps/web/src/lib/env.ts`, `apps/web/middleware.ts`, `apps/web/src/lib/security-headers.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts` |
| contract | 新規 CSP 専用 URL env は増やさず、既存 public `NEXT_PUBLIC_SENTRY_DSN` から `buildSentryCspReportUrl()` で endpoint を導出。未設定 / 不正 DSN は report 系未出力 |
| boundary | `apps/api` / D1 / `apps/web/wrangler.toml` は不変更。staging deploy、Sentry 受信確認、commit、push、PR は user-gated |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-awshh-followup-003-csp-reporting-endpoints-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-awshh-followup-003-csp-reporting-endpoints-2026-05.md` |

### Issue #864 admin staging runtime smoke CI gate（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/` |
| state | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| purpose | staging deploy 後に authenticated `/admin` を実トラフィックで叩き、Server Components render error digest `167275886` と `error.boundary.caught` を CI で検出する |
| implementation | `scripts/cf.sh tail`, `scripts/smoke/mint-staging-session-cookie.mts`, `scripts/smoke/runtime-admin-web.sh`, `.github/workflows/web-cd.yml admin-runtime-smoke` |
| tests | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts`, `scripts/smoke/__tests__/runtime-admin-web.test.sh` |
| artifact inventory | `references/workflow-issue-864-admin-staging-runtime-smoke-ci-gate-artifact-inventory.md` |
| user gate | Cloudflare staging deploy, real authenticated `/admin` probe, commit, push, PR |

## fix-admin-scr-err-stg-fu-001-auth-env-via-getenv（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/` |
| status | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL` |
| scope | `apps/web` 認証境界 (`auth.ts`) と public fetch 境界 (`fetch/public.ts`) の env 参照を `env.ts` アクセサ経由へ統一 |
| implementation | `apps/web/src/lib/env.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/lib/fetch/public.ts` |
| tests | `apps/web/src/lib/auth.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/fetch/public.spec.ts`（3 files / 75 tests PASS） |
| spec sync | `references/environment-variables.md` が `getEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` の用途別アクセサ契約を正本化。`getAuthEnv()` は safeParse partial + `API_SERVICE` binding 同梱で invariant #11 fail-closed を維持 |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-fix-admin-scr-err-stg-fu-001-auth-env-via-getenv-2026-05.md` (L-AUTHENV-001..005) |
| source | unassigned `fix-admin-scr-err-stg-followup-001-auth-env-via-getenv-migration.md`（consumed）/ issue #862（CLOSED kept closed）/ parent PR #849 #877 |
| boundary | Cloudflare staging deploy, authenticated `/login -> /admin` smoke (AC-7), commit, push, PR are user-gated |

## Issue #838 Schema Alias Rollback Notification（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-838-schema-alias-rollback-notification/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending` |
| purpose | Send best-effort operations notification after successful schema alias rollback and record notification status in application `audit_log`. |
| implementation targets | `apps/api/src/workflows/schemaAliasRollbackNotification.ts`, `apps/api/src/routes/admin/schema.ts`, `apps/api/src/routes/admin/_shared.ts` |
| contract | Slack `SLACK_WEBHOOK_INCIDENT` preferred, legacy `SLACK_WEBHOOK_URL` fallback, mail fallback via `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `OPS_NOTIFICATION_EMAIL`; failure does not break rollback 200. |
| audit | `schema_alias.rollback_notification` with redacted `after_json={ status, channel, attempts, errorClass, dispatchedAt }` |
| Phase 12 | strict 7 files present; Phase 11 local evidence present and staging provider smoke user-gated |

## Issue #908 Staging Rollback Notification Runtime Smoke（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-908-staging-rollback-notification-runtime-smoke/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| helper | `scripts/runtime-smoke/schema-alias-rollback.sh` |
| parent evidence | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` |
| boundary | staging deploy / rollback POST / D1 mutation / provider evidence population / parent completion promotion / commit / push / PR are user-gated |

## Issue #837 schema alias bulk rollback（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-837-schema-alias-bulk-rollback/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / runtime_screenshot_pending_user_gate` |
| source | Issue #837 CLOSED / `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` consumed |
| purpose | `/admin/schema` HistoryPane に複数 alias rollback selection / confirm modal / partial failure handling を追加 |
| implementation | `apps/web/src/lib/admin/api.ts`, `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `SchemaDiffBulkRollbackModal.tsx`, `hooks/useSchemaDiffBulkRollbackSelection.ts` |
| API boundary | existing `POST /admin/schema/aliases/:aliasId/rollback`; no new endpoint / no D1 schema change |
| evidence | typecheck PASS, focused Vitest 69 PASS, Phase 12 strict files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-837-schema-alias-bulk-rollback-artifact-inventory.md` |
| user gate | authenticated runtime screenshot, staging smoke, commit, push, PR, Issue mutation |

## issue-857 internal alert relay binding wiring（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #857 CLOSED; PR wording is `Refs #857` only |
| purpose | wire `API_INTERNAL_BASE_URL` into both API Worker env vars so sheets-auth healthcheck can POST to `/internal/alert-relay` |
| implementation | `apps/api/wrangler.toml`, `apps/api/src/env.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` |
| contract | receiver validates `CF_WEBHOOK_AUTH_SECRET`; separate `INTERNAL_ALERT_TOKEN` provisioning is intentionally not used |
| Phase 12 | strict 7 outputs present; root/output artifacts present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-857-internal-alert-relay-binding-wiring-artifact-inventory.md` |
| user gate | Cloudflare secret list, staging deploy/tail, SA key invalidation dry-run, commit, push, PR |

## Issue #917 alert relay runtime fire evidence（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_observation` |
| issue | #917 CLOSED; PR wording is `Refs #917` only |
| purpose | make relay POST responseStatus observable in Workers tail, then capture user-gated staging runtime evidence that SA key invalidation makes `sheets-auth-healthcheck` actually fire `/internal/alert-relay` after issue-857 base URL wiring |
| source | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` remains unconsumed until runtime evidence is captured |
| upstream | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` |
| parent | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| implementation | `apps/api/src/scheduled/sheets-auth-healthcheck.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-917-alert-relay-runtime-fire-evidence-artifact-inventory.md` |
| lesson | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-917-alert-relay-runtime-fire-evidence-2026-05.md` |
| local evidence | focused Vitest 8 PASS for relay POST 200/401 responseStatus logging |
| user gate | Cloudflare secret list, staging deploy/tail, controlled SA key invalidation, evidence MD creation, issue-857 back-reference update, source consumed conversion, commit, push, PR |

## step-08 audit filter/paging verify（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/step-08-audit-filter-paging-verify/` |
| status | `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / verify_existing` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-08-audit-filter-paging/spec.md` |
| purpose | `/admin/audit` filter / cursor paging / PII masking の監査OK結論をコード変更ゼロで回帰検証する仕様 |
| existing implementation | `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx`, `apps/api/src/routes/admin/audit.ts`, `apps/api/src/repository/auditLog.ts`, `apps/api/src/lib/audit/redact.ts` |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-step-08-audit-filter-paging-verify-artifact-inventory.md` |
| boundary | Phase 11 local regression evidence captured; commit, push, PR are user-gated |

## Issue #836 schema alias recompute trigger（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/` |
| status | `spec_created / implementation / VISUAL / Phase 12 strict 7 present / runtime_pending` |
| issue | #836 CLOSED。PR 文脈は `Refs #836` のみ |
| source | `docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` consumed |
| parent | `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` |
| contract | recompute = rollback 済み alias の `response_fields.stable_key` reverse-backfill。`triggerKey` は server-side derivation、job UNIQUE + lease + SQL idempotency で二重変動を防ぐ |
| endpoints | `POST /admin/schema/aliases/:aliasId/recompute`, `GET /admin/schema/aliases/:aliasId/recompute` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-836-schema-alias-recompute-trigger-artifact-inventory.md` |
| user gate | apps/api/apps/web 実装、D1 migration apply、authenticated visual/runtime evidence、commit、push、PR |

## UT-DSF-07 staging visual runtime evidence（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` |
| status | `spec_created / implementation / VISUAL / runtime_pending` |
| source | Issue #829 CLOSED; `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md` consumed |
| parent | `docs/30-workflows/ui-prototype-design-system-foundation/` Gate-B/C, `VISUAL_RUNTIME_PENDING` release target |
| purpose | Cloudflare Workers staging runtime で `public-top` / `login` / `profile` / `admin-dashboard` の production-equivalent visual evidence を取得する実装仕様 |
| Phase 11 | physical contract files present; real deploy logs and PNG screenshots are pending, not PASS |
| Phase 12 | strict output set present under `outputs/phase-12/` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-dsf-07-staging-visual-runtime-evidence-artifact-inventory.md` |
| user gate | staging deploy, screenshot capture, parent gate release, commit, push, PR |

## Issue #902 members staging visual baseline（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| source | Issue #902 CLOSED; `docs/30-workflows/completed-tasks/UT-DSF-07-FU-02-members-list-detail-staging-visual.md` consumed |
| parent | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` |
| implementation | `apps/web/playwright/tests/visual-staging/{members-list,member-detail}.spec.ts`, `.github/workflows/playwright-smoke.yml` |
| purpose | Extend `staging-visual` coverage from 4 to 6 public runtime screens: `/members` and env-gated `/members/[id]`. |
| evidence | `outputs/phase-11/evidence/playwright-list-staging-visual.txt` lists 6 tests; focused web typecheck log present. |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-902-members-staging-visual-baseline-artifact-inventory.md` |
| user gate | staging deploy verification, CI baseline PNG generation, commit, push, PR |

## Issue #832 AdminTopbar primitive extraction（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / implementation_complete_pending_pr` |
| issue | #832 CLOSED。PR 文脈は `Refs #832` のみ |
| source | `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction.md` consumed |
| implementation | `apps/web/src/components/layout/AdminTopbar.tsx`, `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` |
| contract | `data-shell="topbar"` は primitive root、`data-route-group="admin"` / `data-theme="cool"` は layout wrapper に残置。OKLch token のみ。 |
| evidence | `AdminTopbar.spec.tsx` 9 cases + existing `(admin)/layout.spec.tsx` PASS; Phase 12 strict 7 present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-832-admin-topbar-primitive-extraction-artifact-inventory.md` |
| boundary | authenticated screenshot / commit / push / PR は user-gated |

## mypage-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/mypage-prototype-alignment/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / existing-ui-alignment` |
| scope | existing `/profile` を prototype `MyProfilePage` に合わせ、Google Form 再回答 CTA、VisibilitySummary、ProfilePreview、RevalidateModal、danger-zone、MemberHeader 動線を実装 |
| API boundary | Existing `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request` only. No `PATCH /me/profile`, D1 schema, Google Form schema, or primitive API change |
| key UI contract | `/profile` page action uses `/members/{memberId}` when public; global `MemberHeader` public nav uses generic `/members` |
| Phase 12 | strict 7 present; Phase 11 screenshots captured and PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-mypage-prototype-alignment-artifact-inventory.md` |
| user gate | commit, push, PR |

## runtime-smoke-staging-mint-recurrence-fix（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime rerun user-gated` |
| purpose | 24h TTL 静的 bearer のサイレント失効による 401 周期再発を構造排除（`ci-green-recovery-smoke-coverage-shard` の mint path 導入の follow-up） |
| 方針 | Option C: 静的 fallback を維持しつつ smoke 前 **鮮度ゲート** + 401 **reason 二分** + mint **署名後自己検証** |
| 鮮度ゲート | `scripts/smoke/bearer-freshness-gate.mts`。`exp - now < 21600s（6h）` または decode 不能で smoke 前に loud fail（`FRESHNESS_THRESHOLD_SECONDS` で上書き、token 非露出） |
| 401 診断早見 | `exp <= now` → `auth-token-expired`（bearer 再発行 / mint path 有効化）, `exp > now` → `auth-secret-drift`（署名鍵=検証鍵 再同期）。500 → `auth-secret-binding-missing`、403 → `auth-not-admin`。詳細は SSOT §4 |
| mint 自己検証 | `scripts/smoke/mint-staging-bearers.mts` が署名直後 `verifySessionJwt` round-trip、不整合なら token 非露出で throw（AC-4）。test は `@ubm-hyogo/shared` を `vi.mock` で `verifySessionJwt=null` 固定 |
| SSOT | `docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md`（TTL / secret 同期不変条件 / reason ディシジョンツリーの唯一の正本） |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-runtime-smoke-staging-mint-recurrence-fix-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-runtime-smoke-staging-mint-recurrence-2026-05.md`（L-RSMR-001..006） |
| boundary | `STAGING_AUTH_SECRET` 投入による mint path 恒久化・staging runtime rerun・GitHub/Cloudflare secret mutation・commit・push・PR は user-gated |

## issue-899-static-bearer-fallback-retirement（2026-05-25）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-899-static-bearer-fallback-retirement/` |
| status | `spec_created / implementation / NON_VISUAL / implementation_pending` |
| purpose | runtime-smoke-staging の静的 bearer fallback を物理撤去し、mint-only + freshness hard-fail 既定へ恒久化する実装仕様 |
| prerequisite | #916 `STAGING_AUTH_SECRET` provisioning + mint path smoke green |
| implementation targets | `.github/workflows/runtime-smoke-staging.yml`, `secret-provisioning.md`, `bearer-lifecycle-ssot.md` |
| Phase 12 | strict 7 present; root/output artifacts parity present; 30-method compact evidence included |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-899-static-bearer-fallback-retirement-artifact-inventory.md` |
| boundary | workflow edit / runtime smoke rerun / static secret physical delete / commit / push / PR are user-gated |

## issue-870-apps-api-security-headers（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| scope | `apps/api` global response security headers and deny-by-default CORS |
| implementation | `apps/api/src/middleware/security-headers.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts`, `apps/api/wrangler.toml` |
| tests | `apps/api/src/middleware/__tests__/security-headers.spec.ts` |
| contract | `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy: no-referrer`, conditional no-store, exact-origin `ALLOWED_ORIGINS`, credentials true |
| Phase 12 | strict 7 outputs present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-870-apps-api-security-headers-artifact-inventory.md` |
| user gate | staging/production curl, deploy, commit, push, PR |

## members-page-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/members-page-prototype-alignment/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL` |
| scope | 公開 `/members` と public chrome を frozen prototype `MemberListPage` / CSS に整合。既存 `GET /public/members` と URL query helper は不変 |
| implementation targets | `PublicHeader.tsx`, `PublicFooter.tsx`, `DensityToggle.client.tsx`, `MemberFilters.client.tsx`, `MemberCard.tsx`, `MemberGrid.tsx`, `MemberTable.tsx`, `EmptyState.tsx`, `Segmented.tsx`, `legacy-public.css`, `app/(public)/members/page.tsx` |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 present |
| Phase 11 | `outputs/phase-11/screenshots/EV-1..6` + Playwright report present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-members-page-prototype-alignment-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-members-page-prototype-alignment-2026-05.md` |
| user gate | staging deploy, production-equivalent visual evidence, commit, push, PR |

## members-list-prototype-alignment（2026-05-26）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/members-list-prototype-alignment/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / visual_runtime_pending` |
| scope | 公開 `/members` list density を `MemberGrid` 一本へ統一し、zone/status chip、occupation/location icon meta、TagPicker divider、compact EmptyState を現行 API contract 内で整合 |
| implementation targets | `apps/web/app/(public)/members/page.tsx`, `apps/web/src/components/public/{MemberCard,MemberGrid,MemberFilters.client,TagPicker.client}.tsx`, `apps/web/src/components/feedback/EmptyState.tsx`, `apps/web/src/components/ui/{Icon.tsx,icons.ts}`, `apps/web/src/styles/legacy-public.css` |
| evidence | typecheck PASS, web Vitest 157 files / 1146 tests PASS, Playwright visual pending on local webServer readiness |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-members-list-prototype-alignment-artifact-inventory.md` |
| user gate | commit, push, PR, staging deploy |

## Issue #827 member detail adapter and visibility defense（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #827 CLOSED; PR should use `Refs #827`; commit / push / PR / issue mutation are user-gated |
| scope | public member detail web-side pure adapter and visibility double-defense |
| implementation | `apps/web/src/lib/adapters/member-detail.ts`, `MemberDetailSections.tsx`, `/members/[id]/page.tsx` |
| contract | adapter first filters all section fields to `visibility="public"` for `MemberLinks` / `MemberActivity`; detail sections then include only non-activity kinds `shortText` / `paragraph` / `date` / `radio` / `checkbox` / `dropdown`; `url` remains for `MemberLinks`; `activity` remains for `MemberActivity` |
| evidence | apps/web Vitest 888 PASS, workspace typecheck/lint PASS, web build PASS with required local env |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-827-member-detail-adapter-and-visibility-defense-artifact-inventory.md` |

## home-page-prototype-alignment（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/home-page-prototype-alignment/` |
| status | `implemented / implementation / VISUAL / local runtime screenshots captured` |
| purpose | public home `/` の prototype drift を `legacy-public.css` selector rules と `CallToActionCTA` data-role cleanup で解消 |
| historical parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| current implementation owner | `docs/30-workflows/ui-prototype-design-system-foundation/`（prototype/system foundation の現行 SSOT） |
| implementation targets | `apps/web/src/styles/legacy-public.css`, `apps/web/src/components/public/CallToActionCTA.tsx`, `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`, `apps/web/app/opengraph-image.tsx`, `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 present |
| evidence | `outputs/phase-11/screenshots/home-desktop-2026-05-23.png`, `outputs/phase-11/screenshots/home-mobile-2026-05-23.png` |
| boundary | staging deploy, commit, push, PR are user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-home-page-prototype-alignment-artifact-inventory.md` |

## login-page-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| 状態 | `implemented_local_visual_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| system spec | `docs/00-getting-started-manual/specs/13-mvp-auth.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-login-page-prototype-alignment-artifact-inventory.md` |
| implementation | `apps/web/app/login/**`, `apps/web/src/components/ui/{Icon,icons}.ts(x)`, `apps/web/src/styles/auth.css`, `apps/web/playwright/tests/login-smoke.spec.ts` |
| UI contract | Magic Link primary -> OR divider -> Google secondary, brand block, sent inbox state |
| boundary | `/api/auth/*`, Auth.js handler, D1 schema, `apps/api/**` are unchanged; staging visual smoke, commit, push, PR are user-gated |

## issue-874-login-staging-visual-smoke（2026-05-24）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL` |
| source | FU-LOGIN-003 from `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` |
| implementation | `apps/web/playwright/tests/login-smoke.spec.ts`, `scripts/run-login-staging-smoke.sh` |
| contract | `PLAYWRIGHT_EVIDENCE_DIR` overrides explicit screenshot output path; default keeps completed parent local baseline path |
| evidence | Phase 12 strict 7 present; staging deploy / staging smoke / 7 PNG evidence remain user-gated |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-874-login-staging-visual-smoke-artifact-inventory.md` |
| boundary | deploy, staging runtime smoke, visual diff, commit, push, PR are user-gated |

## fix-admin-server-components-render-error-stg（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/fix-admin-server-components-render-error-stg/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| purpose | recover staging `/admin` Server Components render error digest `167275886` by routing admin server fetch env access through `getEnv()` and removing localhost fallback |
| implementation | `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/lib/env.ts` |
| tests | `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts` |
| spec sync | `references/architecture-admin-api-client.md` now defines `fetchAdmin()` base URL / internal auth resolution via `getEnv()` with no localhost fallback |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-admin-server-components-render-error-stg-artifact-inventory.md` |
| boundary | staging deploy, authenticated `/admin` curl, backend-ci rerun, commit, push, PR are user-gated |

## apps-web-security-headers-hardening（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/apps-web-security-headers-hardening/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| scope | `apps/web` response security headers via middleware |
| implementation | `apps/web/src/lib/security-headers.ts`, `apps/web/middleware.ts`, `apps/web/src/lib/security-headers.spec.ts`, `apps/web/playwright/tests/security-headers.spec.ts` |
| contract | CSP header mode is env-driven via `CSP_MODE`; `report-only` emits `Content-Security-Policy-Report-Only`, `enforce` emits `Content-Security-Policy`; `Permissions-Policy` excludes `browsing-topics`; Trusted Types enforcement is not emitted |
| env | `getSecurityHeaderEnv()` is the middleware boundary for `CSP_MODE` + `NEXT_PUBLIC_API_BASE_URL`; `NEXT_PUBLIC_API_ORIGIN` is not used |
| Phase 12 | strict 7 outputs present; root/output artifacts parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-apps-web-security-headers-hardening-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-apps-web-security-headers-hardening-2026-05.md` (L-AWSHH-001..004) |
| user gate | staging/production response verification, commit, push, PR |

## issue-869-csp-enforce-cutover（2026-05-24）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime deploy user-gated` |
| issue | #869 CLOSED; do not reopen; PR should use `Refs #869` only |
| implementation | `apps/web/src/lib/env.ts`, `apps/web/middleware.ts`, `apps/web/wrangler.toml`, `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/playwright/tests/security-headers.spec.ts` |
| contract | `CSP_MODE` zod enum defaults to `report-only`; staging wrangler var is `enforce`; production remains `report-only` until explicit cutover |
| system spec | `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-869-csp-enforce-cutover-artifact-inventory.md` |
| boundary | staging/production deploy and curl evidence, production enforce final cutover, commit, push, PR are user-gated |

## ci-green-recovery-smoke-coverage-shard（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_ci_pending` |
| purpose | 3 CI failures (`runtime-smoke-staging` admin 401, aggregate `coverage-gate` MISSING, `coverage-gate-shard` checkout auth) を 1 implementation cycle で解消する実装 |
| Lane A | CI-time short-lived JWT mint with `signSessionJwt`, replacing static 24h staging bearer expiry |
| Lane B/C | fail aggregate coverage on upstream shard failure before MISSING, plus `contents: read` / explicit checkout token hardening |
| Phase 12 | strict 7 files present; root/output `artifacts.json` parity present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ci-green-recovery-smoke-coverage-shard-artifact-inventory.md` |
| boundary | code/CI changes and runbook edit are implemented with local evidence; staging secrets, runtime CI evidence, commit, push, PR are user-gated |

## admin-ui-prototype-alignment（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-ui-prototype-alignment/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL / 11 admin routes` |
| scope | 11 admin routes（dashboard / attendance / members / tags / meetings / meetings/[id] / schema / schema/history / requests / identity-conflicts / audit）の prototype alignment + 共通 component 6 種 + per-section degrade pattern |
| per-section degrade | `apps/web/src/lib/result.ts`（`SafeResult<T>`）+ `apps/web/src/lib/admin/safe-server-fetch.ts` で throw を normalize → `Promise.all` 後に section 毎に `result.ok` 分岐 → `AdminSectionError` で degrade。`error.tsx` は renderer crash 専用に縮小（L-AUIP-001 / 再利用 Pattern 1） |
| 共通 component | `apps/web/src/features/admin/components/_shared/{AdminSectionCard,AdminSectionError,AdminEmptyState,AdminStat,AdminTable,AdminQueuePanel}.tsx` + `index.ts` barrel export |
| import 強制 | barrel 経由のみ。深 path import を ESLint `no-restricted-imports` で deny、grep gate `rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` 0 件を Phase 5 DoD に組込（L-AUIP-003 / 再利用 Pattern 2） |
| design token | 新規 component は OKLch token のみ（`var(--ubm-color-*)`）。既存 `*Panel.tsx` の HEX 移行は別 wave へ分離（L-AUIP-004） |
| server/client boundary | server page = throw-only / view-compute-only、client wrapper = state/event-only の twin principle。`TagsClientShell` / `RequestsClientShell` で state ownership を Phase 2 fix（L-AUIP-005） |
| scope cutoff | Phase 4 test plan に scope lock TC を列挙し、test fail = scope miss として early detect（L-AUIP-006 / 再利用 Pattern 5） |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md`（L-AUIP-001..006 + 再利用可能パターン 5 件） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260523-admin-ui-prototype-alignment.md` |
| 出典 | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `unassigned-task-detection.md` |
| user gate | authenticated runtime screenshots / staging refresh / commit / push / PR |

## Issue #55 Notification Channel + Opt-out（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-55-notification-channel-and-optout/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / production_runtime_pending_user_gate` |
| purpose | Close the remaining Issue #55 gaps by introducing a `NotificationChannel` abstraction and an operator-managed member notification opt-out gate. |
| current-code alignment | Store opt-out on `member_status.notification_opt_out`; add `notification_outbox.channel`; expand `notification_ledger.event_type` for `skipped_opt_out` and `unknown_channel`; use admin `MemberDrawer`, not a nonexistent member detail page route. |
| implementation targets | `apps/api/src/services/notification/{channel.ts,registry.ts,channels/mail.ts}`, `apps/api/src/repository/{notificationOutbox.ts,memberNotificationPreference.ts}`, `apps/api/src/workflows/notificationDispatchTick.ts`, `apps/api/src/routes/admin/member-notification-pref.ts`, `apps/api/migrations/0020_notification_channel_and_opt_out.sql`, `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`, `apps/web/src/lib/admin/api.ts` |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present; Phase 11 local UI/D1 evidence present |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-55-notification-channel-and-optout-artifact-inventory.md` |
| user gate | production D1 migration apply, staging/runtime evidence, commit, push, PR |

## UT-25-DERIV-02 SA key expiry monitoring（2026-05-22）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| source | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md` (`status: consumed`) |
| purpose | detect Google Service Account key expiry or permission loss for `GOOGLE_SERVICE_ACCOUNT_JSON` via Sheets API 401/403 classification |
| implementation | `apps/api/src/jobs/sheets-auth-classifier.ts`, `apps/api/src/jobs/sheets-auth-logger.ts`, `apps/api/src/scheduled/sheets-auth-healthcheck.ts`, sync injection targets, scheduled wiring, `alert-relay.ts` payload extension |
| invariant | no new cron; healthcheck piggybacks existing `*/15 * * * *`; 401/403 are distinct; 5xx/429/network are not sheets-auth alerts |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-25-deriv-02-sa-key-expiry-monitoring-artifact-inventory.md` |
| boundary | staging invalidation, Workers tail, production deploy, commit, push, PR are user-gated |

## step-07 requests approve/reject implementation（2026-05-23）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/step-07-requests-approve-reject/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 12 strict 7 present` |
| parent spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-07-requests-approve-reject/spec.md` |
| purpose | `/admin/requests` の `visibility_request` / `delete_request` approve/reject を二段階確認 UI と 409 conflict refresh で実装するための Phase 1-13 仕様 |
| local implementation | `apps/web/src/components/admin/RequestQueuePanel.tsx`, `RequestQueueDetail.tsx`, `RequestConfirmDialog.tsx`, focused `*.spec.tsx` |
| API boundary | existing `POST /admin/requests/:noteId/resolve`; no D1 schema or endpoint change |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-step-07-requests-approve-reject-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-step-07-requests-approve-reject-2026-05.md` |
| user gate | authenticated runtime/staging evidence, commit, push, PR |

## ut-cicd-composite-setup-rollout（2026-05-22）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/ut-cicd-composite-setup-rollout/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| purpose | Issue #284 の raw `actions/setup-node@v4` + `pnpm/action-setup@v4` workflow steps を existing `.github/actions/setup-project` composite action へ rollout |
| implementation | `.github/workflows/*.yml` 13 files; direct setup action grep after = 0 |
| exceptions | `web-cd.yml` uses `setup-strategy: mise`; `post-release-dashboard.yml` uses `install: 'false'` + `cache: ''` |
| Phase 12 | strict 7 files present under `outputs/phase-12/` |
| boundary | commit, push, PR, remote GitHub Actions green evidence, Issue #284 mutation are user-gated |

## Issue #276 mobile FilterBar tag picker（2026-05-20）
## Issue #277 Next.js proxy migration（2026-05-20）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-277-next-proxy-migration/` |
| 状態 | `implemented_local / implementation / NON_VISUAL / runtime_evidence_pending` |
| issue | #277 OPEN。PR 文脈は `Refs #277` のみ。Issue close は PR merge 後 user-gated |
| scope | `apps/web/middleware.ts` → `apps/web/proxy.ts` rename、export `middleware` → `proxy`、admin/profile gate parity |
| tests | `apps/web/__tests__/proxy.spec.ts` with `signSessionJwt`; AC-1〜AC-7 mandatory, no `it.todo` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`; local implementation present, Phase 11 dev-server runtime smoke pending |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-277-next-proxy-migration-artifact-inventory.md` |
| user gate | dev-server manual smoke, commit, push, PR, issue close |

## Issue #806 dynamic member OG image（2026-05-20）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-806-dynamic-member-og-image/` |
| 状態 | `implemented-local / implementation / VISUAL / local-evidence-captured` |
| issue | #806 CLOSED; PR should use `Refs #806`; commit / push / PR / Issue mutation are user-gated |
| parent | `docs/30-workflows/completed-tasks/issue-274-public-pages-ogp-sitemap-robots/` |
| scope | `/members/[id]/opengraph-image` dynamic member OG image, member detail `og:image` / `twitter:image`, unit + Playwright coverage |
| key contract | Next.js 16 App Router `params: Promise<{ id: string }>`; public profile privacy is API-owned by `apps/api/src/routes/public/member-profile.ts` and `apps/api/src/use-cases/public/get-public-member-profile.ts` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-806-dynamic-member-og-image-artifact-inventory.md` |
| evidence boundary | Phase 12 strict 7 present; focused unit/Playwright and Phase 11 screenshot evidence captured; commit / push / PR / deploy verification user-gated |

## fix-verify-design-tokens-og-route-exclude（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/fix-verify-design-tokens-og-route-exclude/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / local-evidence-captured` |
| upstream | Issue #806 dynamic member OG image; task-18 `verify-design-tokens` gate |
| scope | `scripts/verify-design-tokens.ts` route handler convention exclude for `opengraph-image/route.tsx`, `twitter-image/route.tsx`, `icon/route.tsx`, `apple-icon/route.tsx` |
| tests | `scripts/verify-design-tokens.spec.ts` C-EX-1..6 plus existing C1..7 |
| evidence | `outputs/phase-11/verify-tokens-local.txt`, `vitest-verify-design-tokens.txt`, `drift-canary-fail.txt`, `canary-non-og-route.txt` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-verify-design-tokens-og-route-exclude-artifact-inventory.md` |
| user gate | commit, push, PR, GitHub Actions PR checks |

## Issue #799 useAutoFocusOnMount hook（2026-05-19）
## step-06 meetings attendance implementation（2026-05-20）
## Issue #778 Schema Alias Rollback / Undo（2026-05-19）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| source | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md` |
| parent | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| API | `POST /admin/schema/aliases/:aliasId/rollback` with `If-Match: version=<N>` |
| audit | application `audit_log.action='schema_alias.rollback'`;元 resolve は `after_json.relatedAuditId` |
| specs | `docs/00-getting-started-manual/specs/01-api-schema.md`, `docs/00-getting-started-manual/specs/11-admin-management.md` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/artifacts.json` |
| pattern | `.claude/skills/aiworkflow-requirements/references/pattern-d1-soft-delete-optimistic-lock-batch.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-d1-batch-atomicity-and-soft-delete-2026-05.md`（L-DBATCH-001 / L-SOFTDEL-001 / L-OPTLOCK-001 / L-AUDITREL-001 / L-SCOPE-001） |
| user gate | staging apply / production apply / visual baseline / commit / push / PR |

## D1 Soft Delete + Optimistic Lock + db.batch（汎用パターン / 2026-05-19）

| 項目 | 値 |
| --- | --- |
| 正本 | `.claude/skills/aiworkflow-requirements/references/pattern-d1-soft-delete-optimistic-lock-batch.md` |
| schema 拡張 | `deleted_at TEXT`, `deleted_by TEXT`, `version INTEGER NOT NULL DEFAULT 1` + partial unique index `WHERE deleted_at IS NULL` + `idx_<table>_deleted_at` |
| API 形 | `POST /admin/<resource>/:id/rollback` + `If-Match: version=<N>` (`^version=(\d+)$`) |
| Error 体系 | 400 bad_request / 404 not_found / 404 already_deleted / 409 version_mismatch / 500 |
| atomic | `db.batch([soft-delete UPDATE WHERE version=?, downstream insert, audit_log insert])` — Cloudflare D1 公式 all-or-nothing |
| audit | application `audit_log.after_json.relatedAuditId`（`cf_audit_log` には書かない） |
| grep gate | `rg "FROM <table>" \| rg -v "deleted_at IS NULL"` 0 行 / `rg "UPDATE <table>" \| rg -v "version ="` 0 行 |
| 参考実装 | Issue #778 `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| lessons-learned | `references/lessons-learned-d1-batch-atomicity-and-soft-delete-2026-05.md` |
| 苦戦箇所 | If-Match parse 400/409 分離, `db.batch` atomicity 公式 doc 引用, soft delete grep gate, audit_log vs cf_audit_log 分離, followup scope 分離 |

## task-staging-auth-secret-binding-recovery-001（2026-05-22）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/task-staging-auth-secret-binding-recovery-001/` |
| status | `implemented_runtime_verified_pending_pr / implementation / NON_VISUAL` |
| purpose | recover staging `AUTH_SECRET` runtime binding after `auth misconfigured` body proved middleware root cause |
| implementation | `apps/api/src/middleware/require-admin.ts`, `apps/api/src/env.ts`, `scripts/smoke/runtime-attendance-provider.sh`, `scripts/cf.sh` |
| tests | `apps/api/src/middleware/require-admin.authz.spec.ts`, `apps/api/src/env.spec.ts`, `scripts/smoke/__tests__/runtime-attendance-provider.test.sh`, `scripts/__tests__/cf-sh-secret-put.test.sh` |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| Phase 11 runtime evidence | `outputs/phase-11/evidence/staging-runtime-smoke.log` + `staging-runtime-smoke-summary.json`（admin-list / admin-detail / admin-attendance / me-root / me-profile / me-attendance 全 6 経路 HTTP 200 PASS） |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-staging-auth-secret-binding-recovery-001-artifact-inventory.md` |
| boundary | production curl, backend-ci rerun, commit, push, PR are user-gated |

## task-runtime-smoke-admin-members-500-recovery-001（2026-05-21）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/` |
| status | `runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| purpose | staging runtime smoke `admin-list http=500` for `GET /admin/members` recovery |
| in-cycle implementation | `apps/api/src/routes/admin/members.ts` defensive recovery + `members.contract.spec.ts`; `scripts/smoke/runtime-attendance-provider.sh` logs redacted non-200 body; `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` T-4-5 covers it |
| Phase 12 | `outputs/phase-12/phase12-task-spec-compliance-check.md` + strict 7 files present |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-runtime-smoke-admin-members-500-recovery-001-artifact-inventory.md` |
| boundary | true root cause superseded by `task-staging-auth-secret-binding-recovery-001`; staging curl/D1/tail, deploy, backend-ci rerun, commit, push, PR are user-gated |

## Issue #775 serial-05-step-03 runtime evidence completion（2026-05-18）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL / implementation_complete_pending_pr` |
| issue | #276 OPEN |
| source trace | `docs/30-workflows/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md` canonical_root_created |
| purpose | `/members` に tag candidate chip picker、mobile sticky/collapsible summary、clear-all、5-tag limit hint を追加する実装 |
| API boundary | existing `GET /public/members` response extension with `topTags`; no new endpoint |
| implementation | `packages/shared/src/zod/viewmodel.ts`, public members API/view model, `MemberFilters.client.tsx`, `FiltersSummaryMobile.client.tsx`, `TagPicker.client.tsx`, public members page, focused Vitest and Playwright mobile spec |
| evidence | `outputs/phase-11/evidence/*.png`, `outputs/phase-11/test-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| system specs | `docs/00-getting-started-manual/specs/01-api-schema.md`, `09-ui-ux.md`, `09e-screen-blueprints-public.md`, `12-search-tags.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-276-mobile-filterbar-tag-picker-2026-05.md`（L-I276-001..007） |
| pattern reference | `.claude/skills/task-specification-creator/references/patterns-mobile-ui-primitive-3point-sync.md`（filter / picker primitive 追加時に複製） |
| boundary | commit, push, PR, Issue mutation, and external deployment are pending user approval |

## Issue #799 useAutoFocusOnMount hook（2026-05-19）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/step-06-meetings-attendance-implementation/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / user-gated commit-push-PR` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-06-meetings-attendance/spec.md` |
| scope | 出席解除 / 開催日削除 に confirm dialog 共通化、`MeetingAttendancePanel` の直接 `fetch` → `useAdminMutation` 統一 |
| 新規 primitive | `apps/web/src/components/ui/ConfirmDialog.tsx`（ARIA-compliant, focus trap / restore） |
| 新規 hook | `apps/web/src/features/admin/hooks/useConfirmDialog.ts`（state machine: idle / open / submitting / error） |
| 改修 | `apps/web/src/components/admin/MeetingPanel.tsx`, `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` |
| API contract | 不変。`POST /api/admin/meetings/:id/attendances` `{ memberId, attended }`、error mapping 200/404/409/422/401/5xx を toast 統一 |
| system spec | `docs/00-getting-started-manual/specs/11-admin-management.md`（`useConfirmDialog` / `/attendances` alias contract 反映） |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-step-06-meetings-attendance-implementation-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-step-06-meetings-attendance-confirm-dialog-2026-05.md`（L-STEP06-001..004: confirm dialog 共通化 / focus trap pitfall / admin mutation 統一 / legacy 単数 route と複数形 alias 混同回避） |
| follow-up | `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/`（useAdminMutation timeout policy canonical workflow; one-pager consumed） |
| evidence | `outputs/phase-11/evidence/test.log` (52 Vitest PASS), `outputs/phase-11/evidence/e2e-attendance.log` (5 Playwright PASS), `outputs/phase-11/screenshots/*.png` (5 枚) |
| user gate | commit / push / PR / staging smoke / production smoke |

## Issue #842 admin mutation reliability policy（2026-05-24）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-842-admin-mutation-reliability-policy/` |
| 状態 | `implemented / implementation / NON_VISUAL / local QA PASS / Phase 12 strict 7 present` |
| source | Issue #842 CLOSED; PR wording is `Refs #842`; one-pager `docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md` consumed |
| scope | `useAdminMutation` に timeout / idempotent retry / idempotency-key / 404 policy / abort を集約し、`useConfirmDialog` close から cancel callback を渡す実装仕様 |
| implementation targets | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `useConfirmDialog.ts`, hook barrel/tests, legacy `apps/web/src/lib/useAdminMutation.ts` delete |
| stale optimization | current `MeetingAttendancePanel.tsx` is POST-only; DELETE 404 success-relaxation is provided as hook policy but no caller is forcibly migrated in the spec-created cycle |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-842-admin-mutation-reliability-policy-artifact-inventory.md` |
| user gate | commit, push, PR, staging runtime evidence |

## Issue #274 public pages OGP / sitemap / robots（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / Phase 13 blocked_pending_user_approval` |
| issue | #274 OPEN; PR should use `Refs #274`; commit / push / PR / Issue mutation are user-gated |
| scope | public routes `/`, `/members`, `/members/[id]`, `/register`; sitemap / robots / root OG image / page metadata |
| sitemap contract | `/public/members?limit=100&page=N` paginated until `pagination.hasNext === false`; list item shape is top-level `memberId` / `fullName` |
| playwright target | `apps/web/playwright/tests/public-metadata.spec.ts` |
| evidence | `outputs/phase-11/evidence/*`, `outputs/phase-11/screenshots/og-image.png`; typecheck/lint/test/build/curl/Playwright PASS |
| source consumed | `docs/30-workflows/unassigned-task/task-06a-followup-002-ogp-sitemap.md`, `docs/30-workflows/unassigned-task/task-11-followup-002-public-og-sitemap-robots.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-274-public-pages-ogp-sitemap-robots-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-274-public-pages-ogp-sitemap-robots-2026-05.md`（L-274-001..006: site URL SSOT / sitemap degraded mode / robots env-branch / OG edge runtime / consumed trace / issue-NNN namespace 規約） |
| user gate | implementation, runtime evidence, commit, push, PR |

## Issue #777 Schema Diff Resolve History View（2026-05-20）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-777-schema-diff-resolve-history-view/` |
| 状態 | `CONTRACT_READY_IMPLEMENTATION_PENDING / implementation / VISUAL / Phase 12 strict 7 present` |
| source issue | #777 OPEN |
| source task | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` consumed |
| parent | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| API boundary | existing `/admin/audit?action=schema_diff.alias_assigned`; no new endpoint by default |
| implementation targets | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`, `apps/web/app/(admin)/admin/schema/history/page.tsx`, `apps/web/src/lib/admin/api.ts` |
| same-wave hardening | `schemaAliasAssign` audit payload now includes `questionText` for future history UI |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`; implementation/runtime evidence pending |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-777-schema-diff-resolve-history-view-artifact-inventory.md` |
| user gate | UI implementation, authenticated admin screenshot, staging smoke, commit, push, PR |

## Issue #256 E2E coverage baseline runbook（2026-05-18）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-256-e2e-coverage-baseline-runbook/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| implementation | `scripts/measure-coverage-exclude-ratio.ts`, `.github/workflows/verify-coverage-exclude-ratio.yml`, `vitest.config.ts` |
| runbooks | `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md`, `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` |
| evidence | `outputs/phase-7/coverage-exclude-ratio.json` (`37 / 80 = 46.3% warn`), `outputs/phase-9/qa-result.md`, `outputs/phase-11/manual-test-result.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | Issue #256 CLOSED, use `Refs #256` only; commit / push / PR are user-gated |

## Issue #266 shared sync Zod contract（2026-05-18）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-266-shared-sync-zod-contract/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| issue | #266 CLOSED。PR 文脈は `Refs #266` のみ |
| contract | `SyncLogStatus = running/success/failed/skipped`, `SyncTriggerType = cron/admin/backfill`, `SyncLogRecord = sync_job_logs` 物理 12 カラム |
| implementation | `packages/shared/src/zod/sync-log.ts`, `packages/shared/src/zod/index.ts`, `apps/api/src/sync/{types,audit,manual,scheduled}.ts`, `apps/api/src/jobs/{sync-sheets-to-d1,sync-forms-responses}.ts`, sync contract specs |
| key boundary | U-UT01-08 / U-UT01-10 の旧 `pending/in_progress/completed`・`manual/cron/backfill` 前提は historical。issue #266 は物理 DDL / runtime 実態を canonical とする |
| Phase 12 | strict 7 outputs present; local code/test evidence captured |
| user gate | staging D1 distinct query, commit, push, PR |

## Issue #762 CF OIDC staging proof readiness（2026-05-17）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / user-gated PR` |
| implementation | `scripts/oidc/verify-claim-pin.sh`, `scripts/redaction-check.sh`, `.github/workflows/oidc-observation-window.yml`, `.github/workflows/web-cd.yml` comment-only |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` Issue #762 G1-G4 gate |
| source trace | `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` partially consumed |
| evidence | `outputs/phase-11/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | real OIDC cutover / staging proof / production cutover / legacy token revocation remain blocked until official support G1-G4 |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-762-cf-oidc-pre-support-hardening-2026-05.md`（L-I762-001..005） |
| user gate | commit / push / PR and all external mutations |

## Issue #324 shared package type contracts（2026-05-15）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-324-shared-package-type-contracts/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| implementation | `packages/shared/src/__tests__/type-contracts.spec.ts` |
| source trace | `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md` |
| evidence | `outputs/phase-11/evidence/shared-typecheck.txt`, `outputs/phase-11/evidence/shared-lint.txt`, `outputs/phase-11/evidence/shared-test.txt` |
| boundary | Issue #324 CLOSED, use `Refs #324` only; no runtime schema/API/D1 changes |

> 最重要情報への即時アクセス
> 詳細は resource-map.md → 該当ファイル を参照

---

### Issue #520 Slack Incident Channel Webhook Provisioning（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| channel SSOT | `#ubm-hyogo-incidents` |
| secret SSOT | `SLACK_WEBHOOK_INCIDENT` |
| 1Password 正本 | `op://UBM-Hyogo/Slack Incident Webhook (<env>)/url` |
| runbook | `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` |
| redaction gate | `bash scripts/redaction-grep.sh .` |
| blocks | Issue #495 Phase 11 runtime smoke / 09c production readiness observability gate |
| boundary | Slack / 1Password / Cloudflare / GitHub / smoke / commit / push / PR は user approval 後のみ |

### parallel-04 Shared Page Chrome（2026-05-19）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/` |
| 状態 | `spec_created / implementation / VISUAL / Phase 11 evidence captured (EV-01..16)` |
| 実装対象 | `apps/web/app/{layout,error,not-found,loading}.tsx` + `apps/web/app/__tests__/error.component.spec.tsx` + `apps/web/app/__smoke__/loading-state/{page,loading}.tsx` |
| invariant | OKLch token のみ / HEX 直書き 0 / `__tests__` 除外 ToastProvider 単一 mount / `next build --webpack` / Phase 12 strict 7 は parent root 集約 |
| evidence | EV-01..09 静的 gate + EV-10..11 capture provenance + EV-12..15 root chrome / fallback PNG + EV-16 visual review |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-parallel-04-shared-page-chrome-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-04-root-chrome-2026-05.md` (L-PARA04-001..007) |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260519-parallel-04-shared-page-chrome.md` |
| completion shard | `.claude/skills/aiworkflow-requirements/references/task-workflow-completed-recent-2026-05.md` |
| user gate | commit / push / PR / serial-07 19 routes 全体 visual regression |

### profile-loading-skeleton-oklch（2026-05-19）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/profile-loading-skeleton-oklch/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / implementation_complete_pending_pr` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` |
| implementation | `apps/web/app/(member)/profile/loading.tsx`, `apps/web/app/(member)/profile/loading.spec.tsx` |
| contract | `/profile/loading.tsx` は `role=status` / `aria-busy=true` / `aria-live=polite` / `data-page=profile-loading` と avatar + 4 KV row skeleton を持つ |
| evidence | `outputs/phase-11/evidence/{test,typecheck,lint,build,grep-gate}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-profile-loading-skeleton-oklch-artifact-inventory.md` |
| user gate | commit / push / PR |

### UT-07C-FU-001 attendance CSV import spec（2026-05-18）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-07c-followup-001-attendance-csv-import/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval` |
| issue | #312 |
| contract | `POST /admin/meetings/:sessionId/attendance/import?dryRun=true|false`; client CSV parse + JSON rows; max 500 rows; row status `ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid` |
| implementation targets | `apps/api/src/routes/admin/attendance.ts`, `apps/api/src/use-cases/admin/import-attendance-bulk.ts`, `apps/api/src/repository/attendance.ts`, `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx`, `apps/web/src/lib/csv/parse-attendance.ts`, `apps/web/package.json` |
| important boundary | Hono `Context` is not passed into service; route resolves `DbCtx`, `authUser`, and `auditLogProvider`. `member_status.is_deleted` is the deleted-member source. `dryRun=false` explicit only commits; omitted/typo dry-runs. commit uses D1 batch for attendance + audit insert. |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07c-followup-001-attendance-csv-import-artifact-inventory.md` |
| evidence boundary | focused API route 13 / API service 13 / web parser+UI 13 PASS. Phase 11 local Playwright screenshots S1-S4 captured. Phase 12 strict 7 outputs present. commit / push / PR remain user-gated. |

---

### UI Prototype Design System Foundation（2026-05-18 / parallel-02 close-out 2026-05-19）
### Issue #772 CF audit monitor runtime restoration（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/` |
| 状態 | `runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| source | `docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` consumed |
| decision | production environment monitor cleanup is no-op if fresh inventory still shows no monitor-specific secrets; runtime restoration remains pending |
| evidence | `outputs/phase-11/runtime-evidence/{hourly-runs.json,6h-success.md,heartbeat-after.txt}`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-772-cf-audit-monitor-runtime-restoration-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-772-cf-audit-monitor-runtime-restoration-2026-05.md` |
| user gate | repo secrets / variables, workflow dispatch, six hourly successes, rollback delete, commit, push, PR |

---

### Issue #770 Profile Loading Skeleton（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-770-profile-loading-skeleton/` |
| 状態 | `implemented_local_runtime_pending / implementation / VISUAL` |
| source issue | #770 OPEN |
| implementation | `apps/web/app/(member)/profile/loading.tsx`, `apps/web/app/(member)/profile/loading.spec.tsx` |
| parent spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md` |
| source task | `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md` consumed |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/phase-11/evidence/` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-770-profile-loading-skeleton-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-770-profile-loading-skeleton-2026-05.md` (L-770-001..007) |
| user gate | authenticated browser screenshot, staging runtime visual evidence, commit, push, PR |

---

### Issue #769 root error h1 auto-focus（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-769-root-error-focus/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending` |
| scope | root `apps/web/app/error.tsx` の h1 自動 focus |
| implementation | `apps/web/app/error.tsx` |
| tests | `apps/web/app/__tests__/error.component.spec.tsx` TC-U-09a/b/c |
| evidence | `outputs/phase-11/evidence/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source | `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` consumed |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-769-root-error-focus-2026-05.md` (L-I769-001..005) |
| user gate | interactive screen reader smoke, commit, push, PR |

### Issue #801 admin error h1 auto-focus transfer（2026-05-19）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-801-admin-error-focus-transfer/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / runtime_pending` |
| scope | `(admin)/admin/error.tsx` の h1 自動 focus / aria-live / digest / logger 横展開 |
| implementation | `apps/web/app/(admin)/admin/error.tsx` |
| tests | `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` |
| evidence | `outputs/phase-11/evidence/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source | `docs/30-workflows/unassigned-task/issue-769-followup-003-admin-error-focus-transfer.md` consumed |
| predecessor | `docs/30-workflows/completed-tasks/issue-769-root-error-focus/` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-801-admin-error-focus-transfer-artifact-inventory.md` |
| user gate | runtime browser screenshot, screen reader smoke, commit, push, PR |

### Issue #800 error boundary focus hook rollout（2026-05-19）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| source issue | #800 CLOSED。PR 文脈は `Refs #800` のみ |
| implementation | `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`, `apps/web/app/{error,profile/error,login/error}.tsx`, `apps/web/app/(admin)/admin/error.tsx` |
| tests | hook + root/profile/login/admin focused tests |
| source | `docs/30-workflows/completed-tasks/issue-769-followup-{001,002,003}*.md` consumed; `/login/error.tsx` residual recovered from i05/Issue #768 context |
| source parent | `docs/30-workflows/completed-tasks/issue-769-root-error-focus/` |
| umbrella parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |
| evidence | focused Vitest 5 files / 31 PASS, web typecheck PASS, web lint PASS, `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-800-profile-error-focus-transfer-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-800-profile-error-focus-transfer-2026-05.md` |
| user gate | manual screen reader smoke, commit, push, PR |

### i02-admin-error-type-unify（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/i02-admin-error-type-unify/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / completed-tasks moved` |
| scope | admin mutation hook の 401 / 非 2xx error class 統一 |
| implementation | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| tests | `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`, `apps/web/src/lib/fetch/authed.spec.ts` |
| invariant | 401 は `AuthRequiredError` + `/login?redirect=...` redirector、403 / 4xx / 5xx は `FetchAuthedError(status, bodyText)`。既存 caller の hook 利用形は互換 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-i02-admin-error-type-unify-artifact-inventory.md` |
| source | `docs/30-workflows/completed-tasks/integration-fixes-i02-admin-error-type-unify.md` consumed |
| user gate | commit / push / PR |

### parallel-i02b-admin-mutation-error-finalize（2026-05-23）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/parallel-i02b-admin-mutation-error-finalize/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| scope | i02 closeout: residual `AdminMutationError` class removal and panel migration to `FetchAuthedError` |
| implementation | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/components/admin/{MeetingPanel,SchemaDiffPanel,RequestQueuePanel}.tsx` |
| tests | `MeetingPanel.component.spec.tsx`, `SchemaDiffPanel.component.spec.tsx`, `RequestQueuePanel.component.spec.tsx`, `useAdminMutation.spec.ts` |
| invariant | `FetchAuthedError.status` is the discriminator; user-facing fallback text reads `bodyText`, not `message` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-parallel-i02b-admin-mutation-error-finalize-artifact-inventory.md` |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02b-admin-mutation-error-finalize/spec.md` completed |
| user gate | commit / push / PR |

### serial-05-step-03 schema diff resolve UI（2026-05-16）
### Runtime Smoke Staging Secrets Restore（2026-05-16）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/runtime-smoke-staging-secrets-restore/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / user-gated runtime evidence boundary user-gated` |
| scope | `staging-runtime-smoke` 必須 4 secret を `verify-env-secrets.allowlist` の env-required contract とテストへ追加 |
| implementation | `scripts/ci/verify-env-secrets.sh`, `scripts/ci/verify-env-secrets.allowlist`, `scripts/ci/__tests__/verify-env-secrets.spec.sh` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| provisioner | `scripts/smoke/provision-staging-secrets.sh`（op:// path は SECRETS[] と `verify_staging_marker()` 双方 `op://Employee/ubm-hyogo-env/STAGING_*` で同期） |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-runtime-smoke-staging-secrets-provisioning-2026-05.md` (L-PRS779-001..005: helper op:// 分散、`op item edit` stdout leak、staging member rules_consent fixture、JWT 24h、production 対称化方針) |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260516-runtime-smoke-staging-secrets-restore.md` |
| boundary | runtime inline value check is retained; secret placement, workflow rerun, commit, push, PR are user-gated。production-runtime-smoke env は dev→main マージ未済のため secret 投入保留（allowlist 行も未追加） |

### UI Prototype Design System Foundation（2026-05-18）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ui-prototype-design-system-foundation/` |
| 状態 | `CONTRACT_READY_IMPLEMENTATION_PENDING / implementation / VISUAL` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING` |
| 状態 | `spec_created / implementation / VISUAL`（parallel-01 は `runtime_pending`: local CSS selectors added, serial-07 visual evidence pending） |
| 状態 | `spec_created / implementation / VISUAL`（parallel-01 は `runtime_pending`: local CSS selectors added, serial-07 visual evidence pending） |
| 状態 | `spec_created / implementation / VISUAL` |
| prototype coverage SSOT | `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md` |
| strict Phase 12 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` |
| source inventory | `claude-design-prototype/{app.jsx,data.jsx,icons.jsx,index.html,pages-admin.jsx,pages-member.jsx,pages-public.jsx,primitives.jsx,styles.css}` + `specs/09a..09h` |
| current app path rule | `apps/web/app/**` is canonical; `/login`, `/profile`, `/privacy`, `/terms` remain root app paths |
| implementation boundary | no new API endpoint / D1 schema / Google Form change; minimal `apps/web` AppShell / selector hooks and parallel-02 G3 CSS marker blocks added; full 19-route binding and visual evidence remain user-gated work |
| parallel-02 close-out | `apps/web/src/styles/globals.css` G3-1/2/3 markers + `MemberFilters.client.tsx` tag-pill data-component + visual harness + Playwright spec; Phase 11 9 screenshot + 5 log present, strict 7 outputs aggregated at parent root |
| follow-up unassigned | `docs/30-workflows/unassigned-task/UT-DSF-01..07-*.md`（globals-css / AppShell / page-chrome / route blueprint / form binding / regression evidence / runtime screenshots） |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-02-prototype-css-rules-port-2026-05.md`（L-P02-001..007） |
| implementation boundary | no new API endpoint / D1 schema / Google Form change; minimal `apps/web` AppShell / selector hooks and parallel-01 P1-1〜P1-5 CSS selectors added; full 19-route binding and visual evidence remain user-gated work |
| implementation boundary | no new API endpoint / D1 schema / Google Form change; minimal `apps/web` AppShell / selector hooks and parallel-01 P1-1〜P1-5 CSS selectors added; full 19-route binding and visual evidence remain user-gated work |
| implementation boundary | no new API endpoint / D1 schema / Google Form change; minimal `apps/web` AppShell / selector hooks added; full 19-route binding and visual evidence remain user-gated work |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md` |
| sub-workflow parallel-03 AppShell Layouts（2026-05-19 / EV-12 updated 2026-05-23） | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`、status `implemented_local_evidence_captured / implementation / VISUAL (public screenshot + admin DOM scrape present; member DOM / full chrome screenshots delegated)`、`implementation_mode: existing-layout-alignment`、3 layout (`apps/web/app/(public\|member\|admin)/layout.tsx`) に `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` を付与、OKLch token (`var(--ubm-color-*)`) 経由のみ、既存 primitive 無改変、admin は `getSession()` 2 段防御 + redirect 維持、Phase 11 evidence は `outputs/phase-11/`（EV-12 `dom-scrape-admin.txt` present / `parallel-03-admin-shell-scrape.spec.ts`）、lessons-learned `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-03-appshell-layouts-2026-05.md` (L-PAR03-001..005) |
| follow-up 001 AdminTopbar extraction（2026-05-23） | `docs/30-workflows/parallel-03-followup-001-admin-topbar-primitive-extraction/`、status `implemented_local_evidence_captured / implementation / NON_VISUAL`、source unassigned consumed、`apps/web/src/components/layout/AdminTopbar.tsx` を追加し `(admin)/layout.tsx` の inline `<header data-shell="topbar">` を `<AdminTopbar />` に置換、`apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` 追加。親 parallel-03 の successor contract として `data-shell="topbar"` は primitive root、`data-route-group` / `data-theme` は wrapper 側に残す。DOM 同型 + existing layout spec + serial-07 visual owner 継続により screenshot baseline 追加なし。commit / push / PR は user-gated |
| sub-workflow serial-06 Form Response Binding（2026-05-23） | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/`、status `spec_created / implementation / VISUAL / strict7-parent-aggregated`、adapter/page/MemberDetail/fixture/spec の実装仕様。standalone `docs/30-workflows/serial-06-form-response-binding/` は禁止 duplicate topology、Phase 12 strict 7 は parent root 集約、sub 側は `phase-12-compliance-check.md` のみ |
| sub-workflow parallel-03 AppShell Layouts（2026-05-19） | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/`、status `implemented_local_evidence_captured / implementation / VISUAL (public chrome only; admin/member deferred-to-serial-07)`、`implementation_mode: existing-layout-alignment`、3 layout (`apps/web/app/(public\|member\|admin)/layout.tsx`) に `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` を付与、OKLch token (`var(--ubm-color-*)`) 経由のみ、既存 primitive 無改変、admin は `getSession()` 2 段防御 + redirect 維持、Phase 11 evidence は `outputs/phase-11/`、lessons-learned `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-03-appshell-layouts-2026-05.md` (L-PAR03-001..005) |

### member-header-admin-link（2026-05-28）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/member-header-admin-link/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_visual_pending_user_gate` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` Task E |
| scope | MemberHeader admin CTA, member layout authView配信, `auth-view` 最小基盤 |
| implementation targets | `apps/web/src/lib/auth-view/*`, `apps/web/src/components/layout/MemberHeader.tsx`, `apps/web/app/(member)/layout.tsx` |
| evidence | focused Vitest 9 PASS、workspace typecheck PASS、workspace lint PASS、HEX grep PASS、member header contract grep PASS、local header screenshots 2 PNG |
| invariant | no new endpoint / no D1 schema / no PII in DOM; member header maps guest/missing authView to `data-auth-state="member"` fail-closed |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-member-header-admin-link-artifact-inventory.md` |
| user gate | staging visual smoke, commit, push, PR |

### public-header-session-aware-auth-view-base（2026-05-28）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/public-header-session-aware-auth-view-base/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / Phase 13 pending_user_approval` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` Task A |
| implemented targets | `apps/web/src/lib/auth-view/*`, `apps/web/src/components/public/PublicHeader.tsx`, `apps/web/app/(public)/layout.tsx` |
| tests | focused Vitest 24 PASS (`resolveAuthView`, `getAuthView`, `PublicHeader`, `PublicLayout`) |
| Phase 11 | local component screenshots present for guest/member/admin |
| invariant | no new endpoint / no D1 schema / no Google Form change; `data-auth-state` is only `guest\|member\|admin`; no PII in DOM |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-public-header-session-aware-auth-view-base-artifact-inventory.md` |
| user gate | staging authenticated runtime visual, commit, push, PR |

### issue-1010-auth-view-session-contract-integration-test（2026-05-30）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| source | `docs/30-workflows/completed-tasks/issue-1010-auth-view-session-contract-integration-test/unassigned-task-specs/public-header-auth-view-session-contract-integration-test-001.md`（consumed） |
| purpose | 実 `buildAuthConfig().callbacks.session` 出力を `resolveAuthView()` / `getAuthView()` に連鎖し、AuthView session contract drift を検出する |
| implementation | `apps/web/src/lib/auth-view/__tests__/authViewSessionContract.integration.spec.ts` |
| evidence | focused Vitest 4 files / 61 tests PASS、web typecheck PASS、workspace lint PASS |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-1010-auth-view-session-contract-integration-test-artifact-inventory.md` |
| user gate | commit, push, PR |

### public-header-logged-in-nav-cleanup（2026-05-28）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / implementation_complete_pending_pr` |
| scope | PublicHeader session awareness, root/legal public shell consistency, login safe redirect, MemberHeader admin CTA, AdminSidebar public-return, Playwright auth slot coverage |
| implementation targets | `apps/web/src/lib/auth-view/*`, `apps/web/src/components/public/PublicHeader.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/app/{page,privacy,terms}/page.tsx`, `apps/web/src/components/layout/{MemberHeader,AdminSidebar,AdminSidebarNavItem}.tsx`, `apps/web/middleware.ts`, `apps/web/playwright/tests/auth-slot-coverage.spec.ts` |
| evidence | focused Vitest 29 PASS, web typecheck PASS, Playwright setup-auth + auth-slot-coverage 28/28 PASS |
| strict Phase 12 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` |
| invariant | no new endpoint / no D1 schema / no PII in DOM; `data-auth-state` is only `guest\|member\|admin`; route topology stays unchanged |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-public-header-logged-in-nav-cleanup-artifact-inventory.md` |
| user gate | remote CI observation, staging runtime visual, commit, push, PR |

### public-header-auth-slot-e2e（2026-05-28）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| scope | 7 routes x 3 states auth-slot Playwright coverage for parent public-header DOM contract |
| implementation targets | `apps/web/playwright/tests/setup-auth.spec.ts`, `apps/web/playwright/tests/auth-slot-coverage.spec.ts`, `apps/web/playwright/.auth/.gitignore`, `apps/web/playwright.config.ts`, `.github/workflows/playwright-smoke.yml` |
| evidence | `setup-auth` 3 PASS + `auth-slot-coverage` 25 PASS（dependency setup 含め 28/28 PASS）、storageState JSON ignored |
| strict Phase 12 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` |
| invariant | no new API endpoint / no D1 schema / no Google Form schema / no Auth.js config change; cookie/token values never appear in docs, logs, artifacts, or PR body |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-public-header-auth-slot-e2e-artifact-inventory.md` |
| user gate | remote GitHub Actions observation, commit, push, PR |

### task-c-privacy-terms-public-shell-spec（2026-05-28）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-c-privacy-terms-public-shell-spec/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_verification_passed` |
| parent | `docs/30-workflows/public-header-logged-in-nav-cleanup/` |
| source task | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-c-privacy-terms-public-shell.md` |
| scope | `/privacy`, `/terms` に `<PublicHeader authView />` + `<PublicFooter />` を mount。metadata と LegalProse 本文は不変 |
| planned targets | `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`, `apps/web/app/privacy/__tests__/page.spec.tsx`, `apps/web/app/terms/__tests__/page.spec.tsx` |
| strict Phase 12 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-c-privacy-terms-public-shell-spec-artifact-inventory.md` |
| evidence | focused Vitest/typecheck/lint PASS、Phase 11 guest/member/admin screenshots 6 件 present |
| user gate | commit, push, PR |

### Issue #749 Primitive Adoption Tracker（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING / standard` |
| source | Issue #749 CLOSED / PR 文脈は `Refs #749` のみ |
| route SSOT | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`（19 routes） |
| scope | 19 routes x 6 primitive（FormField / EmptyState / Pagination / Icon / Breadcrumb / useAdminMutation）採用 tracker |
| same-cycle policy sync | `CLAUDE.md` 不変条件 9 / 10 に admin FormField と canonical useAdminMutation を追記 |
| evidence boundary | `apps/web` implementation、Phase 11 grep/typecheck/focused tests、Phase 12 strict 7 は captured。runtime screenshot、commit、push、PR は user-gated |

### UT-07A-FU-01 memberTags.assignTagsToMember cleanup（2026-05-15）
### i02-admin-error-type-unify（2026-05-17）
### Issue #747 Vitest esbuild arch & worktree isolation（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/` |
| 状態 | `implemented_local_runtime_blocked_node_arch / implementation / NON_VISUAL / PARTIAL_LOCAL_EVIDENCE_NODE_ARCH_BLOCKED` |
| source | Issue #747 CLOSED / `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md` consumed |
| root cause | Node arch x64 under Rosetta 2 + worktree `node_modules` missing `@esbuild/darwin-x64` + parent repository `@esbuild/darwin-x64@0.25.4` leakage |
| contract | root `esbuild@0.27.3` devDependency; `verify-node-arch`, `verify-worktree-isolation`, `verify-esbuild`, `verify:vitest-runtime`; focused Vitest root scripts `test:parallel09-primitives` / `test:parallel09-use-admin-mutation` |
| evidence boundary | focused Vitest 2 specs, worktree isolation, and esbuild version parity pass locally; `verify:node-arch` blocks because local Node is x64; CI / commit / push / PR remain user-gated |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-747-vitest-esbuild-arch-and-worktree-isolation-artifact-inventory.md` |

### Issue #776 schema alias bulk resolve UI（2026-05-18）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-776-schema-alias-bulk-resolve/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL / staging_pending` |
| source | Issue #776 CLOSED / `docs/30-workflows/unassigned-task/serial-05-step-03-followup-002-schema-alias-bulk-resolve.md` consumed |
| parent | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| contract | Existing `POST /admin/schema/aliases` only; `postSchemaAliasBulk` uses bounded fan-out, row-level progress, `success / retryable / error` result states |
| retryable boundary | `202 backfill_cpu_budget_exhausted` remains retryable continuation in the modal, not a failure |
| implementation | `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `SchemaDiffBulkResolveModal.tsx`, `schemaAliasValidation.ts`, `hooks/useSchemaDiffBulkSelection.ts`, `apps/web/src/lib/admin/api.ts`, `apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts` |
| evidence | focused Vitest/typecheck PASS; `outputs/phase-11/bulk-*.png`, `perf-30rows.md`, `a11y-manual-check.md`; `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-776-schema-alias-bulk-resolve-artifact-inventory.md` |

### UT-07A-FU-01 memberTags.assignTagsToMember cleanup（2026-05-15）
### parallel-09 UX cross-cutting primitives visual evidence（Issue #746 / 2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/` |
| recovery root | `docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| source | Issue #746 CLOSED / `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md` consumed |
| implementation | `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` completed-tasks evidence path + `PARALLEL09_EVIDENCE_DIR` override |
| evidence | `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/*.png` (12), Issue #746 `outputs/phase-11/playwright-run.txt` |
| user gate | commit / push / PR / issue mutation / staging-production smoke |

### UT-07B alias recommendation i18n（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-07b-alias-recommendation-i18n/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #292 CLOSED / source task consumed to `docs/30-workflows/completed-tasks/UT-07B-alias-recommendation-i18n-001.md` |
| implementation | `apps/api/src/services/aliasRecommendation.ts` の `normalizeLabelForCompare` |
| contract | `recommendedStableKeys` label 比較前に NFKC + trim + whitespace 圧縮。response shape は `string[]` 維持 |
| tests | `apps/api/src/services/aliasRecommendation.spec.ts` 20 tests PASS; `apps/api/src/routes/admin/schema.contract.spec.ts` 16 tests PASS; apps/api suite 48 files / 300 tests PASS |
| evidence | `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | commit / push / PR |

### CI Env Secret Inventory And Preflight Gate（2026-05-16）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| scope | `staging-runtime-smoke` 5 secrets, adjacent 15 workflow secret refs, env/repo preflight gate |
| implementation | `scripts/ci/verify-env-secrets.sh`, `scripts/ci/__tests__/verify-env-secrets.spec.sh`, `scripts/ci/verify-env-secrets.allowlist`, `.github/workflows/verify-env-secrets.yml`, `.github/workflows/d1-migration-verify.yml` |
| inventory | `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-02-adjacent-unregistered-secret-inventory/inventory.md` |
| runbook | `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-01-staging-runtime-smoke-secret-finalization/runbook.md` |
| evidence | `outputs/phase-11/evidence/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-ci-env-secret-inventory-and-preflight-gate-2026-05.md` (L-CI-ENV-001..005) |
| user gate | secret placement, variable placement, `runtime-smoke-staging.yml` rerun, commit, push, PR |

### UT-07A-FU-01 memberTags.assignTagsToMember cleanup（2026-05-15）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| 状態 | `implemented-local-runtime-pending / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| scope | 既存 `SchemaDiffPanel` の stableKey validation / table semantics / focus / error payload / status label hardening |
| implementation | `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/lib/admin/api.ts` |
| tests | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`, `apps/web/src/lib/admin/__tests__/api.spec.ts` |
| API | `GET /admin/schema/diff`, `POST /admin/schema/aliases`; `stableKey` regex `/^[a-zA-Z][a-zA-Z0-9_]*$/`; 202 retryable / 409 existingStableKey / 422 existingQuestionIds |
| runtime boundary | real authenticated screenshots and staging smoke remain runtime pending |

### PARALLEL-01-NAV admin navigation wayfinding（2026-05-15）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/parallel-01-navigation-admin-wayfinding/` |
| 状態 | `implemented_local_user-gated runtime evidence boundary / implementation / VISUAL` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL` |
| scope | AdminSidebar home link + MemberDrawer tags link |
| implementation | `apps/web/src/components/layout/AdminSidebar.tsx`, `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| tests | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`, `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` |
| evidence | `outputs/phase-11/dom-snapshot.txt`, mock fallback PNG 2 files, component/typecheck/lint/build logs |
| runtime boundary | real authenticated screenshots and staging smoke remain runtime pending |
| source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md` |

### fix-cf-deploy-esbuild-import-source-staging-failure（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| root cause | `wrangler@4.85.0` requires `esbuild@0.27.3`, but root `pnpm.overrides.esbuild` pinned all esbuild resolution to `0.25.4` |
| implementation targets | `package.json`, `pnpm-lock.yaml`, `scripts/cf.sh` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-fix-cf-deploy-esbuild-import-source-staging-failure-artifact-inventory.md` |
| user gate | GitHub Actions deploy-staging / runtime smoke / commit / push / PR |

### PR #795 residual CI cache / Cloudflare token recovery（2026-05-18）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/fix-ci-cache-and-cf-token-pr795/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| task-01 | `setup-project.cache` input を追加し、`workflow-shell-lint` の `install: 'false'` caller は `cache: ''` で setup-node pnpm cache を無効化 |
| task-02 | Historical PR #795 note: backend-ci D1 / Workers scoped secrets (`CF_TOKEN_D1_*`, `CF_TOKEN_WORKERS_*`) were once documented as the scoped source behind `with.apiToken` and step-level `env.CLOUDFLARE_API_TOKEN`. Current `backend-ci.yml` uses environment-scoped `CLOUDFLARE_API_TOKEN` directly. |
| implementation targets | `.github/actions/setup-project/action.yml`, `.github/workflows/ci.yml`, `.github/workflows/backend-ci.yml`, `scripts/__tests__/workflow-env-scope.test.sh` |
| evidence | `outputs/phase-11/evidence.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | GitHub environment secret confirmation / GitHub Actions runtime evidence / commit / push / PR |

### Issue #638 CLOUDFLARE_PAGES_PROJECT GitHub Variable deletion（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-638-cloudflare-pages-project-var-deletion/` |
| 状態 | `implemented_local_pending_pr / implementation / NON_VISUAL / external_mutation_completed` |
| deletion target | GitHub repository variable `CLOUDFLARE_PAGES_PROJECT` (`ubm-hyogo-web`) |
| evidence | `outputs/phase-11/evidence/current-repo-variables.json`, `source-grep-preflight.txt`, `pre-mutation-static-summary.txt`, `user-approval-marker.md`, `before.json`, `before-single.json`, `after.json`, `after-single.txt`, `grep-gate.txt`, `deletion-log.md` |
| user gate | DELETE completed with approval marker. Rollback `POST`, push, PR, and Issue operation still require separate user approval |
| source task | `docs/30-workflows/unassigned-task/issue-331-followup-001-cloudflare-pages-project-var-deletion.md` superseded in place |
| related | Issue #331 Workers deploy cleanup, Issue #419 Pages dormant cleanup historical-only, followup-002 Pages project physical deletion remains separate |

### UT-17 follow-up 004 — Cloudflare Notification Policy IaC（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-17-followup-004-cloudflare-notification-policy-iac/` |
| 状態 | `implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval` |
| scope | Cloudflare Notification Policy 4 categories / 5 policy files + webhook destination 1 件を IaC 化済み。Cloudflare apply は user-gated |
| command contract | `bash scripts/cf.sh alerts {apply,diff,list}`（implemented。Cloudflare update は `PUT`） |
| token contract | apply=`CLOUDFLARE_ALERTS_TOKEN_APPLY` / read=`CLOUDFLARE_ALERTS_TOKEN_READ` / URL drift=`CLOUDFLARE_ALERT_RELAY_URL` |
| webhook definition root | `infra/cloudflare-alerts/webhooks/` |
| parent | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/` |
| user gate | Cloudflare token placement / Cloudflare mutation / commit / push / PR |

### UT-17 follow-up 005 — Alert Relay KV Operation Error Metrics（2026-05-16）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-17-followup-005-alert-relay-kv-operation-error-metrics/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| implementation | `apps/api/src/routes/internal/alert-relay.ts` adds fail-safe `logKvOperationError`, `KV.get` fail-open logging, `KV.put` structured logging |
| log event | `alert_relay_kv_op_failed` with `op`, `errorClass`, `dedupeKeyHash`, `isolateId`, `ts`; hash failure uses `dedupeKeyHash="hash_error"` |
| evidence | `outputs/phase-11/evidence/{typecheck,lint,build,test,grep-gate}.txt`; API test PASS = 48 files / 294 tests |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` section 5 |
| user gate | runtime Workers Logs tail / deploy / commit / push / PR |

### task-alert-relay-global-scope-fix-001 — Alert Relay Workers Global Scope Fix（2026-05-21）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-alert-relay-global-scope-fix-001/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / staging deploy validation pending_user_approval` |
| implementation | `apps/api/src/routes/internal/alert-relay.ts` lazily initializes `isolateId` through `getIsolateId()` instead of module top-level `crypto.randomUUID()` |
| local deploy token bridge | `scripts/cf.sh` maps `deploy --env staging\|production` to `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` from 1Password, then exposes only child-env `CLOUDFLARE_API_TOKEN` to wrangler |
| regression test | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` TC-GS-01 asserts import-time `crypto.randomUUID` is not called |
| artifact inventory | `references/workflow-task-alert-relay-global-scope-fix-001-artifact-inventory.md` |
| deployment secrets spec | `references/deployment-secrets-management.md` v1.4.7 local-only token bridge |
| lessons learned | `lessons-learned/lessons-learned-task-alert-relay-global-scope-fix-001-2026-05.md` |
| user gate | deploy-staging CI job / commit / push / PR |


### task-18-FU Full Visual Regression Suite（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-18-fu-full-visual-regression-suite/` |
| 状態 | `implemented_local_user-gated runtime evidence boundary / implementation / VISUAL` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL` |
| upstream | `docs/30-workflows/completed-tasks/task-18-w7-verify-tokens-and-playwright-smoke/` |
| route contract | W7 17 URL set: public 6 / member 2 / admin 8 / not-found 1 |
| target visual scope | 17 routes x desktop/tablet/mobile = 51 baselines |
| artifact inventory | `references/workflow-task-18-fu-full-visual-regression-suite-artifact-inventory.md` |
| baseline boundary | baseline-missing CI fail is not acceptable for required checks; 51 baselines must be present before required-check promotion |
| user gate | baseline update approval, commit, push, PR |

### UI prototype alignment / MVP recovery task-23 verification status matrix（2026-05-14）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-23-ui-mvp-w8-par-verification-status-matrix/` |
| 状態 | `implemented_local_evidence_captured / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| parent workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` |
| evidence boundary | Phase 5/7/9 deterministic matrix evidence, root/output artifacts parity, Phase 11 NON_VISUAL marker, Phase 12 strict 7 present, documentation-changelog entry checklist + validator execution log |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-23-docs-only-final-deliverable-state-gate-2026-05.md` |
| downstream | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` can use the generated `VERIFICATION-STATUS.md` |
| user gate | commit / push / PR |

### UI prototype alignment / MVP recovery task-27 3-layer task mapping（2026-05-15）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/` |
| 状態 | `implemented_local_evidence_captured / docs-only / NON_VISUAL / Phase 13 blocked` |
| parent workflow | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| generated deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` |
| evidence | `outputs/phase-5/implementation-notes.md`, `outputs/phase-7/coverage.md`, `outputs/phase-11/manual-test-result.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| inputs | task-23 `VERIFICATION-STATUS.md`, task-24 `INVARIANT-AUDIT.md`, task-25 `SMOKE-COVERAGE-MATRIX.md`, completed task-26 common surfaces context |
| layer model | historical `3-layer` name + `PUB / MEM / ADM / COM` matrix columns |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping-artifact-inventory.md` |
| user gate | commit / push / PR |

### parallel-10 Auth Session Handling（2026-05-15）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/parallel-10-auth-session-handling/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| client 401 | `useAdminMutation` が same-origin `/api/admin/*` から 401 を受け、`toLoginRedirect(currentPath)` で `/login?redirect=<encoded>` へ遷移。`normalizeRedirectPath` は `/login?...` / external / protocol-relative / backslash を `/profile` fallback |
| client 403 | `useAdminMutation` が `"権限がありません"` を Toast `alert` variant（`role="alert"` / `aria-live="assertive"`）で表示し、`error` state を保持 |
| implementation targets | `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/components/ui/Toast.tsx`, `apps/web/src/lib/url/safe-redirect.ts` |
| system spec | `docs/00-getting-started-manual/specs/02-auth.md`（Client 401 / 403 ハンドリング） |
| evidence | `outputs/phase-11/evidence/{typecheck,lint,test,build}.txt`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| user gate | commit / push / PR |

### Issue #622 Packages Test Suffix Rename（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-622-packages-test-suffix-rename/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / rename-only / local-evidence-partial` |
| source | `docs/30-workflows/completed-tasks/task-issue-325-followup-002-packages-test-suffix-rename.md` |
| upstream | #325 apps/api rename, #621 apps/web rename |
| downstream | #623 / `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` |
| implementation targets | `packages/shared` 17 test files, `packages/integrations` and `packages/integrations-google` 11 test files, package ADR files |
| evidence | `outputs/phase-05/rename-mapping.csv`, `outputs/phase-11/main.md`, `outputs/phase-11/evidence/`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| focused tests | `@ubm-hyogo/shared`, `@ubm-hyogo/integrations`, `@ubm-hyogo/integrations-google` |
| issue wording | Issue body 26 files is stale; implementation uses current measured 28 files. PR uses `Closes #622`; `Refs #325`, `Refs #621`, `Refs #623` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-622-packages-test-suffix-rename-2026-05.md`（Issue body と実測の乖離 / `local-evidence-partial` 採用 / `apps/api/tsconfig.build.json` exclude pattern / Phase-12 strict 7 と artifacts.json の SSOT 関係） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260511-issue622-packages-test-suffix-rename-spec.md` |

### Issue #590 Phase 11 canonical evidence paths（2026-05-10）

### Issue #589 Gate Metadata Structured Ledger（2026-05-10）

### E2E Quality Uplift Stage 3 — branch protection desired-state manifest land（Issue #608 / 2026-05-12）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/e2e-quality-uplift-stage-3/` |
| 状態 | `implemented_local_user-gated runtime evidence boundary / implementation / NON_VISUAL`（Phase 12 strict 7 PASS / apply+verify evidence captured） |
| desired contexts manifest | `.github/branch-protection/{dev,main}.json`（`ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate` のみを宣言。PUT body 全体ではない） |
| adapter | `.github/branch-protection/apply.sh`（fresh GET → contexts/strict 差し替え → CLAUDE.md 不変条件正規化 → optional fields は fresh 値保持） |
| verifier | `scripts/verify-branch-protection.sh`（read-only drift gate / 契約: 最終行 `OK(<branch>): no drift`） |
| INV 正規化対象 | INV-SOLO (`required_pull_request_reviews=null`) / INV-ENF (`enforce_admins=true`) / INV-LINEAR (`required_linear_history=true`) / INV-LOCK (`lock_branch=false`) |
| lighthouse readiness | `.github/workflows/lighthouse.yml`（`nohup pnpm --filter @ubm-hyogo/web start` + `pnpm dlx wait-on -t 120000 http-get://localhost:3000` / `pull_request.branches=[dev,main]` + `workflow_dispatch`） |
| canonical reference | `references/branch-protection-desired-state-manifest.md` |
| 関連 lessons | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md` L-E2EQU-S3A-001..003 |
| operational SSOT | GitHub branch protection fresh GET（`gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection`） |
| user gate | PR creation / `gh pr checks` required-context 表示 / Lighthouse workflow run / commit / push / PR |

### Wait-on readiness pattern（CI server startup）

| 目的 | 内容 |
| --- | --- |
| 適用先 | 外部サーバ起動を待つ CI step（Lighthouse / smoke / E2E） |
| 起動 | `nohup pnpm --filter <app> start > /tmp/<app>-server.log 2>&1 &` + `echo $! > /tmp/<app>-server.pid` |
| 待機 | `pnpm dlx wait-on -t 120000 http-get://localhost:<port>`（`npx` は L-E2EQU-011 により禁止） |
| 利点 | exit code / timeout / cleanup を構造担保。手作り retry loop の二重起動・SIGTERM 漏れを排除 |
| 関連 | `references/quality-e2e-testing.md`「lighthouse-ci の readiness pattern」/ L-E2EQU-S3A-003 |

---

### Issue #603 phase-12 compliance-check CI gate（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` |
| 状態 | `implemented_local_user-gated runtime evidence boundary / implementation / NON_VISUAL` |
| CI gate | `.github/workflows/verify-phase12-compliance.yml` |
| script | `scripts/verify-phase12-compliance.ts` |
| canonical headings | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` Required Sections 9 項目 |
| focused test | `scripts/__tests__/verify-phase12-compliance.test.ts` |
| artifact inventory | `references/workflow-issue-603-phase12-compliance-check-ci-gate-artifact-inventory.md` |
| source task | `task-spec-skill-compliance-check-ci-gate` consumed/promoted |

### UI prototype alignment / MVP recovery task-16 admin tags meetings requests（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-16-admin-tags-meetings-requests/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/admin/tags`, `/admin/meetings`, `/admin/requests` |
| implementation targets | `apps/web/app/(admin)/admin/{tags,meetings,requests}/page.tsx`, `apps/web/src/components/admin/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.tsx`, `apps/web/src/lib/admin/{api,server-fetch}.ts` |
| API boundary | Existing admin endpoints only: `/admin/tags/queue`, `/admin/tags/queue/:queueId/resolve`, `/admin/meetings`, `/admin/meetings/:id`, `/admin/meetings/:id/attendances`, `/admin/requests`, `/admin/requests/:noteId/resolve` |
| corrected drift | Stale `apps/web/src/app`, `src/features/admin`, `adminClient`, `/decision`, and `approved` wording removed from normative task-16 contract |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-16-admin-tags-meetings-requests-artifact-inventory.md` |
| user gate | runtime screenshots / staging smoke / commit / push / PR |

### Admin tags queue resolver drawer（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-tags-queue-resolver-drawer/` |
| 状態 | `implemented_local_evidence_captured / implementation / VISUAL` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-04-tags-assignment/spec.md`（`_components` 新規前提は superseded） |
| implementation targets | `apps/web/src/components/admin/TagQueuePanel.tsx`, `TagsQueueResolveDrawer.tsx`, `_tagQueueStatus.ts`, `apps/web/src/features/admin/hooks/useAdminMutation.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright/tests/admin-tags-resolve-drawer.spec.ts`, `apps/web/src/styles/tokens.css` |
| API boundary | browser/BFF path `/api/admin/tags/queue/:queueId/resolve` -> upstream `/admin/tags/queue/:queueId/resolve`; no API/D1/schema change |
| UI contract | `TagQueuePanel` は list/filter/trigger、`TagsQueueResolveDrawer` は dialog/focus trap/ESC/return focus/schema validation/terminal submit block |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`; local Vitest PASS; Phase 11 VISUAL screenshots 5 PNG; axe violations 0 |
| lessons | `references/lessons-learned-admin-tags-queue-resolver-drawer-2026-05.md` |
| user gate | staging smoke, commit, push, PR |

### Issue #630 authenticated /profile LHCI a11y（2026-05-13）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL` |
| issue state | #630 CLOSED at `2026-05-12T06:26:21Z`; use `Refs #630` |
| route scope | `/profile` |
| auth contract | `signSessionJwt(AUTH_SECRET, { memberId, email, isAdmin: false, ttlSeconds: 3600 })` |
| cookie | `authjs.session-token` for `localhost` |
| implementation targets | `apps/web/scripts/lhci-auth-storage.ts`, `apps/web/scripts/lhci-profile-mock-api.ts`, `apps/web/lhci/lhci-auth.cjs`, `lighthouserc.authenticated.json`, `.github/workflows/lighthouse.yml`, `lighthouserc.json` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`; CI LHCI artifacts pending user-approved PR run |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-630-authenticated-profile-lhci-a11y-2026-05.md` |
| user gate | GitHub Secret mutation / runtime LHCI / commit / push / PR |

### UI prototype alignment / MVP recovery task-14 my profile and requests（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-14-my-profile-and-requests/` |
| 状態 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/profile` |
| implementation targets | `apps/web/app/(member)/profile/page.tsx`, `apps/web/app/(member)/profile/_components/*` |
| UI contract | `PublicVisibilityBanner`, `StatusSummary`, `RequestActionPanel`, `VisibilityRequestDialog`, `DeleteRequestDialog` |
| selector contract | `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog` |
| API boundary | Existing `/me` self-service API only; no task-14 changes to `apps/api/src/routes/me/*` or new `apps/web/app/api/me/*` handlers |
| evidence | `outputs/phase-11/manifest.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-14-my-profile-and-requests-artifact-inventory.md` |
| user gate | authenticated screenshots / staging smoke / production smoke / commit / push / PR |

### UI prototype alignment / MVP recovery task-13 login rebuild（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-13-login-rebuild/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route scope | `/login` |
| implementation targets | `apps/web/app/login/page.tsx`, `apps/web/app/login/_components/{LoginPanel.client,LoginCard,LoginStatus,MagicLinkForm.client,GoogleOAuthButton.client}.tsx`, `apps/web/src/lib/url/login-query.ts`, `apps/web/playwright/tests/login-smoke.spec.ts` |
| UI contract | 5 core states (`input / sent / unregistered / deleted / error`) + `rules_declined` derived state + `gate=admin_required` overlay |
| locator contract | `data-testid="login-card"` + `data-state="<LoginGateState>"` |
| a11y contract | `deleted` / `error` / `rules_declined` are `role="alert"` |
| API boundary | Auth.js + Magic Link API surface unchanged; `apps/web/app/api/auth/*` diff must remain 0 |
| dependencies | task-09 / task-10 |
| downstream | task-18 regression smoke / verify-design-tokens |
| evidence boundary | Phase 12 strict 7, artifacts parity, apps/web implementation, focused tests, and local screenshot evidence are present. Staging smoke, production-equivalent runtime evidence, commit, push, and PR remain user-gated |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-13-login-rebuild-artifact-inventory.md` |

### parallel-i03 profile request dialog refresh order（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/parallel-i03-dialog-refresh-order/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| route scope | `/profile` |
| implementation targets | `apps/web/app/(member)/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx` |
| contract | dialog success / 409 duplicate-pending 両分岐とも `router.refresh() -> onSubmitted(res.accepted) -> onClose()` |
| parent boundary | `RequestActionPanel` does not call `router.refresh()` in `onSubmitted` |
| evidence | `outputs/phase-11/visual-verification-skip.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-parallel-i03-dialog-refresh-order-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-parallel-i03-dialog-refresh-order-2026-05.md`（L-PARALLEL-I03-001..005） |
| user gate | commit / push / PR |

### CI Pipeline Recovery Web CD And Runtime Smoke（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL` |
| web deploy | `.github/workflows/web-cd.yml` uses `build:cloudflare` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production` |
| web deploy secret | `.github/workflows/web-cd.yml` maps environment-scoped `secrets.CLOUDFLARE_API_TOKEN` into step-scoped env only for verify/deploy steps. `CLOUDFLARE_API_TOKEN` must not appear in job-level env or install/build steps. |
| Issue #640 step-scoped CF token cutover | `docs/30-workflows/issue-640-oidc-cf-token-cutover/`（`implemented-local-runtime-pending` / implementation / NON_VISUAL）。`web-cd.yml` and `post-release-dashboard.yml` job-level token exposure removed; `scripts/redaction-check.sh` and `scripts/__tests__/workflow-env-scope.test.sh` provide local gates. Runtime deploy evidence, OIDC full migration, legacy token revocation, commit, push, and PR are user-gated. |
| Issue #717 Cloudflare Workers OIDC support revalidation | `docs/30-workflows/issue-717-oidc-cf-full-migration/`（`verified_current_no_code_change_pending_pr` / implementation / NON_VISUAL / conditional）。2026-05-16 時点では Cloudflare Workers GitHub Actions docs と `cloudflare/wrangler-action` README が API token authentication を案内しており、supported OIDC deploy path は未確認。`web-cd.yml` は no-code、Issue #640 step-scoped `CLOUDFLARE_API_TOKEN` boundary を維持。Follow-up: `issue-717-followup-001-production-oidc-cutover`, `issue-717-followup-002-apps-api-d1-token-cutover`, `issue-717-followup-003-1password-restructure`. |
| runtime smoke guard | `.github/workflows/runtime-smoke-staging.yml` Slack post runs only when `ci-evidence/summary.json` exists |
| secret provisioning | `bash scripts/smoke/provision-staging-secrets.sh` |
| web-cd staging / production secret provisioning | canonical runbooks: `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md` and `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md`; separate from `staging-runtime-smoke`; `CLOUDFLARE_API_TOKEN` is environment-scoped web-cd deploy token, `CLOUDFLARE_ACCOUNT_ID` is Variables-managed, evidence records `op://` references only, and secret mutation / commit / push / PR are user-gated |
| Phase 12 | parent design root pending; task-01 strict outputs at `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| approval boundary | secret placement / deploy run / runtime smoke / Slack failure injection / commit / push / PR are user-gated |
| build mode 不変条件 | `apps/web` production build は `next build --webpack`。Turbopack は local dev 限定（`deployment-cloudflare-opennext-workers.md` §11.1） |
| failure cascade guard | 通知 step は `if: ${{ failure() && hashFiles('<artifact>') != '' }}` で前提 artifact を guard する（`deployment-gha.md`） |
| Environment secret 0 件問題 | smoke 起動前に `bash scripts/smoke/provision-staging-secrets.sh` + name-only inventory を必須化（`deployment-secrets-management.md`） |
| lessons-learned | `references/lessons-learned-ci-pipeline-recovery-2026-05.md`（L-CIPR-001〜006） |

### E2E quality uplift Stage 2 / 2a admin requests（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| parent workflow root | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| sub-task specs | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/` |
| 2a spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 2a implementation target | `apps/web/playwright/tests/admin-requests.spec.ts` |
| 状態 | `implemented-local-runtime-pass / implementation / NON_VISUAL` |
| strict outputs | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/outputs/phase-12/` strict 7 files |
| evidence boundary | 2a local E2E spec and support code are implemented. Desktop Chromium E2E passed 6/6; coverage 70% / CI gate PASS remains Stage 3-owned |
| SSR fixture boundary | Server Component initial `/admin/requests` data uses `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` + `NODE_ENV === "development"` because browser `page.route()` cannot intercept SSR `fetchAdmin()` |
| downstream | `docs/30-workflows/e2e-quality-uplift-stage-3/` |

### E2E quality uplift Stage 2 / 2d contract-stage-2（2026-05-11）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2d-contract-stage-2.md` |
| implementation target | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| strict outputs | `docs/30-workflows/completed-tasks/task-spec-2d-contract-stage-2/outputs/phase-12/` strict 7 files |
| evidence boundary | Local focused Vitest / typecheck / lint / grep gates passed. Commit / push / PR / CI runtime remain user-gated |
| fixture boundary | `MergeIdentityResponseZ` shared schema is the response shape SSOT; requests/audit response fixtures parse route-exported `AdminRequestsListResponseZ` / `AdminAuditListResponseZ` |
| artifact inventory | `references/workflow-task-spec-2d-contract-stage-2-artifact-inventory.md` |
| lessons-learned | `references/lessons-learned-task-spec-2d-contract-stage-2-2026-05.md`（L-2D-001..006: shared schema SSOT / named export 昇格 / pure unit / fixture inline / type-level 同型 / path 一括更新） |

### E2E Quality Uplift Stage 0-3（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow roots | `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/` |
| Stage 0 状態 | `implementation_complete_pending_pr / implementation / NON_VISUAL` (Playwright README / project filter / `evidence-capture` project / logged-in spec split / quality-gate exception) |
| Stage 1 状態 | `implemented_local / implementation_complete_e2e_verification_recorded / NON_VISUAL`（auth fixture HS256 JWT 署名・server fetch mock API・tracked `.txt` evidence） |
| Stage 2 状態 | `spec_verified_pending_dependency / docs-only spec / NON_VISUAL`（tier-aware coverage 自動 enforcement: critical ≥80% / standard ≥70% / experimental ≥50%） |
| Stage 3 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL`（branch protection desired contexts: CI / Lighthouse / e2e-tests-coverage-gate、local execution root `docs/30-workflows/e2e-quality-uplift-stage-3/`） |
| evidence boundary | Stage 0/1 は tracked runtime evidence。Stage 2 は placeholder evidence。Stage 3 は branch protection PUT + verify evidence captured、PR CI required 表示 / Lighthouse run / commit / push / PR は user-gated |
| tier policy 正本 | `.claude/skills/task-specification-creator/references/coverage-standards.md` + `quality-gates.md §7.1 (4)` (`evidence-capture` project 例外条項) |
| artifact inventory | `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`（4 stage 責務分割表 / Phase 11 evidence kind matrix / tier policy 表） |
| lessons-learned | `lessons-learned/lessons-learned-e2e-quality-uplift-stages-2026-05.md`（L-E2EQU-001..007 + 002A: Server Component fetch は browser route mock で検証不可） |
| changelog | `changelog/20260509-e2e-quality-uplift-stage0-3.md` |
| Phase 12 strict 7 | 4 stage 全てに present（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |
| user gate | runtime tier enforcement / PR CI required 表示 / Lighthouse run / commit / push / PR は user approval 後 |


### UI prototype alignment / MVP recovery task-05 error boundary and staging smoke（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| route SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`（19 routes） |
| implementation targets | `apps/web/app/{error,global-error,not-found,loading}.tsx` |
| e2e target | `apps/web/tests/e2e/staging-smoke.spec.ts` |
| fixture safety | `ENABLE_STAGING_SMOKE_FIXTURE=1`; `NODE_ENV` による staging fixture 制御は禁止 |
| command | `ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke` |
| evidence boundary | runtime deploy / Playwright smoke / Sentry dashboard は user approval 後。Phase 12 strict 7 と artifacts parity は作成済み |
| artifact inventory | `references/workflow-task-05-error-boundary-and-staging-smoke-artifact-inventory.md` |

### Issue #547 Cloudflare Audit Logs Redacted Feature Export（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-547-cf-audit-logs-redacted-production-feature-export/` |
| 状態 | `implemented_local_user-gated runtime evidence boundary / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| CLI | `scripts/cf.sh audit-log feature-export` |
| implementation | `scripts/cf-audit-log/feature-export.ts`, `scripts/cf-audit-log/feature-export/schema-validation.ts`, `scripts/cf-audit-log/feature-export/manifest.ts` |
| D1 boundary | `readEventsForFeatureExport()` returns `AuditLogEvent[]`; `raw_json` does not cross module boundary |
| evidence | `outputs/phase-11/main.md`, `fixture-exported-features.jsonl`, `fixture-export-manifest.json`, `secret-leakage-grep.log`, `schema-validation.log` |
| production gate | `outputs/phase-11/production-pending-user-gate.md`; production export is `PENDING_RUNTIME_EVIDENCE` until approval |
| PR wording | Issue #547 is CLOSED; use `Refs #547` only |

### Issue #532 Write/Tag/Note Provider ctx Injection（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / local command evidence recorded / Phase 13 pending_user_approval` |
| parent | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| provider set | `adminNotesProvider`, `auditLogProvider`, `notificationOutboxProvider`, `tagDefinitionsProvider`, `tagQueueProvider`, `memberTagsProvider` |
| boundary | D1 schema / public response shape / Auth.js admin gate unchanged |
| route write consolidation | `/admin/requests` guarded note/status/audit batch is owned by `adminNotesProvider.resolveRequestAtomic()` |
| scheduled path | Hono `c.var` is route-only; scheduled workflows use explicit provider bundle |
| evidence | `outputs/phase-11/evidence/{typecheck,lint,focused-tests,grep-direct-import,grep-fallback,coverage-guard}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-issue-532-write-tag-note-provider-ctx-injection-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-532-write-tag-note-provider-ctx-injection-2026-05.md` |
| Issue 取扱 | Issue #532 CLOSED 維持。PR 文脈は `Refs #532` のみ |
| user gate | commit / push / PR は user approval 後のみ |

### Issue #526 CI actionlint / shellcheck gate（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| CI owner | `.github/workflows/ci.yml` |
| dedicated job | `workflow-shell-lint` |
| required context path | 既存 required context `ci` 内で `pnpm observation:lint` を実行 |
| local command | `pnpm observation:lint` |
| lint対象 | `.github/workflows/post-release-observation-reminder.yml`, `.github/workflows/ci.yml`, `scripts/observation/*.sh`, `scripts/observation/test/*.sh` |
| source unassigned | `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` consumed |
| 正本 refs | `references/deployment-gha.md`, `references/post-release-long-term-observation.md`, `references/task-workflow-active.md` |
| inventory | `references/workflow-issue-526-ci-actionlint-shellcheck-gate-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` |
| 境界 | reminder workflow の schedule / workflow_dispatch / Issue 作成副作用は変更しない。runtime CI evidence、branch protection PUT、commit / push / PR は user approval 後 |

### Issue #290 workflow lint gate（2026-05-17）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/` |
| 状態 | `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| CI owner | `.github/workflows/ci.yml` |
| dedicated job | `workflow-shell-lint` |
| required context path | 既存 required context `ci` 内で `pnpm observation:lint` を実行 |
| local command | `pnpm observation:lint` |
| lint対象 | `.github/workflows/*.yml`（現行 32 件） |
| runbook | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |
| source unassigned | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md` consumed |
| inventory | `references/workflow-issue-290-workflow-lint-gate-artifact-inventory.md` |
| lessons | `references/lessons-learned-issue-290-workflow-lint-gate-2026-05.md` |
| 境界 | branch protection 変更、commit / push / PR、GitHub Actions runtime evidence は user approval 後 |

### Issue #520 Slack Incident Channel Webhook Provisioning（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| channel SSOT | `#ubm-hyogo-incidents` |
| secret SSOT | `SLACK_WEBHOOK_INCIDENT` |
| 1Password 正本 | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` |
| runbook | `docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md` |
| redaction gate | `bash scripts/redaction-grep.sh .` |
| blocks | Issue #495 Phase 11 runtime smoke / 09c production readiness observability gate |
| boundary | Slack / 1Password / Cloudflare / GitHub / smoke / commit / push / PR は user approval 後のみ |

### UI prototype alignment / MVP recovery task-20 screen blueprints public/member（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-20-w2-screen-blueprints-public-and-member/` |
| 状態 | `implemented-local / docs-only / NON_VISUAL / Phase 13 blocked_pending_user_approval` |
| 実 docs 正本 | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`, `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` |
| scope | 公開 6 routes + 会員 2 routes の screen blueprint。コード変更なし |
| API 境界 | 既存 `/public/*`, `/auth/*`, `/me/*` endpoint のみ。新 endpoint / D1 schema 変更なし |
| visual gate | fenced JSX prototype 転記を除く仕様本文で visual literal 0。凍結 prototype 一字一句転記を優先 |
| downstream | task-11 / task-12 / task-13 / task-14 / task-06 |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | commit / push / PR は user approval 後 |

### UI prototype alignment / MVP recovery task-02 wrangler env injection（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-02-w2-wrangler-env-injection/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| 実装正本 | `apps/web/wrangler.toml`, `apps/web/.dev.vars.example`, `apps/web/src/lib/env.ts`, `apps/web/src/lib/__tests__/env.test.ts` |
| env contract | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `ENVIRONMENT`, `NEXT_PUBLIC_API_BASE_URL`, `PUBLIC_API_BASE_URL`, `INTERNAL_API_BASE_URL`, `AUTH_URL`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` を配置 |
| secret boundary | `SENTRY_DSN_WEB` / `AUTH_SECRET` / `INTERNAL_AUTH_SECRET` は Cloudflare Secrets / 1Password 正本。`wrangler.toml` に値を書かない |
| downstream | task-03 は `SENTRY_*`、task-04/05/18 は `getEnv()` / grep gate を利用 |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`。Cloudflare dry-run / secret put / commit / push / PR は user approval 後 |
| lessons | `references/lessons-learned-task-02-w2-wrangler-env-injection-2026-05.md`（L-T02W2-001..005: getEnv() 単一窓口 / zod throw を error.tsx に委譲 / public env schema 分離 / vars vs Secrets 境界 / NON_VISUAL platform evidence 5 点） |

### UI prototype alignment / MVP recovery scope gate（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-01-w1-solo-scope-gate-all-screens/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` |
| routes | 19 routes（公開 6 / 会員 2 / 管理 8 / 共通 3） |
| API 境界 | 既存 `apps/api/src/routes/` endpoint のみ接続。新 endpoint / D1 schema / Google Form 変更は禁止 |
| design boundary | OKLch token 正本化、task-10 primitive set 内で画面を構成、apps/web direct D1 access 禁止 |
| downstream | task-02..22 は `SCOPE.md §6` の diff scope discipline / archive rule を完了前に確認 |
| archive hygiene | 5 dir は `docs/30-workflows/completed-tasks/` へ archive。純削除 blocker は解消済み |
| evidence | `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UI prototype alignment / MVP recovery task-10 UI primitives（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| 状態 | `runtime-evidence-captured / implementation / VISUAL_ON_EXECUTION / existing-ui-integration` |
| current baseline | `apps/web/src/components/ui/index.ts` の PascalCase barrel export |
| 方針 | Wave 0 の 15 primitive を削除せず、task-10 の 11 primitive contract を統合 |
| 既存拡張 | `Button / Avatar / Field / Input / Select` |
| 新規追加 | `Card / Badge / Sidebar / Stat / EmptyState / Banner` |
| 維持 | `Chip / Switch / Segmented / Textarea / Search / Drawer / Modal / Toast / KVList / LinkPills` |
| local evidence | typecheck / lint / focused test / coverage / next build PASS |
| blocker | 当時は follow-up 001 で `pnpm.overrides.esbuild = 0.25.4` により `build:cloudflare` PASS。2026-05-17 の `fix-cf-deploy-esbuild-import-source-staging-failure` で wrangler 4.85.0 経路を優先し、現在の root override 正本は `0.27.3` |
| downstream | task-11..17 は `@/components/ui` から import |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md`、`outputs/phase-11/evidence/screenshots/task10-ui-primitives-runtime.png`、`outputs/phase-11/evidence/axe-report.json` |
| follow-up 001 | `docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/`、`references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md`、`lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md` |
| follow-up 002 | `docs/30-workflows/task-10-followup-002-runtime-visual-axe-evidence/`、`lessons-learned/lessons-learned-task-10-followup-002-runtime-visual-axe-evidence-2026-05.md`（L-T10FU002-001 VISUAL_ON_EXECUTION 2 段 workflow_state / -002 親 evidence 集約 / -003 axe DOM 構造） |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-10-ui-primitives-2026-05.md`（L-T10-001 OpenNext esbuild mismatch / L-T10-002 C/M/R + barrel owner / L-T10-003 VISUAL_ON_EXECUTION local↔runtime 分離 / L-T10-004 lint.log capture header） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260511-task-10-runtime-evidence-captured.md`、`.claude/skills/aiworkflow-requirements/changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md` |

### E2E quality uplift Stage 2 sub-task 2b admin identity conflicts spec（2026-05-09）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/2b-admin-identity-conflicts-spec/` |
| 状態 | `user-gated runtime evidence boundary / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed` |
| primary implementation file | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` |
| parent | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2b-admin-identity-conflicts.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2b-admin-identity-conflicts-001.md`（formalized trace） |
| mock boundary | initial list is server-side `fetchAdmin()` and uses `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`; browser `page.route()` is only for `/api/admin/identity-conflicts/*/{merge,dismiss}` and negative `/api/admin/members/*` observation |
| schema | `IdentityConflictRowZ` uses `conflictId`, `candidateTargetMemberId`, `matchedFields`, `detectedAt`, `responseEmailMasked`, `syncJobId` |
| auth fixture | import `test` / `expect` from `apps/web/playwright/fixtures/auth.ts`; do not named-import `adminPage` |
| evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime gate | local chromium Phase 11 evidence captured; firefox / webkit / staging / CI, commit, push, PR are user-gated |

### E2E quality uplift Stage 2 sub-task 2c admin member delete spec（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/admin-member-delete-e2e-spec/` |
| 状態 | `implemented-local-runtime-pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 12 completed` |
| primary implementation file | `apps/web/playwright/tests/admin-member-delete.spec.ts` |
| source spec | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2c-admin-member-delete.md` |
| source unassigned | `docs/30-workflows/unassigned-task/e2e-stage-2-2c-admin-member-delete-001.md`（consumed trace） |
| mock boundary | initial members/audit are server-side `fetchAdmin()` and use `PLAYWRIGHT_ADMIN_MEMBER_DELETE_FIXTURE=1`; browser `page.route()` is only for drawer detail and delete mutation |
| UI reflection | delete/restore mutation passes `{ memberId, isDeleted }` from `MemberDrawer` to `MembersClient`; row label updates before `router.refresh()` completes |
| evidence | `outputs/phase-11/evidence/e2e-run.txt` = desktop-chromium 5 passed / 1 skipped |
| reusable refs | `references/workflow-admin-member-delete-e2e-spec-artifact-inventory.md`, `lessons-learned/lessons-learned-admin-member-delete-e2e-2026-05.md` |
| runtime gate | firefox / webkit / staging / CI, commit, push, PR are user-gated |

### task-21 09g Admin Screen Blueprints（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-21-w2-par-screen-blueprints-admin/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| verify | `scripts/verify-09g-screen-blueprints-admin.sh` |
| scope | AdminSidebar + admin 8 routes（dashboard / members / tags / meetings / schema / requests / identity-conflicts / audit） |
| API boundary | current `references/api-endpoints.md` admin contract。旧 `/admin/kpi`、direct tag approve/reject、schema apply、identity resolve は採用しない |
| downstream | task-15 consumes §2/§3, task-16 consumes §4/§5/§7, task-17 consumes §6/§8/§9, task-22 verifies anchors |
| evidence | `outputs/phase-07/automated-checks.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UI prototype alignment task-17 admin schema-conflicts-audit（2026-05-10）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass` |
| 実装方針 | `existing-admin-contract-hardening-with-e2e-fixture-fix`。新規 route tree ではなく既存 admin route/component/helper の不足補強 |
| route 正本 | `apps/web/app/(admin)/admin/schema/page.tsx`, `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/app/(admin)/admin/audit/page.tsx` |
| component 正本 | `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| helper 正本 | `apps/web/src/lib/admin/api.ts`, `apps/web/src/lib/admin/server-fetch.ts` |
| API 境界 | 既存 `apps/api/src/routes/admin/{schema,sync-schema,identity-conflicts,audit}.ts` のみ。新 endpoint / D1 schema 追加なし |
| downstream | task-18 Playwright smoke / design-token / a11y regression |
| evidence | `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-17-admin-schema-conflicts-audit-2026-05.md`（L-TASK17-001 Server Component fixture / 002 artifacts.json parity / 003 existing-UI inventory / 004 AUTH_SECRET override 禁止） |

### UI prototype alignment task-21 Admin Blueprint 09g（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-21-w2-screen-blueprints-admin/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| blueprint 正本 | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| 対象 | admin 8 routes + AdminSidebar contract。既存補助 route `/admin/dashboard/attendance` は削除しない |
| source | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`, `docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md` |
| evidence | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| downstream | task-15 / task-16 / task-17 admin implementation |
| 境界 | apps/packages code 変更なし。既存 admin API endpoint surface のみ参照。screenshot 不要 |

### UI prototype alignment / task-19 09c primitives full spec（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-19-w2-primitives-full-spec/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09c-primitives.md` |
| source | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` |
| validation | 600-1200 lines、17 JSX excerpts、HEX / `oklch()` / `px` / `bg-[` grep 0、placeholder token grep 0 |
| downstream | task-06 contract index、task-10 ui-primitives、task-11..17 screens、task-20..22 blueprints |
| evidence | `outputs/phase-11/evidence/grep-gate.log`, `scripts/verify-09c-no-visual-values.sh`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| boundary | task-19 primary deliverable は docs-only。隣接 `apps/api/src/repository/identity-conflict.ts` diff は branch review で分離記録 |
| 苦戦箇所 | `references/lessons-learned-task19-primitives-full-spec-2026-05.md`（L-T19-001..005: placeholder token grep 必須化 / §99 keyword 二段検証 / docs-only staged path scope 検証 / prototype `export const` 1:1 照合 / verify script の Phase 1-4 雛形配置） |
| changelog | `changelog/20260507-task19-primitives-full-spec.md` |

### Task 08 W2 Design Tokens Doc（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| token SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| source values | `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70 |
| scope | stone / warm / cool OKLch values、surface/text/border HEX、radius、shadow、font、spacing、motion、sRGB fallback、dark placeholder |
| naming | 正本 token は `--ubm-color-*` / `--ubm-radius-*` / `--ubm-shadow-*` / `--ubm-font-*` / `--ubm-text-*` / `--ubm-space-*` / `--ubm-dur-*` / `--ubm-ease-*`。旧 `--ubm-bg` / `--ubm-accent` は 09b 互換 mapping で置換 |
| downstream | task-09 `tokens.css` / `@theme inline`、task-10 primitives、task-18 verify-design-tokens |
| evidence | `docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### Task 09 W3 Tailwind v4 setup（2026-05-08）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/` |
| 状態 | `implemented-local / implementation / VISUAL_ON_EXECUTION / local PASS 5-point evidence captured / Phase 13 blocked_pending_user_approval` |
| upstream | task-08 `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| scope | `apps/web` Tailwind v4 CSS-first build pipeline、`tokens.css`、`globals.css @theme inline`、PostCSS config、token tests |
| package pins | `tailwindcss@~4.0.0`, `@tailwindcss/postcss@~4.0.0` |
| evidence boundary | generated CSS は utility probe 経由で `.bg-accent` + `var(--ubm-color-accent)` を確認済み。runtime PASS は Phase 11 local evidence として記録済み |
| downstream | task-10 primitives, task-11..17 screens, task-18 verify-design-tokens |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-task-09-w3-par-tailwind-v4-setup-artifact-inventory.md` |

### UI prototype mapping table task-07（2026-05-07）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-07-prototype-mapping-table/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` |
| artifact | `docs/00-getting-started-manual/specs/09a-prototype-map.md` |
| aiworkflow ref | `references/ui-ux-prototype-map.md` |
| inventory | `references/workflow-task-07-prototype-mapping-table-artifact-inventory.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-task-07-prototype-mapping-table-2026-05.md`（L-07-001..004: 逆引き目次の責務分離 / verifier による frozen JSX 保護 / 層別カウント契約 / derivation rule §5.1-§5.8 固定） |
| verifier | `scripts/verify-09a-prototype-line-ranges.sh` |
| scope | frozen prototype JSX -> production component/route/spec mapping, 19 routes, 13+ primitives, shell/chrome, 09c-09h source mapping |
| boundary | no app/package code, no token values, no props/state canon, no new primitives for missing screens |
| rejection | `TweaksPanel`, `AvatarStoreProvider`, `data-theme="warm"`, `data-theme="cool"` are `不採用` |
| downstream | task-10 uses §2/§6, task-11..17 use §3/§5, task-19..22 use §4.2 |

### UI/UX Contract Rewrite task-06（2026-05-07）

| workflow root | `docs/30-workflows/completed-tasks/task-06-ui-ux-contract-rewrite/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / primary spec rewritten / Phase 13 pending_user_approval` |
| primary spec | `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| 契約範囲 | 19 routes、13 primitives、feature components、page state、login 5 状態、dialog / drawer / form / live region a11y、token prefix |
| 視覚詳細委譲 | `09a-prototype-map.md`, `09b-design-tokens.md`, `09c-primitives.md`, `09d-icons.md`, `09e-screen-blueprints-public.md`, `09f-screen-blueprints-member.md`, `09g-screen-blueprints-admin.md`, `09h-shell-and-fixtures.md`, Storybook VRT |
| diff discipline | primary M: `docs/00-getting-started-manual/specs/09-ui-ux.md`; same-wave skill/index sync M; A: workflow package + aiworkflow changelog; D: なし |
| guard | `##` count 10、`### 2.` count 19+、`#### 3.1.` count 13、HEX / oklch / px / `bg-[` 0 hits、route/API trace PASS |
| downstream | task-07 / task-08 / task-09 / task-10 / task-11..17 / task-19..22 が本契約を grep 起点に参照 |

### UI prototype alignment task-03 Sentry Workers SDK unify（2026-05-07）
| workflow root | `docs/30-workflows/task-03-w2-par-sentry-workers-sdk-unify/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval` |
| parent | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` W2 runtime task |
| server SDK | `@sentry/cloudflare` via `apps/web/src/instrumentation.ts` |
| browser SDK | `@sentry/nextjs` via `apps/web/src/instrumentation-client.ts` |
| secret boundary | web server DSN is `SENTRY_DSN_WEB` (`op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn`); browser DSN is `[vars]` `NEXT_PUBLIC_SENTRY_DSN` |
| Phase 11 boundary | `IMPLEMENTED_LOCAL_RUNTIME_PENDING`; local typecheck / tests / build / OpenNext worker grep pass, staging deploy and dashboard evidence pending user approval |
| strict evidence | `outputs/phase-11/main.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md`, `outputs/phase-13/pr-creation-result.md` |
| downstream | task-04 logger and task-05 error boundary consume `captureException` / `captureMessage` contract |
### UI prototype alignment task-04 Window guard and logger（2026-05-08）
| workflow root | `docs/30-workflows/task-04-w3-window-guard-and-logger/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING / Phase 12 strict outputs present / Phase 13 blocked_pending_user_approval` |
| runtime guard | `apps/web/src/lib/is-browser.ts` exports `isBrowser()`, `whenBrowser()`, `browserHistory()`, `browserDocument()`; direct `window.` / `document.` runtime code is lint-gated |
| structured logger | `apps/web/src/lib/logger.ts` emits JSON one-line logs, redacts sensitive keys, and bridges `logger.error({ event, error, digest })` to task-03 `captureException` |
| ESLint gate | `apps/web/package.json` `lint` runs `tsc` + ESLint; `apps/web/eslint.config.mjs` restricts `window` / `document` outside allow-list |
| Phase 11 boundary | local typecheck / lint / tests / build / grep-gate PASS; Sentry dashboard smoke and runtime logger staging evidence pending user approval |
| strict evidence | `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/references/lessons-learned-task-04-w3-window-guard-and-logger-2026-05.md`（L-T04-001..008: `init?.()` / `RUNTIME_TAG` / allow-list 同期 / `lint` false-green / `Error` redaction / `historyImpl` DI / Phase 拡張 ledger / observability swallow） |
| downstream | task-05 error boundary should call `logger.error({ event, error, digest })`; task-09..17 consume `isBrowser()` / `whenBrowser()` for remaining UI browser APIs |
### UI prototype alignment task-20 public/member screen blueprints（2026-05-07）
| workflow root | `docs/30-workflows/completed-tasks/task-20-screen-blueprints-public-and-member/` |
| public blueprint | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`（990 行 / section count 6） |
| member blueprint | `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`（917 行 / section count 3） |
| endpoint surface | `SCOPE.md` §2 + 現行 `apps/api` route の AND: `GET /public/members/:memberId`, `POST /auth/magic-link`, `GET /auth/gate-state`, `GET /auth/session-resolve`, `GET /me`, `POST /me/visibility-request`, `POST /me/delete-request` |
| login state | `input / sent / unregistered / deleted / rules_declined / error` |
| legacy endpoint 撤回 | `/v1/public/*`, `/public/member-profile/:id`, `/auth/schemas`, `/auth/logout`, `/api/me`, `ruleConsent` を 09e/09f から削除 |
| docs-only NON_VISUAL lifecycle | `references/lessons-learned-docs-only-lifecycle.md`（L-DOCS-LIFECYCLE-001..005: 状態語彙固定 / endpoint surface AND 検証 / consent key grep / lifecycle model / artifacts parity） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-task-20-screen-blueprints-public-member.md` |
| 境界 | apps/packages コード変更 0。Phase 13 commit / push / PR は user approval 後のみ |
### Issue #497 Post-release Dashboard 30 Day Feedback（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` |
| 状態 | `spec_created / docs-only / NON_VISUAL / external-time-dependent / 30day gate pending` |
| 親 trace | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md` U-1 |
| 対象 workflow | `.github/workflows/post-release-dashboard.yml` |
| 30 日 gate | `gh run list --workflow=post-release-dashboard.yml --limit=80 --json createdAt` の最古 run が実行日 - 30 日以前 |
| runtime evidence | `outputs/phase-11/post-release-dashboard-30d.json` と conclusion / root cause / consecutive failure / failure rate / redaction grep |
| 正本反映先 | `references/deployment-gha.md` §30 day schedule feedback contract, `changelog/20260506-issue497-30day-feedback.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md`（L-497-001..004: 二相状態分離 / file-existence と runtime AC 分離 / 親契約 hardening 同サイクル / 3-fence detection model） |
| 同サイクル親 hardening | `scripts/post-release-dashboard/lib/redaction-check.sh`（`redaction-check.md` artifact 出力）, `scripts/post-release-dashboard/__tests__/redaction-check.test.sh`, `.github/workflows/ci.yml`（`pnpm post-release-dashboard:test`） |
| 境界 | screenshots 不要。Issue #497 runtime は docs-only / gate pending。親 Issue #351 automation hardening として redaction report artifact + CI script test を同 cycle で補正。Issue #497 は CLOSED 維持し、PR 文面は `Refs #497, Refs #351` |

---

### U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC short-lived credentials（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / NON_VISUAL / Phase 12 strict outputs present / runtime evidence pending_user_approval` |
| primary IdP | AWS STS（GitHub OIDC federation） |
| workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| current token references | `backend-ci.yml` still uses `CLOUDFLARE_API_TOKEN` and `d1-migration-verify.yml` still uses `CLOUDFLARE_API_TOKEN_STAGING` until their runtime cutover. `web-cd.yml` uses environment-scoped `CLOUDFLARE_API_TOKEN` after task-01 web-cd secret alignment. |
| current token references | 2026-05-20 `ci-staging-deploy-failure-fix` 以降、`backend-ci.yml` / `web-cd.yml` は environment-scoped `CLOUDFLARE_API_TOKEN` を current runtime secret name とする。`CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` は historical split names。 |
| approval gates | G1 trust policy / G2 staging cutover / G3 production cutover / G4 long-lived token revoke |
| close-out evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/main.md` + `manual-smoke-log.md` + `link-checklist.md` are RUNTIME_PENDING placeholder ledgers. deploy / revoke are未実行 |
| 正本 refs | `references/deployment-gha.md`, `references/deployment-secrets-management.md`, `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` |

---

### Issue #401 Admin Request Notification（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval` |
| API | `POST /admin/requests/:noteId/resolve` 後に `notification_outbox` へ best-effort enqueue |
| DB | `notification_outbox`, `notification_ledger`(migration `0014_notification_outbox.sql`) |
| mail env | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`（旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` は使わない） |
| mail config gate | `MAIL_PROVIDER_KEY` missing / `.example` sender は claim 前に dispatch skip |
| retry | retryable failure は `pending` 復帰。`failed` は ledger event only |
| stuck recovery | stale `dispatching` rows are reclaimed after lease timeout |
| recipient | `member_identities.response_email` |
| PII boundary | raw `resolutionNote` is not copied to email / `reason_summary` / ledger detail |
| close-out evidence | `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime boundary | staging D1 apply / Resend send / production migration / commit / push / PR は user approval 後 |

---


### task-05a `/public/form-preview` 503 root cause + fix（2026-05-05）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-05a-form-preview-503-001/` |
| 状態 | `implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL / Phase 12 strict 7 files present / Phase 11 runtime evidence blocked / Phase 13 blocked_until_user_approval` |
| 対象 endpoint | staging `GET /public/form-preview`。`getLatestVersion()` null → `UBM-5500` → HTTP 503 |
| current D1 contract | `schema_versions.form_id`, `revision_id`, `state='active'`, `synced_at`; `schema_questions.revision_id` |
| runtime fact | 2026-05-05 review curl: staging 503 / production 503。D1 write / production mutation は user approval gate 後 |
| close-out evidence | `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 evidence contract | `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md`, `manual-test-result.md` |
| artifact inventory | `references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` |
| lessons | `references/lessons-learned-05a-form-preview-503-2026-05.md` |
| 禁止事項 | response shape 変更、D1 schema 列追加、apps/web direct D1 access、production mutation、commit / push / PR |

---


### Issue #359 Out-of-Band Production D1 Apply Audit（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/` |
| 状態 | `spec_created root / docs-only / NON_VISUAL / Phase 1-12 completed / runtime_evidence_captured / decision=confirmed / Phase 13 blocked_until_user_approval` |
| 監査対象 | production D1 `ubm-hyogo-db-prod` の `0008_schema_alias_hardening.sql` (`2026-05-01 08:21:04 UTC`) / `0008_create_schema_aliases.sql` (`2026-05-01 10:59:35 UTC`) 先行 apply |
| runtime evidence | `outputs/phase-11/` に read-only audit evidence を保存済み。`confirmed` = `backend-ci` `deploy-production` / `Apply D1 migrations`（run `25207878876`, `25211958572`） |
| CI guard | `.github/workflows/backend-ci.yml` に migration success + deploy failure を `$GITHUB_STEP_SUMMARY` へ明示する `Record post-migration deploy failure` step を追加済み |
| close-out evidence | `docs/30-workflows/task-issue-359-production-d1-out-of-band-apply-audit-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-task-issue-359-production-d1-out-of-band-apply-audit-001-artifact-inventory.md` |
| 禁止事項 | production write / additional apply / rollback / deploy / commit / push / PR / Issue state change |

---

### Issue #484 Cloudflare Analytics Monthly Export Automation（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` |
| 状態 | `implemented-local / implementation / NON_VISUAL / code evidence captured / runtime Cloudflare export pending_user_approval / Phase 13 blocked_pending_user_approval` |
| consumed source | `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md` |
| parent decision | `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/` |
| output dir | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` |
| required secrets/env | `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ZONE_TAG`, `CLOUDFLARE_ACCOUNT_TAG` |
| persisted identifiers | `zoneTag` / `accountTag` are stored as `[redacted]`; they are GraphQL inputs only |
| metric aggregation | GraphQL groups are summed across returned buckets |
| redaction gate | email / IPv4 / bearer-token / URL query / member ID / session-cookie |
| Phase 12 compliance | `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime boundary | Cloudflare runtime export and PR creation are pending explicit implementation/runtime execution |

---

### UT-07B-FU-03 D1 Production Migration Apply Runbook（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md` |
| 実行コマンド | `bash scripts/cf.sh d1:apply-prod`（production 実適用はユーザー明示承認後のみ） |
| scripts | `scripts/d1/preflight.sh`, `scripts/d1/postcheck.sh`, `scripts/d1/evidence.sh`, `scripts/d1/apply-prod.sh`, `scripts/cf.sh` |
| CI gate | `.github/workflows/d1-migration-verify.yml` |
| artifact inventory | `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` |
| reverse-index close-out | `docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

### Issue #194 / 04c Identity Conflict Merge Alias（2026-05-04）

| 目的 | 参照先 |
| --- | --- |
| 実装正本 | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` |
| 04c alias trace | `docs/30-workflows/04c-followup-001-email-conflict-merge-api-and-ui/` |
| consumed unassigned | `docs/30-workflows/unassigned-task/03b-followup-001-workflow-elevation.md`, `docs/30-workflows/unassigned-task/04c-followup-001-email-conflict-merge-api-and-ui.md` |
| 正本 tables | `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |
| runtime evidence | issue-194 Phase 11 / Phase 13 user approval boundary。04c alias root では screenshot / deploy / migration / PR を PASS 主張しない |
| withdrawn stale 04c draft | `identity_dismissals`, `admin_audit_log` 拡張, `sync_jobs.lock_token` 転用, `GET /admin/identity-conflicts/:id`, screenshot 3枚必須, 04c root での `gh pr create` |

---

### Issue #399 Admin Queue Resolve Staging Visual Evidence（2026-05-03）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/` |
| 状態 | `implementation-prepared / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 11 runtime evidence pending / Phase 13 blocked_until_user_approval` |
| seed識別 | D1 schema変更なし。既存ID列の `ISSUE399-` synthetic prefix で cleanup する |
| 実装artifacts | apps/api/migrations/seed/issue-399-admin-queue-staging-{seed,cleanup}.sql, scripts/staging/{seed,cleanup}-issue-399.sh, focused Vitest |
| close-out evidence | `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/screenshots/` は未取得。staging seed投入 / screenshot取得 / cleanup は user承認付き実行サイクルで行う |
| parent | `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/` の delegated visual evidence gap を閉じるための実行仕様 |
| Issue 取扱 | #399 は CLOSED 維持。reopen / commit / push / PR / Issue comment は user 明示指示後のみ |

---

### UT-05A Auth UI Logout Button（2026-05-03）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` |
| 状態 | `implemented-local-runtime-evidence-blocked / implementation / VISUAL_ON_EXECUTION / Phase 12 strict outputs present / Phase 13 blocked_until_user_approval` |
| 実装 | `apps/web/src/components/auth/SignOutButton.tsx`, `apps/web/src/components/layout/MemberHeader.tsx`, `apps/web/app/(member)/profile/page.tsx`, `apps/web/app/(member)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx` |
| close-out evidence | `docs/30-workflows/ut-05a-auth-ui-logout-button-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| runtime evidence | `outputs/phase-11/` は placeholder。OAuth visual smoke / cookie / session evidence は未取得で PASS 扱いしない |
| Issue 取扱 | #386 は CLOSED 維持。PR / comment は user 明示指示後のみ |

---

### Issue #196 response_email UNIQUE DDL / Spec Canonicalization（2026-05-02）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` |
| 状態 | `implemented-local-static-evidence-pass / implementation / NON_VISUAL / Phase 1-12 strict outputs present / Phase 13 blocked_until_user_approval` |
| 正本 UNIQUE | `member_identities.response_email TEXT NOT NULL UNIQUE` |
| 非 UNIQUE | `member_responses.response_email` は履歴行の system field。UNIQUE を付与しない |
| close-out evidence | `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| migration コメント方針 | `0001_init.sql` / `0005_response_sync.sql` はコメントのみ同期済み。SQL semantics は不変で、typecheck / lint / SQL semantic diff は PASS。production D1 migration list は Phase 13 承認時に取得 |
| Issue 取扱 | #196 は CLOSED 維持。PR / commit は `Refs #196` のみ |

---

### Issue #346 08a canonical workflow tree restore（2026-05-02）

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/` |
| 採用案 | A. canonical tree 復元（08a current/partial canonical root を維持し、本タスクは A restore trace） |
| 08a canonical root（維持） | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` |
| 下流 gate | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |
| close-out evidence | `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-12/main.md` |
| Phase 11 evidence | `outputs/phase-11/evidence/{file-existence.log,verify-indexes.log,aiworkflow-state-diff.log,09c-targeted-link-check.log,unassigned-grep.log,secret-hygiene.log}` |
| 苦戦箇所・教訓 | `references/lessons-learned-issue-346-08a-canonical-workflow-tree-restore-2026-05.md` |
| artifact inventory | `references/workflow-task-issue-346-08a-canonical-workflow-tree-restore-artifact-inventory.md` |
| Issue 取扱 | #346 は CLOSED at spec time。Phase 13 commit message は `Refs #346` のみ |

---

### 07c Follow-up 003 Audit Log Browsing UI（2026-05-01）

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/` |
| API 契約 | `references/api-endpoints.md`（`GET /admin/audit`） |
| 管理画面仕様 | `docs/00-getting-started-manual/specs/11-admin-management.md`（`/admin/audit`） |
| 苦戦箇所・教訓 | `references/lessons-learned-07c-audit-log-browsing-ui-2026-05.md` |
| artifact inventory | `references/workflow-task-07c-followup-003-audit-log-browsing-ui-artifact-inventory.md` |
| 実装 | `apps/api/src/routes/admin/audit.ts`, `apps/api/src/repository/auditLog.ts`, `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Phase 11 visual evidence | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/outputs/phase-11/screenshots/` |
| close-out evidence | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/outputs/phase-12/implementation-guide.md` |

---

### Issue #400 Admin Request Audit Target Taxonomy（2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-400-admin-request-audit-target-taxonomy/` |
| API 契約 | `references/api-endpoints.md`（04c 構造的不変条件 / request resolve audit） |
| 実装 | `apps/api/src/repository/auditLog.ts`, `apps/api/src/routes/admin/requests.ts`, `apps/api/src/routes/admin/audit.ts`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| taxonomy | 新規 request resolve audit は `targetType='admin_member_note'`, `targetId=<noteId>`, `after.memberId` を保持。legacy `member` 行は migration せず readable |
| tests | `apps/api/src/repository/__tests__/auditLog.test.ts`, `apps/api/src/routes/admin/{requests,audit}.test.ts`, `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` |

---

### UT-21 Forms sync conflict close-out（2026-04-30）

| 目的 | 参照先 |
| --- | --- |
| legacy UT-21 の扱い（Sheets→D1 単一 endpoint / audit table は新設しない） | `docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-12/implementation-guide.md`, `references/task-workflow.md` |
| 現行 Forms sync 正本 | `apps/api/src/jobs/sync-forms-responses.ts`, `apps/api/src/sync/schema/`, `references/task-workflow.md` |
| 後続判断 | `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`, `docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md`, `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` |
| UT21-U02 確定判定 | `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/`（Issue #235 CLOSED）。`sync_audit_logs` / `sync_audit_outbox` は新設不要。現行 `sync_jobs` + `sync_job_logs` + `metrics_json` で充足し、コード変更 0。 |
| 旧仕様の状態欄 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` |

---

### CI/CD workflow topology drift（UT-CICD-DRIFT / 2026-04-29）
| 目的 | 参照先 |
| --- | --- |
| CI/CD topology drift 正本 | `references/deployment-gha.md`, `references/deployment-cloudflare.md`, `references/deployment-core.md`, `references/deployment-secrets-management.md` |
| Pages vs Workers deploy target decision | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`（ADR-0001 / Workers cutover accepted） |
| OpenNext Workers 詳細仕様 | `references/deployment-cloudflare-opennext-workers.md` |
| Issue #355 cutover spec workflow | `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`（spec_created / implementation / NON_VISUAL / Phase 11 evidence contracts） |
| 残る実装 task | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`（2026-05-09 CI recovery wave で `web-cd.yml` Workers deploy 置換は local 実装済み。残りは Cloudflare side cutover / user-approved runtime smoke evidence） |
| Pages delete after dormant (current) | `docs/30-workflows/issue-639-cloudflare-pages-project-physical-deletion/`（Issue #639 / `spec_created` / implementation / NON_VISUAL / destructive external mutation / dormant 30 day observation + Gate C user approval pending）。source: `docs/30-workflows/unassigned-task/issue-331-followup-002-cloudflare-pages-project-physical-deletion.md` consumed |
| Pages delete after dormant (historical predecessor) | `docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/`（Issue #419 formalized historical runtime contract for Issue #355 era。current tracking is superseded by Issue #639）。起票元: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` |
| Delete request retention purge | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/`（Issue #402 / `implemented-local` / implementation / NON_VISUAL / retention policy / runtime evidence pending）。SSOT: `references/data-retention-policy.md`。対象 table: `member_responses` / `member_identities` / `member_status` + response child rows; `deleted_members` は tombstone 保持。default `RETENTION_PURGE_MODE=dry-run`、production apply は user-gated |
| 決定 workflow | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` |

---
### Issue #112 API Worker Env 型 SSOT（2026-05-01）

`apps/api/src/env.ts` の `Env` interface を API Worker binding 型の正本とする。`apps/api/wrangler.toml` の `DB` / `SHEET_ID` / `GOOGLE_FORM_ID` / `SHEETS_SPREADSHEET_ID` / `SYNC_*` などの vars と Cloudflare Secrets は、binding 追加・変更時に `Env` と同一 wave で同期する。`_shared/db.ts` の `ctx()` は `Pick<Env, "DB">` を受け取り、`apps/web` から `apps/api/src/env` への import は boundary lint が raw token と relative path 解決の両方で遮断する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / Phase 12 close-out | `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/` |
| 実装 | `apps/api/src/env.ts`, `apps/api/src/repository/_shared/db.ts`, `scripts/lint-boundaries.mjs` |
| 02c consumer guide | `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/outputs/phase-12/implementation-guide.md` |
| D1 / Cloudflare manual pointer | `docs/00-getting-started-manual/specs/08-free-database.md` |

---
### 06a Public Web Real Workers/D1 Smoke（2026-04-30）

06a の mock API smoke では検出できなかった Workers runtime / D1 binding / `PUBLIC_API_BASE_URL` 経路を、follow-up 仕様として local + staging の二段 smoke に分離する。

| 目的 | 参照先 |
| --- | --- |
| 13 Phase 仕様 | `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` |
| execution successor | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` |
| 元未タスク（昇格済み trace） | `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` |
| artifact inventory | `references/workflow-task-06a-followup-001-real-workers-d1-smoke-artifact-inventory.md` |
| execution artifact inventory | `references/workflow-task-06a-A-public-web-real-workers-d1-smoke-execution-artifact-inventory.md` |
| 親 06a | `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/` |
| smoke route family | `/`, `/members`, `/members/[id]`, `/register` |
| evidence 方針 | actual evidence 実体は execution successor 側、旧 follow-up と親 06a へは相対リンク trace のみ |
| Issue | `Refs #273` のみ、CLOSED 維持 |

---
### Issue #494 09a-A Runtime Staging Smoke（2026-05-06）

09a の `NOT_EXECUTED` 境界を実測 evidence に置換する execution-oriented successor。current execution root は issue-494 root であり、historical `09a-A-staging-deploy-smoke-execution/` root はこのブランチの実行正本ではない。deploy / D1 apply / Forms sync / Playwright visual / wrangler tail / 09c blocker update は G1〜G4 user approval 後のみ実行し、Phase 12 spec contract completeness と runtime PASS / Phase 12 runtime update を分離する。親 `09a-parallel...` directory は現 worktree 不在のため、親 mirror update は restoration follow-up 後にのみ実施する。

| 目的 | 参照先 |
| --- | --- |
| current execution root | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/` |
| evidence root | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory | `references/workflow-task-issue-494-09a-A-exec-staging-smoke-runtime-artifact-inventory.md` |
| parent mirror restoration follow-up | `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` |
| runtime exec task | `docs/30-workflows/unassigned-task/task-09a-A-exec-staging-smoke-001.md`（`UT-09A-A-EXEC-STAGING-SMOKE-001`, HIGH, G1-G4 multi-stage approval gate, 2026-05-06 formalize） |
| downstream blocker | `09c-production-deploy-execution-001` remains blocked until actual 09a-A runtime evidence exists |

---
### UT-06-FU-E D1 Backup Long-Term Storage（2026-05-01）

UT-06 Phase 12 UNASSIGNED-E を `implemented-local` / docs-only / NON_VISUAL workflow として formalize。日次 D1 export は GHA schedule を主経路、Cloudflare cron triggers を R2 latest healthcheck として併用する。R2 30日 + 月次保存、暗号化、UT-08 alert、復元机上演習を実装 PR 前の正本仕様に固定する。

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` |
| Phase 12 実装ガイド | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-12/implementation-guide.md` |
| Phase 11 NON_VISUAL placeholder | `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/outputs/phase-11/`（`NOT_EXECUTED`; runtime PASS ではない） |
| 正本反映先 | `references/deployment-cloudflare.md`, `references/database-operations.md` |
| 上流 evidence | `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-05/d1-backup-evidence.md`, `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md`, `docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-06/rollback-rehearsal-result.md` |
| Issue | `Refs #118` のみ、CLOSED 維持 |

---
### Schema Alias Resolution Contract（issue-191 / 2026-04-30）

07b の alias assignment は endpoint `POST /admin/schema/aliases` を維持しつつ、書き込み先を `schema_questions.stableKey` direct update から `schema_aliases` INSERT へ差し替える。03a は aliases first、miss の場合のみ `schema_questions.stable_key` fallback。

UT-07B schema alias hardening は、この `schema_aliases` write target replacement を上位前提にする。hardening 対象は alias table の DB constraint、back-fill の再開可能化、`backfill_cpu_budget_exhausted` の HTTP 202 retryable continuation、10,000 行 staging evidence である。参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`, `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`, `references/api-endpoints.md`, `references/database-schema.md`。

UT-07B-FU-01 schema alias back-fill queue/cron split の current root は `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/`。状態は `implemented-local / implementation / NON_VISUAL / local implementation GO / runtime evidence pending`。Phase 10 は `design-ready` のみで、implementation GO / NO-GO / staging-deferred は `outputs/phase-11/gate-decision.md` が唯一の判定点。公開 `backfill.status` は `pending / running / exhausted / completed` に固定し、internal failure state は DB/retry metadata に閉じる。Issue #361 は CLOSED 維持、`Refs #361` のみ。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-01-schema-alias-backfill-queue-cron-split-2026-05.md`（L-UT07B-FU01-001 Queue dedupe 二層 / L-002 Cron 分割と CPU budget / L-003 public-internal status 値域変換 / L-004 remaining-scan 選定 / L-005 consumer dedupe 再確認 / L-006 Phase 11 gate 文言）。

UT-07B-FU-02 admin schema alias retry label の current root は `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/`。状態は `implemented-local / implementation / VISUAL_ON_EXECUTION / component evidence PASS / runtime screenshot pending`。目的は HTTP 202 + `backfill.status='exhausted'` + `retryable=true` + `code='backfill_cpu_budget_exhausted'` + `mode='apply'` を `/admin/schema` の `SchemaDiffPanel` で通常 success / validation error / conflict error と区別し、「続きから再試行できる状態」として表示すること。web client predicate は `isSchemaAliasRetryableContinuation`（`apps/web/src/lib/admin/api.ts`）で 5 点完全合致による narrowing。不一致時は generic path にフォールバックする。実装は `apps/web/src/lib/admin/api.ts` / `apps/web/src/components/admin/SchemaDiffPanel.tsx` / focused tests、JUnit evidence は `outputs/phase-11/test-junit.xml`（30 tests PASS）。API contract と D1 schema は変更しない。Issue #362 は CLOSED 維持、PR 文面は `Refs #362` のみ。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu-02-admin-schema-alias-retry-label-2026-05.md`（L-UT07B-FU02-001 5 点 narrowing / L-002 confirmed と backfill.status の責務分離 / L-003 code 不一致 fallback / L-004 4 状態 manual screenshot deferred）。

UT-07B-FU-03 production migration apply runbook は、`apps/api/migrations/0008_schema_alias_hardening.sql` を `ubm-hyogo-db-prod` へ適用する別運用のための手順書 + 検証スクリプト実装である。workflow root は `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md`。状態は `spec_created / implemented-local / NON_VISUAL`、実装は `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`、Cloudflare CLI ラッパー、`.github/workflows/d1-migration-verify.yml`、`pnpm test:scripts`。production apply は未実行であり正本 production 状態を上書きしない。

UT-07B-FU-04 production migration already-applied verification は、`references/database-schema.md` の production D1 ledger fact（`0008_schema_alias_hardening.sql` applied at `2026-05-01 08:21:04 UTC`）を優先し、duplicate apply を禁止する operations verification workflow である。workflow root は `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/`。状態は `spec_created / implementation / NON_VISUAL / completed_boundary_user-gated runtime evidence boundary / runtime verification blocked_until_user_approval`。Phase 11 は placeholder evidence、Phase 12 は strict 7 files materialized、artifact inventory は `references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md`。post-check scope は `schema_diff_queue.backfill_cursor` / `backfill_status` のみで、`schema_aliases` table / UNIQUE indexes は `0008_create_schema_aliases.sql` 側の責務。Issue #424 は CLOSED 維持。苦戦箇所と適用ルールは `references/lessons-learned-ut07b-fu04-production-migration-already-applied-verification-2026-05.md`（L-UT07B-FU04-001 duplicate apply 禁止 / L-002 preflight `--expect pending|applied` 二モード / L-003 post-check scope 縮約 / L-004 placeholder + user-gate runtime 分離）。

| 目的 | 参照先 |
| --- | --- |
| 正本 DB 契約 | `references/database-implementation-core.md`（§Schema Alias Resolution Contract） |
| 13 Phase 補完仕様 | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` |
| 07b stale contract 上書き | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/index.md` |
| 実装 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-aliases-implementation-001.md` |
| fallback 廃止 follow-up | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` |
| direct update guard follow-up | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` |

### UT-02A Canonical Section/Field Resolver（Issue #108 / 2026-05-01）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` |
| 実装 | `apps/api/src/repository/_shared/metadata.ts`, `apps/api/src/repository/_shared/builder.ts` |
| generated baseline | `apps/api/src/repository/_shared/generated/static-manifest.json` |
| shared enum | `packages/shared/src/types/common.ts`, `packages/shared/src/zod/primitives.ts` (`FieldKind=consent/system`) |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-11/` |
| Phase 12 guide | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/outputs/phase-12/implementation-guide.md` |
| diagnostics hardening workflow | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` |
| source follow-up | `docs/30-workflows/completed-tasks/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` (`formalized_as_issue_373_workflow`) |
| lessons | `lessons-learned/lessons-learned-ut-02a-canonical-schema-resolver-2026-05.md` (L-UT02A-001〜004) |

### Issue #373 UT-02A Canonical Metadata Diagnostics Hardening（UT-02A-FU-DIAG-001 / 2026-05-06）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-373-ut02a-canonical-metadata-diagnostics-hardening/` |
| 状態 | `implemented-local / Phase 11 evidence captured / Phase 12 completed / Phase 13 blocked_pending_user_approval` |
| PR本文ソース | `outputs/phase-12/implementation-guide.md` |
| static manifest stale検出 | `scripts/verify-static-manifest.mjs`（sourceSpecHash drift → exit 1 + stderr、CI gate `verify-static-manifest`） |
| 決定的再生成 | `scripts/regenerate-static-manifest.mjs`（top-level key固定順序＋sections/fields決定的整列、3連続sha256一致 DT-05 確認） |
| 構造化 diagnostics | `apps/api/src/repository/_shared/builder.ts` の `buildSectionsWithDiagnostics()` で `logWarn({code:"UBM-MANIFEST-UNKNOWN-KEY",count,stableKeys,note})` 発火 |
| 構造化ロガー | `apps/api/src/lib/logger.ts`（最小ロガー、sink 差し替え可） |
| AliasQueueAdapter contract | `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts`（DT-11..DT-14、D1非依存 `vi.fn()` fake） |
| retirement condition | `docs/00-getting-started-manual/specs/01-api-schema.md` §Static Manifest Retirement Condition（03a alias queue 完了後に generated manifest と CI gate を retire） |
| AC PASS 一覧 | AC-1〜AC-8（DT-01/02/05/06/07/11..14/16, builder.test.ts AC-3/AC-6, metadata.test.ts AC-4/AC-5）|
| 苦戦箇所 | source spec canonicalize↔sourceSpecHash 境界、byte-identical のための key 順序固定、D1非依存 contract 設計、retirement 条件の 03a 依存明文化 |
| lessons | `lessons-learned/lessons-learned-ut-02a-canonical-schema-resolver-2026-05.md`（L-UT02A-001〜004） |
| changelog | `changelog/20260506-issue373-ut02a-canonical-metadata-diagnostics-spec.md` |

## よく使うパターン

> **検索パターン集・コードパターン早見は [quick-reference-search-patterns.md](quick-reference-search-patterns.md) に分離**
> 機能・タスク別のキーワード分割、読む順番、IPC/Zustand/Result 等のコードスニペットを収録

### Japanese IME Input Composition Search Fix

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/japanese-ime-input-composition-search-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| implementation | `apps/web/src/hooks/useImeSafeInput.ts`, `apps/web/src/components/ui/{Search,Input}.tsx`, `apps/web/src/components/public/SelectedFiltersBar.client.tsx` |
| focused tests | `apps/web/src/hooks/__tests__/useImeSafeInput.spec.tsx`, `apps/web/src/components/ui/__tests__/{Search,Input}.spec.tsx`, `apps/web/src/components/public/__tests__/{SelectedFiltersBar.client,MemberFilters.client}.spec.tsx` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-japanese-ime-input-composition-search-fix-artifact-inventory.md` |
| lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-japanese-ime-input-composition-search-fix-2026-06.md`（L-IME-001..003: URL 正本 + composition guard / clear ownership 一本化 / IME regression は fake timers + composition events） |

Public `/members` keyword search keeps URL query as canonical state, but `Search` now buffers draft text during IME composition and commits only after `compositionend + debounce`. `SelectedFiltersBar` excludes the `q` chip so the keyword has one clear owner: the input-local clear button. `Input` exposes `imeSafe` + `onValueChange` as opt-in; default behavior remains unchanged. Local screenshots are present under `outputs/phase-11/screenshots/`; staging real-IME screenshots, commit, push, and PR are user-gated.

### 08a-B Public Members Search Filter

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root | `docs/30-workflows/08a-B-public-search-filter-coverage/` |
| query 正本 | `docs/00-getting-started-manual/specs/12-search-tags.md` |
| public API contract | `docs/00-getting-started-manual/specs/01-api-schema.md` |
| page / UI contract | `docs/00-getting-started-manual/specs/05-pages.md`, `docs/00-getting-started-manual/specs/09-ui-ux.md` |
| API parser / repository | `apps/api/src/_shared/search-query-parser.ts`, `apps/api/src/repository/publicMembers.ts` |
| Web URL parser / filter UI | `apps/web/src/lib/url/members-search.ts`, `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` |
| Phase 11 runtime evidence contract | `docs/30-workflows/08a-B-public-search-filter-coverage/outputs/phase-11/main.md` |

`status` は参加ステータスであり、公開状態フィルタではない。公開境界は API の base WHERE（`public_consent` / `publish_state` / `is_deleted` / canonical alias exclusion）で固定する。`q` は LIKE wildcard literal escape、tag AND は先行 bind 数を考慮した placeholders offset、sort は `name`/`recent` とも fullName tie-break を使う。runtime screenshot / curl / axe は VISUAL_ON_EXECUTION として 08b / 09a で取得する。

### AI Chat / LLM Integration Fix 即時導線（2026-03-21）

| 目的                          | 最初に開くファイル                                                              |
| ----------------------------- | ------------------------------------------------------------------------------- |
| 4タスクの全体像               | `references/workflow-ai-chat-llm-integration-fix.md`                            |
| parent workflow               | `docs/30-workflows/ai-chat-llm-integration-fix/index.md`                        |
| same-wave artifact inventory  | `references/workflow-ai-chat-llm-integration-fix-artifact-inventory.md`         |
| Task 01 canonical root        | `docs/30-workflows/completed-tasks/01-TASK-FIX-CHATVIEW-ERROR-SILENT-FAILURE/`  |
| Task 02 canonical root        | `docs/30-workflows/completed-tasks/02-TASK-FIX-LLM-SELECTOR-INLINE-GUIDANCE/`   |
| ChatView error transport 契約 | `references/llm-ipc-types.md`, `references/error-handling-core.md`              |
| LLM selector / persistence    | `references/ui-ux-llm-selector.md`, `references/arch-state-management-core.md`  |
| Workspace stream error        | `references/llm-streaming.md`, `references/ui-ux-feature-components-details.md` |
| legacy path 逆引き            | `references/legacy-ordinal-family-register.md`                                  |

---

### SkillCenterView → SkillManagementPanel ナビゲーション接続（2026-04-04）

| 目的                              | 最初に開くファイル                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| secondary CTA 設計 / ViewType 定義 | `references/ui-ux-navigation.md`                                                                                           |
| dock 正規化コード                 | `apps/desktop/src/renderer/App.tsx`                                                                                        |
| コンポーネント実装                | `apps/desktop/src/renderer/views/SkillCenterView/index.tsx`, `apps/desktop/src/renderer/components/skill/SkillManagementPanel.tsx` |
| completed ledger                  | `references/task-workflow-completed.md`                                                                                    |
| 苦戦箇所（same surface return / dock 正規化） | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                      |
| workflow root                     | `docs/30-workflows/skill-center-lifecycle-navigation/`                                                                     |

---

### Skill Wizard Redesign (W2-seq-03a) 参照導線 [2026-04-08完了]

| 目的 | 参照先 |
| --- | --- |
| 全体像 | `docs/30-workflows/skill-wizard-redesign-lane/index.md` |
| タスク仕様書 | `docs/30-workflows/W2-seq-03a-skill-create-wizard/` |
| canonical 6成果物 | `outputs/phase-12/*.md` |
| lessons-learned | `references/lessons-learned-skill-wizard-redesign.md` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |
| 後続タスク | W3-seq-04（使用率計装 / trackEvent） |

---

### W3-seq-04（使用率計装 / trackEvent）参照導線 [2026-04-08完了]

| 目的 | 参照先 |
| --- | --- |
| UI実装（trackEvent / 使用率計装）全体像 | `docs/30-workflows/W3-seq-04-usage-tracking/` |
| SkillAnalysis コンポーネント（5計装ポイント実装先） | `references/ui-ux-feature-components-skill-analysis.md` |
| Zustand store（skillCreatorStore / trackEvent） | `references/arch-state-management-skill-creator.md` |
| lessons-learned（trackEvent / 計装パターン） | `references/lessons-learned-w3-usage-tracking-2026-04.md` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |

---

### HealthPolicy 移管 / Worktree コンフリクト解消（2026-04-08）

| 目的 | 参照先 |
| --- | --- |
| async hook flush・shared 集約・Phase 12 canonical 教訓（L-HP-001/002/003） | `references/lessons-learned-health-policy-worktree-2026-04.md` |
| merge 戦略・command -v・gitattributes 教訓（L-WC-001/002/003） | `references/lessons-learned-health-policy-worktree-2026-04.md` |
| Zustand store（skillCreatorStore / HealthPolicy） | `references/arch-state-management-skill-creator.md` |
| IPC/Preload 教訓 参照 | `references/lessons-learned-ipc-preload-runtime.md` |

---

### UT-GOV-001 Second-Stage Reapply（contexts 後追い再 PUT / 2026-04-30 / approval-gated NON_VISUAL）

UT-GOV-001 で `contexts=[]` 暫定 fallback を採用したケースに対し、UT-GOV-004 由来の実在 context で dev / main 独立 PUT を行う後追いタスク。Phase 13 は user 承認ゲート + 実 PUT 実行ゲート + PR 作成ゲートの三役。

| 目的 | 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` |
| Phase 13 三役ゲート（user_approval_required=true / 自走禁止 3 項目: 実 PUT・push・PR） | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-13.md` |
| rollback payload location（再利用のみ・上書き禁止）| `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply/outputs/phase-05/rollback-payload-{dev,main}.json` |
| admin token op 経路（実値は環境変数で揮発的に渡す / docs に op:// 参照のみ） | `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN`（admin scope 必須） |
| 期待 contexts（dev / main 別配列） | `outputs/phase-02/expected-contexts-{dev,main}.json` |
| 適用前 / 適用後 GET 保全 | `outputs/phase-13/branch-protection-{current,applied}-{dev,main}.json` |
| drift 6 値検査（CLAUDE.md / deployment-branch-strategy.md） | `outputs/phase-09/drift-check.md` |
| 苦戦箇所 8 件（typo context / dev-main 片側更新 / admin block / `contexts=[]` 残留 / workflow vs job 名 / dev-main 別 contexts / CLAUDE.md drift 片務化 / 自走禁止）| `references/lessons-learned-utgov001-second-stage-reapply-2026-04.md` |
| Artifact Inventory（13 phases / 入出力契約 / AC-1〜AC-14） | `references/workflow-utgov001-second-stage-reapply-artifact-inventory.md` |
| applied GET reflection（Refs #303） | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/`。fresh GET current applied: dev/main contexts = `ci`, `Validate Build`; strict dev=false / main=true; `verify-indexes-up-to-date` は current applied に含まれない |
| Issue 参照規約 | `Refs #202` のみ採用 / `Closes #202` 禁止 / Issue は CLOSED のまま再オープン禁止 |
| relay 先 | `task-utgov001-references-reflect-001` / `task-utgov001-drift-fix-001`（条件発火）/ `task-utgov-downstream-precondition-link-001` |

---

### Branch Protection Required Status Checks Contexts 同期（UT-GOV-004 / 2026-04-29）

UT-GOV-001 を安全に実行するための前提タスク。確定 contexts の機械可読正本と branch protection 運用ルール 4 項目を集約。

| 目的 | 参照先 |
| --- | --- |
| 機械可読正本（UT-GOV-001 の唯一の apply 入力） | `docs/30-workflows/completed-tasks/ut-gov-004-required-status-checks-context-sync/outputs/phase-08/confirmed-contexts.yml` |
| Phase 1 投入 3 contexts（`ci` / `Validate Build` / `verify-indexes-up-to-date`）と strict 採否（dev=false / main=true） | 同上 `confirmed-contexts.yml` |
| branch protection 運用ルール 4 項目（AC-3 / AC-5 / AC-8 / AC-9） | `outputs/phase-12/system-spec-update-summary.md` §4 |
| lefthook ↔ CI 対応表（同一 pnpm script 規約） | `outputs/phase-05/lefthook-ci-mapping.md`, `outputs/phase-08/lefthook-ci-mapping.md` |
| strict 採否決定根拠（dev / main 別） | `outputs/phase-05/strict-mode-decision.md`, `outputs/phase-09/strict-decision.md` |
| 苦戦箇所 6 件（context 名生成・同名 job・存在しない context・strict トレードオフ・lefthook drift・refactor 名前変更事故） | `references/lessons-learned-ut-gov-004-branch-protection-context-sync.md` |
| Phase 12 close-out strict 7 成果物 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| relay 先 | UT-GOV-001（apply 実行）/ UT-GOV-005（unit-test / integration-test / security-scan / docs-link 新設）/ UT-GOV-007（workflow `name:` drift 自動検出）|
| 関連既存タスク | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/`（草案 8 contexts は本タスクで上書き確定済み）, `task-git-hooks-lefthook-and-post-merge` |

### Sheets→D1 同期方式定義（UT-01 / 2026-04-29）

Google Sheets を入力源、Cloudflare D1 を canonical store として扱う同期方式の docs-only / NON_VISUAL 設計仕様。実装差分を見落とさないため、既存 `apps/api` 実装との対応表を必ず確認する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / AC / state ownership | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/index.md` |
| 同期方式比較（Cron pull 採択） | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md` |
| 手動 / 定期 / バックフィル 3 フロー | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-flow-diagrams.md` |
| `sync_log` 論理設計 + 既存 `sync_job_logs` / `sync_locks` 対応表 | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` §9 |
| U-UT01-07 sync log naming reconciliation | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/`（spec_created / docs-only / NON_VISUAL）。物理 `sync_job_logs` / `sync_locks` を canonical、`sync_log` は概念名として扱う |
| U-UT01-07 Phase 2 正本4ファイル | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md`, `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md` |
| U-UT01-07-FU01 UT-09 canonical sync job receiver | `docs/30-workflows/completed-tasks/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/`（completed / Phase 1-12 完了 / Phase 13 pending_user_approval / docs-only / NON_VISUAL）。UT-09 実装受け皿は `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`。実コード・script・hook・CI gate は UT-09 / governance guard へ委譲 |
| Phase 12 未タスク | `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-12/unassigned-task-detection.md` |
| 既存実装差分 | `apps/api/src/jobs/sync-sheets-to-d1.ts`, `apps/api/migrations/0002_sync_logs_locks.sql` |
| 完了記録 | `references/task-workflow-completed-recent-2026-04d.md` |

### Retry / Offset Policy Alignment（U-UT01-09 / 2026-04-30）

UT-01 の未タスク U-UT01-09 で、legacy Sheets→D1 sync の retry / backoff / resume 方針を canonical 化した。現行 Forms sync 方針は上書きしない。実コード反映は UT-09 追補、物理 ledger / migration は U-UT01-07 へ委譲する。

| 目的 | 参照先 |
| --- | --- |
| workflow root / AC1〜AC6 | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/index.md` |
| canonical 決定 | `outputs/phase-02/canonical-retry-offset-decision.md`（retry max 3 / base 1s / factor 2 / cap 32s / jitter ±20% / `processed_offset` chunk index） |
| migration 影響評価 | `outputs/phase-02/migration-impact-evaluation.md` |
| UT-09 実装委譲 | `outputs/phase-05/ut09-handover-runbook.md` |
| quota worst case | `outputs/phase-09/quota-worst-case-calculation.md`（2 req / 100s = 0.4%） |
| Phase 11 NON_VISUAL evidence | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` |
| Phase 12 close-out | `outputs/phase-12/main.md`, `outputs/phase-12/system-spec-update-summary.md` |
| 既存実装差分 | `apps/api/src/jobs/sync-sheets-to-d1.ts`（`DEFAULT_MAX_RETRIES=5` は UT-09 で 3 へ変更予定）, `apps/api/migrations/0002_sync_logs_locks.sql`（`processed_offset` 不在） |

### Worktree Environment Isolation（2026-04-28）

worktree 間の暗黙共有・shell state 残留・並列作成競合を防ぐ 4 領域への引き方。

| 検索領域 | 検索パターン例 | 最初に開くファイル |
| --- | --- | --- |
| skill symlink 検出 | `find .claude/skills -type l`、`grep -r "type l" scripts/`、キーワード `skill-symlink-removal` | `references/development-guidelines-details.md` (L197〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-001 |
| tmux session env / global env 分離 | `tmux show-environment -g`、`tmux show-environment -t <session>`、キーワード `UBM_WT` `tmux-session-scoped-env` `update-environment` | `references/development-guidelines-details.md` (L197〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-002 |
| lockdir owner metadata | `ls .worktrees/.locks/`、キーワード `gwt-auto-lock` `lockdir` `branch-slug-hash` `exit 75`、`grep "mkdir.*lockdir" scripts/` | `scripts/new-worktree.sh`、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-003 / §L-WTI-008 |
| shell state reset | キーワード `hash -r` `unset OP_SERVICE_ACCOUNT_TOKEN` `mise trust` `mise exec --`、`git rev-parse --git-path hooks` | `references/development-guidelines-core.md` (L213〜)、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-007 |

| 目的 | 参照先 |
| --- | --- |
| 全体仕様 | `docs/30-workflows/task-worktree-environment-isolation/` |
| Phase 12 implementation guide（Part 2 が運用ランブック） | `outputs/phase-12/implementation-guide.md` |
| NON_VISUAL Phase 11 ログ3点（`tmux show-environment` / `find -type l` / `exit 75` の固定設計） | `outputs/phase-11/manual-smoke-log.md`、`references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-004 |
| spec_created 同期 4 点セット標準（development-guidelines / lessons-learned / task-workflow-active / topic-map+keywords） | `references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-006 |
| 横断依存 5 タスクの wave 同期手順 | `references/lessons-learned-health-policy-worktree-2026-04.md` §L-WTI-005 |
| Artifact Inventory | `references/workflow-task-worktree-environment-isolation-artifact-inventory.md` |

---

### Google Sheets API 認証 / Service Account + Web Crypto JWT RS256（UT-03 / 2026-04-29）

`packages/integrations/google/src/sheets/` に Service Account JSON + Web Crypto API（`SubtleCrypto.sign`）で RS256 JWT を生成し、`https://oauth2.googleapis.com/token` へ `urn:ietf:params:oauth:grant-type:jwt-bearer` で交換する access token 取得層。Cloudflare Workers ランタイム互換（Node `crypto` 非依存）。consumer は 03b / 03a の Forms / Sheets 同期 wave。

| 目的 | 最初に開くファイル |
| --- | --- |
| パッケージ責務・モジュール境界（`packages/integrations/google` の export 構造） | `references/architecture-monorepo.md`（§packages/integrations/google） |
| Service Account JSON / scope / spreadsheet ID の env 配置 | `references/environment-variables.md`（§Google Sheets API） |
| Cloudflare Workers Secret 投入手順・JWT 署名・OAuth token endpoint | `references/deployment-cloudflare.md`（§Sheets API Service Account 認証） |
| 公開 API（`getSheetsAccessToken(env)` / `createSheetsTokenSource(env)`）と型（`SheetsAuthEnv` / `SheetsAccessToken`） | `packages/integrations/google/src/sheets/index.ts`, `packages/integrations/google/src/sheets/auth.ts` |
| 関連 env vars | `GOOGLE_SERVICE_ACCOUNT_JSON`（Secret） / `SHEETS_SCOPES`（既定 `https://www.googleapis.com/auth/spreadsheets.readonly`） / `SHEETS_SPREADSHEET_ID` |
| 単体テスト・契約テスト | `packages/integrations/google/src/sheets/auth.test.ts`, `auth.contract.test.ts` |
| Phase 12 spec / consumer wave 受け渡し | `docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup/index.md`, `phase-12.md` |
| Wave 状態 | `references/task-workflow-active.md`（§UT-03） |

---

### Forms Response Sync / Cron */15 / sync_jobs ledger（03b / 2026-04-29）

Google Forms `forms.responses.list` を D1 に冪等取り込み、`current_response_id` 切替・consent snapshot・unknown field → schema_diff_queue を一括処理する batch worker の即時導線。

| 目的 | 最初に開くファイル |
| --- | --- |
| 管理 API 契約（`POST /admin/sync/responses`、`fullSync` / `cursor` / 409 二重起動） | `references/api-endpoints.md`（§管理同期 API） |
| D1 スキーマ責務（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`） | `references/database-schema.md`（§UBM 会員 Forms 同期テーブル 03b） |
| `sync_jobs` runtime contract SSOT（Issue #435 / 2026-05-04） | runtime: `apps/api/src/jobs/_shared/sync-jobs-schema.ts` / logical spec: `docs/30-workflows/_design/sync-jobs-spec.md` / owner table: `docs/30-workflows/_design/sync-shared-modules-owner.md` / workflow: `docs/30-workflows/completed-tasks/issue-195-sync-jobs-contract-schema-consolidation-001/` |
| cron `*/15 * * * *` 設定・JWT 署名・Secret 配置 | `references/deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b） |
| `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `SYNC_ADMIN_TOKEN` 配置 | `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| `RETENTION_PURGE_MODE`（dry-run/apply/off）/ `RETENTION_PURGE_LIMIT` 配置（Issue #402 retention purge gate） | `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期）, `references/data-retention-policy.md` |
| D1 health endpoint（`GET /health/db`、`X-Health-Token`、`HEALTH_DB_TOKEN`、401/403/503 境界） | `references/api-endpoints.md`（§UBM-Hyogo Health API）, `references/environment-variables.md`（§Cloudflare Workers / Google Forms 同期） |
| 苦戦箇所（per-sync write 200 cap / partial UNIQUE で重複 enqueue 抑止 / submittedAt 同値時 responseId 降順 tie-break / `metrics_json.cursor` ≠ `pageToken`） | `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/implementation-guide.md` Part 2 |
| follow-up 責務 8 項目（responseEmail merge / 退会 identity 表示制御 / sync 共通モジュール owner / response_email UNIQUE 所在明文化 / 旧 `ruleConsent` lint / per-sync cap 通知 / lock TTL 解除 runbook / E2E fixture） | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-response-sync-followups.md`。UNIQUE 所在は Issue #196 workflow `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` で consumed / 訂正済み: 正本は `member_identities.response_email`、`member_responses.response_email` は非 UNIQUE |
| 全 phase 設計と AC-1〜AC-10 検証 | `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |

### Cron Monitoring / Release Runbook（09b / 2026-05-01）

09b は docs-only / spec_created / NON_VISUAL の運用 runbook 仕様。runtime 設定変更は行わず、`apps/api/wrangler.toml` の current facts を監視・リリース手順に固定する。

| 目的 | 最初に開くファイル |
| --- | --- |
| 09b workflow root / AC / Phase 一覧 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` |
| cron current facts と legacy Sheets hourly cron の扱い | `references/deployment-cloudflare.md`（§API Worker cron / Forms response sync 03b）, `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-02.md` |
| NON_VISUAL Phase 11 evidence | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-11.md` |
| Phase 12 runbook / same-wave sync / compliance | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-12.md` |
| Phase 13 approval gate / 4 required outputs | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-13.md` |
| Direct runbooks | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/release-runbook.md`, `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/phase-12/incident-response-runbook.md` |
| Artifact inventory / lessons | `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`, `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md` |

### Sentry / Slack Runtime Smoke（09b-A / 2026-05-05）

09b-A は implementation / NON_VISUAL / `implemented-local`。API smoke route は実装済みで、実 Sentry event 受信、Slack message 送信、production secret 登録は user-approved runtime execution wave で取得する。

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root / AC / approval gate | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/index.md` |
| Secret 命名と Slack/Sentry smoke 設計 | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/phase-02.md` |
| Runtime evidence template | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-11/main.md` |
| Phase 12 strict 7 compliance | `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| API smoke route 実装 | `apps/api/src/routes/admin/smoke-observability.ts`, `apps/api/src/routes/admin/smoke-observability.test.ts` |
| Canonical observability / secrets | `references/observability-monitoring.md`, `references/deployment-secrets-management.md` |
| 苦戦箇所 / lessons-learned | `references/lessons-learned-09b-A-sentry-slack-runtime-smoke-2026-05.md` |
| Runtime execution 後続タスク | `docs/30-workflows/unassigned-task/task-09b-a-runtime-provider-smoke-execution-001.md` |

### Sentry / Slack Runtime Smoke Production Extension（Issue #495 / 2026-05-06）

Production smoke uses the same route and secret names as staging, but requires `x-smoke-production-confirm: YES` and G1-G4 approval before runtime execution.

| 目的 | 最初に開くファイル |
| --- | --- |
| workflow root / production AC | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/index.md` |
| production confirmation gate design | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/phase-02.md` |
| implementation runbook | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/phase-05.md` |
| staging / production runtime templates | `docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-11/main.md` |
| production smoke route implementation | `apps/api/src/routes/admin/smoke-observability.ts`, `apps/api/src/routes/admin/smoke-observability.test.ts` |

---

### Member Self-Service API / `/me/*` / dev session header（04b / 2026-04-29）

会員本人向け `/me/*` endpoint の即時導線。04b 時点では dev session header だったが、06b-A で Auth.js cookie / Bearer JWT resolver に差し替え済み。

| 目的 | 最初に開くファイル |
| --- | --- |
| API 契約（`GET /me`, `GET /me/profile`, `POST /me/visibility-request`, `POST /me/delete-request` / 禁止: `PATCH /me/profile`、`/me/*` への `:memberId`、GET 系での `notes`/`adminNotes` 露出） | `references/api-endpoints.md`（§UBM-Hyogo Member Self-Service API 04b） |
| `admin_member_notes` request queue（`note_type`: `general` / `visibility_request` / `delete_request`、`request_status`: `pending` / `resolved` / `rejected`、pending 判定は `request_status='pending'`） | `references/database-admin-repository-boundary.md`（§04b member self-service queue） |
| `SessionUser.authGateState` の値域（`active` / `rules_declined` / `deleted`）と spec 整合 | `docs/00-getting-started-manual/specs/04-types.md`, `06-member-auth.md` |
| 再回答更新方針 / `editResponseUrl` / 退会・公開停止申請の MVP 経路 | `docs/00-getting-started-manual/specs/07-edit-delete.md` |
| session resolver（production/staging: Auth.js cookie / Bearer JWT + `AUTH_SECRET`; development only: `x-ubm-dev-session: 1` + `Authorization: Bearer session:<email>:<memberId>`。`ENVIRONMENT` 欠落時は dev token deny） | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/outputs/phase-12/implementation-guide.md` |
| 苦戦知見（`authGateState` enum 文脈分離 / `packages/shared` exports 漏れ / wave 跨ぎ schema 変更宣言 / dev session production guard / 不変条件根拠の集約） | `references/lessons-learned-04b-member-self-service.md`（L-04B-001〜005） |

### UBM-Hyogo Magic Link / AuthGateState API 早見（05b / 2026-04-29）

Magic Link 発行・検証と login gate 判定の即時導線。画面は 06b の責務で、05b は API/NON_VISUAL。

| 項目 | 正本 |
| --- | --- |
| API contract | `references/api-endpoints.md`（§認証 API 05b） |
| env / secrets | `references/environment-variables.md`（`AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`） |
| 実装ガイド | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md` |
| 05b-B callback / Credentials Provider 実装 | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/`（implemented-local / implementation / NON_VISUAL / local evidence PASS / staging smoke deferred） |
| 02c follow-up fixture prod build exclusion 仕様 | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/`（spec_created / NON_VISUAL / runtime 未実行） |
| Phase 11 evidence | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-11/` |
| 苦戦知見 | `references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（L-05B-001〜005） |
| Artifact Inventory | `references/workflow-task-05b-parallel-magic-link-provider-and-auth-gate-state-artifact-inventory.md` |

05b-B は `/api/auth/callback/email` と Auth.js Credentials Provider の `apps/web` 実装であり、05b 本体 API の完了証跡とは分けて読む。`GET /api/auth/callback/email`、`verify-magic-link.ts`、Credentials Provider `id="magic-link"`、focused tests、typecheck、boundary check は実装済み。dev-server curl / Auth.js real Set-Cookie / staging smoke は 09a 系 runtime evidence に委譲する。

02c follow-up 002 は `apps/api` の `__fixtures__` / `__tests__` を production build から除外する実装仕様であり、現時点では build config 変更や runtime artifact grep は未実行。実装時は Phase 11 reserved evidence を取得する。

---

### UBM-Hyogo Magic Link / Auth Mail Env Contract Alignment（05b-A / 2026-05-01）

Magic Link メール送信の env 名を、実装と aiworkflow 正本に合わせて `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` に統一する docs-only workflow。

| 項目 | 正本 |
| --- | --- |
| workflow | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` |
| env / secrets | `references/environment-variables.md`（`AUTH_URL` / `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS`） |
| Artifact Inventory | `references/workflow-05b-a-auth-mail-env-contract-alignment-artifact-inventory.md` |
| 苦戦知見 | `references/lessons-learned-05b-a-auth-mail-env-contract-alignment-2026-05.md`（L-05BA-001〜004） |
| Phase 11 readiness | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-11/` |
| Phase 12 close-out | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/outputs/phase-12/` |

---

### UT-28 Cloudflare Pages Projects Creation（2026-04-29 / spec_created）

| 目的 | 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/` |
| production / staging Pages project contract | `references/deployment-cloudflare.md`（UT-28 Cloudflare Pages project creation contract） |
| GitHub Actions variable semantics | `references/deployment-gha.md`（`CLOUDFLARE_PAGES_PROJECT` deleted by Issue #638; rollback value only = `ubm-hyogo-web`） |
| U-FIX-CF-ACCT-01-DERIV-02 Cloudflare token split | `references/deployment-gha.md`, `references/deployment-secrets-management.md`, `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/`（`CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` / `CF_TOKEN_PAGES_*`, Issue #406 は `Refs`） |
| 苦戦知見 | `references/lessons-learned-ut-28-cloudflare-pages-projects-2026-04.md`（L-UT28-001〜005: production_branch 逆配線 / Variable suffix derivation / Pages Git Integration OFF / compatibility_date 同期 / OpenNext blocker handoff） |
| UT-27 handoff | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-10/handoff-to-ut27.md` |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-11/` |
| Phase 12 close-out | `docs/30-workflows/completed-tasks/ut-28-cloudflare-pages-projects-creation/outputs/phase-12/` |
| OpenNext blocker owner | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` / `UT-05` |

---

### UT-06-FU-A Production Worker Preflight（2026-04-30 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| runbook | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` |
| 原典 unassigned | `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` |
| lessons-learned | `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` |
| artifact inventory | `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md` |
| route inventory design workflow | `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` |
| route inventory design close-out log | `changelog/20260501-ut-06-fu-a-route-inventory-design-close-out.md` |
| route inventory design lessons | `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md` § 2026-05 / route-inventory-design 追記（L-UT06FUA-008〜013） |
| automation follow-up | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md`, `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` |
| consumed pointer | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` |
| Logpush target diff script | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`（implementation_complete / Phase 1-12 completed / Phase 13 pending_user_approval） |
| Logpush diff command | `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml` |
| 対象 Worker | `ubm-hyogo-web-production` |
| 境界 | route / custom domain / secret key / observability target の preflight。production deploy / DNS 切替 / Worker 削除は別承認 |

---

### 09c Production Deploy / Post-release Verification（2026-05-01 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |
| 種別 | docs-only / spec_created / VISUAL / runtime evidence pending_user_approval |
| runbook | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-05/production-deploy-runbook.md` |
| Phase 11 template | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| artifact inventory / legacy alias | `references/workflow-task-09c-serial-production-deploy-and-post-release-verification-artifact-inventory.md`, `references/legacy-ordinal-family-register.md` |
| production execution | `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` |
| production execution issue mirror | `docs/30-workflows/issue-353-09c-production-deploy-execution/` |
| production execution status | `implemented-local` / implementation / VISUAL_ON_EXECUTION / user approval G1-G3 required / production runtime evidence pending |
| production execution inventory | `references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md` |
| production execution lessons | `references/lessons-learned-09c-production-deploy-execution-001-2026-05.md`（L-09C-EXEC-001〜006）|
| 境界 | 09c 本体は runbook / evidence template。実 production D1 migration / deploy / tag push / 24h verification は `09c-A-production-deploy-execution` の Phase 5-11 で user approval 後に実行 |

### 09c Incident Runbook Slack Delivery（2026-05-06 / spec_created）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/` |
| 種別 | implementation-spec / NON_VISUAL / runtime-contract-formalization |
| source | `docs/30-workflows/completed-tasks/task-09c-incident-runbook-slack-delivery-001.md` consumed |
| secret spec | `references/deployment-secrets-management.md` §Slack Incident Runbook Delivery |
| lessons | `references/lessons-learned-09c-incident-runbook-slack-delivery-2026-05.md`（L-09C-IRSD-001〜005: workflow_run inputs / 二段ゲート / permalink evidence / Refs #N / secret promote）|
| Phase 12 compliance | `docs/30-workflows/completed-tasks/09c-incident-runbook-slack-delivery/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation | `.github/workflows/incident-runbook-slack-delivery.yml`, `scripts/notify/{slack-incident-runbook.{sh,ts,template.json}, save-slack-evidence.ts}` |
| evidence schema | `ok`, `mode`, `ts`, `channel`, `message.permalink`, `commitSha`, `runbookPermalink`, `deliveredAt` |
| boundary | `workflow_run` は dry-run のみ。production delivery は `workflow_dispatch` + `production-slack-delivery` environment approval + `dryrun_evidence_confirmed=true` 後に実行 |

### Issue #348 GitHub Release Tag Automation（2026-05-06 / implemented-local）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| scripts | `scripts/release/generate-release-notes.sh`, `scripts/release/create-github-release.sh` |
| template | `scripts/release/release-notes.template.md` |
| GitHub Actions | `.github/workflows/release-create.yml` |
| runbook | `docs/runbooks/release-create.md`, `references/release-runbook.md` |
| tag format | `vYYYYMMDD-HHMM` |
| command | `bash scripts/release/create-github-release.sh --tag vYYYYMMDD-HHMM --target <sha> --changelog-path <path> --evidence-url <url> --dry-run` |
| boundary | `workflow_dispatch` は dry-run のみ。tag push は draft release 作成。local `--apply` は user 承認後のみ |

### Issue #352 Postmortem Template Automation（2026-05-05 / implemented-local）

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-352-postmortem-template-automation/` |
| generator | `scripts/postmortem/generate-postmortem.ts` |
| command | `pnpm postmortem:generate -- --release vX.Y.Z --commit <sha> --evidence <09c-phase-11-dir> --rollback-evidence <rollback-md> --occurred-at <iso8601>` |
| runbook/template | `docs/30-workflows/runbooks/postmortem/README.md`, `docs/30-workflows/runbooks/postmortem/template.md` |
| upstream evidence | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| status | implementation / NON_VISUAL / implemented-local / Phase 13 blocked_pending_user_approval |
| validation | `--evidence` は directory + `main.md` 必須。`--rollback-evidence` は file 必須、0 byte は warning + exit 0 |
| runner | Node 24 `--experimental-strip-types`。`tsx` は esbuild host/binary mismatch のため本CLIでは使わない |
| boundary | postmortem markdown generation only。incident response 本文置換、Slack 通知、GitHub Releases 自動生成、PR 作成は user-gated / scope-out |

---

### UBM-Hyogo Member Login / Profile Pages 早見（06b / 2026-04-29）

会員向け `/login` と `/profile` の即時導線。API は 04b/05b、session / OAuth は 05a を上流とする。

| 項目 | 正本 |
| --- | --- |
| canonical task root | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/` |
| 実装ガイド | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/outputs/phase-12/implementation-guide.md` |
| login UI | `apps/web/app/login/` |
| profile UI | `apps/web/app/(member)/profile/`（URL remains `/profile`） |
| proxy | `apps/web/proxy.ts`（`/profile/:path*` session gate; Issue #277 migrated from legacy `middleware.ts`） |
| URL helpers | `apps/web/src/lib/url/{login-query,login-redirect,login-state,safe-redirect}.ts` |
| API clients | `apps/web/src/lib/fetch/authed.ts`, `apps/web/src/lib/auth/{magic-link-client,oauth-client}.ts` |
| Phase 11 evidence | `docs/30-workflows/06b-parallel-member-login-and-profile-pages/outputs/phase-11/evidence/` |
| Auth.js `/me` session resolver follow-up | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/`（implemented-local / implementation / NON_VISUAL。`apps/api/src/middleware/me-session-resolver.ts` が Auth.js cookie / Bearer JWT を `AUTH_SECRET` で検証し、`apps/api/src/index.ts` の `/me` mount に接続済み。staging / production live smoke は 09a / 09c gate） |
| profile self-service request UI follow-up | `docs/30-workflows/completed-tasks/06b-B-profile-self-service-request-ui/`（implemented-local / implementation / runtime-evidence-blocked / VISUAL_ON_EXECUTION。`/profile` に `RequestActionPanel`、公開停止/再公開申請 dialog、退会申請 dialog、同一 origin proxy、`/api/me/visibility-request` / `/api/me/delete-request` client helper を追加済み。ログイン済み実 screenshot は runtime capture 待ち） |
| profile logged-in visual evidence follow-up | `docs/30-workflows/completed-tasks/06b-C-profile-logged-in-visual-evidence/`（implementation-prepared / runtime evidence pending / M-08〜M-10, M-14〜M-16） |
| Magic Link 429 Retry-After follow-up | `docs/30-workflows/completed-tasks/issue-275-magic-link-429-retry-after/`（implemented_local_evidence_captured / implementation / NON_VISUAL。`MagicLinkRateLimitedError` + server-truth cooldown 実装、focused specs PASS。source `UT-06B-MAGIC-LINK-RETRY-AFTER` は consumed） |

---

### UT Coverage 2026-05 Wave 早見（Issue #320）

| 目的 | 最初に開くファイル |
| --- | --- |
| wave 実行順序 | `docs/30-workflows/ut-coverage-2026-05-wave/README.md` |
| apps/api coverage precondition | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/index.md` |
| apps/web auth/fetch/session coverage spec | `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/index.md` |
| wave-3 roadmap | `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md`（Issue #433 / implemented-local / Phase 1-12 completed / Phase 13 approval gate） |
| artifact inventory | `references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` |
| lessons learned | `references/lessons-learned-ut-coverage-2026-05-wave.md` |
| Phase 11 NON_VISUAL evidence | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/outputs/phase-11/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| coverage command | `bash scripts/coverage-guard.sh` |

Boundary: wave-1 is `implemented-local / test-fixture implementation / NON_VISUAL`; only `apps/api/src/jobs/__fixtures__/d1-fake.ts` is changed. `ut-web-cov-03` is now `implemented-local / test implementation / NON_VISUAL`: apps/web auth/fetch/session Vitest tests, `fetch-mock` helper + helper test, and root `vitest.config.ts` coverage exclude are implemented and measured (40 files / 3510 tests PASS). Issue #433 wave-3 roadmap measured all four packages and materialized 8 candidate tasks; root `vitest.config.ts` also contains the React / React DOM alias used to keep coverage runs stable under isolated node-linker. Runtime production code, packages/*, commit, push, PR creation, and post-push `verify-indexes-up-to-date` CI evidence remain blocked until Phase 13 user approval.

---

### UI Visual Baseline Drift / dark-mode screenshot stability（2026-04-03）

| 目的                 | 最初に開くファイル                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dark-mode baseline   | `references/workflow-ui-ux-visual-baseline-drift.md`                                                                                                        |
| workflow root        | `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/`                                                                                      |
| screenshot evidence  | `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/outputs/phase-11/manual-test-result.md`, `docs/30-workflows/completed-tasks/ut-uiux-visual-baseline-drift-001/outputs/phase-11/screenshots/` |
| completed ledger     | `references/task-workflow-completed-ui-ux-visual-baseline-drift.md`                                                                                         |
| lessons / reuse card | `references/lessons-learned-ui-ux-visual-baseline-drift.md`, `references/ui-ux-design-system.md`                                                            |
| same-wave sync       | `references/task-workflow.md`, `indexes/resource-map.md`                                                                                                    |

---

### Runtime Skill Creator Public IPC 即時導線（2026-03-21）

| 目的                      | 最初に開くファイル                                                       |
| ------------------------- | ------------------------------------------------------------------------ |
| public IPC 契約           | `references/api-ipc-agent-core.md`                                       |
| security detail           | `references/security-electron-ipc-details.md`                            |
| registration / DI pattern | `references/architecture-implementation-patterns-details.md`             |
| completed ledger          | `references/task-workflow-completed-ipc-contract-preload-alignment.md`   |
| lessons                   | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |
| workflow root             | `docs/30-workflows/completed-tasks/runtime-skill-creator-ipc-wiring/`    |

---

### Runtime Skill Creator Workflow Engine Orchestration / Failure Lifecycle（2026-03-26）

| 目的                                                      | 最初に開くファイル                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| owner 分離と failure review return                        | `references/architecture-overview-core.md`                                                     |
| facade / engine / transition guard / artifact append 詳細 | `references/arch-electron-services-details-part2.md`                                           |
| public IPC と `execute-plan` failure lifecycle 契約       | `references/api-ipc-system-core.md`                                                            |
| auth / ipc 教訓                                           | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md`                       |
| completed ledger                                          | `references/task-workflow-completed.md`                                                        |
| follow-up backlog                                         | `references/task-workflow-backlog.md`                                                          |
| workflow root                                             | `docs/30-workflows/completed-tasks/step-02-seq-task-02-workflow-engine-runtime-orchestration/` |
| failure lifecycle follow-up                               | `docs/30-workflows/completed-tasks/ut-imp-runtime-workflow-engine-failure-lifecycle-001/`      |
| path sync follow-up                                       | `docs/30-workflows/completed-tasks/ut-imp-task-sdk-02-system-spec-and-path-sync-001/`          |

---

### Runtime Skill Creator Execute-plan Fire-and-Forget（2026-04-01）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ack + snapshot relay の current facts             | `references/api-ipc-system-core.md`                                                                    |
| security / response contract                      | `references/security-electron-ipc-details.md`                                                         |
| fire-and-forget の owner 分離                     | `references/architecture-overview-core.md`                                                            |
| public IPC / renderer bridge の整合               | `references/api-ipc-agent-core.md`                                                                    |
| completed ledger                                  | `references/task-workflow-completed-ipc-contract-preload-alignment.md`                               |
| follow-up backlog                                 | `references/task-workflow-backlog.md`                                                                 |
| lessons                                           | `references/lessons-learned-ipc-preload-runtime.md`                                                   |
| workflow root                                     | `docs/30-workflows/fix-step3-seq-execute-plan-nonblocking/`                                           |

---

### Runtime Skill Creator Resource Selection Hardening（2026-03-27）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Task03 実装全体像                                 | `docs/30-workflows/completed-tasks/step-03-par-task-03-context-budget-and-resource-selection/index.md` |
| multi-root / budget / degrade の current contract | `references/interfaces-agent-sdk-skill-reference.md`                                                   |
| service owner と pipeline detail                  | `references/arch-electron-services-details-part2.md`                                                   |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                |
| 苦戦箇所 / provenance 教訓                        | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md`                               |

---

### Skill Creator Create Mainline Entry（2026-03-27）

| 目的                           | 最初に開くファイル                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Task05 の全体像                | `docs/30-workflows/step-04-par-task-05-create-entry-mainline-unification/index.md`                        |
| 一次導線と ViewType 契約       | `references/ui-ux-navigation.md`, `references/workflow-skill-lifecycle-routing-render-view-foundation.md` |
| state owner / handoff 境界     | `references/arch-state-management-core.md`                                                                |
| create 後の downstream journey | `references/workflow-skill-lifecycle-created-skill-usage-journey.md`                                      |
| completed ledger               | `references/task-workflow-completed.md`                                                                   |
| Phase 12 教訓                  | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                |

---

### Skill Creator SDK Event Normalization (TASK-RT-06)

**概要:** SDKMessage → SkillCreatorSdkEvent 変換契約の安定化

| 項目 | 詳細 |
|---|---|
| 型 | `SkillCreatorSdkEvent` (7フィールド), `SkillCreatorSdkEventType` ("init"\|"assistant"\|"result"\|"error") |
| normalizer | `normalizeSdkMessage(msg, sessionId?)`, `normalizeSdkStream(msgs)` |
| IPCチャネル | `skill-creator:normalize-sdk-messages` |
| sessionId伝播 | init → 後続メッセージへ自動伝播 |
| テスト | 32件, Line 99.35% / Branch 91.22% / Function 100% |
| 未タスク | SkillExecutor.convertToStreamMessage()との統合候補（1件） |

---

### Skill Creator Conversation UI（TASK-SDK-SC-02 / 2026-04-03 実装済み）

| 目的                                                 | 最初に開くファイル                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Task02 の全体像・Phase 仕様書                        | `docs/30-workflows/step-02-par-task-02-conversation-ui/index.md`                                                |
| 5 コンポーネント Props API・使用例                   | `docs/30-workflows/step-02-par-task-02-conversation-ui/phase-12-documentation.md`                               |
| アーキテクチャ・型マッピング・IPC 通信フロー         | `outputs/phase-12/implementation-guide.md`                                                                      |
| Session Bridge 型定義                                | `packages/shared/src/types/skillCreatorSession.ts`（`UserInputQuestion` / `UserInputAnswer`）                   |
| Workflow UI 型定義                                   | `packages/shared/src/types/skillCreator.ts`（`SkillCreatorUserInputRequest` / `InterviewUserAnswer`）           |
| IPC チャネル定義                                     | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_SESSION_CHANNELS`）                                      |
| Preload API                                          | `apps/desktop/src/preload/skill-creator-session-api.ts`（`window.skillCreatorSessionAPI`）                      |
| Organism コンポーネント（ブリッジ層）                | `apps/desktop/src/renderer/components/skill-creator/SkillCreatorConversationPanel.tsx`                           |
| テスト（57 件）                                      | `apps/desktop/src/renderer/components/skill-creator/__tests__/`                                                 |
| completed ledger                                     | `references/task-workflow-completed.md`                                                                         |

---

### Skill Creator External API Support（TASK-SDK-SC-03 / 2026-04-03 実装済み）

| 目的                                                    | 最初に開くファイル                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| External API IPC チャネル4本の契約                      | `references/api-ipc-system-core.md`（§Skill Creator External API Support）              |
| 型定義（ExternalApiConnectionConfig / AuthType / Error） | `packages/shared/src/types/skillCreatorExternalApi.ts`                                   |
| チャネル定数定義                                         | `packages/shared/src/ipc/channels.ts`（SKILL_CREATOR_EXTERNAL_API_CHANNELS）            |
| credential 秘匿化セキュリティ契約                       | `references/security-electron-ipc-core.md`（§Credential 秘匿化）                       |
| IpcBridge バリデーション / SdkSession custom tool       | `apps/desktop/src/main/services/runtime/SkillCreatorIpcBridge.ts` / `SkillCreatorSdkSession.ts` |
| ExternalApiConfigForm UI                                | `apps/desktop/src/renderer/components/skill/ExternalApiConfigForm.tsx`                   |
| 苦戦箇所5件                                             | `references/lessons-learned-current.md`（§TASK-SDK-SC-03）                              |
| completed ledger                                        | `references/task-workflow-completed.md`                                                  |
| workflow root                                           | `docs/30-workflows/completed-tasks/step-02-par-task-03-external-api-support/`           |

---
### Skill Creator Skill Output Integration（TASK-SDK-SC-04 / 2026-04-04 実装済み）

| 目的                                                          | 最初に開くファイル                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Skill Output IPC チャネル3本の契約                            | `references/api-ipc-system-core.md`（§Skill Creator Output Integration）                                                    |
| 型定義（SkillOutputReadyPayload / SkillOpenPayload 等）        | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_OUTPUT_CHANNELS`）                                                    |
| チャネル定数定義                                              | `packages/shared/src/ipc/channels.ts`（`SKILL_CREATOR_OUTPUT_READY` / `SKILL_CREATOR_OUTPUT_OVERWRITE_APPROVED` / `SKILL_CREATOR_OPEN_SKILL`） |
| OutputHandler 実装（マーカー検出・SKILL.md抽出・ファイル保存） | `apps/desktop/src/main/services/runtime/SkillCreatorOutputHandler.ts`                                                       |
| SkillRegistry 実装（インメモリ・DI対応）                      | `apps/desktop/src/main/services/runtime/SkillRegistry.ts`                                                                   |
| IpcBridge outputHandler DI 追加                               | `apps/desktop/src/main/services/runtime/SkillCreatorIpcBridge.ts`                                                           |
| Preload onOutputReady() リスナー                              | `apps/desktop/src/preload/skill-creator-api.ts`（`onOutputReady()`）                                                        |
| SkillCreatorResultPanel UI（プレビュー・上書き確認）          | `apps/desktop/src/renderer/components/skill-creator/SkillCreatorResultPanel.tsx`                                            |
| 苦戦箇所4件                                                   | `references/lessons-learned-current.md`（§TASK-SDK-SC-04）                                                                  |
| completed ledger                                              | `references/task-workflow-completed.md`                                                                                      |

---

### execute→SkillFileWriter persist 統合（TASK-P0-05 / 2026-04-05 実装済み）

| 目的                                                          | 最初に開くファイル                                                                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| persist 統合パイプライン（Step 3.5-3.6）                      | `apps/desktop/src/main/services/runtime/RuntimeSkillCreatorFacade.ts`                                                       |
| LLM応答→コンテンツ抽出                                       | `apps/desktop/src/main/services/runtime/parseLlmResponseToContent.ts`                                                       |
| SkillFileWriter persist / rollback                            | `apps/desktop/src/main/services/skill/SkillFileWriter.ts`                                                                   |
| 二重パイプライン B経路（OutputHandler→SkillRegistry）         | `apps/desktop/src/main/services/runtime/SkillCreatorOutputHandler.ts`                                                       |
| パストラバーサル対策（toSlug / PATH_TRAVERSAL）               | `SkillCreatorOutputHandler.ts`（toSlug）、`SkillFileWriter.ts`（PATH_TRAVERSAL バリデーション + rollback）                   |
| LLMAdapter Setter Injection（P34 準拠）                       | `RuntimeSkillCreatorFacade.ts`（setLlmAdapter）                                                                             |
| 統合テスト 22 件                                              | `apps/desktop/src/main/services/runtime/__tests__/RuntimeSkillCreatorFacade.persist-integration.test.ts`                     |
| OutputHandler テスト 22 件                                    | `apps/desktop/src/main/services/runtime/__tests__/SkillCreatorOutputHandler.test.ts`                                        |
| 苦戦箇所（L-P005-001〜004）                                   | `references/lessons-learned-current.md`（§TASK-P0-05）                                                                      |
| completed ledger                                              | `references/task-workflow-completed.md`（§TASK-P0-05）                                                                      |
| workflow root                                                 | `docs/30-workflows/skill-creator-agent-sdk-lane/task-spec-sdk-interactive-skill-creator-v3/step-03-seq-task-04-skill-output-integration/` |

---

### Verify Execution Engine Layer 1/2（TASK-P0-01 / 2026-04-04 実装済み）

| 目的                                              | 最初に開くファイル                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| verify contract 仕様                              | `references/interfaces-skill-verify-contract.md`                                                       |
| workflow root                                     | `docs/30-workflows/step-09-par-task-p0-01-verify-execution-engine-layer12/`                            |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                |
| 苦戦箇所（L-VE-001〜003）                         | `references/lessons-learned-current.md`                                                                |
| 実装ファイル                                      | `apps/desktop/src/main/services/runtime/SkillCreatorVerificationEngine.ts`                             |

---
### Skill Creator SDK Event Normalization (TASK-RT-06)

**概要:** SDKMessage → SkillCreatorSdkEvent 変換契約の安定化

| 項目 | 詳細 |
|---|---|
| 型 | `SkillCreatorSdkEvent` (7フィールド), `SkillCreatorSdkEventType` ("init"\|"assistant"\|"result"\|"error") |
| normalizer | `normalizeSdkMessage(msg, sessionId?)`, `normalizeSdkStream(msgs)` |
| IPCチャネル | `skill-creator:normalize-sdk-messages` |
| sessionId伝播 | init → 後続メッセージへ自動伝播 |
| テスト | 32件, Line 99.35% / Branch 91.22% / Function 100% |
| 未タスク | ~~SkillExecutor.convertToStreamMessage()との統合候補（1件）~~ → **UT-RT-06-SKILL-STREAM-SKCE-TYPE-UNIFICATION-001 にて完了** |

### SDK 出力型統合 (UT-RT-06-SKILL-STREAM-SKCE-TYPE-UNIFICATION-001)

**概要:** 実行 lane と skill-creator lane の出力型を `packages/shared` に集約

| 項目 | 詳細 |
|---|---|
| 共通基底型 | `SdkOutputMessageBase` (`timestamp?: number`) |
| 実行 lane 型 | `SkillExecutorStreamMessage extends SdkOutputMessageBase` (executionId / id / type / content / timestamp / isComplete) |
| 実行 lane 種別 | `SkillExecutorStreamMessageType` ("text"\|"tool_use"\|"error"\|"complete"\|"retry") |
| skill-creator lane 型 | `SkillCreatorSdkEvent extends SdkOutputMessageBase` (変更: 共通基底を継承) |
| @deprecated | `SkillExecutor.ts` ローカル `SkillStreamMessage` / `SkillStreamMessageType` は型エイリアスとして残存 |
| 型定義場所 | `packages/shared/src/types/skillCreator.ts` |

---

### Runtime Skill Creator Session Persistence（TASK-SDK-08 / 2026-03-28 実装済み）

| 目的                                                            | 最初に開くファイル                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Task08 の全体像（checkpoint / lease / resume 契約）             | `docs/30-workflows/step-06-seq-task-08-session-persistence-and-resume-contract/index.md`                                                               |
| WorkflowSessionStorage（checkpoint / lease / revision 管理）   | `apps/desktop/src/main/services/session/WorkflowSessionStorage.ts`                                                                                     |
| ResumeCompatibilityEvaluator（compatible / incompatible 判定）  | `apps/desktop/src/main/services/session/ResumeCompatibilityEvaluator.ts`                                                                               |
| SkillCreatorWorkflowSessionRepository（保存 / ロード / 互換性） | `apps/desktop/src/main/services/session/SkillCreatorWorkflowSessionRepository.ts`                                                                      |
| session index（SessionService 登録）                            | `apps/desktop/src/main/services/session/index.ts`                                                                                                      |
| 型定義（WorkflowSession / ResumeCompatibilityResult）           | `packages/shared/src/types/skillCreator.ts`                                                                                                            |
| persistence contract と resume namespace rule                   | `references/api-ipc-system-core.md`                                                                                                                    |
| esbuild mismatch / artifact 命名 / Phase 11 判定 教訓          | `references/lessons-learned-current.md`（TASK-SDK-08 セクション）                                                                                     |
| completed ledger                                                | `references/task-workflow-completed.md`                                                                                                                |

---

### Skill Creator Execution Governance Bundle（2026-03-28 実装済み）

| 目的                                                                     | 最初に開くファイル                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Task07 governance bundle の全体像                                        | `docs/30-workflows/step-05-seq-task-07-execution-governance-and-handoff-alignment/index.md` |
| route authority / route owner                                            | `references/workflow-ai-runtime-execution-responsibility-realignment.md`                    |
| shared `HandoffGuidance` / Manual Boundary                               | `references/ui-ux-agent-execution-core.md`                                                  |
| approval / disclosure contract                                           | `references/api-ipc-system-core.md`                                                         |
| shared DTO / consumer mapping                                            | `references/interfaces-agent-sdk-skill-reference-share-debug-analytics.md`                  |
| Preload 実装（respondToApproval / getDisclosureInfo）                    | `apps/desktop/src/preload/skill-creator-api.ts`                                             |
| Renderer 実装（disclosure summary UI / handoff 分岐）                    | `apps/desktop/src/renderer/components/skill/SkillLifecyclePanel.tsx`                        |
| preload governance test（7テスト）                                       | `apps/desktop/src/preload/__tests__/skill-creator-api.governance.test.ts`                   |
| governance bundle 統合テスト（18テスト）                                 | `apps/desktop/src/main/services/runtime/__tests__/governance-bundle.test.ts`                |
| Phase 12 教訓（shared channel 再利用 / disclosure graceful degradation） | `references/lessons-learned-phase12-workflow-lifecycle.md`                                  |
| UT-SDK-07-APPROVAL-REQUEST-SURFACE-001 完了（2026-04-06）               | `onApprovalRequest()` Preload API / `SkillLifecyclePanel` 承認リクエスト表示 UI・lifecycle reset。テスト 17 件 PASS |
| 未タスク backlog（2件残）                                                | `references/task-workflow-backlog.md`（UT-SDK-07-PHASE11-SCREENSHOT-EVIDENCE-001 / UT-SDK-07-SHARED-IPC-CHANNEL-CONTRACT-001） |

---

### Runtime Workflow Engine Failure Lifecycle（2026-03-26）

| 目的                                     | 最初に開くファイル                                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 実装済み failure lifecycle task の全体像 | `docs/30-workflows/completed-tasks/ut-imp-runtime-workflow-engine-failure-lifecycle-001/index.md`                 |
| owner / consumer rule の current fact    | `references/architecture-overview-core.md`, `references/arch-electron-services-details-part2.md`                  |
| public IPC と workflow engine の境界     | `references/api-ipc-system-core.md`                                                                               |
| 親 task の foundation                    | `docs/30-workflows/completed-tasks/step-02-seq-task-02-workflow-engine-runtime-orchestration/`                    |
| completed ledger / close-out             | `references/task-workflow-completed.md`, `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |

---

### Runtime Skill Creator Verify Detail / Reverify（2026-03-27）

| 目的                                 | 最初に開くファイル                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| public IPC 契約                      | `references/api-ipc-agent-core.md`                                                   |
| main / preload / shared current fact | `references/api-ipc-system-core.md`                                                  |
| renderer consumer / DTO 利用面       | `references/interfaces-agent-sdk-skill-reference.md`                                 |
| backlog / carry-forward root         | `references/task-workflow-backlog.md`                                                |
| workflow root                        | `docs/30-workflows/completed-tasks/ut-imp-task-sdk-06-layer34-verify-expansion-001/` |
| Phase 11/12 教訓                     | `references/lessons-learned-phase12-workflow-lifecycle.md`                           |

---

### RuntimePolicyResolver subscription 判定統合（2026-03-22）

| 目的                            | 最初に開くファイル                                                                                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3パターン分岐ロジック           | `references/arch-electron-services-details-part2.md`                                                                                                                                                                                                                    |
| execution capability 契約       | `references/arch-execution-capability-contract.md`                                                                                                                                                                                                                      |
| Implementation Anchor close-out | `docs/30-workflows/completed-tasks/step-01-seq-task-01-execution-responsibility-contract-foundation/outputs/phase-1/scope-definition.md`, `docs/30-workflows/completed-tasks/task-exec-scope-definition-path-update-001/outputs/phase-12/system-spec-update-summary.md` |
| IPC 契約（resolveWithService）  | `references/api-ipc-system-core.md`                                                                                                                                                                                                                                     |
| lessons learned                 | `references/lessons-learned-ipc-preload-runtime.md`                                                                                                                                                                                                                     |
| workflow root                   | `docs/30-workflows/w1b-sc-runtime-policy-closure/`                                                                                                                                                                                                                      |

---

### Execution Responsibility follow-up path correction（2026-03-27）

| 目的                               | 最初に開くファイル                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `UT-EXEC-01` workflow 全体像       | `docs/30-workflows/completed-tasks/task-exec-scope-definition-path-update-001/index.md`                                                  |
| actual patch target                | `docs/30-workflows/completed-tasks/step-01-seq-task-01-execution-responsibility-contract-foundation/outputs/phase-1/scope-definition.md` |
| execution capability 契約背景      | `references/arch-execution-capability-contract.md`, `references/interfaces-auth-core.md`                                                 |
| close-out ledger                   | `references/task-workflow-completed.md`                                                                                                  |
| stale path / duplicate source 教訓 | `references/lessons-learned-phase12-workflow-lifecycle.md`                                                                               |

---

### Advanced Console Safety Governance（2026-03-25）

| 目的                              | 最初に開くファイル                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ApprovalGate セキュリティ契約     | `references/security-electron-ipc-core.md`                                                                          |
| 5 IPC channel 契約                | `references/api-ipc-system-core.md`                                                                                 |
| ApprovalGate Enforcement パターン | `references/architecture-implementation-patterns-core.md`                                                           |
| 3層レイヤー / handler 登録        | `references/architecture-overview-core.md`                                                                          |
| 設計レッスン                      | `references/lessons-learned-current.md`                                                                             |
| 未タスク（UT-6〜10）              | `references/task-workflow-backlog.md`                                                                               |
| production 統合 workflow root     | `docs/30-workflows/safety-gov-production-integration/index.md`                                                      |
| 実装ガイド                        | `docs/30-workflows/step-03-seq-task-03-advanced-console-safety-governance/outputs/phase-12/implementation-guide.md` |

---

### Safety Governance Production Integration 本番配線完了（2026-03-31 実装済み）

| 目的                                              | 最初に開くファイル                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 本番配線タスク全体像（Phase 1-12 完了）           | `docs/30-workflows/safety-gov-production-integration/index.md`                                                                  |
| ExecutionAPI preload namespace 型定義             | `apps/desktop/src/preload/types.ts`                                                                                             |
| contextBridge execution 公開実装                  | `apps/desktop/src/preload/index.ts`                                                                                             |
| DefaultApprovalGate DI / handler 登録             | `apps/desktop/src/main/ipc/index.ts`, `apps/desktop/src/main/ipc/approvalHandlers.ts`                                          |
| APPROVAL_CHANNELS / EXECUTION_CHANNELS 定数       | `packages/shared/src/ipc/channels.ts`                                                                                           |
| session cleanup（revokeAll on session destroy）   | `apps/desktop/src/main/ipc/approvalHandlers.ts`                                                                                 |
| follow-up 未タスク 4件（HIGH×3 / LOW×1）         | `docs/30-workflows/unassigned-task/UT-IMP-SAFETY-GOV-PUSH-REQUEST-PRODUCER-001.md` 等                                          |
| completed ledger                                  | `references/task-workflow-completed.md`                                                                                         |
| workflow pack formalize 教訓                      | `references/lessons-learned-current.md`                                                                                         |

---

### LLM provider registry SSoT（2026-04-01 更新）

| 目的                          | 最初に開くファイル                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| provider / model 正本 (SSOT)  | `packages/shared/src/types/llm/schemas/provider-registry.ts`                             |
| LLM IPC 型定義                | `references/llm-ipc-types.md`                                                             |
| UI surface                    | `references/ui-ux-llm-selector.md`                                                        |
| LLM 全体インデックス          | `references/interfaces-llm.md`                                                            |
| 教訓                          | `references/lessons-learned-test-typesafety.md`                                           |
| completed ledger              | `references/task-workflow-completed.md`                                                   |
| workflow pack root            | `docs/30-workflows/llm-provider-model-modernization/`                                     |
| Task05 schema-extension root  | `docs/30-workflows/llm-provider-model-modernization/tasks/step-04-seq-task-05-schema-extension/` |

---

### TASK-SDK-01 Phase 12 close-out / follow-up sync（2026-03-26）

| 目的                            | 最初に開くファイル                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| close-out follow-up の全体像    | `references/task-workflow-completed.md`                                                                 |
| manifest foundation の教訓      | `references/lessons-learned-phase12-workflow-lifecycle.md`                                              |
| runtime hardening current facts | `references/interfaces-agent-sdk-skill-reference.md`                                                    |
| backlog / carry-forward 判定    | `references/task-workflow-completed.md`                                                                 |
| workflow ledger 導線            | `references/task-workflow.md`                                                                           |
| 実装完了 root                   | `docs/30-workflows/completed-tasks/step-01-seq-task-01-manifest-contract-foundation/`                   |
| follow-up workflow root         | `docs/30-workflows/completed-tasks/task-sdk-01-phase12-compliance-sync/`                                |
| follow-up 指示書                | `docs/30-workflows/completed-tasks/unassigned-task/task-imp-task-sdk-01-phase12-compliance-sync-001.md` |

---

### Skill Creator Workflow State / User Input / Verify API（2026-03-27）

| 目的                    | API / 型名                                                                      | 最初に開くファイル                                                       |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| verify detail 取得      | `getVerifyDetail(planId)` → `RuntimeSkillCreatorVerifyDetail`                   | `references/api-ipc-system-core.md`                                      |
| reverify 要求           | `requestReverify(planId)` → `RuntimeSkillCreatorReverifyResult`                 | `references/api-ipc-system-core.md`                                      |
| workflow state 取得     | `getWorkflowState(planId)` → `SkillCreatorWorkflowUiSnapshot`                   | `references/api-ipc-system-core.md`                                      |
| ユーザー入力送信        | `submitUserInput(submission)` → `SkillCreatorWorkflowUiSnapshot`                | `references/api-ipc-system-core.md`                                      |
| workflow state 変更通知 | `onWorkflowStateChanged(callback)` → unsubscribe                                | `references/api-ipc-system-core.md`                                      |
| 教訓                    | 苦戦箇所4件（artifact ID / PhaseResourcePlanner / IPC型境界 / verify evidence） | `references/lessons-learned-auth-ipc-skill-creator-sync-auth-timeout.md` |

---

### 監視・アラート設計 / Observability（UT-08 / 2026-04-27）

| 目的 | 最初に開くファイル |
| --- | --- |
| WAE 6イベント設計 / 無料枠境界 / アラート閾値 | `references/observability-monitoring.md` |
| 苦戦箇所（設計/実装境界・WAE無料枠・アラート疲れ・identifier drift・DEFERRED解消） | `references/lessons-learned-monitoring-design-2026-04.md` |
| 05a 観測マトリクス（手動観測の正本） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` |
| 05a コストガードレール runbook | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` |
| Cloudflare デプロイ正本 | `references/deployment-cloudflare.md` |
| シークレット管理（Slack Webhook 等） | `references/deployment-secrets-management.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-08-monitoring-alert-design.md` |

---

### KV セッションキャッシュ設計（UT-13 / 2026-04-27）

| 目的 | 最初に開くファイル |
| --- | --- |
| KV 最終的一貫性 / 無料枠書き込み制限 / Namespace 分離教訓 | `references/lessons-learned-kv-session-cache-2026-04.md` |
| KV 書き込み計装の `kv_op` イベント仕様 | `references/observability-monitoring.md`（§2 WAE 6イベント設計） |
| Cloudflare バインディング正本 | `references/deployment-cloudflare.md` |
| 未タスク仕様 | `docs/30-workflows/unassigned-task/UT-13-cloudflare-kv-session-cache.md` |
| 検出元 | `docs/01b-parallel-cloudflare-base-bootstrap/` UN-02 |

---

## 型定義クイックアクセス

| 用途                        | 型名                                                                                 | ファイル                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| API結果                     | `OperationResult<T>`                                                                 | interfaces-core.md                                                                                                            |
| IPC transport               | `IPCResponse<T>`                                                                     | interfaces-auth.md                                                                                                            |
| 認証方式状態                | `AuthModeStatus`                                                                     | interfaces-auth.md                                                                                                            |
| スキル情報                  | `Skill`, `SkillMetadata`                                                             | interfaces-agent-sdk.md                                                                                                       |
| 実行ステータス              | `SkillExecutionStatus`                                                               | packages/shared/src/types/skill.ts                                                                                            |
| チャットメッセージ          | `ChatMessage`                                                                        | interfaces-llm.md                                                                                                             |
| 会話セッション              | `ChatSession`                                                                        | interfaces-chat-history.md                                                                                                    |
| RAG検索結果                 | `SearchResult`                                                                       | interfaces-rag-search.md                                                                                                      |
| エラー                      | `AppError`, `ValidationError`                                                        | error-handling.md                                                                                                             |
| CTA制御                     | `CTAVisibility`, `CTAState`                                                          | workflow-skill-lifecycle-created-skill-usage-journey.md                                                                       |
| ViewType拡張                | `ViewType` (`skillAnalysis` / `skillCreate`)                                         | ui-ux-navigation.md                                                                                                           |
| Agent改善導線               | `currentSkillName`, `selectedSkillName`, `skillExecutionStatus`, `viewHistory`       | workflow-skill-lifecycle-routing-render-view-foundation.md, arch-state-management-core.md, arch-state-management-reference.md |
| SkillCenter analyze handoff | `handleAnalyzeSkill`, `setCurrentSkillName`, `setCurrentView("skillAnalysis")`       | workflow-skill-lifecycle-created-skill-usage-journey.md, arch-state-management-reference-permissions-import-lifecycle.md      |
| SkillAnalysis close 契約    | `onClose`, `currentSkillName ?? "demo-skill"`, `viewHistory`, `goBack()`             | ui-ux-navigation.md, workflow-skill-lifecycle-routing-render-view-foundation.md                                               |
| 権限フォールバック          | `AbortReason`, `PermissionFlowContext`, `PermissionFlowResult`                       | interfaces-agent-sdk-executor-core.md                                                                                         |
| 権限リトライ上限            | `PERMISSION_MAX_RETRIES`                                                             | interfaces-agent-sdk-executor-core.md                                                                                         |
| SafetyGate評価              | `SafetyGatePort`, `DefaultSafetyGate`, `evaluateSafety`                              | api-ipc-agent-safety.md, security-skill-execution.md                                                                          |
| Permission Fallback Hook    | `processPermissionFallback`, `revokeSessionEntries`                                  | interfaces-agent-sdk-executor-details.md                                                                                      |
| スキル公開レベル            | `SkillVisibility`                                                                    | interfaces-agent-sdk-skill.md                                                                                                 |
| 公開メタデータ              | `SkillPublishingMetadata`                                                            | interfaces-agent-sdk-skill.md                                                                                                 |
| 互換性チェック結果          | `CompatibilityCheckResult`                                                           | interfaces-agent-sdk-skill.md                                                                                                 |
| 公開準備状態                | `PublishReadiness`                                                                   | interfaces-agent-sdk-skill.md                                                                                                 |
| スキルレジストリ            | `SkillRegistryService`                                                               | interfaces-agent-sdk-skill.md                                                                                                 |
| スキル配布                  | `SkillDistributionService`                                                           | interfaces-agent-sdk-skill.md                                                                                                 |
| LLMヘルスチェック結果       | `HealthCheckResult`                                                                  | llm-ipc-types.md                                                                                                              |
| LLM設定同期                 | `SetSelectedConfigParams`                                                            | llm-ipc-types.md                                                                                                              |
| RAG LLMクライアント         | `ILLMClient`（crag/types.ts 版 / llm/types.ts 版）型ドリフト→P64                     | lessons-learned-rag-embedding-runtime.md (L-RAG-06)                                                                           |
| Slide UI状態                | `SlideUIStatus` (`synced` / `running` / `degraded` / `guidance`)                     | arch-state-management-core.md                                                                                                 |
| Slide レーン分離            | `SlideLane` (`integrated` / `manual`)                                                | arch-state-management-core.md                                                                                                 |
| Slide 能力DTO               | `SlideCapabilityDTO` (laneType / modifier / agentClient / fallbackReason / guidance) | arch-state-management-core.md                                                                                                 |
| 承認ゲート                  | `IApprovalGate`, `DefaultApprovalGate`                                               | security-electron-ipc-core.md                                                                                                 |
| Consumer Auth Guard         | `isConsumerToken()` (`sess-` / `sessionKey=` prefix)                                 | security-electron-ipc-core.md                                                                                                 |
| API Key 除去                | `sanitizeForApiKeys()`                                                               | security-electron-ipc-core.md                                                                                                 |
| External API 認証タイプ     | `ExternalApiAuthType`                                                                | skillCreatorExternalApi.ts                                                                                                     |
| External API 接続設定       | `ExternalApiConnectionConfig`                                                        | skillCreatorExternalApi.ts                                                                                                     |
| External API タイムアウト   | `ExternalApiTimeoutError`                                                            | skillCreatorExternalApi.ts                                                                                                     |
| External API HTTP エラー    | `ExternalApiHttpError`                                                               | skillCreatorExternalApi.ts                                                                                                     |

---

## docs-only status sync

> `SkillExecutionStatus` / status type spec sync 系タスクで、最初に見るべき現状と前提ブロッカー。

| 項目            | 値                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| current blocker | `packages/shared/src/types/skill.ts` の `SkillExecutionStatus` は現状 6 値。Task12 は `implemented-local` 前提で、Phase 1 では実体確認が先。                                                                                                                    |
| primary refs    | `task-workflow-completed-skill-lifecycle-design.md`, `task-workflow-completed-skill-lifecycle-ui.md`, `interfaces-agent-sdk-integration.md`, `arch-state-management-core.md`, `task-workflow.md`, `lessons-learned-current-electron-menu-docs-task0912.md` |
| read order      | `resource-map.md` -> `task-workflow-completed-skill-lifecycle-design.md` -> `task-workflow-completed-skill-lifecycle-ui.md` -> `skill.ts` -> `task-workflow.md`                                                                                            |

---

## IPCチャンネル早見表

### 認証・ユーザー

| チャンネル           | 用途                             |
| -------------------- | -------------------------------- |
| `auth:get-session`   | セッション取得                   |
| `auth:sign-out`      | ログアウト                       |
| `auth-mode:get`      | 現在の認証方式取得               |
| `auth-mode:set`      | 認証方式の切替                   |
| `auth-mode:status`   | 現在 mode の資格情報状態取得     |
| `auth-mode:validate` | 対象 mode の有効性検証           |
| `auth-mode:changed`  | Main→Renderer の認証方式変更通知 |

### スキル管理

| チャンネル             | 用途           |
| ---------------------- | -------------- |
| `skill:list-available` | スキルスキャン |
| `skill:list-imported`  | インポート済み |
| `skill:execute`        | スキル実行     |
| `skill:permission`     | 権限確認       |

### スキル公開・配布

| チャンネル                             | 用途               |
| -------------------------------------- | ------------------ |
| `skill:publishing:register`            | スキル登録         |
| `skill:publishing:update`              | メタデータ更新     |
| `skill:publishing:check-compatibility` | 互換性チェック     |
| `skill:publishing:check-readiness`     | 公開準備確認       |
| `skill:publishing:publish`             | スキル公開         |
| `skill:publishing:unpublish`           | スキル非公開化     |
| `skill:publishing:get-status`          | 公開状態取得       |
| `skill:distribution:import`            | スキルインポート   |
| `skill:distribution:export`            | スキルエクスポート |
| `skill:distribution:fork`              | スキルフォーク     |
| `skill:distribution:share`             | 共有リンク生成     |

### 承認・安全ガバナンス

| チャンネル                      | 用途                               |
| ------------------------------- | ---------------------------------- |
| `approval:respond`              | Renderer→Main 承認/拒否応答送信    |
| `approval:request`              | Main→Renderer 承認要求プッシュ通知 |
| `execution:get-disclosure-info` | AI開示情報取得                     |
| `execution:get-terminal-log`    | ターミナルログ取得                 |
| `execution:get-copy-command`    | コピーコマンド取得                 |

### スキルクリエイター 外部API連携（TASK-SDK-SC-03）

| チャンネル                                     | 用途                         |
| ---------------------------------------------- | ---------------------------- |
| `skill-creator:configure-api`                  | Renderer→Main 外部API設定送信 |
| `skill-creator:api-configured`                 | Main→Renderer API設定完了通知 |
| `skill-creator:api-test-result`                | Main→Renderer API接続テスト結果 |
| `skill-creator:external-api-config-required`   | Main→Renderer API設定要求    |

### スキルクリエイター Skill Output統合（TASK-SDK-SC-04）

| チャンネル                                      | 用途                                           |
| ----------------------------------------------- | ---------------------------------------------- |
| `skill-creator:output-ready`                    | Main→Renderer スキル生成完了通知（プレビュー・上書き確認フロー） |
| `skill-creator:output-overwrite-approved`       | Renderer→Main 上書き確認承認                   |
| `skill-creator:open-skill`                      | Main→Renderer 生成スキルを開く指示             |

### チャット

| チャンネル                | 用途                           |
| ------------------------- | ------------------------------ |
| `chat:send`               | メッセージ送信                 |
| `chat:stream`             | ストリーミング                 |
| `conversation:*`          | 会話履歴管理                   |
| `llm:check-health`        | LLMヘルスチェック（primary）   |
| `llm:set-selected-config` | Renderer→Main 選択同期         |
| `AI_CHECK_CONNECTION`     | legacy接続確認（新規利用禁止） |

**詳細**: api-endpoints.md L126-736

---

### IPC契約ドリフト自動検出（UT-TASK06-007）

| 項目         | 値                                                                                                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| スクリプト   | `apps/desktop/scripts/check-ipc-contracts.ts`                                                                                                                                                                                                                              |
| テスト       | `apps/desktop/scripts/__tests__/check-ipc-contracts.test.ts`                                                                                                                                                                                                               |
| 実行         | `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --report-only`                                                                                                                                                                                                       |
| ルール       | R-01(孤児), R-02(引数不一致/P44), R-03(ハードコード/P27), R-04(未登録)                                                                                                                                                                                                     |
| 仕様         | `ipc-contract-checklist.md` / `quality-requirements.md` / `architecture-implementation-patterns-reference-ipc-drift-detection.md`                                                                                                                                          |
| 導線         | `task-workflow.md` / `task-workflow-backlog.md` / `task-workflow-completed-ipc-contract-preload-alignment.md` / `docs/30-workflows/completed-tasks/UT-TASK06-007-ipc-contract-drift-auto-detect/` / `docs/30-workflows/UT-TASK06-007-EXT-006-new-function-test-expansion/` |
| 未タスク     | EXT-001(タプル配列), EXT-002(alias/再export/動的定数), EXT-003(ipcMain.on/safeOn), EXT-004(モジュール分割), EXT-005(R-02精度向上)                                                                                                                                          |
| 完了済み拡張 | EXT-006（5関数/パターン export追加 + 20件追加テスト）                                                                                                                                                                                                                      |
| テスト       | 610件（Line 95.79% / Branch 91.55% / Function 100%）                                                                                                                                                                                                                        |
| 実行時間     | 約2.1秒（NFR-01: 10秒以内）                                                                                                                                                                                                                                                |
| 実測値       | Main 217 handlers / Preload 189 entries / Drifts 198 / Orphans 120 / `passed=false`                                                                                                                                                                                        |

#### CLI コマンド早見表

| コマンド                                                                           | 用途                              |
| ---------------------------------------------------------------------------------- | --------------------------------- |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --report-only`               | Phase 9 品質ゲート（常に exit 0） |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --format json --report-only` | CI/CD 統合（JSON出力）            |
| `pnpm tsx apps/desktop/scripts/check-ipc-contracts.ts --strict`                    | error + warning で exit 1         |

#### 検出ルール早見表

| ルール | 名称               | 重大度  | 検出パターン                                     |
| ------ | ------------------ | ------- | ------------------------------------------------ |
| R-01   | チャンネル孤児     | warning | Main/Preload の片方のみに存在                    |
| R-02   | 引数形式不一致     | error   | Main=object, Preload=primitive（P44対応）        |
| R-03   | ハードコード文字列 | warning | IPC_CHANNELS 定数でなく文字列リテラル（P27対応） |
| R-04   | 未登録チャンネル   | error   | Preload にあるが Main にない                     |

---

## ディレクトリ構成早見表

```
apps/
  desktop/
    src/
      main/           # Electron Main Process
        services/     # ビジネスロジック
        ipc/          # IPCハンドラ
        settings/     # 設定管理
      renderer/       # React UI
        store/        # Zustand
        views/        # ページ
        components/   # 共通コンポーネント
      preload/        # Preload API
  web/                # Next.js (将来)
packages/
  shared/             # 共通型・ユーティリティ
    src/types/        # 型定義
  ui/                 # UIコンポーネント
```

**詳細**: directory-structure.md

---

## エラーコード早見表

| プレフィックス | 種別             | 例                     |
| -------------- | ---------------- | ---------------------- |
| ERR_1xxx       | システムエラー   | ERR_1001 INTERNAL      |
| ERR_2xxx       | 認証・認可       | ERR_2006 UNAUTHORIZED  |
| ERR_3xxx       | バリデーション   | ERR_3001 INVALID_INPUT |
| ERR_4xxx       | ビジネスロジック | ERR_4001 NOT_FOUND     |

**詳細**: error-handling.md L8-230

---

## テスト基準早見表

| メトリクス        | 必須 | 推奨 |
| ----------------- | ---- | ---- |
| Line Coverage     | 80%  | 90%+ |
| Branch Coverage   | 75%  | 85%+ |
| Function Coverage | 90%  | 100% |

**詳細**: quality-requirements.md L94-256

---

## セキュリティチェックリスト

- [ ] 入力バリデーション（Zod）
- [ ] IPCチャンネルホワイトリスト
- [ ] XSS対策（DOMPurify）
- [ ] パストラバーサル防止
- [ ] 機密情報ログ出力禁止

**詳細**: security-implementation.md, security-api-electron.md

---

## 新機能追加フロー

1. **型定義**: `packages/shared/src/types/`
2. **サービス**: `apps/desktop/src/main/services/`
3. **IPCハンドラ**: `apps/desktop/src/main/ipc/`
4. **Preload API**: `apps/desktop/src/preload/`
5. **React Hook**: `apps/desktop/src/renderer/hooks/`
6. **UIコンポーネント**: `apps/desktop/src/renderer/components/`
7. **テスト**: 各ディレクトリの`__tests__/`

**詳細**: architecture-patterns.md L8-74

---

## 仕様書テンプレート選択

| 作成対象                  | テンプレート               |
| ------------------------- | -------------------------- |
| インターフェース/型定義   | interfaces-template.md     |
| アーキテクチャ/パターン   | architecture-template.md   |
| API/エンドポイント        | api-template.md            |
| React Hook                | react-hook-template.md     |
| UIコンポーネント          | ui-ux-template.md          |
| テスト仕様                | testing-template.md        |
| エラーハンドリング        | error-handling-template.md |
| セキュリティ              | security-template.md       |
| データベース              | database-template.md       |
| デプロイ/CI/CD            | deployment-template.md     |
| 技術スタック              | technology-template.md     |
| Claude Code               | claude-code-template.md    |
| ワークフロー              | workflow-template.md       |
| 汎用                      | spec-template.md           |

---

## 関連ドキュメント

| ドキュメント                 | 用途                      |
| ---------------------------- | ------------------------- |
| resource-map.md              | タスク種別→ファイル逆引き |
| topic-map.md                 | セクション・行番号詳細    |
| spec-guidelines.md           | 仕様書作成ルール          |
| spec-splitting-guidelines.md | ファイル分割ルール        |

---

### Approval Request Surface (UT-SDK-07)
| 観点 | 参照先 |
| --- | --- |
| IPC surface (onApprovalRequest) | `references/api-ipc-system-core.md` → `onApprovalRequest` セクション |
| ApprovalRequestPayload shared type | `references/interfaces-agent-sdk-skill-reference.md` |
| UI コンポーネント (ApprovalRequestPanel) | `references/arch-ui-components.md` |

### Path-Scoped Governance Enforcement (TASK-P0-09-U1)
| 観点 | 参照先 |
| --- | --- |
| canUseTool path-scoped 判定 | `references/arch-state-management-core.md` → governance セクション |
| extractTargetPath / allowedSkillRoot | `references/api-ipc-system-core.md` |
| SafetyGovernance Production Integration | `references/arch-state-management-core.md` |

---

### Cloudflare デプロイ・本番運用

| 目的 | 参照先 |
| --- | --- |
| デプロイ戦略・全体像 | `references/deployment-core.md` |
| Cloudflare セットアップ手順 | `references/deployment-cloudflare.md` |
| モニタリング・チェックリスト | `references/deployment-details.md` |
| ブランチ戦略（feature→dev→main） | `references/deployment-branch-strategy.md` |
| シークレット管理（CF/GitHub） | `references/deployment-secrets-management.md` |
| UT-27 GitHub Secrets / Variables 配置決定マトリクス | `references/deployment-gha.md`（UT-27 章）|
| `CLOUDFLARE_ACCOUNT_ID` 参照規約 | GitHub Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` を使う（Secret ではない） |
| UT-27 1Password 正本→GitHub 派生コピー同期パターン（`op read` + 一時環境変数 + `unset` + Last-Updated メモ） | `references/deployment-secrets-management.md`（UT-27 章）|
| UT-27 `if: secrets.X != ''` 無音失敗の env 受け shell 判定回避 / 同名併存禁止 / API Token 最小スコープ + 命名規則 / rollback 3 経路 | `references/deployment-gha.md` + `references/deployment-secrets-management.md` + `lessons-learned/lessons-learned-ut-27-github-secrets-variables-2026-04.md`（L-UT27-001〜006）|
| インテグレーションパッケージ設計 | `references/arch-integration-packages.md` |

### 無料枠 / コストガードレール参照時（05a-parallel-observability-and-cost-guardrails）

| 目的 | 参照先 |
| --- | --- |
| Cloudflare 無料枠数値（Pages / Workers / D1 / KV / R2） | `references/deployment-cloudflare.md` |
| GitHub Actions minutes（public/private 区別） | `references/deployment-gha.md` |
| デプロイ品質ゲート / rollback 手順 | `references/deployment-core.md` |
| secret 配置（Cloudflare / GitHub / 1Password） | `references/environment-variables.md` |
| 観測対象一覧・閾値（warning / action） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` |
| 閾値別対処・degrade / rollback runbook | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` |
| 月次・週次の手動 ops チェックリスト | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-11/manual-ops-checklist.md` |
| 運用ガイド（同 wave 05b への handoff） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/operations-guide.md` |
| CI/CD workflow識別子 mapping（対象5 workflow sync） | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md`（作業証跡: `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/outputs/phase-12/main.md`） |

### UBM-Hyogo D1 Schema / Repository 早見（01a / 02a current）

| 観点 | 値 / 参照先 |
| --- | --- |
| 01a canonical task root | `docs/30-workflows/01a-parallel-d1-database-schema-migrations-and-tag-seed/` |
| 02a canonical task root | `docs/30-workflows/02a-parallel-member-identity-status-and-response-repository/` |
| legacy 03-serial contract | `member_responses` / `member_identities` / `member_status` / `sync_audit` は旧4テーブル契約として参照。01a以降の物理実装では20テーブル構成を正とする |
| 02a repository root | `apps/api/src/repository/` |
| 02a repository tables | `member_identities` / `member_status` / `member_responses` / `response_sections` / `response_fields` / `member_field_visibility` / `member_tags` / `tag_definitions` / `deleted_members` |
| UT-02A tag assignment queue write workflow | `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/`（implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval） |
| UT-02A formal stub | `docs/30-workflows/unassigned-task/UT-02A-TAG-ASSIGNMENT-QUEUE-MANAGEMENT.md` |
| D1 interface | `D1Db` / `D1Stmt` / `DbCtx` を `apps/api/src/repository/_shared/db.ts` で定義し、テスト時は `@cloudflare/workers-types` に依存しない |
| View assembler | `buildPublicMemberProfile` / `buildMemberProfile` / `buildAdminMemberDetailView` / `buildPublicMemberListItems` |
| Public list reads | `listMembersByIds` + `listStatusesByMemberIds` + `listResponsesByIds` によるバッチ読み取り |
| visibility default | 未設定時は privacy first で `member` |
| admin notes | `AdminMemberDetailView` へ引数で渡す。public/member view model には混ぜない |
| DB 名（staging） | `ubm-hyogo-db-staging`（`apps/api/wrangler.toml` `[env.staging]`） |
| DB 名（production） | `ubm-hyogo-db-prod`（`apps/api/wrangler.toml` top-level production） |
| binding 経由アクセス | `apps/api` のみ（`apps/web` から直接アクセス禁止） |

### UBM-Hyogo Attendance Profile Integration 早見（UT-02A follow-up / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-02a-attendance-profile-integration/` |
| 状態 | implemented / Phase 1-12 completed / Phase 13 pending_user_approval / NON_VISUAL |
| legacy stub | `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` |
| 実装 root | `apps/api/src/repository/attendance.ts` + `apps/api/src/repository/_shared/builder.ts` attendance provider injection |
| interface boundary | `MemberProfile.attendance: AttendanceRecord[]` は 02a 確定契約として変更しない |
| runtime evidence | `outputs/phase-11/evidence/api-curl/*` and `outputs/phase-11/evidence/ui-smoke/*`（NON_VISUAL local evidence captured） |
| read path | `createAttendanceProvider(ctx).findByMemberIds()` が `member_attendance` と `meeting_sessions` を `session_id` で INNER JOIN。80-id chunk、`held_on DESC` + `session_id ASC`、session 不在 row 除外、同一 session 重複正規化 |
| 直交タスク | 09a staging smoke / 09b release runbook / 09c production deploy / 06b visual evidence / U-UT01-08 enum canonicalization は本 workflow で代替しない |

### Issue #372 Attendance Pagination 早見（implemented-local / 2026-05-07）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-372-attendance-pagination/` |
| 状態 | implemented-local / implementation / VISUAL / Phase 11 visual evidence pending / Phase 13 pending_user_approval |
| source | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md` |
| repository | `apps/api/src/repository/attendance.ts` (`findByMemberId(id, { limit, cursor })`) |
| routes | `/me/attendance`, `/admin/members/:memberId/attendance` |
| shared contract | `MemberProfile.attendance` は配列維持、`attendanceMeta?: { hasMore, nextCursor }` を optional 追加 |
| web targets | `apps/web/app/(member)/profile/_components/AttendanceList.tsx`, `apps/web/src/components/admin/MemberDrawer.tsx` |
| scope boundary | `findByMemberIds(ids)` bulk pagination は明示スコープ外。未タスク化しない |
| evidence | local focused tests + Phase 12 strict files: `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/`; staging screenshots/curl remain Phase 11 pending |
| lessons-learned | `references/lessons-learned-issue-372-attendance-pagination-2026-05.md`（L-ISSUE372-001〜006: cursor encoded/decoded 境界 / bulk と個人特化 API 分離 / `attendanceMeta` optional 追加 / miniflare EADDRNOTAVAIL focused run / 1Password CLI timeout 切り分け / Phase 11 visual evidence pending を spec sync の blocker にしない） |

### Issue #531 AttendanceProvider Runtime Smoke 早見（spec_created / 2026-05-07）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/` |
| 状態 | spec_created / implementation / NON_VISUAL / runtime evidence pending_user_credentials |
| purpose | issue-371 の `c.var.attendanceProvider` middleware DI 移行を Cloudflare staging Worker で read-only smoke する。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` |
| smoke script | `scripts/smoke/runtime-attendance-provider.sh` |
| evidence boundary | persistent evidence は summary-only（status / jq contract / count or type）。raw body は `mktemp` + `trap`、保存禁止 |
| route contract | `/admin/members` = `.members[]`, `/admin/members/:memberId` = `.attendance[]`, `/admin/members/:memberId/attendance` = `.records[]`, `/me/` = `.user.memberId`, `/me/profile` = `.profile.attendance[]`, `/me/attendance` = `.records[]` |
| boundary | POST self-request routes are inventory-only because they write staging queue state; production smoke remains forbidden |

### UBM-Hyogo Attendance Write Operations Close-out（UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/ut-02a-followup-001-attendance-write-operations/` |
| 状態 | implemented-local / resolved-by-existing-06cE-07c / implementation / NON_VISUAL |
| source unassigned | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/task-ut-02a-attendance-write-operations-001.md`（解消済み） |
| repository write | `apps/api/src/repository/attendance.ts` (`addAttendance` / `removeAttendance`) |
| canonical route | `POST /admin/meetings/:sessionId/attendances` |
| legacy routes | `POST /admin/meetings/:sessionId/attendance`, `DELETE /admin/meetings/:sessionId/attendance/:memberId` |

### UBM-Hyogo Attendance Provider Context Migration（Issue #371 / UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` |
| 状態 | implemented-local / implementation / NON_VISUAL / code evidence captured / runtime smoke pending / Issue #371 CLOSED |
| source stub | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md`（transferred） |
| target contract | `buildMemberProfile(c, mid)` / `buildAdminMemberDetailView(c, mid, adminNotes)` に縮小し、provider は `c.var.attendanceProvider` から解決 |
| type boundary | 既存 `DbCtx` (`readonly db`) は変更せず、attendance builder だけ `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }` を要求 |
| evidence boundary | Phase 11 は `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。typecheck / lint / test / build / grep gate logs captured、runtime smoke は下流 gate |
| error boundary | duplicate=409, deleted member=422, session/member not found=404 |
| design decision | 新規 `AttendanceWriter` / `AttendanceRecordId` は導入しない |

### UBM-Hyogo Attendance Dashboard Analytics（UT-02A follow-up / 2026-05-06）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-02a-followup-002-attendance-dashboard-analytics/` |
| 状態 | implemented-local / implementation / VISUAL_ON_EXECUTION / local tests passed / runtime curl and UI screenshot pending |
| source issue | Issue #370（CLOSED 維持、PR は `Refs #370`） |
| repository aggregate | `apps/api/src/repository/attendance.ts` 末尾に `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` を実装済み |
| route | 既存 `apps/api/src/routes/admin/dashboard.ts` を拡張し `/admin/dashboard/attendance/{overview,by-session,ranking}` を実装済み |
| web UI | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` |
| proxy | 既存 `apps/web/app/api/admin/[...path]/route.ts` を再利用。attendance 専用 proxy は作らない |
| schema boundary | `meeting_sessions.session_id` が PK。`meeting_sessions.id` は使用禁止 |
| index policy | 新規は `idx_member_attendance_member` 1 本。既存 `idx_member_attendance_session` / `idx_meeting_sessions_active_held_on` を流用 |
| evidence boundary | repository / route / EXPLAIN Vitest は local PASS。runtime curl / browser screenshot は user-approved capture cycle まで pending |

### UBM-Hyogo DevEx Conflict Prevention Spec Wave（2026-04-28）

| 順序 | canonical task root | 状態 |
| --- | --- | --- |
| 1 | `docs/30-workflows/task-conflict-prevention-skill-state-redesign/` | spec_created / docs-only / NON_VISUAL |
| 2 | `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/` | spec_created / docs-only / NON_VISUAL |
| 3 | `docs/30-workflows/task-worktree-environment-isolation/` | spec_created / docs-only / NON_VISUAL |
| 4 | `docs/30-workflows/task-github-governance-branch-protection/` | spec_created / docs-only / NON_VISUAL |
| 5 | `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` | Phase 1-12 completed / NON_VISUAL / CODEOWNERS current applied |
| 6 | `docs/30-workflows/task-claude-code-permissions-decisive-mode/` | spec_created / docs-only / NON_VISUAL |

横断順序: skill ledger 再設計 → Git hook 再生成停止 → worktree 分離 → GitHub governance → Claude Code permissions。

### モニタリング/アラート 早見（UT-08 monitoring-alert-design）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow root | `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/` |
| 派生実装タスク | `docs/30-workflows/unassigned-task/UT-08-IMPL-monitoring-alert-implementation.md` |
| WAE binding / dataset | `MONITORING_AE` / `ubm_hyogo_monitoring` |
| 主要イベント | `api.request` / `api.error` / `d1.query.fail` / `cron.sync.start` / `cron.sync.end` |
| 通知 | Slack Webhook + Email fallback（30 分 dedupe / 5 件以上 summary） |
| 外部監視 | UptimeRobot 無料プラン（5 分間隔） |
| SSOT 参照 | `references/workflow-ut08-monitoring-alert-design-artifact-inventory.md` |
| 苦戦箇所と知見 | `references/lessons-learned-ut08-monitoring-design-2026-04.md` |

### UBM-Hyogo D1 Repository 早見（02b: meeting/tag queue + schema diff repository）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/02b-parallel-meeting-tag-queue-and-schema-diff-repository/` |
| 実装パス | `apps/api/src/repository/`（attendance / meetings / schemaDiffQueue / schemaQuestions / schemaVersions / tagDefinitions / tagQueue + `_shared/`） |
| schema diff queue 未解決 status 正本 | `'queued'`（`pending` / `unresolved` / `open` 等は不可。不変条件 #14） |
| `schemaVersions.getLatestVersion()` | `ORDER BY synced_at DESC` で確定（不変条件 #15） |
| tag 書き込み境界 | `tag_assignment_queue` への enqueue/resolve のみ。`tag_definitions` は read-only マスタ（不変条件 #13）。UT-02A は enqueue 側（`idempotency_key=<memberId>:<responseId>`, retry max=3 / backoff `30s × 2^(attempt-1)`, partial unique index `WHERE idempotency_key IS NOT NULL`, `dlq` status terminal）、07a は resolve 側 |
| UT-02A 早見 | canonical: `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/`、migration: `apps/api/migrations/0009_tag_queue_idempotency_retry.sql`、repository: `apps/api/src/repository/tagQueue.ts`（既存規約 `repository/` 単数形・`tagQueue.ts` 短縮名を優先 / spec の `repositories/tagAssignmentQueue.ts` 表記とは差分あり）、type-level read-only test: `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`、苦戦知見: `references/lessons-learned-ut-02a-tag-assignment-queue-2026-05.md`（L-UT02A-001〜007） |
| issue #377 retry tick | `apps/api/src/workflows/tagQueueRetryTick.ts` / `TAG_QUEUE_TICK_CRON="*/5 * * * *"`。retry 対象は `reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL` のいずれか。plain human-review `queued` は skip。default scheduled path でも `incrementRetryWithDlqAudit` を呼び、DLQ 移送時は `admin.tag.queue_dlq_moved` audit (`target_type='tag_queue'`) を D1 batch で同時記録 |
| issue #378 pause flag | `TAG_QUEUE_PAUSED` は non-secret Cloudflare variable。`"true"` 完全一致のみ Forms sync candidate enqueue を停止し、`has_tags` / `has_pending_candidate` / `paused` reason contract を維持する。runbook: `docs/30-workflows/runbooks/tag-queue-pause.md`、workflow: `docs/30-workflows/completed-tasks/issue-378-tag-queue-paused-flag/`、inventory: `references/workflow-issue-378-tag-queue-paused-flag-artifact-inventory.md`、苦戦知見: `lessons-learned/lessons-learned-issue-378-tag-queue-paused-flag-2026-05.md`（L-378-001〜004） |
| Issue #408 Cloudflare audit-log monitoring | canonical: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`。secret は `CF_AUDIT_TOKEN_PROD` (`Account > Audit Logs:Read` only) で deploy 用 `CLOUDFLARE_API_TOKEN` と分離。alert labels は HIGH=`priority:high` / MEDIUM=`priority:medium` / LOW=`priority:low` + `type:security`。runtime コード (`scripts/cf-audit-log/{fetch,analyze,baseline}.ts` / migration `0014_create_cf_audit_log.sql` / 2 workflows: `cf-audit-log-monitor.yml` `0 * * * *` + `cf-audit-log-monitor-watchdog.yml` `15 * * * *` `WATCHDOG_STALE_MINUTES=90`) は merge 済。Token 発行・1Password 登録・GitHub Secret 登録・D1 apply・7 日 baseline は manual runbook (`outputs/phase-5/secrets-registration.md`)。Phase 11 placeholder = `IMPLEMENTED_LOCAL_RUNTIME_PENDING`。D1 schema: `references/database-schema-cf-audit-log.md` (`cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe`、apps/api runtime read-only)。苦戦知見: `references/lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md`（L-ISSUE408-001〜007: cursor pagination + INSERT OR IGNORE / Account scope / WranglerD1 quoting / fetch 直接呼び / rotation window env / TTL purge in analyze.ts / 監視・deploy token 分離）。followup 3 件: FU-02 cold-storage / FU-03 ml-anomaly / FU-04 github-audit-merge |
| Issue #546 Cloudflare audit-log 90 day baseline observation | canonical: `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/`。status は `observation_continue / docs-only / NON_VISUAL / Gate-A FAIL / Gate-B-C pending`。2026-05-08 evidence: monitor 32 runs and watchdog 32 runs from 2026-05-06〜2026-05-07 are all failure; monitor evidence is normalized to a JSON array; `cf-audit` issue label count 0; production D1 read-only query returned `no such table: cf_audit_log`; baseline thresholds and monthly tuning minutes log are pending. Issue #546 remains CLOSED and PR text must use `Refs #546` only. ML comparison / production switch is not unlocked by this evidence; earliest 90 day re-check is after 2026-08-05 if successful hourly runs begin on 2026-05-08. Reminder: `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`; inventory: `references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`; lessons: `references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`. |
| Issue #514 Cloudflare audit-log cold storage / R2 export | canonical: `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`。status は `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`。daily `0 2 * * *` で `[now - 29d, now - 26d)` を export、manifest `cf_audit_log_export_manifest` は `(yyyy, mm, dd)` UNIQUE + `pending -> completed/failed` + `r2_etag`。R2 binding は `UBM_AUDIT_COLD_STORAGE`、Secret は `CF_AUDIT_R2_TOKEN_PROD`。G1 R2/bucket/secret/deploy -> G2 D1 migration apply -> G3-prod first daily export + restore drill -> G4 commit/push/PR。Issue #514 CLOSED のため PR 文脈は `Refs #514` のみ。苦戦知見: `references/lessons-learned-issue-514-cf-audit-logs-cold-storage-r2-export-2026-05.md`（L-ISSUE514-001..007: artifacts mirror parity / Phase 11 10 screenshots, Phase 12 strict 7 outputs / `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 語彙 / G1-G4 gate sequence / monthly→daily cadence 補正 / source schema 整合 + r2_etag / 6-category redaction guard） |
| Issue #315 application audit_log cold storage / R2 export | canonical: `docs/30-workflows/issue-315-audit-log-application-cold-storage/`。status は `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。manifest `audit_log_export_manifest` は `(yyyy, mm, dd)` UNIQUE + `pending -> completed/failed` + `r2_etag` / `sha256`。R2 binding は `UBM_AUDIT_APP_COLD_STORAGE`。production D1 apply / R2 Object Lock bucket create / deploy / non-dry-run export / restore drill / commit / push / PR は user-gated。 |
| Issue #408 / #518 Cloudflare audit-log monitoring | canonical: `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`、HOLD spec: `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/`、manual runbook: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`。secret は `CF_AUDIT_TOKEN_PROD` (`Account > Audit Logs:Read` only) で deploy 用 `CLOUDFLARE_API_TOKEN` と分離。Issue #518 により runtime は HOLD / manual-check-only: `cf-audit-log-monitor.yml` は schedule 削除 + `workflow_dispatch` のみ + `dry_run=true` 既定、`cf-audit-log-monitor-watchdog.yml` は削除。runtime コード (`scripts/cf-audit-log/{fetch,analyze,baseline}.ts` / migration `0014_create_cf_audit_log.sql`) と D1 schema は保持。自動 alert labels は HIGH=`priority:high` / MEDIUM=`priority:medium` / LOW=`priority:low` + `type:security` だが HOLD 中は公開 Issue 自動起票を既定無効。D1 schema: `references/database-schema-cf-audit-log.md` (`cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe`、apps/api runtime read-only)。苦戦知見: `references/lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md`。followup 3 件: FU-02 cold-storage / FU-03 ml-anomaly / FU-04 github-audit-merge |
| `tag_definitions` カテゴリ | 6 カテゴリ single source（41 行 seed） |
| fake D1 テストパターン | `apps/api/src/repository/_shared/__fakes__/fakeD1.ts`（in-memory pattern-matching SQL） |
| Issue #379 current verification | `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/`。旧 `schemaDiffQueue.test.ts` list 系 2 fail は 2026-05-05 focused Vitest 7/7 PASS で stale 扱い。fakeD1 parser 拡張 / seed edit / SQL rewrite は未実施 |
| 状態遷移系 repository の必須設計 | Phase 2 で **ALLOWED 表**（from→to の許可遷移行列）を提示 |
| 苦戦知見 | `references/lessons-learned-02b-schema-diff-and-tag-queue.md` (L-02B-001〜005) |
| 02b 由来未タスク | `docs/30-workflows/unassigned-task/02b-followup-00{1,2,3}-*.md` |
| free tier 実測（02b 単体） | reads 0.24% / writes 0.11% |

### UBM-Hyogo Schema Sync 早見（03a-parallel-forms-schema-sync-and-stablekey-alias-queue / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/` |
| 手動 entry point | `POST /admin/sync/schema`（Bearer `SYNC_ADMIN_TOKEN` 必須 / 200 success / 401 missing or invalid token / 403 forbidden / 409 already running / 500 internal）。詳細: `references/api-endpoints.md` |
| 自動実行 cron | `0 18 * * *` UTC = 03:00 JST schema sync（`apps/api/wrangler.toml` `[triggers] crons`）。詳細: `references/deployment-details.md` |
| 関連 D1 tables | `schema_versions` / `schema_questions` / `schema_diff_queue` / `sync_jobs`（詳細: `references/database-implementation-core.md`） |
| `schema_diff_queue.unresolved` 型 | 不変条件 #14 に従い `'queued'`（本タスクは登録だけを担当、解決は 07b に委譲） |
| 関連 env vars | `SYNC_ADMIN_TOKEN` / `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`（詳細: `references/environment-variables.md`） |
| 実装モジュール | `apps/api/src/sync/schema/` / `apps/api/src/middleware/admin-gate.ts` / `apps/api/src/routes/admin/sync-schema.ts` |
| 苦戦知見 | `references/lessons-learned-03a-parallel-forms-schema-sync.md`（L-03a-001〜005） |

### 03a stableKey Literal Lint Enforcement 早見（2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` |
| 状態 | `enforced_dry_run` / warning mode / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval |
| 実装 | `scripts/lint-stablekey-literal.mjs` + `package.json` `lint:stablekey` / `lint:stablekey:strict` |
| allow-list | `packages/shared/src/zod/field.ts`, `packages/integrations/google/src/forms/mapper.ts` |
| strict blocker | legacy literal blocker resolved by `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/` (`strict_ready`, 0 violation). `fully enforced` は strict CI gate 後 |
| follow-up | `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` |
| inventory | `references/workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md` |

### UBM-Hyogo Admin Backoffice API 早見（04c / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/` |
| API master | `references/api-endpoints.md`（管理バックオフィス API） |
| 実装 root | `apps/api/src/routes/admin/` |
| dashboard repository | `apps/api/src/repository/dashboard.ts` |
| 認可境界 | 04c は `SYNC_ADMIN_TOKEN` Bearer gate。05a で Auth.js + `admin_users` active 判定へ差し替える |
| 不在 endpoint | `PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags` は作らない |
| tag 書き込み境界 | `POST /admin/tags/queue/:queueId/resolve` のみ |
| schema 書き込み境界 | `/admin/schema/*` のみに集約 |
| attendance error | duplicate は `409`、deleted member は `422`、session not found は `404` |
| phase 11 判定 | API-only / NON_VISUAL。スクリーンショット対象外、curl smoke 手順と Vitest を証跡にする |

### UBM-Hyogo Admin Tag Queue Resolve Contract（UT-07A-02 / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/` |
| shared schema SSOT | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` |
| body type | `{ action: "confirmed"; tagCodes: string[] } | { action: "rejected"; reason: string }` |
| mixed body | 400 `validation_error`（strict discriminated union） |
| API consumer | `apps/api/src/routes/admin/tags-queue.ts` |
| web consumer | `apps/web/src/lib/admin/api.ts` の `resolveTagQueue(queueId, body)` |
| focused evidence | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/workflows/tagQueueResolve.test.ts apps/api/src/schemas/tagQueueResolve.test.ts` |
| handoff | UT-07A-03 staging smoke with real admin auth / deployed Worker |

### UBM-Hyogo Issue #295 Tag Queue Race Smoke（2026-05-15）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_pending` |
| smoke runner | `scripts/smoke/tag-queue-race.mjs` |
| focused test | `bash scripts/smoke/__tests__/tag-queue-race.test.sh` |
| D1 fixture columns | `tag_assignment_queue.queue_id`, `response_id`, `suggested_tags_json` |
| audit check | `audit_log.target_type='tag_queue' AND target_id=$QUEUE_ID` |
| source task | `UT-07A-03` consumed by Issue #295 workflow |

### step-05 dashboard chart implementation（2026-05-18）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/step-05-dashboard-chart-implementation/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / implementation_complete_pending_pr` |
| implementation | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` |
| test | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` |
| contract | `GET /admin/dashboard` returns optional `byStatus`; populated 時は SVG bar chart + chip list、legacy/未提供時は existing placeholder |
| boundary | authenticated runtime screenshots / commit / push / PR are user-gated |

### issue-819 admin dashboard runtime screenshot（2026-05-20）

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-819-admin-dashboard-runtime-screenshot/` |
| state | `spec_created / implementation / VISUAL_ON_EXECUTION / runtime_pending` |
| source issue | `#819` closed 維持。PR 文脈は `Refs #819` のみ |
| source unassigned | `docs/30-workflows/unassigned-task/step-05-followup-001-admin-dashboard-runtime-screenshot-capture.md` |
| purpose | step-05 の dummy 16x16 PNG 2 件を authenticated admin runtime screenshot に置換し、親 workflow evidence を `runtime_completed` に進める |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-819-admin-dashboard-runtime-screenshot-artifact-inventory.md` |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-runtime-screenshot-evidence-replacement-2026-05.md`（L-RSE-001..005） |
| boundary | screenshot capture / parent PNG replacement / source consumed update / commit / push / PR are user-gated |

### UBM-Hyogo Admin UI 早見（06c / 2026-04-29）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/` |
| 実装 root | `apps/web/app/(admin)/admin/`, `apps/web/src/components/admin/`, `apps/web/src/lib/admin/` |
| admin layout | `apps/web/app/(admin)/layout.tsx` (`getSession` + `isAdmin` gate + `AdminSidebar`) |
| API proxy | `apps/web/app/api/admin/[...path]/route.ts`（client mutation -> apps/api、secret 注入） |
| 5画面 | `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` |
| 不変条件 | profile本文編集なし / tag直接編集なし / schema解消は`/admin/schema`のみ / deleted attendance除外 / duplicate attendance disabled |
| 検証 | `@ubm-hyogo/web` typecheck PASS、Vitest 7 files / 36 tests PASS。スクリーンショットは D1 fixture / staging admin 前提のため 08b/09a に委譲 |
| UI/UX 詳細 | `references/ui-ux-admin-dashboard.md`（5画面のレイアウト/状態遷移/不変条件/エラー文言） |
| API client 詳細 | `references/architecture-admin-api-client.md`（Server Component `fetchAdmin` / client mutation helper / proxy / 認可境界） |
| 教訓 | `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-001〜005） |

### UBM-Hyogo Admin Meetings Remaining（06c-E / 2026-05-04）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-E-admin-meetings/` |
| 状態 | `implemented-local / implementation / remaining-only / VISUAL_ON_EXECUTION` |
| API | `PATCH /admin/meetings/:id`, `POST /admin/meetings/:id/attendances`, `GET /admin/meetings/:id/export.csv` |
| DB | `meeting_sessions.deleted_at`, `member_attendance` |
| Web | `MeetingPanel` edit details / soft delete / CSV link |
| Evidence | API meetings 15 PASS / MeetingPanel 17 PASS; visual runtime evidence deferred to 08b / 09a |

### UBM-Hyogo Admin Tags Remaining Spec（06c-C / 2026-05-03）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-C-admin-tags/` |
| 状態 | `implemented-local / implementation / runtime evidence pending_user_approval / docs-only / remaining-only / VISUAL_ON_EXECUTION` |
| 正本境界 | `/admin/tags` は未タグ会員キュー。タグ辞書 CRUD / alias editor / `member_tags` 直接編集 UI/API は作らない |
| API 正本 | `GET /admin/tags/queue`, `POST /admin/tags/queue/:queueId/resolve` |
| schema 正本 | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` の `tagQueueResolveBodySchema` |
| audit | `admin.tag.queue_resolved`, `admin.tag.queue_rejected` |
| evidence | Phase 12 strict outputs present。runtime visual evidence は 08b / 09a に委譲 |

### UBM-Hyogo Admin Dashboard Follow-up 早見（06c-A / 2026-05-02）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/06c-A-admin-dashboard/` |
| 状態 | `implemented-local` / docs-only / remaining-only / `VISUAL_ON_EXECUTION` / outputs contract only |
| endpoint | apps/api は `GET /admin/dashboard`、apps/web は proxy 経由 `GET /api/admin/dashboard`（split `/kpi` / `/recent-actions` は不採用） |
| KPI | `総会員数 / 公開中人数 / 未タグ人数 / スキーマ未解決件数` |
| recent actions | `audit_log` 直近7日 / max20 / `dashboard.view` 除外 |
| audit | dashboard read は `dashboard.view` として記録し、recent actions と KPI を自己汚染しない |
| Phase 12 evidence | `docs/30-workflows/06c-A-admin-dashboard/outputs/phase-12/phase12-task-spec-compliance-check.md` |

### UBM-Hyogo Playwright Full Execution 早見（08b-A / 2026-05-04）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/` |
| 状態 | `implemented-local` / `implementation-spec` / `VISUAL_ON_EXECUTION` / Phase 1-10 and 12 completed / Phase 11 contract_ready_user-gated runtime evidence boundary / Phase 13 pending_user_approval |
| 実測境界 | Phase 11 runtime evidence is `PENDING_RUNTIME_EVIDENCE`; implemented-local paths are not PASS evidence |
| evidence manifest | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-11/evidence-manifest.md` |
| required runtime evidence | Playwright HTML/JSON report、real axe report、30+ desktop/mobile screenshots、non-admin `/admin/*` UI gate、direct `/api/admin/*` 403、foreign content edit 403、secret hygiene、zero skipped spec inventory |
| Phase 12 evidence | `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| upstream | `08b-parallel-playwright-e2e-and-ui-acceptance-smoke` scaffold |
| downstream | 09a staging smoke and 09c production deploy remain gated until fresh runtime evidence or explicit blocker |

### UBM-Hyogo Staging Smoke / Forms Sync Validation 早見（09a / 2026-05-01）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`（現 worktree では不在。復元 blocker は `task-09a-canonical-directory-restoration-001.md`） |
| 状態 | `implemented-local` / implementation execution spec / `VISUAL_ON_EXECUTION` / Phase 13 blocked until user approval |
| 実測境界 | Phase 11 の `manual-smoke-log.md` / `sync-jobs-staging.json` / `wrangler-tail.log` は現状 `NOT_EXECUTED` placeholder。実測 PASS として扱わない |
| consumes | 05a OAuth/admin gate、06a public web、06b login/profile、06c admin UI、08b Playwright scaffold、03a/03b/U-04 Forms sync |
| blocks | 09c production deploy。09a の実 staging evidence 完了まで GO 判定不可 |
| follow-up | `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` |
| execution workflow | `docs/30-workflows/ut-09a-exec-staging-smoke-001/`（implemented_local_user-gated runtime evidence boundary / implementation / VISUAL_ON_EXECUTION。2026-05-02 user 明示指示後に Phase 11 を試行し、`cloudflare_unauthenticated + 09a_directory_missing` で `EXECUTED_BLOCKED`） |
| execution blockers | `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md`, `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md` |
| artifact inventory | `references/workflow-task-09a-parallel-staging-deploy-smoke-and-forms-sync-validation-artifact-inventory.md` |
| 苦戦知見 | `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md`（L-09A-001〜005） |

### skill-ledger 4 施策（task-conflict-prevention-skill-state-redesign）

> 本ファイル 500 行超過のため詳細は分離。`indexes/quick-reference-search-patterns-skill-ledger.md` を参照。

| キーワード | 1 行誘導 |
| --- | --- |
| `skill-ledger`, `4施策`, `A-1/A-2/A-3/B-1` | `references/skill-ledger-overview.md` |
| `fragment`, `escapedBranch`, `nonce`, `render-api` | `references/skill-ledger-fragment-spec.md` |
| `gitignore`, `keywords.json` 自動生成 | `references/skill-ledger-gitignore-policy.md` |
| `progressive-disclosure`, `200 行ガード` | `references/skill-ledger-progressive-disclosure.md` |
| `merge=union`, `_legacy.md` | `references/skill-ledger-gitattributes-policy.md` |
| 苦戦箇所 (L-SLR-001〜009) | `references/lessons-learned-skill-ledger-redesign-2026-04.md` |
| 全クエリ早見 | `indexes/quick-reference-search-patterns-skill-ledger.md` |
| A-2 fragment 経路（2026-04-28〜） | canonical: `LOGS/<fragment>.md` / `changelog/<fragment>.md` / `lessons-learned/<fragment>.md`（旧 `LOGS.md` / `SKILL-changelog.md` / `references/lessons-learned-*.md` は `_legacy*.md` に退避済み・履歴参照のみ） |
| fragment append / render | `pnpm skill:logs:append` / `pnpm skill:logs:render`（writer は `scripts/skill-logs-append.ts` に一本化。直接 fragment を手書きしない） |
| fragment 命名 | `<YYYYMMDD-HHMMSS>-<escapedBranch>-<nonce>.md`（`scripts/lib/branch-escape.ts` で escapedBranch 生成、衝突時は `scripts/lib/retry-on-collision.ts` で nonce 再生成） |
| T-6 hook 冪等化 / 4 worktree smoke 仕様 | `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/index.md`（AC-1〜AC-11 / 2 worktree 事前 smoke → 4 worktree full smoke 二段構え / 部分 JSON リカバリ / `wait $PID` 個別集約）。実装は `docs/30-workflows/unassigned-task/task-skill-ledger-t6-implementation.md` |

### Git Hook 統一・post-merge indexes 再生成廃止 早見（task-git-hooks-lefthook-and-post-merge / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/` |
| Git hook 正本 | `lefthook.yml`（root） / `.git/hooks/*` は派生物 |
| pre-commit 正本 | `scripts/hooks/staged-task-dir-guard.sh`（branch slug と staged task-dir の整合チェック） |
| post-merge 正本 | `scripts/hooks/stale-worktree-notice.sh post-merge`（read-only 通知のみ・自動再生成なし） |
| post-fetch | lefthook supported hook に未含のため lane 化しない（M-04 / P0-01 由来） |
| 自動配置 | `package.json` `"prepare": "lefthook install"`（`pnpm install` 連動） |
| indexes 再生成 | 明示コマンド `pnpm indexes:rebuild`（post-merge から廃止） |
| drift gate | `.github/workflows/verify-indexes.yml`（job/check 名: `verify-indexes-up-to-date`。`pnpm indexes:rebuild` 後 `git diff --exit-code` で `.claude/skills/aiworkflow-requirements/indexes` drift を検出） |
| 仕様正本 | `references/technology-devops-core.md`（§Git hook 運用正本 L351-365） |
| 苦戦知見 | `references/lessons-learned-lefthook-unification-2026-04.md`（L-LH-001〜L-LH-005） |
| 運用ガイド | `doc/00-getting-started-manual/lefthook-operations.md` / `CLAUDE.md`（Git hook の方針節） |
| 関連 baseline 未タスク | `husky` 不採用判断の ADR 化は 2026-04-28 に [`doc/decisions/0001-git-hook-tool-selection.md`](../../../../doc/decisions/0001-git-hook-tool-selection.md) として resolved / 後続: [`task-adr-template-standardization`](../../../../docs/30-workflows/unassigned-task/task-adr-template-standardization.md), [`task-lefthook-ops-adr-backlink`](../../../../docs/30-workflows/unassigned-task/task-lefthook-ops-adr-backlink.md)（既存 worktree への一括再 install runbook は task-lefthook-multi-worktree-reinstall-runbook で formalize 済み） |

### Multi-Worktree Lefthook Reinstall Runbook 早見（task-lefthook-multi-worktree-reinstall-runbook / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` |
| 派生元 baseline | `task-git-hooks-lefthook-and-post-merge`（B-1 を formalize） |
| 並列禁止理由 | pnpm content-addressable store の競合（worktree 横断で共有） |
| 対象抽出 | `git worktree list --porcelain` から `prunable` を除外（detached HEAD は対象に含める） |
| 実コマンド | `mise exec -- pnpm install --prefer-offline` → `mise exec -- pnpm exec lefthook version` を逐次 |
| 旧 hook 検出 | `.git/hooks/post-merge` の `LEFTHOOK` sentinel 不在を STALE 扱い（手動削除のみ・自動削除しない） |
| バイナリ不一致 | 一次対処 `pnpm rebuild lefthook` / 二次対処 `pnpm install --force`（Apple Silicon ケア） |
| べき等性 | 公式仕様で再実行可・失敗 worktree から再開可 |
| 運用ログ | `outputs/phase-11/manual-smoke-log.md`（Markdown 表 + ISO8601 / 見本行は実機反映後も削除しない） |
| 仕様書差分追記 | `doc/00-getting-started-manual/lefthook-operations.md`（Step 2-1〜2-4 specify 済み） |
| 苦戦知見 | `references/lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜L-MWR-006） |
| baseline 不採用 | ALT-A（CI 全 worktree 検証）/ ALT-B（per-clone 化）/ ALT-C（post-merge 復活）— `outputs/phase-12/unassigned-task-detection.md` |
| 派生未タスク | N-01 `scripts/reinstall-lefthook-all-worktrees.sh` 実装 Wave + CI smoke（index.md 依存関係表で追跡・重複起票しない） |

### Indexes Drift Detection 早見（task-verify-indexes-up-to-date-ci / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/` |
| CI gate 名（job / required status check） | `verify-indexes-up-to-date` |
| ワークフロー定義 | `.github/workflows/verify-indexes.yml` |
| 監視範囲（diff 対象パス） | `.claude/skills/aiworkflow-requirements/indexes`（`topic-map.md` / `keywords.json` の auto-generated drift） |
| 検出コマンド | `pnpm indexes:rebuild` を CI 上で実行し、続けて `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` で drift 判定（非ゼロ exit で fail） |
| Node / pnpm 固定 | Node 24（`.mise.toml`） / pnpm 10.33.2（`package.json` `packageManager`）。CI も同バージョンを `mise` 経由で利用 |
| ローカル再生成 | `mise exec -- pnpm indexes:rebuild`（post-merge から廃止された自動再生成の正規後継経路） |

### Indexes Drift Recovery SOP 早見（UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER / 2026-05-17）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-verify-indexes-trigger/` |
| runbook | `docs/00-getting-started-manual/lefthook-operations.md`（§skill indexes drift gate — trigger 条件と復旧 SOP） |
| hook 導線 | `lefthook.yml` `pre-push.indexes-drift-guard.fail_text` |
| 通常復旧 | `mise exec -- pnpm indexes:rebuild` → `git status .claude/skills/aiworkflow-requirements/indexes` → index diff commit → push |
| CI fail 復旧 | `git pull --rebase` 後に通常復旧を実施 |
| 禁止 | `indexes/*.json` 手編集 / 復旧目的の `--no-verify` |
| 継続 follow-up | `U-VIDX-01`（Actions smoke / branch protection）、`U-VIDX-02`（other skill indexes ADR） |
| branch protection 連携 | `main` / `dev` の `required_status_checks` 候補として `verify-indexes-up-to-date` を登録（solo 運用ポリシー: レビュー必須化はせず CI gate で品質担保） |
| トリガー | `pull_request`（push / merge 経路で indexes drift を pre-merge ブロック） |
| 失敗時の対処 | ローカルで `pnpm indexes:rebuild` を実行 → 差分をコミット → 再 push（ジェネレータ `scripts/generate-index.js` が正本） |
| 関連未タスク | `docs/30-workflows/unassigned-task/U-VIDX-01-verify-indexes-actions-smoke-and-branch-protection.md`（実 PR での smoke / required status 登録） |

### Issue #230 lefthook edit guard 早見（2026-05-31）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow root | `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/` |
| state | `implemented_local_runtime_pending / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| Issue | #230 OPEN; PR 文脈は `Refs #230` |
| 目的 | `lefthook.yml` を Git hook 正本とし、手書き `.git/hooks/*` と無 ack の `lefthook.yml` 直編集を検知する |
| local enforcement | implemented `scripts/hooks/lefthook-edit-guard.sh`。`.git/hooks` は CI で観測不能なため pre-commit で検知 |
| CI enforcement | implemented `scripts/verify-hook-integrity.sh` + `.github/workflows/verify-hook-integrity.yml`。`lefthook.yml` 参照先 script 実在 / tracked stray hook 不在 / `min_version` を検証 |
| worktree 注意 | marker は `--git-dir`（per-worktree）、hooks dir は `git rev-parse --git-common-dir`（共有）で解決する |
| false positive 抑制 | dotted ファイル名（`*.*`: `.sample`/`.old`/`.bak` 等）除外 + lefthook 署名除外 + merge/rebase/cherry-pick/revert skip |
| lessons | `references/lessons-learned-issue-230-lefthook-edit-guard-2026-05.md`（L-I230-001..004） |
| artifact inventory | `references/workflow-issue-230-lefthook-edit-guard-artifact-inventory.md` |
| user gate | GitHub Actions runtime, commit, push, PR, Issue mutation |

### GitHub Governance / branch protection apply（solo 運用 / UT-GOV-001 / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/ut-gov-001-github-branch-protection-apply/` |
| 適用予定値（dev / main 共通） | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` / `required_linear_history=true` / `required_conversation_resolution=true` / force-push & deletions = false |
| payload 正規化 | GET 形（snapshot）→ PUT 形（payload）adapter で `enforce_admins.enabled→bool` / `restrictions.users[].login→配列` / `required_pull_request_reviews=null` を必ず変換（snapshot を直接 PUT すると HTTP 422） |
| rollback 境界戦略 | snapshot / payload / rollback / applied JSON を `{branch}` サフィックスで分離。bulk PUT 禁止。enforce_admins DELETE 経路を事前準備 |
| 上流前提 | UT-GOV-004（`required_status_checks.contexts` の実 job 名同期）。未完了時は `contexts=[]` の 2 段階適用 fallback |

### Issue #475 coverage-gate required context（runtime evidence captured / 2026-05-05）

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/issue-475-branch-protection-coverage-gate/` |
| 目的 | `coverage-gate` を `main` / `dev` の `required_status_checks.contexts` に append し、coverage 80% gate を merge gate 化 |
| current applied 境界 | `deployment-branch-strategy.md` current applied 表を Issue #475 適用後 fresh GET evidence へ更新済み |
| Gate A | external GitHub PUT は外部適用済みとして fresh GET で観測済。追加 PUT は実行しない |
| Gate B | git commit / push / PR approval before Phase 13。throwaway PR による `mergeStateStatus=BLOCKED` 経験的観測も Gate B 後 |
| invariant | Issue #475 起因の non-target drift なし。dev の `required_pull_request_reviews=null` は out-of-scope / solo policy 方向として記録 |
| runtime evidence | Phase 11 fresh GET / drift / invariant / contexts-preserved / SSOT diff は取得済み。empirical PR observation only pending |
| 実 PUT のゲート | Gate A は消化済み。Phase 13 = `blocked_pending_gate_b_git_publish_and_empirical_pr`（ユーザー明示承認後の別オペレーションでのみ実行） |
| 苦戦知見 | `references/lessons-learned-ut-gov-001-2026-04.md`（L-GOV-001 payload adapter / L-GOV-002 5 重明記 / L-GOV-003 Phase 12-13 二重ゲート / L-GOV-004 NON_VISUAL evidence） |
| 正本仕様 | `references/deployment-branch-strategy.md`（current applied / Issue #475 適用 evidence） |

### GitHub Governance / UT-GOV-001 second-stage reapply（2026-04-30）

UT-GOV-004 で確定した required status checks を、UT-GOV-001 の `contexts=[]` fallback 適用後に再 PUT するための approval-gated implementation / NON_VISUAL workflow。

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` |
| confirmed contexts | `ci`, `Validate Build`, `verify-indexes-up-to-date` |
| 実行ゲート | Phase 13 でユーザー明示承認後のみ `gh api -X PUT` / commit / push / PR 作成を実行する |
| evidence 境界 | Phase 13 の fresh GET output だけを適用証跡にできる。placeholder / PUT payload / expected contexts は current applied の入力にしない |
| final references 反映 | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/` で反映済み。dev/main contexts は `ci`, `Validate Build`; strict は dev=false / main=true; `verify-indexes-up-to-date` は expected-context drift |
| downstream precondition | `docs/30-workflows/unassigned-task/task-utgov-downstream-precondition-link-001.md` で UT-GOV-005〜007 の上流前提へ反映 |

### Lefthook Multi-Worktree Reinstall（task-lefthook-multi-worktree-reinstall / 2026-04-28）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical runbook | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md` |
| 実行コマンド | `bash scripts/reinstall-lefthook-all-worktrees.sh`（dry-run は `bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run`） |
| スクリプト本体 | `scripts/reinstall-lefthook-all-worktrees.sh` |
| 用途 | `lefthook.yml` 改定時 / 新規 worktree 追加時に、全 worktree の `.git/hooks/*` を一括で `lefthook install` し直す |
| 並列実行 | **禁止**（worktree のロックや `.git/hooks/` 上書きが競合するため、必ず順次 1 worktree ずつ処理する。スクリプトは sequential loop で実装） |
| 判定 | SKIP: 対象 worktree が `.git/hooks` 未保有 / 既に同 commit の lefthook が install 済み（idempotency 達成）／ PASS: `lefthook install` が exit 0 で完了し hook ファイル群が期待 hash になる ／ FAIL: install 失敗 or 検証不一致（その worktree のみ赤、後続は継続） |
| 出力契約 | 各 worktree について `[SKIP] / [PASS] / [FAIL]` を 1 行ずつ stdout に出力。最後に集計サマリ。`--dry-run` は副作用なしで「何が走るか」のみ表示 |
| 運用契約（Phase 11 manual-smoke-log） | 実行ログ（stdout 全文）を該当タスクの `outputs/phase-11/manual-smoke-log.md` に転記必須。SKIP/PASS/FAIL の件数と、FAIL があった worktree のフルパス・原因仮説を併記する |
| 前提 | mise で Node 24 / pnpm 10.33.2 が解決済み（`mise exec --` 経由でないと `lefthook` バイナリが解決できないケースあり） |
| 運用ガイド | `doc/00-getting-started-manual/lefthook-operations.md`（§複数 worktree 一括再インストール） |
| 関連未タスク | `docs/30-workflows/unassigned-task/U-LFT-07-multi-worktree-reinstall-operations.md`（CI 化検討 / stale worktree 検出強化） |

### 公開ディレクトリ API（04a）早見

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical task root | `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/` |
| 4 endpoint | `GET /public/stats`（`public, max-age=60`） / `GET /public/members`（`no-store`） / `GET /public/members/:memberId`（`no-store`） / `GET /public/form-preview`（`public, max-age=60`） |
| 認証 | 未認証で叩ける（session middleware 非適用 / `createPublicRouter()` で `/public/healthz` 直後に mount） |
| 公開条件 | `publishState='published' AND publicConsent='consented' AND is_deleted=0`（`_shared/public-filter.ts` の `buildPublicWhereParams`） |
| 除外キー | `FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']`（runtime delete 必須） |
| visibility 既定値 | `member`（privacy first。`schema_questions.visibility='public'` のみ公開） |
| 6 層 leak 防御 | 1. SQL where / 2. repository EXISTS（`existsPublicMember` → `UBM-1404`） / 3. converter 内 `isPublicStatus` / 4. `keepPublicFields`（visibility filter） / 5. FORBIDDEN_KEYS runtime delete / 6. Zod `.strict()` parse fail close |
| 主要ハンドラ | `apps/api/src/routes/public/{index,stats,members,member-profile,form-preview}.ts` |
| 主要 helper | `apps/api/src/_shared/{visibility-filter,public-filter,pagination,search-query-parser}.ts` |
| 主要 view-model | `apps/api/src/view-models/public/{public-stats-view,public-member-list-view,public-member-profile-view,form-preview-view}.ts` |
| query 契約 | `q`（max 200 文字） / `zone` / `status` / `tag` / `sort` / `density`（`comfy/dense/list`） / `page` / `limit`（max 100, min 1） |
| 関連 references | `references/api-endpoints.md`（公開ディレクトリ API 章） / `lessons-learned/lessons-learned-04a-public-api-security-layers.md`（L-04A-001〜007） / `references/workflow-task-04a-parallel-public-directory-api-endpoints-artifact-inventory.md` |
| Follow-up 未タスク | `docs/30-workflows/unassigned-task/task-04a-followup-001〜005-*.md`（miniflare contract / KV cache / shared parser / cache rules / N+1） |

---

### Governance / Branch Protection 系タスクの Step 2=N/A ショートカット（UT-GOV-002 由来 / 2026-04-29）

> **趣旨**: GitHub Actions governance / branch protection / safety gate 系タスクは API/D1/IPC/UI/auth/Cloudflare Secret 変更を伴わない場合が多く、aiworkflow-requirements の Step 2（正本仕様更新）は原則 N/A。ただし以下の再判定トリガに該当する場合は Step 2 を再実施する。

| 観点 | 値 |
| --- | --- |
| 原則 | GitHub Actions ワークフロー / branch protection / squash-only / linear history / required status checks / CODEOWNERS / pull_request_target safety gate 系のタスクは Step 2 = **N/A**（references/ 配下の仕様編集は不要） |
| 例: N/A 判定済み | UT-GOV-001（branch protection 草案）/ UT-GOV-002（pull_request_target safety gate dry-run）/ task-github-governance-branch-protection（squash-only 等の草案） |
| 再判定トリガ① OIDC | `id-token: write` を伴う OIDC token の新規採用、`aws-actions/configure-aws-credentials` 等の federation 設定追加（Cloudflare Secret / IAM 境界に影響するため `references/deployment-secrets-management.md` / `deployment-cloudflare.md` を更新） |
| 再判定トリガ② workflow_run | `workflow_run` 経由で別ワークフローへデプロイ権限を委譲する場合（権限境界が変わるため `deployment-gha.md` / `deployment-core.md` を更新） |
| 再判定トリガ③ メタデータ参照 | PR triage / governance gate が D1 / KV / R2 メタデータ（member_responses / sync_audit / SESSION_KV 等）を参照する場合（データ境界に影響するため `database-admin-repository-boundary.md` 等を更新） |
| 再判定トリガ④ Secret 追加 | governance gate が新しい Cloudflare Secret / GitHub Secret を要求する場合（`deployment-secrets-management.md` の Secret inventory に追記）。配置層判定（Secret/Variable + repository-scoped/environment-scoped）は UT-27 配置決定マトリクスのフロー（マスク要否 → ログ可視性要否 → 環境別ローテーション要否）を踏襲する |
| 再判定トリガ⑤ auth / RBAC | branch protection が CODEOWNERS 経由で auth / RBAC を実装に拡張する場合（`references/02-auth.md` 系を更新） |
| Step 2 = N/A 時の最低限の同期 | LOGS.md ヘッドラインへの 1 エントリ追加と、SKILL.md 変更履歴への version 追加のみ（references/ 配下は触らない） |
| 一次正本（重複時） | governance / branch protection の運用ルール本文は `CLAUDE.md` のブランチ戦略節を一次正本とし、aiworkflow-requirements は補強として扱う（下表参照） |

---

### CLAUDE.md と aiworkflow-requirements の重複正本判定（UT-GOV-002 由来 / 2026-04-29）

> **趣旨**: 同一トピックが `CLAUDE.md` と aiworkflow-requirements の両方で言及される場合、どちらを一次正本とするか曖昧だと参照ループや矛盾の温床になる。以下の領域は **CLAUDE.md が一次正本**であり、aiworkflow-requirements 配下の記述は補強・派生情報として扱う。

| トピック | 一次正本 | 補強（aiworkflow-requirements 内） | 矛盾検出時の優先順 |
| --- | --- | --- | --- |
| ブランチ戦略（feature/dev/main の役割と PR フロー） | `CLAUDE.md` 「ブランチ戦略」節 | `references/deployment-branch-strategy.md` / `deployment-core.md` | CLAUDE.md > aiworkflow-requirements。差異検出時は CLAUDE.md を正として references/ を補正 |
| solo 運用 CI gate 方針（`required_pull_request_reviews=null` / `required_status_checks` / `required_linear_history` / `required_conversation_resolution`） | `CLAUDE.md` ブランチ戦略の solo 運用ポリシー注記 | `references/deployment-branch-strategy.md` の draft proposal セクション | CLAUDE.md > aiworkflow-requirements。レビュー必須数を変更する場合は CLAUDE.md を先に更新 |
| Cloudflare CLI ラッパー方針（`scripts/cf.sh` 経由・`wrangler` 直接禁止・`wrangler login` 禁止） | `CLAUDE.md` 「Cloudflare 系 CLI 実行ルール」節 | `references/deployment-cloudflare.md` / `deployment-secrets-management.md` の `scripts/cf.sh` 統合章 | CLAUDE.md > aiworkflow-requirements。コマンド形式・禁止事項は CLAUDE.md を起点に同期 |
| ローカル `.env` の op 参照運用 | `CLAUDE.md` 「ローカル `.env` の運用ルール」節 | `references/deployment-secrets-management.md` の op 章 | CLAUDE.md > aiworkflow-requirements |
| Git hook 運用（lefthook 正本 / `.git/hooks/*` 手書き禁止 / post-merge 廃止） | `CLAUDE.md` 「Git hook の方針」節 | `references/technology-devops-core.md` Git hook 運用章 / `lessons-learned-lefthook-unification-2026-04.md` | CLAUDE.md > aiworkflow-requirements。ただし lessons-learned の教訓 ID は references/ 側が一次正本 |
| Node / pnpm バージョン固定（Node 24 / pnpm 10.33.2 / mise） | `CLAUDE.md` 「開発環境セットアップ」節 | `references/technology-devops-core.md` baseline 章 | CLAUDE.md > aiworkflow-requirements |
| references/ 配下の API/D1/IPC/UI/auth 仕様 | `references/*.md`（aiworkflow-requirements が一次正本） | `CLAUDE.md` は概要のみ言及 | aiworkflow-requirements > CLAUDE.md。実装契約・schema・状態定数は references/ を正とする |
| 教訓 / lessons-learned ID（L-XXX-NNN） | `references/lessons-learned-*.md`（aiworkflow-requirements が一次正本） | CLAUDE.md には記載しない | aiworkflow-requirements > CLAUDE.md |
### UT-17 Followup-003 Alert Relay Weekly Healthcheck Cron（2026-05-14 / implemented-local）

UT-17 Cloudflare Notifications → alert-relay → Slack 経路を、既存 API Worker daily cron `0 18 * * *` へ相乗りして週次 healthcheck する。UTC Monday gate (`getUTCDay() === 1`) により新規 cron slot は追加しない。Slack `200 + body != "ok"` を失敗扱いにし、Resend mail fallback で silent failure を検出する。状態は `implementation_completed_external_ops_pending / implementation / NON_VISUAL / CODE_COMPLETE_EXTERNAL_OPS_PENDING`。Cloudflare secrets / deploy / manual cron fire / first production observation / commit / push / PR は user-gated。

| 項目 | 正本 |
| --- | --- |
| workflow root | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/` |
| implementation | `apps/api/src/scheduled/healthcheck.ts`, `apps/api/src/lib/healthcheck-mail-fallback.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts` |
| tests | `apps/api/src/scheduled/__tests__/healthcheck.test.ts`, `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts` |
| runbook | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |
| deployment spec | `references/deployment-cloudflare.md`（UT-17 weekly alert-relay healthcheck cron） |
| artifact inventory | `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md` |

### Issue #627 Composite setup-project action（RB-02 / 2026-05-12）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-627-composite-setup-action/` |
| status | `implemented_local_user-gated runtime evidence boundary / implementation / NON_VISUAL / CI infra` |
| composite contract | `.github/actions/setup-project/action.yml` implemented locally. Checkout is caller-owned; action owns Node / pnpm or mise setup plus optional install. |
| input vocabulary | `setup-strategy: node-setup | mise`, `install: 'true' | 'false'`, `node-version`, `pnpm-version`, `working-directory`, `cache` (`node-setup` path; default `'pnpm'`; `install: 'false'` callers use `''`) |
| required contexts preserved | `ci`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`, `build-test`, `workflow-shell-lint` |
| evidence boundary | Local static checks passed; GitHub Actions runtime evidence is `user-gated runtime evidence boundary` until user-approved commit / push / draft PR. |
| closed issue rule | Issue #627 is CLOSED; PR text must use `Refs #627` only. |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-627-composite-setup-action-2026-05.md` (L-627-001..003) |

### Issue #655 D+7 recovery 2nd-cycle（2026-05-14）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-655-d7-recovery-2nd-cycle/` |
| status | `implemented-local-runtime-pending / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` |
| parent | Issue #586 post-switch 7 day close-out; grandparent is Issue #549 CF Audit Logs ML production switch |
| recovery contract | 1 周目と 2 周目 evidence を `*-recovery.*` suffix と `./hourly-snapshots-recovery` input directory で分離 |
| canonical state | workflow root は `implemented-local-runtime-pending`、runtime collection は `user-gated runtime evidence boundary`、D'+7 成功後の業務状態のみ `pass_runtime_synced` |
| strict outputs | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-655-d7-recovery-2nd-cycle-artifact-inventory.md` |
| user gate | commit / push / PR / workflow_dispatch / secret or variable mutation / runtime promotion は user approval 後のみ |

### Issue #720 CF audit monitor environment protection fix（2026-05-16）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-720-cf-audit-monitor-env-protection-fix/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| local diff | `.github/workflows/cf-audit-log-monitor.yml` から `environment: production` を削除 |
| classification | read-only / notification-only monitor. Deploy / rollback / schema apply は行わない |
| runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` Issue #720 section |
| parent | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` |
| evidence boundary | Phase 11 planned files are physical `PENDING_USER_GATE` placeholders. Runtime success is not claimed locally |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-720-cf-audit-monitor-env-protection-fix-artifact-inventory.md` |
| user gate | repo secret/variable mirror, push, PR, workflow dispatch dry run, six scheduled successes, D'+0 declaration, production env monitor secret cleanup |

### UT-17 Follow-up 002 / Alert Relay Dedup KV（2026-05-13）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/` |
| source task | `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`（transferred_to_workflow） |
| state | `implemented-local-runtime-pending / implementation / NON_VISUAL / external_ops_pending` |
| planned binding | `ALERT_DEDUP_KV: KVNamespace` |
| canonical test path | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（historical source used `.test.ts`, superseded by repo `*.spec.ts` invariant） |
| artifact inventory | `references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md` |
| patterns | `references/patterns-kv-dedup.md`（env binding narrowing / KV stub fixture / persistence ordering / wrangler gating / wording 規律） |
| lessons-learned | `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md`（5 教訓） |
| boundary | KV eventual consistency のため exactly-once は保証しない。目的は isolate 跨ぎ重複通知の実用大幅低減。Dedup key は Slack 配信成功後にのみ保存する。Cloudflare mutation / deploy / Slack runtime smoke / commit / push / PR は user-gated |

### UT-17 Follow-up 006 / ALERT_DEDUP_KV Usage Dashboard Monitoring（2026-05-16）

| 観点 | 値 / 参照先 |
| --- | --- |
| canonical workflow | `docs/30-workflows/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/` |
| source task | `docs/30-workflows/unassigned-task/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring.md`（superseded） |
| state | `implemented_local_user-gated runtime evidence boundary / implementation / NON_VISUAL` |
| issue | `#702`（open。Cloudflare apply / Slack runtime smoke 未取得なら PR は `Refs #702`） |
| current decision | followup-004 の `infra/cloudflare-alerts/` IaC 基盤を再利用し、Workers KV account quota guard として writes/day + stored bytes の 2 policy を `enabled:false` で宣言する。namespace filter は無いため `ALERT_DEDUP_KV` 固有監視ではない |
| latency boundary | native Notification が無い場合は policy 化せず、Workers Analytics / GraphQL review evidence として runbook に固定 |
| runtime boundary | initial policy は `enabled:false`。Slack delivery smoke は一時検証 policy / 短時間負荷で証明し、5 営業日 baseline 後の `enabled:true` 本運用切替は user-gated |
| implementation targets | changed: `infra/cloudflare-alerts/policies/workers-kv-*.json`, `infra/cloudflare-alerts/quota-base.json`, `tests/fixtures/cloudflare-alerts/api-list-policies.json`, `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`; verified unchanged: `infra/cloudflare-alerts/schema/policy.schema.json` |

### task-761 visual-full required status check（2026-05-17）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/task-761-visual-full-required-status-check/` |
| state | `implemented / implementation / NON_VISUAL / governance / external_mutation_completed` |
| required contexts | `visual-full (desktop|tablet|mobile)` |
| safety guard | `.github/workflows/playwright-visual-full.yml` must not use `pull_request.paths` before required-check promotion |
| source task | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` consumed |
| artifact inventory | `references/workflow-task-761-visual-full-required-status-check-artifact-inventory.md` |
| user gate | branch protection contexts POST / after GET / commit / push / PR |

### CI staging deploy failure fix（2026-05-20）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/` |
| status | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL` |
| task-01 | `.github/workflows/web-cd.yml` の OpenNext build step に `apps/web/wrangler.toml` 由来の build-time env を step-scoped 注入し、`apps/web/src/lib/__tests__/build-time-env.spec.ts` で `getPublicEnv` / `getEnv` contract を固定 |
| task-02 | Cloudflare API token を D1:Edit + Workers Scripts:Edit + Account Settings:Read で staging / production 分離 rotation。Cloudflare / 1Password / GitHub Secret mutation は user-gated |
| evidence boundary | local env test / grep / build smoke は PASS。`web-cd / deploy-staging`、`backend-ci / deploy-staging`、staging HTTP 200 は dev push 後の runtime_pending |
| artifact inventory | `references/workflow-ci-staging-deploy-failure-fix-artifact-inventory.md` |
| user gate | Cloudflare token creation, 1Password update, `gh secret set`, commit, push, PR, dev push runtime evidence |
### UT-25-DERIV-01 SA Key Rotation SOP（2026-05-22）

| リソース | 役割 | 読み込み条件 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/ut-25-deriv-01-sa-key-rotation-sop/` | `GOOGLE_SERVICE_ACCOUNT_JSON` 90 日 rotation SOP/helper workflow | SA key rotation 手順・Phase 11/12 evidence 確認時 |
| `scripts/cf-rotate-sa-key.sh` | stdin-only Cloudflare Secret rotation helper | staging→production guard / dry-run / fingerprint helper を確認する時 |
| `docs/30-workflows/runbooks/sa-key-rotation-sop.md` | Operator SOP | 実 rotation 前の手順確認時 |
| `references/workflow-ut-25-deriv-01-sa-key-rotation-sop-artifact-inventory.md` | Artifact inventory | 同 wave 変更棚卸し時 |
| `references/lessons-learned-ut-25-deriv-01-sa-key-rotation-2026-05.md` | SA key rotation 苦戦点 L-UT25SAK-001..007（stdin+history 抑止 / state guard / `secret list` name-only + UT-26 / bats fixture / 500 行近傍分割閾値 / 90 日採用根拠 / 完了記録 8 フィールド）| 次回 SOP 更新・類似 secret rotation 設計時 |
| `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/` | Issue #863 admin error boundary Sentry alert IaC workflow | admin `error.boundary.caught` alert policy、Sentry tag 昇格、drift CI、runbook を確認する時 |
| `infra/sentry-alerts/` | Sentry alert policy IaC for admin runtime error detection | Sentry alert rule manifest / CLI / drift diff を確認・更新する時 |
| `references/workflow-issue-863-admin-error-alert-policy-iac-artifact-inventory.md` | Issue #863 workflow artifact inventory | 同 wave 変更棚卸し時 |
### Issue #255 coverage threshold sync lint（2026-05-26）

| key | value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-255-coverage-threshold-sync-lint/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| purpose | aiworkflow SSOT / `scripts/coverage-guard.sh` / optional `codecov.yml` の coverage threshold drift を CI で検出 |
| implementation | `scripts/coverage-threshold-lint.ts`, `scripts/__tests__/coverage-threshold-lint.spec.ts`, `.github/workflows/coverage-threshold-lint.yml`, `package.json#lint:coverage-threshold` |
| evidence | `outputs/phase-11/evidence/lint-coverage-threshold.log`, `outputs/phase-11/evidence/vitest-coverage-threshold-lint.log` |
| source task | `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-255-coverage-threshold-sync-lint-artifact-inventory.md` |
| user-gated | commit, push, PR, GitHub Actions runtime observation |
| Issue #903 member AppShell runtime evidence | `/profile` under `(member)` route group; EV-13/EV-16 present | `docs/30-workflows/completed-tasks/issue-903-parallel-03-followup-005-member-runtime-evidence/`, `references/workflow-issue-903-parallel-03-followup-005-member-runtime-evidence-artifact-inventory.md` |

### admin-requests-prototype-alignment-and-404-fix（2026-05-27）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL / staging runtime pending_user_approval` |
| purpose | `/admin/requests` の staging `ADMIN_FETCH_404` mount guard と admin prototype primitive 整合の local implementation |
| API boundary | existing `GET /admin/requests` and `POST /admin/requests/:noteId/resolve`; no new endpoint or D1 schema |
| implemented targets | `apps/api/src/routes/admin/requests.contract.spec.ts`, `apps/api/src/routes/admin/requests.mount.spec.ts`, `/admin/requests` page/components, `apps/web/src/styles/globals.css`, `apps/web/playwright/tests/admin-requests.spec.ts` |
| local evidence | `outputs/phase-11/screenshots/admin-requests-visibility-populated-linux.png`, focused API/Web PASS, desktop Chromium visual PASS |
| artifact inventory | `references/workflow-admin-requests-prototype-alignment-and-404-fix-artifact-inventory.md` |
| user gate | staging deploy, staging curl 200, staging visual baseline, commit, push, PR |
## admin-schema-page-prototype-alignment-and-diff-fetch-fix（2026-05-27）

| 観点 | 値 / 参照先 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` |
| implementation | `apps/web/app/(admin)/admin/schema/page.tsx`, `apps/web/src/components/admin/SchemaDiffPanel.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/styles/globals.css` |
| system spec | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` §`/admin/schema` |
| inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-schema-page-prototype-alignment-and-diff-fetch-fix-artifact-inventory.md` |
| evidence | web Vitest 158 files / 1147 tests PASS; local Playwright schema visual 7 PASS + Phase 11 screenshots; staging deploy and authenticated screenshots are user-gated |

# members-list-ux-clarity

| item | value |
| --- | --- |
| status | implemented_local_runtime_pending / implementation / VISUAL / 2026-05-28 |
| workflow | `docs/30-workflows/completed-tasks/members-list-ux-clarity/` |
| summary | `/members` の密度切替説明、即時反映ヒント、適用中filter chip、件数live regionを追加。API/schema/query正本は不変。 |
