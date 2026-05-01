# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

cron deployment / 一時停止 / 再開、release 全体フロー、incident response の各 runbook を、コピペ可能な command + 擬似コード + sanity check 付きで固定する。本タスクは spec_created なので wrangler.toml は placeholder で残す。

## 実行タスク

1. cron deployment runbook（toml 記述 / wrangler triggers list 確認 / 一時停止 / 再開）を作成
2. release 全体 runbook の擬似コードを `outputs/phase-05/main.md` に配置
3. incident response runbook の擬似手順を作成
4. 各 runbook の sanity check を記述

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / cron / D1 |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync_jobs running |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-02.md | 設計 |
| 参考 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | staging runbook（用語統一） |

## 実行手順

### ステップ 1: cron deployment runbook
- `outputs/phase-05/cron-deployment-runbook.md` を作成

### ステップ 2: release 全体 runbook 擬似コード
- `outputs/phase-05/main.md` に擬似コードを配置（最終版は Phase 12 で `outputs/phase-12/release-runbook.md`）

### ステップ 3: incident response 擬似手順

### ステップ 4: sanity check 記述

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | failure case を runbook ステップに紐付け |
| Phase 11 | runbook 走破 evidence を取得 |
| 並列 09a | release runbook 内で staging runbook を参照 |
| 下流 09c | release runbook を production deploy で使用 |

## 多角的チェック観点（不変条件）

- #5: rollback runbook で web 側 D1 操作を含めない
- #6: cron runbook で apps script trigger を含めない
- #10: cron 頻度試算を runbook に記載
- #15: rollback runbook で attendance 整合性 step を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | cron deployment runbook | 5 | pending | wrangler triggers |
| 2 | release 全体 runbook 擬似 | 5 | pending | go-live + rollback |
| 3 | incident response 擬似 | 5 | pending | initial / escalation / postmortem |
| 4 | sanity check 記述 | 5 | pending | 各 runbook |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ランブック | outputs/phase-05/cron-deployment-runbook.md | cron 配信 / 一時停止 / 再開 |
| メタ | artifacts.json | Phase 5 を completed に更新 |

## 完了条件

- [ ] 3 runbook の擬似コードが完成
- [ ] 各 sanity check 記載
- [ ] 09a / 09c との用語統一

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 2 ファイル配置済み
- artifacts.json の phase 5 を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 3 runbook 擬似コード
- ブロック条件: いずれかの runbook が未完成で次 Phase に進まない

## cron-deployment-runbook（擬似）

### Step 1: wrangler.toml に triggers を記述

```toml
# apps/api/wrangler.toml（spec_created：実装は 03b 以降の wave で）
name = "ubm-hyogo-api-staging"
main = "src/index.ts"
compatibility_date = "2026-04-26"

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<staging_database_id>"

[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]

[env.production]
name = "ubm-hyogo-api"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<production_database_id>"

[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

- sanity: cron expression 3 件、production env でも triggers が同一
- 差し戻し: cron 表記が 5 フィールドであるか / `[env.production.triggers]` が漏れていないか

### Step 2: deploy 後 trigger 確認

```bash
wrangler deployments list --config apps/api/wrangler.toml
# Cloudflare Dashboard:
# https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/triggers
```

- sanity: dashboard で cron 3 件表示
- 差し戻し: 表示されない場合 `wrangler deploy --config apps/api/wrangler.toml` を再実行

### Step 3: 二重起動防止確認

```bash
wrangler d1 execute ubm-hyogo-db-staging \
  --command "SELECT id, type, status, started_at FROM sync_jobs WHERE status='running';" \
  --config apps/api/wrangler.toml
```

- sanity: 0 件（cron 起動時に running があれば skip される設計を 03b で実装）
- 差し戻し: 古い running が残ってる場合は `UPDATE sync_jobs SET status='failed', error='timeout' WHERE status='running' AND started_at < datetime('now', '-30 minutes');`

### Step 4: cron 一時停止（incident 時）

```bash
# 方法 A: wrangler.toml の [triggers] crons を空配列にして再 deploy
# crons = []
wrangler deploy --config apps/api/wrangler.toml

# 方法 B: Cloudflare Dashboard で個別 trigger を disable（手動）
```

- sanity: dashboard で cron 0 件
- 差し戻し: cron が止まらない場合 wrangler.toml の env が production / staging で混在していないか確認

### Step 5: cron 再開

```bash
# wrangler.toml の crons を元に戻して再 deploy
wrangler deploy --config apps/api/wrangler.toml
```

- sanity: 次の `*/15` で sync_jobs に新規 running が出る

## release-runbook 擬似（Phase 12 で完成版）

### go-live 全体フロー

1. `dev` → `main` PR を merge（branch 戦略）
2. GitHub Actions `deploy-production` が起動
3. D1 production migration 適用
4. wrangler deploy production
5. `wrangler triggers list` で cron 3 件確認
6. 09c で post-release verification

### rollback フロー（worker / pages）

```bash
# 直前 deploy id を取得
wrangler deployments list --config apps/api/wrangler.toml --env production | head -5

# rollback
wrangler rollback <deploy_id> --config apps/api/wrangler.toml --env production

# pages rollback は Cloudflare Dashboard → Deployments → 直前 deploy → Rollback
```

- sanity: rollback 後に `curl -sI .../public/stats` で 200
- 注意: D1 migration の rollback は backward-compatible にしてあるため通常 SQL を流さない（spec/15-infrastructure-runbook.md 準拠）

### cron 制御フロー

- 一時停止: cron-deployment-runbook Step 4
- 再開: cron-deployment-runbook Step 5
- 手動実行: `POST /admin/sync/schema`, `POST /admin/sync/responses`

### dashboard URL

- Workers staging: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics`
- Workers production: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics`
- D1 staging: `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-staging/metrics`
- D1 production: `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-prod/metrics`
- Pages staging: `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web-staging`
- Pages production: `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web`

## incident-response-runbook 擬似（Phase 12 で完成版）

### initial response（5 分以内）

1. dashboard で error 多発 / sync_jobs.failed 急増を観測
2. cron 一時停止（cron-deployment-runbook Step 4）
3. 直前 deploy への rollback 実施

### escalation matrix

| 重大度 | 内容 | 対応者 | 通知先 placeholder |
| --- | --- | --- | --- |
| P0 | production 全停止 | release-staging + release-runbook 担当 | Slack: #ubm-hyogo-prod-incident（placeholder）, Email: admin@ubm-hyogo.example（placeholder） |
| P1 | sync 完全停止 / authn 不可 | release-runbook 担当 | Slack: #ubm-hyogo-prod-incident |
| P2 | sync 遅延 / 部分機能停止 | dev 担当 | Slack: #ubm-hyogo-dev |

### postmortem template

```markdown
# Postmortem: <incident title>
- date: YYYY-MM-DD
- severity: P0 / P1 / P2
- duration: HH:MM
- detection: how
- root cause: …
- mitigation: …
- timeline: …
- action items: …
```

## 各ステップ後の sanity check（共通）

- secret を log に出力していないか
- production と staging を取り違えていないか
- artifacts.json に途中状態を反映したか
- 09a の runbook と用語が揃っているか
