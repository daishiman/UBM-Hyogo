---
task: UT-17
recorded: 2026-05-09
topics: [monitoring, alert, secrets, slack, cloudflare, observability]
related-references:
  - references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md
  - docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/system-spec-update-summary.md
  - docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/skill-feedback-report.md
  - docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md
  - docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md
classification: [security/secrets, implementation/payload-shape, design/responsibility-boundary, operations/silent-failure]
---

# Lessons Learned — UT-17 Cloudflare Analytics Alerts (2026-05)

UT-17（Cloudflare Notifications → /internal/alert-relay → Slack 日本語化リレー）の Phase 1-13 実装で得た 4 教訓を classification-first で整理する。phase-12.md L37, L143-146 と `outputs/phase-12/skill-feedback-report.md` を出典とする。

---

## 1. セキュリティ / Secrets 漏洩防止

### 概要
Slack Incoming Webhook URL（`https://hooks.slack.com/services/T.../B.../...`）は GitHub の secret scanning 対象であり、PR 本文・docs・commit message に貼ると即座に検知され、Slack 側で URL が revoke される。

### なぜ重要か
- revoke されると alert relay が silent failure に陥る（HTTP 200 を返す Slack 側 mock を期待していると検知不能）。
- 再発行・Cloudflare Secrets 投入・staging/production 両環境への redeploy が必要となり復旧コストが高い。
- 一度 git history に commit すると force-push でも完全には消えない（GitHub cache）。

### 再発防止アクション
- Phase 7 の grep gate で `hooks.slack.com/services/` 文字列を repo 全体から走査し fail させる（既存 verify ジョブに統合）。
- Webhook URL 正本は **1Password の `op://UBM-Hyogo/Slack Webhooks/usage-alerts`** に置き、`bash scripts/cf.sh secret put SLACK_WEBHOOK_URL` 経由で Cloudflare Secrets に注入する。
- docs / PR テンプレ / runbook には placeholder（`<SLACK_WEBHOOK_URL>` または op 参照表記）のみを記述する。
- CODEOWNERS で `apps/api/src/lib/slack-sender.ts` を owner レビュー対象として明示し、誤コミットを stop gap で塞ぐ。

### 関連 reference
- `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md` § Secrets
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/skill-feedback-report.md` 教訓 #1

---

## 2. 実装 / Cloudflare Notification payload 多形性

### 概要
Cloudflare Notifications webhook が送る JSON の `data` フィールドは、metric / policy 種別ごとに構造が異なる（usage alert・WAE custom・健全性 alert で key 名・nest 構造が変わる）。strict typing で固定すると未知 metric が来たとき parse error で 500 を返してしまい、Cloudflare 側で再送が止まる。

### なぜ重要か
- Cloudflare の policy 種別は将来増える（Workers CPU, R2 Class A, KV reads 等）。
- `apps/api/src/lib/cloudflare-alert-formatter.ts` を policy 単位で書き分けると、新規 policy 追加時にコード変更 + redeploy が必要になり Operability が下がる。
- 通知が届かない silent failure と同程度に「未知 payload を握り潰す silent success」も危険。

### 再発防止アクション
- formatter は **generic fallback** を優先設計し、既知の policy_id にだけ日本語整形を適用、未知は raw JSON を code block で Slack に貼る fallback パスを残す。
- Zod schema は `passthrough()` モードで unknown key を許容し、parse 失敗時は 4xx ではなく fallback formatter に流す。
- `apps/api/src/types/cloudflare-notifications.ts` の型定義は「必須 key の最小集合」のみ厳密化し、`data: Record<string, unknown>` で受ける。
- Phase 7 unit test に「未知 policy_id を受けても 200 を返し fallback message を生成する」ケースを必須化する。

### 関連 reference
- `apps/api/src/lib/cloudflare-alert-formatter.ts`
- `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts`
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/skill-feedback-report.md` 教訓 #2

---

## 3. 設計 / UT-08-IMPL と UT-17 の責務分離

### 概要
UT-08-IMPL（Workers Analytics Engine custom alerts）と UT-17（Cloudflare native usage alerts）は両方とも「Slack に通知を出す」goal を持つため、責務境界を Phase 2 で明示しないと formatter / sender / endpoint の重複実装が発生する。

### なぜ重要か
- 重複実装は Webhook URL の二重消費（Slack rate limit）と「同じ event を 2 回通知してしまう」運用ノイズの原因になる。
- どちらが正本かが曖昧になり、修正パッチの投入先が PR ごとにブレる。

### 再発防止アクション
- 責務境界を以下で固定する:
  - **UT-17**: Cloudflare Dashboard で設定する **Notification Policy → webhook destination**（usage / health / quota）。形式は Cloudflare 固定の JSON envelope。
  - **UT-08-IMPL**: Workers Analytics Engine から SQL で抽出した **アプリ固有メトリクス**（form 提出失敗率・Auth 失敗率等）。Workers Cron が Slack へ直接 POST。
- 共有層は `apps/api/src/lib/slack-sender.ts` の **送信プリミティブのみ**。formatter は別ファイルで、入力型も分離する（`CloudflareNotificationPayload` ≠ `WaeAlertPayload`）。
- `references/observability-monitoring.md` と `references/workflow-ut08-monitoring-alert-design-artifact-inventory.md` に責務境界マトリクスを追記する。

### 関連 reference
- `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md`
- `references/workflow-ut08-monitoring-alert-design-artifact-inventory.md`
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/skill-feedback-report.md` 教訓 #3

---

## 4. 運用 / Slack Webhook silent failure 検知

### 概要
Slack Webhook URL が revoke されている場合、`POST https://hooks.slack.com/...` は HTTP 404 を返すが、Cloudflare Workers ログを daily で誰も見ないと**完全に silent failure**になる。usage alert は月数回しか発火しないため、テスト送信なしでは数ヶ月気付かない可能性が高い。

### なぜ重要か
- 兵庫支部会の月次運用において、Cloudflare 無料枠超過アラートを取りこぼすと、課金事故・サービス停止に直結する。
- Cloudflare 側の Notification Policy には「failed delivery 通知」がない（destination ack をチェックしない）。

### 再発防止アクション
- **月次 runbook を HIGH 優先度** で運用: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`。
  - 毎月 1 日 09:00 JST に手動で staging / production の `/internal/alert-relay` に test payload を POST。
  - Slack #ops-alerts に「[HEALTHCHECK] UT-17 monthly probe — 2026-MM-01」が届くこと（日本語整形が崩れていないこと含む）を目視確認。
  - 結果を runbook 末尾に append（実施日 / 実施者 / 結果）。
- Cloudflare Workers の `wrangler tail` を月次健診時に並行起動し、Slack 側の HTTP status を ログで確認する手順を runbook に明記。
- 将来的に Workers Cron で weekly synthetic probe を自動化する extension を `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` § Future Work に記載済み。

### 関連 reference
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/skill-feedback-report.md` 教訓 #4

---

## 横断サマリ

| 教訓 | classification | 主要 gate / runbook |
|------|----------------|---------------------|
| 1 | security/secrets | Phase 7 grep gate + 1Password 正本 |
| 2 | implementation/payload-shape | passthrough Zod + fallback formatter |
| 3 | design/responsibility-boundary | UT-08-IMPL / UT-17 責務境界マトリクス |
| 4 | operations/silent-failure | 月次 healthcheck runbook (HIGH) |

各教訓は task-specification-creator Phase 12 の output と一対一で対応する。再発時は本ファイルを起点に該当 reference / runbook へ Progressive Disclosure で辿ること。
