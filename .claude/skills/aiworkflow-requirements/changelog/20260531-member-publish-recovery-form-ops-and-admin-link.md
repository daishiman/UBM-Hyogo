# 2026-05-31 member-publish-recovery-form-ops-and-admin-link

`docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期した。

## 実装

- `/admin/sync-status` に publish_state backfill dry-run/apply panel と manual form resync/backfill panel を追加。
- Next admin proxy が sync 系 path に server-side `Authorization: Bearer ${SYNC_ADMIN_TOKEN}` を注入するよう更新。
- `/members` と `/profile` に Google Form 反映タイミング note を追加し、`03-data-fetching.md` に反映 SLA を追記。
- Admin sidebar に Google Form 回答編集画面への external nav item を追加。

## Evidence

- `pnpm --filter @ubm-hyogo/web typecheck` PASS。
- focused Vitest 8 files / 53 tests PASS。

## Skill 同期

- `lessons-learned-member-publish-recovery-form-ops-and-admin-link-2026-05.md`（L-MPUB-001..007）を新規作成。
- inventory に `## Lessons Learned` 節 + バックリンクを追加。
- resource-map / quick-reference / topic-map / keywords / task-workflow-active を同一 wave で同期し、`indexes:rebuild` を実行。

## User Gate

production flag / Cloudflare secret injection / deploy / authenticated runtime screenshots / commit / push / PR は user-gated。
