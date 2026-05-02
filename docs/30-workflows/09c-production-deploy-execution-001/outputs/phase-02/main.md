# Phase 2 main: 設計（実行フロー + evidence 設計）

## 13 ステップ × evidence 設計表

| Step | 名称 | 主コマンド | evidence ファイル | 担当 Phase | 失敗時 |
| --- | --- | --- | --- | --- | --- |
| S1 | main 昇格 evidence | `git rev-parse origin/main` / `git log -1 origin/main` | `outputs/phase-05/main-merge-evidence.md` | 5 | 中止 |
| S2 | account identity | `bash scripts/cf.sh whoami` | `outputs/phase-05/cf-whoami.md` | 5 | 中止 |
| S3 | D1 binding confirmation | `rg -n "database_name|binding_name|database_id" apps/api/wrangler.toml` | `outputs/phase-05/d1-binding-confirmation.md` | 5 | 中止 |
| S4 | migration list (dry-run) | `bash scripts/cf.sh d1 migrations list ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml` | `outputs/phase-05/d1-migrations-list-pre.md` | 5 | 中止 |
| S5 | secrets list | `bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml` + Pages secrets | `outputs/phase-05/secrets-list.md`（必須 7 種の有無のみ、値は記録禁止） | 5 | 中止 |
| S6 | D1 backup + migrations apply | `bash scripts/cf.sh d1 export ...` then `bash scripts/cf.sh d1 migrations apply ...` | `outputs/phase-06/d1-backup.sql.path.md`, `outputs/phase-06/d1-migration-evidence.md` | 6 | rollback |
| S7 | api deploy | `pnpm --filter @ubm/api deploy:production` | `outputs/phase-07/api-deploy-evidence.md`（version id 必須） | 7 | rollback |
| S8 | web deploy | `pnpm --filter @ubm/web deploy:production` | `outputs/phase-07/web-deploy-evidence.md`（version id 必須） | 7 | rollback |
| S9 | release tag | `git tag vYYYYMMDD-HHMM && git push --tags` (JST) | `outputs/phase-08/release-tag-evidence.md` | 8 | tag 削除 + 再付与 |
| S10 | smoke + 認可境界 | curl 10 ページ + 認可境界手動確認 | `outputs/phase-09/smoke-evidence.md`, `outputs/phase-09/screenshots/` | 9 | rollback or hotfix |
| S11 | GO/NO-GO | user 承認 G3 | `outputs/phase-10/go-no-go.md`, `outputs/phase-10/user-approval-log.md` | 10 | NO-GO → rollback |
| S12 | incident runbook 共有 | Slack/Email | `outputs/phase-11/share-evidence.md` | 11 | 再送 |
| S13 | 24h Analytics | Cloudflare dashboard | `outputs/phase-11/24h-metrics.md`, `outputs/phase-11/screenshots/` | 11 | incident path |

## rollback / incident 分岐設計

### payload 分離規律
- merge 前 evidence は `outputs/phase-05/` (preflight) に保存
- merge 後 evidence は `outputs/phase-06..11/` に保存
- 両者を **同一ファイルへ上書き保存することを禁止**
- 失敗時 evidence は新規 `rollback-evidence.md` / `incident-evidence.md` を新設し、既存 evidence は残す

### rollback トリガー
- S6 / S7 / S8 / S10 / S11 のいずれかで AC 不達 → rollback 起動

### rollback コマンド (placeholder, Phase 3 で確定)
```bash
bash scripts/cf.sh rollback <PREV_API_VERSION_ID> --config apps/api/wrangler.toml --env production
bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID> --config apps/web/wrangler.toml --env production
# D1: backup-pre-migrate-<ts>.sql からの restore (Phase 6 で取得)
```

### incident 分岐
24h verify 中の Workers req 急増 / D1 quota 警告 → 親 09b incident runbook の P0 / P1 経路。本タスクは `outputs/phase-11/incident-evidence.md` に観測時刻と一次対応のみ記録。

## Cloudflare wrapper 強制 grep ルール (AC-13)

```bash
grep -RnE '^\s*wrangler\s' docs/30-workflows/09c-production-deploy-execution-001/outputs/ || echo OK
git diff main...HEAD -- 'docs/30-workflows/09c-production-deploy-execution-001/**' | grep -E '^\+\s*wrangler\s' || echo OK
```
両方 `OK` で AC-13 PASS。

## evidence ディレクトリ規約

- 形式: `outputs/phase-XX/<artifact>.md`
- スクリーンショット: `outputs/phase-XX/screenshots/<step>-<timestamp>.png`
- secret / token 値の記録は **禁止**（必須 7 種は「存在の有無」のみ記録）
- `backup-pre-migrate-<ts>.sql` 等のバイナリ/大容量は git 管理外、evidence には「ファイル名 + size + sha256」のみ

## 24h deploy 凍結ルール

- S13 開始から 24 時間は新規 deploy (S6〜S8) を凍結
- 例外: 親 09b incident runbook の P0 hotfix のみ
- `outputs/phase-11/freeze-window.md` に開始 / 終了 timestamp を記録
