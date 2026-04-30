# 既存 docs 追記 draft (Phase 12 で system-spec-update-summary 経由で反映)

## 1. `apps/api/README.md` 追加節「sync layer」

```markdown
## sync layer (u-04)

Google Sheets → Cloudflare D1 の同期を担う `apps/api/src/sync/` 配下のモジュール群。

- `POST /admin/sync/run` — manual sync (Bearer `SYNC_ADMIN_TOKEN`)
- `POST /admin/sync/backfill` — truncate-and-reload (同上)
- `GET /admin/sync/audit?limit=N` — 監査履歴取得 (同上)
- Cron Trigger `0 * * * *` — scheduled handler が `runScheduledSync(env)` を起動

運用詳細: `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/outputs/phase-10/sync-runbook.md`

## Cloudflare CLI

`wrangler` を直接呼ばない。必ず `bash scripts/cf.sh` 経由 (CLAUDE.md 参照)。
```

## 2. `docs/00-getting-started-manual/specs/08-free-database.md` 末尾追記

```markdown
### sync_job_logs / sync_locks 利用方針 (u-04)

- 物理テーブル `sync_job_logs` (audit) / `sync_locks` (mutex) は U-05 が定義、書き込みは u-04 / 03a / 03b。
- writes 想定: 24 cron + manual 数件/day = 数千 writes/day (上限 100,000/day の 1〜3%)。
- 監査クエリレシピ: `outputs/phase-10/sync-audit-recipes.md` (u-04)。
```

## 3. `docs/00-getting-started-manual/specs/01-api-schema.md` 関連節

```markdown
### mapping 駆動

`apps/api/src/sync/mapping.ts` (= `apps/api/src/jobs/mappers/sheets-to-members.ts`) は `form_field_aliases` を起点に Sheets 列 → stableKey を解決する。未知 questionId は `extra_fields_json` / `unmapped_question_ids_json` に退避し、alias 追加は 07b の責務。
```

## 4. `docs/00-getting-started-manual/specs/11-admin-management.md` 1 行追記

```markdown
- `/admin/sync*` (u-04) は `requireSyncAdmin` middleware で `SYNC_ADMIN_TOKEN` Bearer 必須。
```

## 反映タイミング

Phase 12 の `system-spec-update-summary.md` でこれらの diff を提示し、PR レビュー後に正本へ反映する。
