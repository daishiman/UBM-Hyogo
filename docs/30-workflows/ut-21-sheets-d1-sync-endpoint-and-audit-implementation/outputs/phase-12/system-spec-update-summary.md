# System Spec Update Summary

## 判定

**Step 2 は正本へ直接反映しない。** UT-21 の Sheets API / 単一 `/admin/sync` / `sync_audit_logs` / `sync_audit_outbox` は、現行正本の Forms API / `/admin/sync/schema` + `/admin/sync/responses` / `sync_jobs` と矛盾する。

## Step 1-A: 完了タスク記録

| 対象 | 判定 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | Deferred | UT-21 は implemented close-out ではなく conflict review として記録対象 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | Deferred | 正本仕様へ Sheets 仕様を登録しない |
| `.claude/skills/task-specification-creator/LOGS.md` | Deferred | Phase 12 成果物欠落と conflict gate の知見を登録候補 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | No change | 正本仕様の内容変更ではなく、UT-21 側の矛盾検出 |
| `.claude/skills/task-specification-creator/SKILL.md` | No change | スキル仕様変更は大きいため未タスク化 |
| topic-map / index | No change | Sheets 仕様を current canonical として追加しない |

## Step 1-B: 実装状況テーブル更新

UT-21 を `implemented` に更新しない。現行正本では 03a / 03b / 04c / 09b が Forms sync の実装単位であり、UT-21 を実装済みとして扱うと二重正本になる。

## Step 1-C: 関連タスクテーブル更新

UT-03 / UT-04 / UT-09 / UT-22 / UT-26 / 03-serial へ「UT-21 完了」として反映しない。関連付けは `task-sync-forms-d1-legacy-umbrella-001` の整理完了後に行う。

## Step 2: 新規インターフェース追加

| 更新対象 | 判定 | 理由 |
| --- | --- | --- |
| `references/api-endpoints.md` | No change | `GET /admin/sync/audit` と単一 `POST /admin/sync` は現行正本と衝突 |
| `references/database-schema.md` | No change | `sync_audit_logs` / `sync_audit_outbox` は現行 `sync_jobs` 方針と衝突 |
| `references/deployment-cloudflare.md` | No change | Cron 方針は 09b / Forms response sync へ集約する |
| `references/deployment-secrets-management.md` | No change | Sheets SA JSON ではなく Forms 用 env vars が現行正本 |

## 結論

Phase 12 は「未反映」ではなく「反映禁止の矛盾を検出」として扱う。正本仕様への追記は行わず、未タスク検出レポートに統合タスクを残す。
