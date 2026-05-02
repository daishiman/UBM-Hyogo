# Phase 3 main: 実装計画（コマンド列 + rollback 分岐）

## Phase 5 (preflight) コマンド列 — dry-run only

```bash
# S1: main 昇格 evidence
git fetch origin main
git rev-parse origin/main
git log -1 origin/main --format='%H %ci %s'

# S2: account identity
bash scripts/cf.sh whoami

# S3: D1 identity / binding confirmation のみ (backup は Phase 6 で取得)
rg -n "database_name|binding_name|database_id" apps/api/wrangler.toml

# S4: migrations list (dry-run)
bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml

# S5: secrets list (api / web)
bash scripts/cf.sh secret list --env production --config apps/api/wrangler.toml
bash scripts/cf.sh pages secret list --project-name ubm-hyogo-web

# 直前 production version id (rollback 先) を控える
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production | head -3 \
  | tee outputs/phase-05/prev-api-version.md
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -3 \
  | tee outputs/phase-05/prev-web-version.md
```

## Phase 6 (D1 migration) コマンド列

```bash
TS="$(date +%Y%m%d-%H%M%S)"
bash scripts/cf.sh d1 export ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --output "backup-pre-migrate-${TS}.sql" \
  | tee outputs/phase-06/d1-backup-export.log

bash scripts/cf.sh d1 migrations apply ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-06/d1-migration-apply.log

bash scripts/cf.sh d1 migrations list ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  | tee outputs/phase-06/d1-migrations-list-post.log
```

**rollback (S6 失敗時)**:
```bash
bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --file "backup-pre-migrate-<ts>.sql" \
  | tee outputs/phase-06/d1-rollback-evidence.log
```

## Phase 7 (api / web deploy)

```bash
pnpm --filter @ubm/api deploy:production | tee outputs/phase-07/api-deploy.log
pnpm --filter @ubm/web deploy:production | tee outputs/phase-07/web-deploy.log

bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production | head -5
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -5
```

**rollback**:
```bash
bash scripts/cf.sh rollback "<PREV_API_VERSION_ID>" \
  --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-07/api-rollback-evidence.log
bash scripts/cf.sh rollback "<PREV_WEB_VERSION_ID>" \
  --config apps/web/wrangler.toml --env production \
  | tee outputs/phase-07/web-rollback-evidence.log
```

## Phase 8 (release tag) — JST 固定

```bash
TAG="v$(TZ=Asia/Tokyo date +%Y%m%d-%H%M)"
git tag -a "$TAG" -m "release: $TAG (production deploy of $(git rev-parse --short origin/main))"
git push origin "$TAG"
git ls-remote --tags origin "$TAG" | tee outputs/phase-08/release-tag-evidence.md
```

**tag 削除**:
```bash
git tag -d "$TAG"
git push origin ":refs/tags/$TAG"
```

## Phase 9 (smoke + 認可境界)

```bash
for path in / /events /forms /members /profile /admin /admin/members /admin/events /api/health /api/version; do
  curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" "https://<production-web-url>$path"
done | tee outputs/phase-09/smoke-http.log

curl -sS -o /dev/null -w "anon /admin: %{http_code}\n" "https://<production-web-url>/admin" | tee -a outputs/phase-09/smoke-http.log

bash scripts/cf.sh d1 execute ubm_hyogo_production \
  --remote --env production --config apps/api/wrangler.toml \
  --command "SELECT event_id, member_id, COUNT(*) c FROM attendance WHERE deleted_at IS NULL GROUP BY 1,2 HAVING c > 1;" \
  | tee outputs/phase-09/invariant-15.log
```

## Phase 11 (24h verify)

- Cloudflare Workers Analytics dashboard で過去 24h の Workers req / D1 reads / writes をスクリーンショット → `outputs/phase-11/screenshots/`
- 数値を `outputs/phase-11/24h-metrics.md` に記入（無料枠比 = req / 100k * 100, reads / 5M * 100, writes / 100k * 100）
- 不変条件 #10 PASS 条件: それぞれ無料枠 10% 以下

## rollback トリガー × 実行コマンド分岐表

| トリガー | 担当 Phase | コマンド | evidence |
| --- | --- | --- | --- |
| S6 migration 失敗 | 6 | `bash scripts/cf.sh d1 execute --file backup-<ts>.sql` | outputs/phase-06/d1-rollback-evidence.log |
| S7 api deploy 失敗 / S10 認可境界違反 | 7/9 | `bash scripts/cf.sh rollback <PREV_API_VERSION_ID>` | outputs/phase-07/api-rollback-evidence.log |
| S8 web deploy 失敗 | 7 | `bash scripts/cf.sh rollback <PREV_WEB_VERSION_ID>` | outputs/phase-07/web-rollback-evidence.log |
| S9 release tag 誤付与 | 8 | `git tag -d` + `git push origin :refs/tags/<TAG>` | outputs/phase-08/tag-rollback-evidence.md |
| S11 NO-GO | 10 | api/web rollback 順次 (D1 非互換なら restore) | outputs/phase-10/rollback-evidence.md |
| S13 24h incident | 11 | 親 09b incident runbook P0/P1 経路 | outputs/phase-11/incident-evidence.md |

## Phase 1 open question clearance

| Q | 結論 |
| --- | --- |
| Q1 (G2 失敗時の戻り先) | Phase 5 内で **最大 1 回まで retry**、2 回目失敗で Phase 2 まで戻し設計欠陥を疑う |
| Q2 (24h 中の hotfix 承認) | 親 09b incident runbook P0 経路、本タスク追加承認不要。`outputs/phase-11/incident-evidence.md` に「凍結ルール例外発動」記録 |
| Q3 (release tag HHMM 基準) | **JST**（`TZ=Asia/Tokyo date +%Y%m%d-%H%M`） |

## dry-run / apply 表記規約

- 全 evidence ログ末尾に `[DRY-RUN] <ISO8601>` または `[APPLIED] <ISO8601>` を 1 行追加
- preflight (Phase 5) は `[DRY-RUN]` のみ
- Phase 6〜8 は `[APPLIED]` 必須
- Phase 12 grep で混在 / 欠落を検出

## 4 条件評価 運用性 PASS 昇格根拠

- api/web/D1/tag の rollback コマンドが本 Phase で全種事前確定
- rollback トリガー × 実行表が 6 行
- → **運用性 TBD → PASS** に昇格
