# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

staging deploy 〜 sync 検証 〜 Playwright 〜 smoke を、コピペで実行可能な command + 擬似コード + sanity check 付きの runbook として固定する。本タスクは spec_created なのでコードは書かず placeholder で残す。

## 実行タスク

1. 11 ステップの staging deploy runbook を作成
2. 各ステップの sanity check を記述
3. 擬似コード（curl / wrangler / pnpm）の placeholder を提示
4. 09b の release runbook 本体に redirect する箇所を明示

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / D1 migration / secret 操作 |
| 必須 | docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/index.md | sync endpoint 仕様 |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-02.md | フロー設計 |
| 参考 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | release runbook 本体 |

## 実行手順

### ステップ 1: runbook 雛形作成
- `outputs/phase-05/staging-deploy-runbook.md` に 11 ステップを書く

### ステップ 2: 各ステップに sanity check 追加
- 失敗時の差し戻し先を 11 ステップ全てに記載

### ステップ 3: placeholder と擬似コード
- 実コマンドを placeholder で書き、09b 完成時に実 URL を埋める指示を残す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の各ステップに対応する failure case を作る |
| Phase 11 | runbook を実行して staging green を取る |
| 並列 09b | release runbook 内から本 staging runbook を参照 |
| 下流 09c | 本 runbook を production 用に転用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: runbook で `apps/web` の D1 binding を確認するステップを含める
- 不変条件 #10: runbook 末尾に Cloudflare Analytics 確認ステップを含める
- 不変条件 #11: runbook の手動 smoke で admin UI 編集 form 不在確認を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 11 ステップ runbook 作成 | 5 | pending | コピペ可能形式 |
| 2 | sanity check 記述 | 5 | pending | 各ステップ |
| 3 | placeholder と擬似コード | 5 | pending | 実値は 09b で埋める |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook サマリ |
| ランブック | outputs/phase-05/staging-deploy-runbook.md | 11 ステップ詳細 |
| メタ | artifacts.json | Phase 5 実行時に artifacts.json を更新 |

## 完了条件

- [ ] 11 ステップ runbook が完成
- [ ] 各ステップに sanity check と差し戻し先記載
- [ ] 擬似コードが pnpm / wrangler / curl の 3 種を含む

## タスク100%実行確認【必須】

- 全実行タスクが実行時に完了条件を満たす
- runbook が 11 ステップ完成
- sanity check が 11 件全て記載
- artifacts.json の phase 5 は実行時に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 11 ステップ runbook と sanity check
- ブロック条件: runbook 未完成、または sanity check 未記載のステップが 1 つでもあれば次 Phase に進まない

## 11 ステップ staging deploy runbook（擬似コード）

### Step 1: staging branch 同期確認
```bash
git fetch origin
git log origin/dev..HEAD --oneline
```
- sanity: 未 push commit が 0 件、ahead/behind が 0
- 差し戻し: feature branch を dev へマージしてやり直し

### Step 2: D1 staging migration 確認
```bash
wrangler d1 migrations list ubm_hyogo_staging --config apps/api/wrangler.toml
```
- sanity: 未適用 migration が 0 件 / 全 `Applied`
- 差し戻し: `wrangler d1 migrations apply ubm_hyogo_staging --remote --config apps/api/wrangler.toml`

### Step 3: staging secrets 確認
```bash
wrangler secret list --config apps/api/wrangler.toml
wrangler pages secret list --project-name ubm-hyogo-web-staging
```
- sanity: api 4 種 + pages 3 種 = 計 7 secrets 存在
- 差し戻し: 04 (infra) で `wrangler secret put` で再登録

### Step 4: GitHub Actions deploy-staging 起動
```bash
git push origin dev
gh run watch --exit-status
```
- sanity: lint / typecheck / test / build / migrate / deploy 全 step green
- 差し戻し: failed step に応じて 08a / 04 / 06* へ

### Step 5: staging deploy 完了確認
```bash
curl -sI https://ubm-hyogo-web-staging.pages.dev | head -1
curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
```
- sanity: HTTP/2 200
- 差し戻し: deploy log を確認、wrangler エラーなら infra へ

### Step 6: staging で schema sync 手動実行
```bash
ADMIN_TOKEN=$(gh secret get STAGING_ADMIN_TOKEN)  # placeholder
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://ubm-hyogo-api-staging.<account>.workers.dev/admin/sync/schema | jq .
```
- sanity: response に `jobId` と `status: "success"` が含まれる
- 差し戻し: 03a へ（schema sync 実装）

### Step 7: staging で responses sync 手動実行
```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://ubm-hyogo-api-staging.<account>.workers.dev/admin/sync/responses | jq .
```
- sanity: 同上 + `member_responses` が更新される
- 差し戻し: 03b へ

### Step 8: sync_jobs 結果確認
```bash
wrangler d1 execute ubm_hyogo_staging \
  --command "SELECT id, type, status, started_at, finished_at, error FROM sync_jobs ORDER BY started_at DESC LIMIT 5;" \
  --config apps/api/wrangler.toml
```
- sanity: 直近 2 件が `success`、`error` カラムが NULL
- 差し戻し: 03a / 03b へ。出力を `outputs/phase-11/sync-jobs-staging.json` に保存

### Step 9: staging で Playwright 再実行
```bash
BASE_URL=https://ubm-hyogo-web-staging.pages.dev \
API_BASE_URL=https://ubm-hyogo-api-staging.<account>.workers.dev \
pnpm --filter @ubm/web test:e2e -- --reporter=html
```
- sanity: 全 spec が pass、screenshot が `outputs/phase-11/playwright-staging/` に出る
- 差し戻し: failing spec の責務 task へ（例: AuthGateState fail → 05b）

### Step 10: 10 ページ手動 smoke
```text
URL list:
- https://ubm-hyogo-web-staging.pages.dev/
- https://ubm-hyogo-web-staging.pages.dev/members
- https://ubm-hyogo-web-staging.pages.dev/members/<sample memberId>
- https://ubm-hyogo-web-staging.pages.dev/login
- https://ubm-hyogo-web-staging.pages.dev/profile
- https://ubm-hyogo-web-staging.pages.dev/admin
- https://ubm-hyogo-web-staging.pages.dev/admin/members
- https://ubm-hyogo-web-staging.pages.dev/admin/tags
- https://ubm-hyogo-web-staging.pages.dev/admin/schema
- https://ubm-hyogo-web-staging.pages.dev/admin/meetings
```
- sanity: 公開 4 / member 1 / admin 5 が 200、未ログインで `/profile` `/admin/*` は redirect、admin gate を通過しない user は 403
- 差し戻し: 該当 06* タスクへ

### Step 11: 無料枠と #5 ガード確認
```bash
# Cloudflare Analytics URL を runbook 末尾に貼る
echo "https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics"
echo "https://dash.cloudflare.com/<account>/d1/databases/ubm_hyogo_staging/metrics"

# apps/web bundle に D1Database import がないか
rg -n "D1Database" apps/web/.vercel/output || echo "OK: no D1 import in web bundle"
```
- sanity: Workers req 30k 以下 / D1 reads 50k 以下 / web bundle に D1 import なし
- 差し戻し: 02c data-access-boundary または 04c へ

## 各ステップ後の sanity check（共通）

- scope 外サービス（production / cron）に触れていないか
- secret を ログ出力していないか
- artifacts.json に途中状態を反映したか
- 09b の release runbook を上書きしていないか
