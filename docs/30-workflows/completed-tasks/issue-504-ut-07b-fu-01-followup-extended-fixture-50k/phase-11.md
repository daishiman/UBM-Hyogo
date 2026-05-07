# Phase 11: runtime evidence 取得（staging 10 trials / redaction 検証）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/main.md` |
| visualEvidence | NON_VISUAL |
| 縮約テンプレ | `references/phase-template-phase11.md` の NON_VISUAL 縮約テンプレを適用 |
| user gate | **YES** — staging への 50,000 行 INSERT は user 承認後に実行 |

## 目的
staging で 10 trials を実行し、retry_count / cpu_ms / queue_enqueued / dlq_count / backfill_status の数値 evidence を redaction 済で記録する。

## 実行タスク
1. **user gate**: staging stress trial 実行の明示承認をユーザーから取得。
2. fixture 生成: `pnpm tsx scripts/schema-alias-backfill/generate-50k-fixture.ts --count 50000 --output /tmp/fixture-50k.sql`
3. seed: `bash scripts/schema-alias-backfill/seed-staging-50k.sh --env staging --fixture-file /tmp/fixture-50k.sql`
4. seed 検証: `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote --command "SELECT COUNT(*) FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'"` → 50000 期待
5. stress trial: `ADMIN_SESSION_JWT=... bash scripts/schema-alias-backfill/run-stress-trial.sh --trials 10 --trigger-path /admin/schema/backfill/trigger --poll-interval-seconds 10 --timeout-seconds 1800 --api-base-url "$ADMIN_API_BASE_URL" --evidence-out /tmp/evidence-50k.json`
6. evidence を `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md` に転記（redaction 確認後）。
7. cleanup: `bash scripts/schema-alias-backfill/cleanup-staging-50k.sh --env staging --confirm`
8. cleanup 検証: 上記 SELECT COUNT が 0 に戻ること確認。
9. redaction CI gate: `rg "@gmail|@senpai-lab|token|secret" docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/` → no match。

## 完了条件 (Phase 11 状態語彙)
- 全 10 trials のメトリクスが evidence file に記録されている → `PASS`
- user gate が未取得 / staging 未実行 → `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（spec contract complete・runtime evidence pending）
- 中止条件発火（any trial `retry_count > 3`, `dlq_count > 0`, `cpu_ms > 250000`, or timeout `1800s`）→ evidence に abort 理由を記録した上で `PASS_PARTIAL`、cursor semantics 採用判断 follow-up に input として連携

## 参照資料
- `outputs/phase-3/evidence-schema.json`
- `docs/runbooks/schema-alias-backfill-50k-stress-trial.md`
- `references/phase-template-phase11.md`

## 成果物
- `outputs/phase-11/main.md`（縮約テンプレ準拠）
- `outputs/phase-11/runtime-trial-log.md`
- 親 workflow: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-11/extended-fixture-50k-evidence.md`

## 完了条件
- runtime evidence ファイルが redaction 済で存在
- cleanup 完了（staging D1 から fixture が完全削除）
- redaction CI gate PASS
- Phase 11 状態が `PASS` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のいずれかに確定
- abort thresholds are fixed: `retry_count <= 3`, `dlq_count == 0`, `cpu_ms <= 250000`, `timeout_seconds=1800`
