# failure-cases

cron / 監視 / runbook で起こり得る失敗 12 種。各ケースに検出方法 / mitigation / 担当 / 不変条件 / 重大度を記載。

## F-1: cron 不動作

- 重大度: P1
- 検出: dashboard で 15 分以上 invocation なし、または `SELECT MAX(started_at) FROM sync_jobs;` の値が 30 分以上前
- mitigation:
  1. wrangler.toml `[triggers]` の存在確認
  2. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で再 deploy
  3. Dashboard Triggers タブで 3 件表示確認
- 担当: release-runbook 担当
- 不変条件: -

## F-2: cron 二重起動

- 重大度: P2
- 検出:
  ```sql
  SELECT COUNT(*) FROM sync_jobs WHERE status='running';
  -- > 1 ならば二重起動疑い
  ```
- mitigation:
  1. 古い running を `failed` 化（cron-deployment-runbook Step 3 の cleanup SQL）
  2. 03b の running guard 強化（`SELECT FOR UPDATE` 相当 or unique index）
- 担当: dev 担当
- 不変条件: AC-6 関連

## F-3: sync 連続 fail

- 重大度: P1
- 検出:
  ```sql
  SELECT id, type, started_at, error FROM sync_jobs
  WHERE status='failed' ORDER BY started_at DESC LIMIT 3;
  -- 3 連続同種 type の failed ならインシデント
  ```
- mitigation:
  1. cron 一時停止（cron-deployment-runbook Step 4）
  2. 直近 error メッセージで原因特定（429 / timeout / parse error 等）
  3. 修正後 cron 再開（Step 5）
- 担当: release-runbook 担当
- 不変条件: -

## F-4: Forms API 429

- 重大度: P2
- 検出: `wrangler tail --config apps/api/wrangler.toml` で `429` または "rate limit" を確認
- mitigation:
  1. 自然 retry（次 cron 周期）を待機
  2. 復旧しない場合 cron 頻度を一時的に下げる（`*/15` → `*/30` で再 deploy、復旧後元に戻す）
- 担当: dev 担当
- 不変条件: -

## F-5: D1 read timeout

- 重大度: P1
- 検出: `wrangler tail` で "timeout"、Cloudflare D1 metrics で query 時間長期化
- mitigation:
  1. 02a/b の query を最適化（index 追加 / N+1 解消）
  2. read 量を減らす（不要な full scan を view に置換）
- 担当: dev 担当
- 不変条件: #10（無料枠）

## F-6: D1 write 上限接近

- 重大度: P1
- 検出: Cloudflare D1 metrics で writes が無料枠 100k 接近
- mitigation:
  1. sync 頻度を一時的に下げる
  2. UPSERT 最適化（差分のみ書く、変更なしならスキップ）
  3. 03b の sync ロジック改善
- 担当: dev 担当
- 不変条件: #10

## F-7: Workers req 上限接近

- 重大度: P1
- 検出: Cloudflare Workers metrics で req が無料枠 100k 接近
- mitigation:
  1. cron 頻度を一時的に下げる
  2. API への重複 call を削減（client cache 強化）
- 担当: dev 担当
- 不変条件: #10、AC-9

## F-8: rollback 不可

- 重大度: P0
- 検出: `wrangler rollback` がエラー終了
- mitigation:
  1. Cloudflare Dashboard → Workers → Deployments → 直前 deploy → "Rollback to this deployment" を手動実行
  2. それでも不可ならば `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で「直前のコード」を再 deploy
- 担当: release-runbook 担当 + release-staging 担当
- 不変条件: -

## F-9: D1 migration 不整合

- 重大度: P0
- 検出: `bash scripts/cf.sh d1 migrations apply` がエラー、または production の table 定義が code と不一致
- mitigation:
  1. **直接 SQL（DROP/ALTER）は禁止**（spec/15-infrastructure-runbook.md 準拠）
  2. 後方互換 fix migration を新規作成
     ```bash
     wrangler d1 migrations create ubm-hyogo-db-prod fix_<issue> --config apps/api/wrangler.toml
     # fix migration を編集（IF NOT EXISTS / ADD COLUMN ... DEFAULT NULL 等）
     bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
     ```
  3. 確認: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` で fix が `Applied`
- 担当: release-staging + release-runbook 担当
- 不変条件: -

## F-10: secret 漏洩

- 重大度: P0
- 検出: log review で `SENTRY_DSN=https://`、`Authorization: Bearer ey...` 等が出力されている
- mitigation:
  1. 該当 secret を即座に rotation（Cloudflare API Token / Sentry DSN / OAuth secret 等）
  2. Cloudflare Secrets を更新（`wrangler secret put` 経由、ただし scripts/cf.sh ラッパー使用）
  3. log を削除（Logpush sink 設定済みの場合は log destination 側でも削除）
  4. postmortem で「secret を log に出した直接原因」を記載し再発防止
- 担当: release-runbook 担当
- 不変条件: -

## F-11: 監視 dashboard URL 変更

- 重大度: P2
- 検出: runbook 走破 R-1 で dashboard URL が 404
- mitigation:
  1. Cloudflare Dashboard で正しい URL を確認
  2. release-runbook.md の placeholder を更新（DRY 化済み env var 命名規則に従う）
  3. infra spec（spec/15）と同期
- 担当: release-runbook 担当
- 不変条件: -

## F-12: apps/web bundle に D1 import

- 重大度: P0（不変条件 #5 違反）
- 検出:
  ```bash
  rg -l 'D1Database' apps/web/.open-next/ apps/web/.vercel/output/ 2>/dev/null
  rg -l '@cloudflare/.*d1' apps/web/src/ 2>/dev/null
  # expected: 0 hit
  ```
- mitigation:
  1. **cron / api 側に rollback は不要**（不変条件は web 側の構造違反）
  2. 02c（apps/web 構造）へ差し戻し、D1 直接 import を削除
  3. apps/web は API 経由（fetch / RSC）でのみ DB アクセスを行う設計に戻す
- 担当: dev 担当
- 不変条件: #5

## まとめ表

| # | 重大度 | 検出 verify | 担当 |
| --- | --- | --- | --- |
| F-1 | P1 | - | release-runbook |
| F-2 | P2 | I-1 | dev |
| F-3 | P1 | I-2 | release-runbook |
| F-4 | P2 | C-1 | dev |
| F-5 | P1 | C-2 | dev |
| F-6 | P1 | C-2 | dev |
| F-7 | P1 | C-4 | dev |
| F-8 | P0 | R-2 | release-runbook |
| F-9 | P0 | R-2 | release-staging |
| F-10 | P0 | log review | release-runbook |
| F-11 | P2 | U-2 | release-runbook |
| F-12 | P0 | U-1 拡張 grep | dev |
