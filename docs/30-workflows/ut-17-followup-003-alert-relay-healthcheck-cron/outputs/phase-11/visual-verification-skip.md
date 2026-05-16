# UT-17-followup-003 Phase 11: 視覚的検証スキップ宣言

[実装区分: 実装仕様書]

## スキップ判定

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation / **NON_VISUAL** |
| UI/UX 実装 | なし |
| スクリーンショット必要性 | なし（UI 変更がないため） |
| 補足 | staging 環境での Slack 投稿 / メールフォールバック受信は「実 Slack 表示確認の手順（外部実施項目）」として別途取得 |

本タスクは `apps/api` の Cloudflare Workers `scheduled` handler 追加・
既存 `wrangler.toml` `[triggers]` への相乗り確認・メールフォールバック実装・runbook 更新のみで、
`apps/web` 配下の UI 変更を一切伴わない。よって Phase 11 の視覚的検証はスキップする。

---

## 代替検証

UI が存在しない代わりに、以下の自動テスト / 設定ファイルで品質を担保する。

### unit test

- `apps/api/src/scheduled/__tests__/healthcheck.test.ts`（新規）
  - cron 発火時に Monday 以外は no-op であること（scheduled handler 内 Monday gate のテスト）
  - Monday に発火した場合、healthcheck payload (`name: "UT-17 weekly healthcheck"`, `severity: "info"`, `data.healthcheck: true`) を生成
  - alert-relay 処理関数を内部呼び出しで叩く（service binding ではなく関数 import）
  - Slack 戻り値が `status === 200 && body.trim() === "ok"` のときのみ成功
  - 上記以外（200 + body !== "ok" / 非 200 / network error）は失敗扱い → メールフォールバック発火
  - Slack 成功時はメールフォールバックを呼ばない（運用ノイズ防止）

- `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts`（新規）
  - Resend API への HTTP POST を fetch mock で検証（送信先 = `HEALTHCHECK_FALLBACK_EMAIL`）
  - Resend API 失敗時もハンドラ自体は throw せず redacted error を Worker log に出すこと

`apps/api/src/__tests__/env.test.ts` への追記は不要と判断した。今回追加した 3 binding は runtime parser ではなく
`Env` interface の optional field として扱われ、`mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
で静的に検証する。

### 設定ファイル

- `apps/api/wrangler.toml`
  - `[triggers]` `crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`（既存 daily cron に相乗り、無料 plan 3 本上限対策）
  - scheduled handler 内で `new Date(controller.scheduledTime).getUTCDay() === 1`（Monday）の場合のみ healthcheck を走らせる

### grep gate（手動 / CI 補助）

```bash
# Slack Webhook URL が docs / PR / 実コードにハードコードされていないこと
git grep -E "hooks\.slack\.com/services/[A-Z0-9/]+" -- ':!.dev.vars.example' ':!*.md'
# 期待: 0 件

# HEALTHCHECK_FALLBACK_EMAIL 実値（@ 付き）がリポジトリに混入していないこと
git grep -E "HEALTHCHECK_FALLBACK_EMAIL\s*=\s*[^\"\\s]+@" -- ':!.dev.vars.example'
# 期待: 0 件
```

---

## 実 Slack 表示確認の手順（外部実施項目）

Phase 4（staging 動作確認）完了時に以下を取得する。本 Phase の初回作成時点では未取得でよい。

### 1. Slack staging channel に「healthcheck OK」が届くことを確認

```bash
# staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 手動 cron 発火（Cloudflare Dashboard → Workers → Triggers → Run）
# または wrangler の --test-scheduled
```

staging Slack channel（`SLACK_WEBHOOK_URL_HEALTHCHECK` 紐付け先、または `SLACK_WEBHOOK_URL` フォールバック先）に
以下のメッセージが届くことを目視確認:

- ヘッダー絵文字 ℹ️ と「UT-17 weekly healthcheck」ラベル
- severity = `info` 表示
- 「現在値」「閾値」フィールドは healthcheck 用に固定文言

screenshot: `outputs/phase-11/screenshots/slack-healthcheck-ok-staging.png`（1 枚）

### 2. メールフォールバックが飛ぶことを確認

```bash
# SLACK_WEBHOOK_URL_HEALTHCHECK を意図的に不正値に差し替え
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging
# 値: "https://hooks.slack.com/services/INVALID/INVALID/INVALID"

# 再度 cron 手動発火
```

`HEALTHCHECK_FALLBACK_EMAIL` 宛に「UT-17 healthcheck failed at <timestamp>」メールが届くことを目視確認。

screenshot: `outputs/phase-11/screenshots/email-fallback-staging.png`（1 枚）

確認後、SLACK_WEBHOOK_URL_HEALTHCHECK を元の値に戻す。

### 3. wrangler tail で cron 発火ログを取得

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
```

Monday 18:00 UTC のログに以下が出ることを確認し、テキストファイルとして保存:

```
Cron Trigger fired: 0 18 * * *
[alertRelayHealthcheck] failed ... # 失敗時のみ redacted error
```

ログ保存先: `outputs/phase-11/cron-fire-log.txt`

---

## NON_VISUAL skip ルールへの準拠確認

- [x] `apps/web/` 配下に変更がない（grep で確認）
- [x] UI component の追加・削除・スタイル変更がない
- [x] design-tokens.css / OKLch トークンに変更がない
- [x] screenshot を取らない代替検証として unit test + staging 実行ログを規定
- [x] `screenshots/.gitkeep` を作成していない

---

## 参照

- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/visual-verification-skip.md`（フォーマット正本）
- `docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md`（原典）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（runbook 連動）
