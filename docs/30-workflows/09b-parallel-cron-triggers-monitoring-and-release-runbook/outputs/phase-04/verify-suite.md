# verify-suite

13 ケースを 4 層に分割。各ケースに ID / 期待 / 確認コマンド / 差し戻し先 / 対応 AC を記載。

## 1. unit 層（U-*）— cron / 監視 placeholder の文字列整合

### U-1: wrangler.toml triggers 定義の正本確認

- 対応 AC: AC-1, AC-2, AC-8
- 期待: `apps/api/wrangler.toml` に `crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` が staging / production 双方に存在し、`apps script` や `google.script` 文字列が存在しない
- 確認コマンド:
  ```bash
  rg '^\s*crons\s*=' apps/api/wrangler.toml
  # expected: [triggers] と [env.production.triggers] の 2 箇所で同一表記

  rg -i 'apps[\s_-]?script|google\.script' apps/api/wrangler.toml docs/30-workflows/09b-*/
  # expected: 0 hit（不変条件 #6）
  ```
- 差し戻し: cron 表記不整合 → Phase 5 cron-deployment-runbook に従い修正

### U-2: release runbook の Cloudflare Analytics URL 6 件

- 対応 AC: AC-5
- 期待: release-runbook.md に Workers / D1 / Pages × staging / production = 6 URL 全部が記載
- 確認コマンド:
  ```bash
  rg 'dash\.cloudflare\.com/<account>/(workers|d1|pages)' \
    docs/30-workflows/09b-.../outputs/phase-12/release-runbook.md | wc -l
  # expected: 6 以上
  ```
- 差し戻し: URL 欠落 → Phase 12 release-runbook 修正

### U-3: Sentry / Logpush placeholder の表記統一

- 対応 AC: AC-5
- 期待: release-runbook.md / incident-response-runbook.md に DSN / sink の実値ではなく `<placeholder>` または「未設定」表記のみ
- 確認コマンド:
  ```bash
  rg 'SENTRY_DSN=https://' docs/30-workflows/09b-.../outputs/phase-12/
  # expected: 0 hit（実 DSN 漏洩なし）
  rg 'SENTRY_DSN' docs/30-workflows/09b-.../outputs/phase-12/
  # expected: placeholder としての言及のみ
  ```
- 差し戻し: 実値混在 → Phase 9 secret hygiene へ

## 2. integration 層（I-*）— sync_jobs

### I-1: running guard による二重起動防止

- 対応 AC: AC-6
- 期待: `sync_jobs` に同種 type の `running` 行がある状態で cron が起動した場合、新規 job を作らずに skip する（spec/03-data-fetching.md 準拠）
- 確認コマンド:
  ```bash
  # 試験的に running 行を挿入
  wrangler d1 execute ubm-hyogo-db-staging \
    --command "INSERT INTO sync_jobs(type, status, started_at) VALUES('responses', 'running', datetime('now'));" \
    --config apps/api/wrangler.toml
  # cron 起動を待つ（最大 15 分）または scheduled() を手動実行
  # 確認
  wrangler d1 execute ubm-hyogo-db-staging \
    --command "SELECT COUNT(*) FROM sync_jobs WHERE type='responses' AND status='running';" \
    --config apps/api/wrangler.toml
  # expected: 1（新規 running が増えていない）
  # cleanup
  wrangler d1 execute ubm-hyogo-db-staging \
    --command "UPDATE sync_jobs SET status='failed', error='test cleanup' WHERE status='running' AND error IS NULL;" \
    --config apps/api/wrangler.toml
  ```
- 差し戻し: 二重起動 → 03b へ

### I-2: failed 状態と error メッセージ保存

- 対応 AC: AC-4（incident response の検出ベース）
- 期待: sync 失敗時 `sync_jobs.status='failed'` + `error` カラムに stack/メッセージ保存
- 確認コマンド: spec のみ（contract test は 08a 側で担保）
- 差し戻し: error 未保存 → 03b へ

### I-3: 部分失敗 view model

- 対応 AC: AC-4
- 期待: 一部 response の解釈失敗時、直近成功 view model を返し API response に warning フィールド（`sync_unavailable` ではなく partial 警告）を返す
- 確認コマンド: API contract test（08a）で担保
- 差し戻し: view model 不備 → 03a/03b へ

## 3. runbook 走破層（R-*）

### R-1: release runbook 完全走破（staging）

- 対応 AC: AC-2, AC-3
- 期待: release-runbook.md の go-live フローを staging で完走、各 sanity check が exit 0
- 確認コマンド:
  ```bash
  # 09a が staging deploy 完了後、本 runbook で go-live セクションの sanity step を実行
  bash scripts/cf.sh deploy --config apps/api/wrangler.toml # staging
  bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging  # 後方互換確認
  # cron triggers 確認
  wrangler deployments list --config apps/api/wrangler.toml | head -3
  # Cloudflare Dashboard で Triggers タブを目視確認（NON_VISUAL のため screenshot N/A）
  ```
- 差し戻し: いずれかの step 失敗 → Phase 5 該当 step 修正

### R-2: rollback 手順走破（worker / pages）

- 対応 AC: AC-3, AC-7
- 期待: staging で worker rollback → pages rollback → 直前 deploy に戻る、その後 rollforward で最新に戻る
- 確認コマンド:
  ```bash
  # worker rollback
  wrangler deployments list --config apps/api/wrangler.toml | head -5
  wrangler rollback <prev_id> --config apps/api/wrangler.toml
  curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
  # expected: HTTP/2 200

  # pages rollback は Dashboard 操作（NON_VISUAL）
  # 不変条件 #5 確認: rollback コマンド一覧に apps/web 内 D1 操作が含まれていないことを grep で確認
  rg 'wrangler d1.*--config apps/web' docs/30-workflows/09b-.../outputs/phase-12/release-runbook.md
  # expected: 0 hit
  ```
- 差し戻し: rollback 失敗 → Phase 6 rollback-procedures 修正

### R-3: cron 一時停止 → sync 停止 → 再開 → sync 再開

- 対応 AC: AC-3, AC-4
- 期待: `crons = []` に変更後再 deploy → 15 分以上待機しても新規 sync_jobs 行なし → 元の crons に戻して再 deploy → 次 `*/15` で新規 running が出現
- 確認コマンド:
  ```bash
  # 一時停止
  # wrangler.toml の [triggers] crons = [] に変更（spec 上の手順）
  wrangler deploy --config apps/api/wrangler.toml
  sleep 900  # 15 分
  wrangler d1 execute ubm-hyogo-db-staging \
    --command "SELECT COUNT(*) FROM sync_jobs WHERE started_at > datetime('now', '-15 minutes');" \
    --config apps/api/wrangler.toml
  # expected: 0
  # 再開
  # wrangler.toml の crons を元に戻して deploy
  wrangler deploy --config apps/api/wrangler.toml
  sleep 900
  # expected: > 0
  ```
- 差し戻し: cron 制御不可 → Phase 5 cron-deployment-runbook 修正

## 4. chaos 層（C-*）

### C-1: Forms API 429

- 対応 AC: AC-4
- 期待: sync_jobs.failed + error に "rate limit" 含む。次 cron で自然 retry
- 確認コマンド: 03a/03b の chaos test で担保。本層では runbook の対応手順（mitigation）が記載されていることを確認
  ```bash
  rg -i '429|rate limit' docs/30-workflows/09b-.../outputs/phase-06/failure-cases.md
  # expected: 1 hit 以上
  ```
- 差し戻し: 03a/03b へ

### C-2: D1 read timeout

- 対応 AC: AC-4
- 期待: sync_jobs.failed + error に "timeout"。runbook に query 最適化の mitigation 記載
- 確認コマンド: failure-cases.md の F-5 を確認
- 差し戻し: 03a/03b へ

### C-3: deploy 中の cron 起動

- 対応 AC: AC-6
- 期待: 既存 running が完走するまで新規 cron は skip。途中で deploy 完了しても二重起動なし
- 確認コマンド: I-1 と同等の running guard で担保
- 差し戻し: 03b へ + Phase 5 修正

### C-4: 無料枠 100k req/day 接近

- 対応 AC: AC-9
- 期待: Cloudflare Analytics で接近 alert（placeholder）+ 試算で 121 req/day（cron のみ）が 100k の 0.121% であることを runbook に記載
- 確認コマンド:
  ```bash
  # 試算記載確認
  rg '100k|100,000|0.121%|121 req/day' \
    docs/30-workflows/09b-.../outputs/phase-09/main.md \
    docs/30-workflows/09b-.../outputs/phase-12/release-runbook.md
  # expected: 1 hit 以上
  ```
- 差し戻し: 試算不備 → Phase 9 修正

## 5. 全 AC 対応 matrix

| AC | suite |
| --- | --- |
| AC-1 | U-1 |
| AC-2 | U-1, R-1 |
| AC-3 | R-1, R-2, R-3 |
| AC-4 | I-2, I-3, C-1, C-2, R-3 |
| AC-5 | U-2, U-3 |
| AC-6 | I-1, C-3 |
| AC-7 | R-2 |
| AC-8 | U-1 |
| AC-9 | C-4 |

未対応 AC: **0 件**。
