# UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) - タスク指示書

## メタ情報

```yaml
issue_number: 635
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | ut-17-followup-003-alert-relay-automated-healthcheck-cron             |
| タスク名     | Cloudflare Cron Triggers による alert-relay → Slack の週次自動死活確認 |
| 分類         | 改善（運用自動化）                                                    |
| 対象機能     | `apps/api` alert-relay Worker / Cloudflare Notifications 通知経路    |
| 優先度       | 低                                                                    |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | ut-17-cloudflare-analytics-alerts                                     |
| 発見日       | 2026-05-09                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-17 で実装した Cloudflare Notifications → 日本語化リレー Worker → Slack の通知経路は、
現状 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に基づく
**月 1 回の手動 runbook** によってのみ生死確認されている。

Slack Incoming Webhook URL は Slack 側で revoke / app 削除 / channel 削除が発生すると
無効化されるが、Cloudflare Worker 側からは Slack へ POST しない限り検知できない。
さらに本番アラートが発火するまで通知経路の障害は表面化しないため、
障害発生から最大 1 ヶ月（次回 runbook 実施まで）気付けない構造になっている。

### 1.2 問題点・課題

- アラート機構自体のサイレント障害は、Cloudflare Notifications 設計上もっとも検知が難しい failure mode。
- 月次 runbook は手動実行に依存しており、担当者の失念で空白期間が発生する。
- 本物のアラート発火（リソース閾値超え）が起きるまで通知到達が確認できない、という運用上の死角を抱える。
- 監視対象（Workers / D1 / Pages / R2）の閾値到達は通常稀で、「アラートが来ない＝平穏」なのか「経路が死んでいる」のか区別できない。

### 1.3 放置した場合の影響

- Slack Webhook URL 失効中に本番閾値超過が発生した場合、運用者は気付けず無料枠超過 → サービス停止に直結する。
- Cloudflare Secrets の `SLACK_WEBHOOK_URL` drift（誤って削除・誤値投入）も同様に最大 1 ヶ月発覚しない。
- UT-17 アラート機構そのものの信頼性が、月次 runbook 担当者個人の運用品質に依存する状態が続く。

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare Workers Cron Triggers を使って `apps/api` から alert-relay 経路の生死を
**週次自動チェック**し、失敗時は Slack 以外のフォールバック経路（メール）で運用者に通知する。

### 2.2 最終ゴール

- 週 1 回（例: 毎週月曜 09:00 JST 相当の UTC）に Cron Trigger が発火し、relay へ healthcheck dummy payload を内部 POST。
- Slack に「healthcheck OK」短文が投稿され、運用者は Slack を見るだけで経路の生死が分かる。
- Slack 投稿が失敗した場合、メール（Cloudflare Email Routing or 外部 SMTP）でフォールバック通知が飛ぶ。
- 月次手動 runbook は「フォールバック / 詳細確認」用途として残し、定常監視は cron に委譲する。

### 2.3 スコープ

#### 含むもの

- `apps/api/wrangler.toml` への `[triggers]` `crons` 追加
- `apps/api/src/index.ts` (もしくは別ファイル) に `scheduled` handler 追加
- healthcheck 用 dummy payload 設計（本物アラートと識別可能なマーカー）
- Slack 投稿失敗時のメールフォールバック実装
- healthcheck 専用 Slack channel or thread 集約方針の決定

#### 含まないもの

- UT-08-IMPL のモニタリング基盤責務（外部サービス監視・SLO 監視等）
- Cloudflare Notifications policy 自体の変更
- Slack 以外への新規通知経路追加（メールフォールバックは緊急通知用途限定）
- D1 schema 変更

### 2.4 成果物

- `apps/api/wrangler.toml` 差分（cron schedule 定義）
- `apps/api/src/scheduled/healthcheck.ts`（新規）
- `apps/api/src/index.ts` の `scheduled` export 追加
- 月次 runbook の更新差分（cron 自動化との役割分担明記）
- 動作確認ログ（`wrangler dev --test-scheduled` または staging で 1 回手動発火）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml` 正本）
- `apps/api` は Cloudflare Workers + Hono 構成
- 既存の alert-relay endpoint (`/internal/alert-relay`) が `cf-webhook-auth` secret を検証する実装済み
- `scripts/cf.sh` 経由で wrangler を実行（`wrangler` 直接禁止）

### 3.2 依存タスク

- 親: ut-17-cloudflare-analytics-alerts（実装完了済み）
- 関連 followup: ut-17-followup-001 / 002（同 workflow 内の他フォローアップ）
- 影響先: 月次 runbook の運用ポジション再定義

### 3.3 必要な知識

- Cloudflare Workers `scheduled` handler / Cron Triggers の cron 式仕様（UTC 固定）
- `env` binding の scheduled handler 内での参照方法（`fetch` handler と同じ env を共有）
- Slack Incoming Webhook の戻り値の癖（200 でも message_ts が無い・revoke 時の挙動が時期で揺れる）
- Cloudflare Email Routing の send API（Workers から `MailChannels` 経由で送信する慣例）
- Workers 無料枠の Cron 発火上限（無料 100,000 req/月の枠内設計）

### 3.4 推奨アプローチ

1. cron schedule は週 1 回 UTC（例: `0 0 * * 1` = 毎週月曜 00:00 UTC ≒ 月曜 09:00 JST）。
2. `scheduled` handler 内で `fetch(env.SELF_URL + '/internal/alert-relay', ...)` ではなく、
   alert-relay の処理関数を直接呼び出す形（service binding or 関数 import）にして、
   外部ネットワーク往復を 1 回減らす。
3. healthcheck payload には `name: "UT-17 weekly healthcheck"` と `severity: "info"` を固定で乗せ、
   Cloudflare Notifications 由来の本物アラートと identifier で識別可能にする。
4. Slack 投稿の戻り値検証は `status === 200 && body === "ok"` の両面確認とする
   （Slack Incoming Webhook 仕様: 成功時 body は plain text `"ok"`）。
5. Slack 投稿失敗時は MailChannels 経由で運用者メールに「UT-17 healthcheck failed at <timestamp>」を送信。

---

## 4. 実行手順

### Phase 構成

1. cron schedule 設計と payload 仕様確定
2. `scheduled` handler 実装
3. メールフォールバック実装
4. staging 動作確認
5. 月次 runbook 更新

### Phase 1: cron schedule 設計と payload 仕様確定

#### 目的

頻度 / payload / 識別マーカーを確定する。

#### 手順

1. Workers 無料枠の cron 制限を確認（無料アカウントで cron triggers が利用可能か再確認）
2. 週 1 回（月曜 00:00 UTC）の cron 式を採用
3. payload に `name: "UT-17 weekly healthcheck"` / `severity: "info"` / `data.healthcheck: true` を固定
4. Slack 投稿先 channel 分離 or thread 集約のいずれかを決定

#### 成果物

cron schedule + payload 仕様メモ

#### 完了条件

仕様が 1 つに収束している

### Phase 2: `scheduled` handler 実装

#### 目的

cron 発火で healthcheck を実行する Worker handler を追加する。

#### 手順

1. `apps/api/wrangler.toml` の各 env (`staging` / `production`) に `[triggers]` `crons = ["0 0 * * 1"]` を追加
2. `apps/api/src/scheduled/healthcheck.ts` を新規作成し、alert-relay 処理関数を直接呼ぶ
3. `apps/api/src/index.ts` で `export default { fetch, scheduled }` の形に拡張
4. healthcheck 内で Slack 投稿の戻り値（status + body）を両面確認

#### 成果物

handler 実装差分

#### 完了条件

`mise exec -- pnpm typecheck` PASS、`mise exec -- pnpm lint` PASS

### Phase 3: メールフォールバック実装

#### 目的

Slack 経路失敗時に運用者がメールで気付ける状態にする。

#### 手順

1. Cloudflare Email Routing or MailChannels 経由の send 関数を実装
2. 送信先メールアドレスは Cloudflare Secrets `HEALTHCHECK_FALLBACK_EMAIL` で管理
3. Slack 投稿失敗時のみ呼び出す（成功時のメール送信はノイズになるため禁止）

#### 成果物

メールフォールバック実装差分

#### 完了条件

Slack 失敗 → メール送信のフローが unit-test レベルで通る

### Phase 4: staging 動作確認

#### 目的

本番投入前に staging で 1 回 cron を発火させ、Slack 到達 + 失敗系の挙動を確認する。

#### 手順

1. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
2. `wrangler` の `--test-scheduled` または Cloudflare Dashboard から手動 trigger で発火
3. Slack staging channel に「healthcheck OK」が届くことを確認
4. SLACK_WEBHOOK_URL を一時的に不正値に差し替え → メールフォールバックが飛ぶことを確認
5. 元の値に戻す

#### 成果物

staging 動作ログ

#### 完了条件

正常系 / 異常系両方で期待動作を確認

### Phase 5: 月次 runbook 更新

#### 目的

cron 自動化と月次手動 runbook の役割分担を明記する。

#### 手順

1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の冒頭に
   「定常監視は cron が担当、本 runbook は四半期に 1 回の詳細確認 + Cron 失敗時の deep-dive 用」と追記
2. 週次 cron が連続 N 回失敗したら月次 runbook を即時実施する閾値を定義

#### 成果物

runbook 差分

#### 完了条件

役割分担が runbook 冒頭で読める

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `apps/api/wrangler.toml` に `[triggers]` `crons` が定義されている
- [ ] `scheduled` handler が `env` 経由で alert-relay を呼べる
- [ ] healthcheck payload が本物アラートと識別可能
- [ ] Slack 投稿戻り値を status + body の両面で検証している
- [ ] Slack 失敗時にメールフォールバックが発火する

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] staging で正常系 / 異常系両方の動作確認ログがある

### ドキュメント要件

- [ ] 月次 runbook に cron 自動化との役割分担が追記されている
- [ ] cron 失敗時の連続 N 回閾値が定義されている

---

## 6. 苦戦箇所・知見（再発防止）

このセクションは UT-17 本体実装と月次 runbook 設計時に判明した、cron 化に向けて事前に押さえておくべき罠を記録する。

### 6.1 Slack Incoming Webhook の「200 = OK」ではない問題

- Slack Incoming Webhook は revoke 後も、時期によっては HTTP 200 を返した上で body に `"no_service"` / `"invalid_payload"` 等のエラー文字列を含むケースが報告されている。
- 公式ドキュメントは「成功時 body = `"ok"` (plain text)」と明示しているが、エラー時の挙動は時期で揺れる。
- そのため `response.ok`（=status 2xx）だけで OK 判定すると、revoke を検出できず healthcheck 自体がサイレント故障する。
- 実装は **status === 200 かつ body の trim 結果 === "ok" のみ成功** と判定する（body は最大 16 byte 程度しかないので fetch コストは無視可能）。
- message_ts は Incoming Webhook では返らないので「投稿後にメッセージ存在を再取得して確認」はできない。**送信時の戻り値だけが唯一の真実**。

### 6.2 healthcheck メッセージの運用ノイズ問題

- 週 1 回の OK 通知を本番アラート channel にそのまま流すと、本物のアラートが埋もれる運用ノイズが発生する。
- 候補は 2 つ:
  - (a) Slack 側で `#alerts-healthcheck` 専用 channel を作成し、Webhook URL を別途発行（運用者は「無投稿が 2 週続いたら異常」と判断）
  - (b) 同一 channel の単一スレッドに集約投稿（thread_ts 指定が必要だが Incoming Webhook では制御不可）
- **(a) を推奨**。(b) は Incoming Webhook の仕様制約で実現が難しい（Bot Token を使う Web API 経路に切り替えると認可スコープ追加が必要で過剰投資）。
- channel 分離する場合、`SLACK_WEBHOOK_URL_HEALTHCHECK` を別 secret として管理し、本番 alert 用と分離する。

### 6.3 Cron Triggers と env 共有の落とし穴

- Workers の `scheduled` handler は同一 Worker 内の `fetch` handler と **env を完全共有**する。
- そのため healthcheck 専用に Slack Webhook URL を別系統にしたい場合、`env.SLACK_WEBHOOK_URL_HEALTHCHECK` のような **別 binding 名** を新設する必要がある（既存 `env.SLACK_WEBHOOK_URL` を上書きすると本番 alert 経路が壊れる）。
- env 設計は事前に `apps/api/src/env.ts` の zod schema を更新し、`SLACK_WEBHOOK_URL_HEALTHCHECK` を optional として追加 → 未設定時は本番用 URL にフォールバックする実装が安全。
- service binding や Durable Object 経由ではなく、内部関数 import で alert-relay 処理を呼ぶ場合、`scheduled` handler から `Request` オブジェクトを偽造する必要がある。`new Request("https://internal/alert-relay", { method: "POST", headers: { "cf-webhook-auth": env.CF_WEBHOOK_AUTH_SECRET }, body })` の形が最小。

### 6.4 Workers 無料枠の Cron 実行回数

- Workers 無料枠は月 100,000 リクエスト想定。週 1 回 cron は月 4-5 回しか発火しないため誤差レベル。
- ただし healthcheck 内で alert-relay を内部呼び出しする場合、relay 内の Slack 投稿 fetch も 1 回 / 発火 で消費する。
- 仮に頻度を週 1 → 日 1 に上げても 30 回 / 月 で枠への影響は無視可能。
- **トレードオフ**: 検知ラグを「最大 1 週間」から「最大 1 日」に短縮するなら日次に上げてよい。ただし運用ノイズ（OK 通知数）も比例増加するため、(a) 専用 channel 分離が前提。
- Workers 無料プランで Cron Triggers が利用可能か（過去に有料プラン限定だった時期あり）を **実装着手前に Cloudflare Dashboard で要確認**。利用不可の場合は GitHub Actions スケジュールジョブで代替する設計に切り替える。

### 6.5 メールフォールバックの送信元問題

- MailChannels 経由送信は SPF / DKIM / DMARC を通すために送信元ドメインを Cloudflare で検証する必要がある。
- 検証未設定だと多くの受信メールサーバで spam 判定され、フォールバック通知が届かない事故になる。
- 暫定運用としては Cloudflare Email Routing の inbound only 構成では送信できないため、MailChannels API を直接使うか、外部 SMTP（Resend / SendGrid 無料枠）を採用する。
- **最小実装の推奨**: Resend 無料枠（3,000 通/月）の API key を Cloudflare Secrets に保管し、Workers から HTTP POST で送信。SPF/DKIM は Resend 側のドメインで送る → 自社ドメイン検証不要。

---

## 7. 参照資料

### 関連ドキュメント

- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（本タスクで更新対象）
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/`（親 workflow 出力）
- `apps/api/src/routes/internal/`（alert-relay endpoint 実装）
- `apps/api/src/lib/slack-sender.ts`（Slack 投稿実装）
- `apps/api/src/middleware/verify-cf-webhook-auth.ts`（auth middleware）
- `apps/api/wrangler.toml`（cron schedule 追加対象）

### 関連 issue / task

- 親: ut-17-cloudflare-analytics-alerts
- 兄弟: ut-17-followup-001 / 002
- 独立性: UT-08-IMPL（モニタリング基盤責務）とは別軸。本タスクは Cloudflare native usage alerts の生死確認に限定する。

### 外部参照

- Cloudflare Workers Cron Triggers: <https://developers.cloudflare.com/workers/configuration/cron-triggers/>
- Slack Incoming Webhooks: <https://api.slack.com/messaging/webhooks>
- MailChannels for Workers: <https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/>
