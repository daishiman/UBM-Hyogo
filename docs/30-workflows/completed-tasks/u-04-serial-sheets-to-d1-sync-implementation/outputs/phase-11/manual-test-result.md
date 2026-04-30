# Phase 11 manual-test-result（NON_VISUAL evidence メタ）

## NON_VISUAL 採用理由

本タスクは UI 表面を持たない（manual / scheduled / backfill / audit はいずれも JSON エンドポイントもしくは Cron handler）。screenshot は意味を持たないため、`.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` に従い

- placeholder PNG を作らない
- `screenshots/.gitkeep` も配置しない
- 代替 evidence として下記の test 実行ログ抜粋・curl 想定コマンド・期待 audit row を残す

を採用する。

## 主ソース evidence

| 種別 | 場所 |
| --- | --- |
| typecheck 結果 | 本ファイル §typecheck 抜粋 |
| vitest 結果 | 本ファイル §unit/contract/integration 抜粋 |
| AC × 実装トレース | `outputs/phase-07/ac-matrix.md` |
| 設計対照 | `outputs/phase-02/{sync-module-design,audit-writer-design}.md` |
| runbook | `outputs/phase-10/sync-runbook.md` + 本ファイル §runbook |

## test 実行ログ抜粋

### typecheck

```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck
> @ubm-hyogo/api@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit
（exit 0、エラー 0 件）
```

### vitest（apps/api 全件 / u-04 focused）

```
$ mise exec -- pnpm --filter @ubm-hyogo/api test --run
 ✓ apps/api/src/sync/audit.test.ts
 ✓ apps/api/src/sync/audit-route.test.ts
 ✓ apps/api/src/sync/backfill.test.ts
 ✓ apps/api/src/sync/manual.test.ts
 ✓ apps/api/src/sync/scheduled.test.ts
 ✓ apps/api/src/sync/sheets-client.test.ts
 ✓ apps/api/src/routes/admin/sync.test.ts (4 tests)
 Test Files  72 passed (72)
      Tests  398 passed (398)
   Duration  56.49s
```

修正点: 旧 `routes/admin/sync.test.ts` は `runSync` を mock していたが、新 sync layer の `runManualSync` シグネチャに整合するよう mock を更新（u-04 互換 mount 動作確認）。

2026-04-30 の再検証では、apps/api full suite 実行中に `forms-schema-sync.test.ts` の timeout が一度発生したが、同 test は後続実行で PASS。u-04 対象の `audit/backfill/scheduled/sheets-client/routes/admin/sync` は focused run で確認する。

## runbook（local / staging smoke）— curl 想定コマンド

### S-01〜S-03: local manual sync

```bash
# 1) ローカル起動
mise exec -- pnpm --filter @ubm-hyogo/api dev

# 2) manual sync 実行（別ターミナル）
curl -s -X POST http://localhost:8787/admin/sync/run \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
# 期待: HTTP 200
# {
#   "ok": true,
#   "result": {
#     "status": "success",
#     "auditId": "<uuid>",
#     "fetched": N, "upserted": N, "failed": 0,
#     "retryCount": 0
#   }
# }

# 3) audit ledger 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-local \
  --command "SELECT id,trigger,status,started_at,finished_at FROM sync_job_logs ORDER BY id DESC LIMIT 1" \
  --local
```

期待 audit row:

| id | trigger | status | started_at | finished_at |
| --- | --- | --- | --- | --- |
| `<uuid>` | `manual` | `success` | `2026-04-30T...Z` | `2026-04-30T...Z` |

### S-04: mutex 二重起動

```bash
# 即時 2 連発
for i in 1 2; do
  curl -s -X POST http://localhost:8787/admin/sync/run \
    -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}" &
done; wait
```

期待: 2 つのうち先行 1 件は 200、後続は 409 + `{"ok":false,"error":"sync_in_progress","auditId":"..."}`。

### S-06: backfill が admin 列を保護

```bash
# before
bash scripts/cf.sh d1 execute ubm-hyogo-db-local \
  --command "SELECT member_id, publish_state, is_deleted FROM member_status" --local --json > before.json

# backfill
curl -s -X POST http://localhost:8787/admin/sync/backfill \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"

# after
bash scripts/cf.sh d1 execute ubm-hyogo-db-local \
  --command "SELECT member_id, publish_state, is_deleted FROM member_status" --local --json > after.json

diff before.json after.json
# 期待: 出力差分なし（admin 列温存）
```

### S-11/S-12: staging smoke (handoff to 05b/09b)

```bash
# deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# manual run
curl -s -X POST https://api-staging.ubm-hyogo.example/admin/sync/run \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN_STAGING}"

# scheduled handler 手動発火（cron 一時短縮 or wrangler dispatch）
bash scripts/cf.sh dispatch --config apps/api/wrangler.toml --env staging --cron "0 * * * *"

# audit 集計
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT trigger,status,COUNT(*) FROM sync_job_logs GROUP BY trigger,status" \
  --env staging
```

期待: trigger=manual / scheduled の両方で status=success の row が 1 件以上。

### GET /admin/sync/audit

```bash
curl -s "http://localhost:8787/admin/sync/audit?limit=5" \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"
# 期待: {"ok":true,"items":[{auditId, trigger, status, startedAt, finishedAt, ...}, ...]}
```

## 期待 audit row（共通スキーマ）

| 列 | manual 期待 | scheduled 期待 | backfill 期待 |
| --- | --- | --- | --- |
| trigger | `manual` | `scheduled` | `backfill` |
| status (start) | `running` | `running` | `running` |
| status (final) | `success` / `failed` / `skipped` | `success` / `failed` / `skipped` | `success` / `failed` |
| fetched | >= 0 | >= 0 | 全件 |
| upserted | <= fetched | <= fetched | 全件 |
| retry_count | 0..3 | 0..3 | 0..3 |
| error_reason | NULL or redacted string | 同左 | 同左 |

## screenshots ディレクトリ

**作成しない**（UBM-010 / phase-11-non-visual-alternative-evidence.md 準拠）。`screenshots/.gitkeep` も配置しない。
