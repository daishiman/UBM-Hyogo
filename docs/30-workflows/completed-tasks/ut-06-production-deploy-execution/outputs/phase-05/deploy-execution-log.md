# Phase 5: 本番デプロイ実行ログ

> **ステータス: NOT EXECUTED (未実行)**
> **理由:** 本タスク (UT-06) はユーザー指示により「ドキュメントのみ作成」モードで進行。本番 Cloudflare 環境への wrangler deploy / d1 migrations apply / d1 export 等の不可逆コマンドは発火していません。本テンプレートは本番デプロイ実行時にオペレーターが実値で埋めるためのものです。

## 1. 実施メタ情報テンプレ (AC-6 必須)

| 項目 | 値 |
| --- | --- |
| 実施日時 (開始) | TBD (YYYY-MM-DD HH:MM:SS JST) |
| 実施日時 (完了) | TBD |
| 実施者 | TBD (GitHub handle) |
| 立会レビュアー | TBD |
| wrangler バージョン | TBD (`wrangler --version` の出力) |
| Node.js バージョン | 24.15.0 (`.mise.toml` 固定) |
| pnpm バージョン | 10.33.2 (`.mise.toml` 固定) |
| 対象ブランチ | main |
| コミット SHA | TBD (`git rev-parse HEAD`) |
| 初回デプロイ判定 | TBD (YES / NO) |

## 2. リソース別実行記録

| # | リソース | コマンド要約 | デプロイ ID / version_id | 開始 | 完了 | 結果 | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | D1 backup | `wrangler d1 export <DB_NAME> --env production --output outputs/phase-05/backup-${TS}.sql` | n/a | TBD | TBD | pending | バックアップファイル名 (空 export 可) |
| 2 | D1 migration | `wrangler d1 migrations apply <DB_NAME> --env production` | n/a | TBD | TBD | pending | 適用件数 1 (`apps/api/migrations/0001_init.sql`) |
| 3 | API Workers (apps/api) | `wrangler deploy --env production` | TBD | TBD | TBD | pending | service name: ubm-hyogo-api 想定 |
| 4 | OpenNext Workers (apps/web) | `wrangler deploy --config apps/web/wrangler.toml --env production` | TBD | TBD | TBD | pending | OpenNext adapter 経由 |
| 5 | smoke: Pages 200 | `curl -sI https://<web-url>` | n/a | TBD | TBD | pending | response (期待: HTTP 200) |
| 6 | smoke: /health | `curl -sS https://<api-host>/health` | n/a | TBD | TBD | pending | 期待: `{"status":"healthy"}` |
| 7 | smoke: D1 SELECT | `curl -sS https://<api-host>/health/db` | n/a | TBD | TBD | pending | 1 件 SELECT 成功 |

## 3. 総合判定

| 項目 | 値 |
| --- | --- |
| 総合結果 | TBD (PASS / FAIL) |
| Phase 6 への遷移要否 | TBD |
| 次アクション | TBD |

## 4. 実行コマンドプリセット (順次実行)

### ステップ 1: D1 バックアップ取得 (AC-7)

```bash
TS=$(date +%Y%m%d-%H%M%S)
bash scripts/cf.sh d1 export <DB_NAME> \
  --env production \
  --output "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
wc -l "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
```

### ステップ 2: D1 マイグレーション本番適用 (AC-3)

```bash
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production
bash scripts/cf.sh d1 migrations apply <DB_NAME> --env production
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production
bash scripts/cf.sh d1 execute <DB_NAME> --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### ステップ 3: API Workers (apps/api) 本番デプロイ (AC-2)

```bash
cd apps/api
bash scripts/cf.sh deploy --env production
bash scripts/cf.sh deployments list --env production | head -n 5
curl -sS -o /dev/null -w "%{http_code}\n" https://<api-host>/health
```

### ステップ 4: OpenNext Workers (apps/web) 本番デプロイ (AC-1)

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production | head -n 5
curl -sS -o /dev/null -w "%{http_code}\n" https://<web-url>
```

### ステップ 5: 即時 smoke test (AC-1 / AC-2 / AC-4 / AC-5)

```bash
curl -sI https://<web-url> | head -n 1                  # AC-1
curl -sS https://<api-host>/health                       # AC-2
curl -sS https://<api-host>/health/db                    # AC-4
```

## 5. 失敗時の即時アクション (Phase 6 への委譲基準)

| 失敗箇所 | 即時アクション | Phase 6 シナリオ |
| --- | --- | --- |
| ステップ 1 (D1 backup 失敗) | ステップ 2 以降を実行しない・Phase 4 verify suite と権限を再確認 | A-3 前段 |
| ステップ 2 (migration 適用失敗) | バックアップから手動リストアを実施 | A-3 |
| ステップ 3 (Workers デプロイ失敗) | Workers のみロールバック・D1 リストア要否を判断 | A-2 |
| ステップ 4 (OpenNext Workers デプロイ失敗) | Pages のみロールバック・Workers/D1 ロールバック要否を判断 | A-1 |
| ステップ 5 (smoke test 失敗) | 失敗箇所に応じて全系統ロールバック検討 | A-4 / A-5 / A-6 |

**判断者:** delivery 担当 + レビュアー 1 名
**判断 SLA:** 失敗検出から 5 分以内に Phase 6 シナリオへ遷移するか再試行するかを判断

## 6. AC 到達状況 (実行時更新)

| AC | 内容 | 本ドキュメント該当箇所 | 達成状況 |
| --- | --- | --- | --- |
| AC-1 | Web 本番 URL 200 OK | リソース #4, smoke #5 | pending |
| AC-2 | /health healthy | リソース #3, smoke #6 | pending |
| AC-3 | D1 migrations 履歴記録 | リソース #2 + migration-apply-record.md | pending |
| AC-4 | Workers→D1 SELECT | smoke #7 | pending |
| AC-5 | smoke 全件 PASS | smoke #5/6/7 | pending |
| AC-6 | 実施記録文書化 | 本ファイル全体 | template-ready |
| AC-7 | D1 backup 取得 | リソース #1 + d1-backup-evidence.md | pending |
