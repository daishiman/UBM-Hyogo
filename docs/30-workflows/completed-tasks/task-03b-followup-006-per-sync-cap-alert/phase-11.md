[実装区分: 実装仕様書]

# Phase 11: NON_VISUAL evidence 取得 — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-10.md

## 成果物

- phase-11.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## visualEvidence 区分

NON_VISUAL（UI なし。grep / SQL log / dry-run log で構成）

## evidence 一覧

| ファイル | 取得方法 |
| --- | --- |
| `outputs/phase-11/grep-writeCapHit.md` | `rg "writeCapHit" apps/api/src/` の結果（schema / runResponseSync / cap-alert / tests でヒットすること） |
| `outputs/phase-11/grep-cap-alert.md` | `rg "evaluateConsecutiveCapHits\|emitConsecutiveCapHitEvent\|sync_write_cap_consecutive_hit" apps/api/src/` |
| `outputs/phase-11/wrangler-config-grep.md` | `rg "analytics_engine_datasets\|SYNC_ALERTS" apps/api/wrangler.toml` |
| `outputs/phase-11/warn-path-grep.md` | `rg "\\[cap-alert\\].*SYNC_ALERTS|emit failed" apps/api/src/jobs/cap-alert.ts` |
| `outputs/phase-11/typecheck.log` | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| `outputs/phase-11/lint.log` | `mise exec -- pnpm --filter @ubm-hyogo/api lint` |
| `outputs/phase-11/test.log` | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| `outputs/phase-11/staging-dry-run.log` | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` |
| `outputs/phase-11/redaction-check.md` | metrics_json / log 出力に PII / token を含まないことの grep 確認 |
| `outputs/phase-11/sql-recent-jobs.md` | staging 反映後の `SELECT ... FROM sync_jobs ... LIMIT 5` 結果（user 承認後の post-deploy 取得） |
| `outputs/phase-11/analytics-query.log` | Analytics Engine query / API 取得ログ。不可の場合は dashboard fallback と理由 |

## evidence contract

- 実装/staging 反映前は `PENDING_IMPLEMENTATION_FOLLOW_UP` placeholder として保存
- Phase 12 implemented-local 状態では Phase 11 を "Local implementation GO（implemented-local）" として閉じる
- 実装完了後の runtime GO は implementation follow-up 完了時に取得

## redaction guard

- log / metrics_json に `responseEmail` / OAuth token / API token を出力しないこと
- Analytics Engine の `blobs` / `doubles` / `indexes` には PII を含めない（jobId は UUID のため可）

## 完了条件

- 11 つの evidence ファイルがすべて存在（実装前は placeholder で可）
- redaction guard を満たす
