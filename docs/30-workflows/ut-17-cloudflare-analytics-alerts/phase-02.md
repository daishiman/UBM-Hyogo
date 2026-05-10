# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase で確定する Slack 日本語化リレー Worker の入出力契約・cf-webhook-auth 認証・メッセージフォーマットは、Phase 4 以降の実装フェーズで実コード（TypeScript on Cloudflare Workers）を生成するための直接的な仕様となるため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 (UT-17) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した要件・論点をもとに、index.md の AC-1〜AC-9 に対応する 4 種類の設計ドキュメントを作成する。
本 Phase は設計成果物のみを出力し、実コードは含めない。Phase 4 以降の実装フェーズへの引き渡しを意識し、メトリクス名・閾値・Webhook plan gate・`cf-webhook-auth` 固定シークレット・Slack ブロック構造・Secret 名・`scripts/cf.sh` 登録手順までを具体的に確定させる。

## 真の論点（Phase 1 から継承）

1. UT-08 既存通知設計との命名・チャンネル衝突回避
2. Cloudflare plan gate で設定可能なメトリクス範囲と Webhook 利用可否の確定
3. リレー Worker 配置先の決定（`apps/api` 内 internal route vs 新規 `apps/alert-relay`）

## 依存境界

| 種別 | 対象 | 本 Phase での扱い |
| --- | --- | --- |
| 上流 | Phase 1 requirements.md | 論点・スコープ・AC・4 条件評価の入力 |
| 上流 | UT-08 notification-design.md / secret-additions.md | 命名衝突確認の照合元 |
| 上流 | 01b cloudflare-topology.md | アラート対象リソースの確認 |
| 下流 | Phase 4〜実装フェーズ | リレー Worker 実装・Notifications 設定・Secret 投入 |
| 下流 | runbooks 追記 | Slack 通知受信時の対応手順 |

## 価値とコスト

- **価値**: 4 ドキュメントを揃え、Phase 4 以降の実装フェーズが迷いなくリレー Worker を実装し、Cloudflare Notifications を設定できる状態を作る。
- **コスト**: メッセージフォーマット例・cf-webhook-auth 検証コード擬似仕様・Secret 名命名など決定事項が多いが、各成果物は短文テーブル + コードスニペット中心で重複排除する。

## 4 条件評価

| 条件 | 問い | 判定基準 |
| --- | --- | --- |
| 価値性 | 4 ドキュメントが実装フェーズの不確実性を実質的に下げるか | 各成果物にメトリクス名・閾値・Secret 名・配置先・cf-webhook-auth 検証手順が含まれていること |
| 実現性 | Cloudflare Notifications + Workers + Slack Webhook で AC を満たせるか | Free plan baseline はメール通知、Webhook relay は Professional 以上またはアカウント条件で Webhook 利用可能な場合だけ有効化すること |
| 整合性 | UT-08 既存設計と Secret 名・チャンネルが衝突していないか | secret-management.md に UT-08 名との比較表が含まれること |
| 運用性 | WARNING/CRITICAL 二段階 + 月次ヘルスチェックで運用継続可能か | alert-policy-matrix.md にベースライン後の閾値再調整方針が併記されること |

## 設計成果物一覧（AC との対応）

| 成果物 | AC | 概要 |
| --- | --- | --- |
| outputs/phase-02/alert-policy-matrix.md | AC-1, AC-7 | Cloudflare Notifications アラート対象メトリクス・閾値・対応 Notification Type の一覧 |
| outputs/phase-02/relay-worker-design.md | AC-2, AC-5 | リレー Worker の配置先・入出力契約・cf-webhook-auth 認証・エラーハンドリング |
| outputs/phase-02/slack-message-format.md | AC-3 | Slack 日本語メッセージフォーマット（`blocks` 形式の JSON サンプル） |
| outputs/phase-02/secret-management.md | AC-4 | Secret 一覧・1Password 正本パス・wrangler 登録手順 |

加えて、AC-6（テスト通知手順）/ AC-8（Webhook 失敗時フォールバック）/ AC-9（runbook 追記方針）は本 Phase 内のセクションに記載する。

## alert-policy-matrix.md 設計（AC-1, AC-7）

### 対象メトリクスと閾値

| メトリクス | 無料枠 | WARNING (80%) | CRITICAL (95%) | 公式確認ステータス |
| --- | --- | --- | --- | --- |
| Workers Daily Requests | 100,000 req/day | 80,000 req/day | 95,000 req/day | 未確認 gate。Cloudflare Dashboard / Available Notifications で正式 type を確認するまで実装不可 |
| D1 Read Rows | 5,000,000 reads/day | 4,000,000 reads/day | 4,750,000 reads/day | 公式確認済み候補。D1 billing notification の条件を Phase 4 で再確認 |
| D1 Write Rows | 100,000 writes/day | 80,000 writes/day | 95,000 writes/day | 公式確認済み候補。D1 billing notification の条件を Phase 4 で再確認 |
| Pages Build | 500 builds/month | 400 builds/month | 475 builds/month | 未確認 gate。正式 Notification Type 確認まで relay 実装対象外 |
| R2 Class A operations | 1,000,000 ops/month | 800,000 ops/month | 950,000 ops/month | 未確認 gate。usage-based billing alert で表現可能か確認 |

> Notification Type は Cloudflare Dashboard 上の正式名称を Phase 4 実装時に最新ドキュメントで確認し本表を更新する。

### 閾値設定タイミング方針（AC-7）

| 段階 | タイミング | 動作 |
| --- | --- | --- |
| 初期投入 | 本タスクの実装フェーズ完了直後 | 上記 80% / 95% を暫定値として登録 |
| ベースライン取得 | 本番稼働後 1〜2 週間 | 実トラフィックの使用量を Cloudflare Analytics で観測 |
| 再調整 | ベースライン取得後 | 実態に応じて閾値を上下調整。誤発火が多ければ閾値を緩め、余裕がありすぎれば厳しくする |

### 通知ペア設計

各メトリクスは **メール通知を baseline** とする。Webhook 通知（リレー Worker 宛）は Cloudflare アカウントが Webhook 利用条件を満たす場合だけ追加し、Webhook 不可の場合も AC はメール通知 + runbook evidence で閉じる。

## relay-worker-design.md 設計（AC-2, AC-5）

### 配置先決定

| 候補 | メリット | デメリット | 採否 |
| --- | --- | --- | --- |
| (a) `apps/api/src/routes/internal/alert-relay.ts` | 既存 API と同居で運用簡素化、wrangler.toml 共有 | API ルートと同一 Worker のためエラー時に巻き込まれるリスク、internal route の認可境界を厳密化する必要 | 採用候補 1 |
| (b) 新規 `apps/alert-relay` Worker | 独立性が高く、API 側の障害から隔離。責務が明確 | 新規 Worker 追加で wrangler.toml が増え、デプロイパイプライン更新が必要 | 採用候補 2 |

**推奨**: 初期は (a) `apps/api/src/routes/internal/alert-relay.ts` を採用する。理由は本タスクが LOW 優先度で、Worker を増やす運用コストよりも既存 Worker への同居による運用簡素化メリットが上回るため。internal route は cf-webhook-auth 認証で外部公開エンドポイントから論理的に分離する。

> 最終決定は Phase 3 設計レビューで承認する。

### 入力ペイロード契約

Cloudflare Notifications が送出する Webhook ペイロード（JSON）を受信する。Cloudflare 公式仕様に従い、以下のフィールドを最低限解釈する。

| フィールド | 型 | 用途 |
| --- | --- | --- |
| `name` | string | Notification Policy 名 |
| `text` | string | 英語のアラート本文 |
| `data` | object | メトリクス詳細（メトリクス名・現在値・閾値などを含む） |
| `ts` | number | 発火タイムスタンプ |
| `account_id` | string | Cloudflare Account ID |
| `policy_id` | string | Policy ID |

> 公式仕様の最新フィールド構造は Phase 4 実装時に確認し、未知フィールドは安全にフォールスルーする実装方針とする。

### 認証設計（cf-webhook-auth 固定シークレット）

Cloudflare generic webhook は、Webhook destination に設定した secret を `cf-webhook-auth` ヘッダで送信する。リレー Worker 側は `CF_WEBHOOK_AUTH_SECRET` とヘッダ値を定数時間比較し、不一致の場合は `401 Unauthorized` を返す。body HMAC 署名や `X-CF-Alert-Signature` は採用しない。

| 項目 | 設計 |
| --- | --- |
| 共有シークレット名 | `CF_WEBHOOK_AUTH_SECRET` |
| 認証方式 | `cf-webhook-auth` 固定シークレット |
| 署名対象 | なし。Cloudflare が secret 値をヘッダで送る |
| 送信ヘッダ | `cf-webhook-auth: <configured secret>` |
| 検証失敗時応答 | HTTP 401 + 空 body |
| タイムスタンプ検証 | 認証とは分離。必要なら重複抑止の補助として `ts` を使う |

> Webhook 利用条件を満たさない場合は relay Worker を実装せず、メール通知 baseline と runbook evidence で閉じる。

### 出力ペイロード（Slack 宛）

Slack Incoming Webhook へ POST する JSON は `slack-message-format.md` の仕様に従う。

### エラーハンドリング・リトライ

| 失敗種別 | 動作 |
| --- | --- |
| cf-webhook-auth 検証失敗 | 401 を返し、リレーしない |
| Slack Webhook 4xx | 400 を返し、リトライしない（リクエスト側起因のため） |
| Slack Webhook 5xx / network | 最大 3 回 exponential backoff (1s / 2s / 4s) でリトライ |
| 全リトライ失敗 | 502 を返す。Cloudflare Notifications 側のメール通知でフォールバック（AC-8） |
| ペイロード JSON parse 失敗 | 400 を返す |

タイムアウト: Worker 全体で 10 秒以内に応答を返す。

### 観測

リレー Worker 自身のログは `console.log` で最低限残し、機微情報（Webhook URL / シークレット）は出力禁止。リレー失敗の継続的観測は将来的に UT-08 の WAE 計装と統合可能だが、本タスクのスコープ外。

## slack-message-format.md 設計（AC-3）

### 日本語メッセージ要件

各通知に以下を含める:

- メトリクス名（日本語訳付き）
- 現在値
- 閾値（WARNING / CRITICAL のいずれか）
- 残量（無料枠 - 現在値）
- 重大度（WARNING / CRITICAL）
- 確認手順リンク（runbook / Cloudflare Dashboard）
- 発火時刻（JST）

### Slack `blocks` JSON サンプル（WARNING 例）

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "[WARNING] Cloudflare 無料枠アラート", "emoji": false }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*メトリクス*\nWorkers 日次リクエスト数" },
        { "type": "mrkdwn", "text": "*重大度*\nWARNING (80%)" },
        { "type": "mrkdwn", "text": "*現在値*\n82,150 req/day" },
        { "type": "mrkdwn", "text": "*閾値*\n80,000 req/day" },
        { "type": "mrkdwn", "text": "*残量*\n17,850 req（無料枠 100,000 まで）" },
        { "type": "mrkdwn", "text": "*発火時刻*\n2026-05-09 14:32 JST" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "本番稼働後のベースライン取得期間中です。短期的な急増でなければ閾値の再調整候補。"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Cloudflare Dashboard", "emoji": false },
          "url": "https://dash.cloudflare.com/?to=/:account/workers"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "対応 Runbook", "emoji": false },
          "url": "https://github.com/daishiman/UBM-Hyogo/tree/main/docs/30-workflows/runbooks"
        }
      ]
    }
  ]
}
```

### CRITICAL 例

ヘッダを `[CRITICAL] Cloudflare 無料枠アラート` とし、Slack の通知強度を上げるため `text` フィールドにプレーン日本語要約も併記する（モバイルプッシュ通知で全文が出るように）。

### メトリクス名 日本語訳マスタ

| Cloudflare 英語名 | 日本語訳 |
| --- | --- |
| Workers Daily Requests | Workers 日次リクエスト数 |
| D1 Read Rows | D1 行読み取り数 |
| D1 Write Rows | D1 行書き込み数 |
| Pages Build | Pages ビルド数 |
| R2 Class A operations | R2 Class A 操作数 |

未知メトリクス名は英語名のままフォールスルーし、本マスタに追記して再デプロイする。

## secret-management.md 設計（AC-4）

### Secret 一覧

| Secret 名 | 用途 | 1Password 正本パス | 配置先 |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_URL` | リレー Worker から Slack へ POST | `op://Cloudflare/UBM-Hyogo Alert Slack Webhook/url` | Cloudflare Secrets（リレー Worker、staging / production 各環境） |
| `CF_WEBHOOK_AUTH_SECRET` | Cloudflare → Worker cf-webhook-auth 認証共有鍵 | `op://Cloudflare/UBM-Hyogo Alert cf-webhook-auth Secret/value` | Cloudflare Secrets（リレー Worker） + Cloudflare Notifications Webhook custom header 設定 |
| `ALERT_EMAIL_TO`（非機密） | フォールバックメール宛先 | （非機密のため `wrangler.toml` の `[vars]` に直接記載） | Cloudflare Notifications メール送信先設定 |

### UT-08 既存 Secret との衝突確認

| UT-08 で予約済 | UT-17 で追加 | 衝突 |
| --- | --- | --- |
| `MONITORING_SLACK_WEBHOOK_URL` | `SLACK_WEBHOOK_URL` | 名前空間が異なるため衝突なし。ただし同一 Slack チャンネルを共有するか別チャンネルにするかは Phase 3 レビューで決定 |
| `UPTIMEROBOT_API_KEY`（任意） | （UT-17 では未使用） | 衝突なし |

### wrangler 登録手順（Phase 4 実装時に実行）

```bash
# Secret 投入は必ず scripts/cf.sh 経由（CLAUDE.md 不変条件）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env production
```

`.dev.vars.example` に `op://` 参照のみ追記する例:

```
SLACK_WEBHOOK_URL=op://Cloudflare/UBM-Hyogo Alert Slack Webhook/url
CF_WEBHOOK_AUTH_SECRET=op://Cloudflare/UBM-Hyogo Alert cf-webhook-auth Secret/value
```

### Secret 取り扱い不変条件

- 1Password Environments を正本とし、`.env` には `op://` 参照のみ
- `wrangler` 直接呼び出し禁止。`bash scripts/cf.sh secret put` 経由のみ
- コードへのハードコード禁止
- ログ・エラーメッセージへの値出力禁止

## テスト通知手順（AC-6）

| 段階 | 手順 |
| --- | --- |
| ローカル疎通 | リレー Worker を `wrangler dev` 経由で起動（`scripts/cf.sh` 経由）。`curl` で擬似 Cloudflare ペイロードを `cf-webhook-auth: <configured secret>` 付きで POST し、Slack に日本語メッセージが届くことを確認 |
| staging 疎通 | staging にデプロイ後、Cloudflare Dashboard の Notification Policy で「Send Test Notification」を実行。Slack staging チャンネルに届くことを確認 |
| production 疎通 | production デプロイ後、同様に Test Notification を実行。Slack production チャンネルに届くことを確認 |
| 月次ヘルスチェック | 月初に手動で Test Notification を実行し、Webhook URL 失効・cf-webhook-auth 不一致がないことを確認 |

## Webhook 失敗時フォールバック（AC-8）

| 障害 | フォールバック |
| --- | --- |
| Slack Webhook URL 失効 | Cloudflare Notifications のメール通知が並行送信されているため、メール側で検知。月次ヘルスチェックで Webhook 側を再生成 |
| リレー Worker ダウン | 同上。メール通知でフォールバック。Worker 側は `apps/api` 同居のため API 全体障害を意味し、別途 UT-08 WAE 計装または UptimeRobot で検知される想定 |
| cf-webhook-auth シークレット失効 | リレー Worker が 401 を返し続ける。Cloudflare Notifications のメール通知で気付く。1Password で新シークレットを発行し、Cloudflare Notifications + Cloudflare Secrets の双方を更新 |

## runbook 追記方針（AC-9）

`docs/30-workflows/runbooks/` 配下に以下を新規追加または既存ファイルへ追記する。

| runbook | 追記内容 |
| --- | --- |
| `cloudflare-quota-alert-runbook.md`（新規） | Slack 通知受信時の一次対応手順（Cloudflare Dashboard 確認 → トラフィック分析 → 必要に応じ閾値再調整） |
| `ut-17-cloudflare-usage-alert-response.md` | UT-17 リレー Worker 経由のアラート一次対応フローを専用 runbook として保持 |

## 実行タスク

- [ ] Phase 1 成果物を読み、論点と CONDITIONAL の解消条件を確認する
- [ ] UT-08 完了済成果物を再確認し、Secret 名・チャンネルの衝突有無を最終確定する
- [ ] Cloudflare plan gateで設定可能なメトリクス（特に R2 Class A）を公式仕様で再確認する
- [ ] Cloudflare Notifications Webhook のcf-webhook-auth ヘッダ仕様を再確認し、cf-webhook-auth 方式が成立するか確定する。不可ならフォールバック（cf-webhook-auth fixed secret）を採用
- [ ] `outputs/phase-02/alert-policy-matrix.md` を作成（AC-1, AC-7）
- [ ] `outputs/phase-02/relay-worker-design.md` を作成（AC-2, AC-5）
- [ ] `outputs/phase-02/slack-message-format.md` を作成（AC-3）
- [ ] `outputs/phase-02/secret-management.md` を作成（AC-4）
- [ ] テスト通知手順（AC-6）/ Webhook 失敗フォールバック（AC-8）/ runbook 追記方針（AC-9）を上記成果物にリンクする形で記述
- [ ] リレー Worker 配置先 (a)/(b) のトレードオフを記述し、推奨案を Phase 3 レビューへ申し送り
- [ ] Phase 3 レビューへの引き継ぎ事項（未決事項・代替案棄却理由）を明記

## 統合テスト連携

本 Phase は設計のみで実コードを生成しない。統合テスト連携は Phase 4 以降で本 Phase 成果物を入力として実施する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 4〜実装フェーズ | リレー Worker 実装、Notifications 設定、cf-webhook-auth 認証、Slack 疎通テスト | 設計詳細を成果物として確定 |
| UT-07 | Slack Workspace / チャンネル / Webhook URL 提供 | 連携先として参照 |
| UT-08 | 既存通知設計との命名・チャンネル衝突確認 | secret-management.md で衝突表を作成 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-01.md | Phase 1 成果物 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | AC・スコープの正本 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md | UT-08 通知設計（衝突確認） |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md | UT-08 Secret 一覧（衝突確認） |
| 必須 | CLAUDE.md | Secret / `scripts/cf.sh` / D1 アクセス境界 |
| 参考 | https://developers.cloudflare.com/notifications/ | Cloudflare Notifications 公式 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Webhook destination 設定 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhook 仕様 |
| 参考 | https://api.slack.com/reference/block-kit/blocks | Slack Block Kit 仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Secrets 取り扱い |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/alert-policy-matrix.md | アラート閾値マトリクス（AC-1, AC-7） |
| ドキュメント | outputs/phase-02/relay-worker-design.md | リレー Worker 設計（AC-2, AC-5） |
| ドキュメント | outputs/phase-02/slack-message-format.md | Slack 日本語メッセージフォーマット（AC-3） |
| ドキュメント | outputs/phase-02/secret-management.md | Secret 管理設計（AC-4） |

## 完了条件

- [ ] 4 ドキュメント全てが指定パスに配置されている
- [ ] 各ドキュメントが対応する AC を冒頭に明示している
- [ ] alert-policy-matrix.md に WARNING/CRITICAL 二段階閾値とベースライン後再調整方針が含まれる
- [ ] relay-worker-design.md に配置先決定根拠・cf-webhook-auth 検証手順・エラーハンドリング・リトライ方針が含まれる
- [ ] slack-message-format.md に日本語 `blocks` JSON サンプルとメトリクス名日本語訳マスタが含まれる
- [ ] secret-management.md に UT-08 既存 Secret との衝突確認表と `scripts/cf.sh` 経由の登録手順が含まれる
- [ ] テスト通知手順（AC-6）・Webhook 失敗フォールバック（AC-8）・runbook 追記方針（AC-9）が本 Phase 内に記述されている
- [ ] Phase 3 レビューへの引き継ぎ事項が明記されている

## タスク 100% 実行確認【必須】

- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Cloudflare Notifications 仕様変更 / Webhook カスタムヘッダ非対応 / Slack API 変更）の影響範囲を記録済み

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: 4 ドキュメント、リレー Worker 配置先 (a)/(b) の決定根拠、UT-08 衝突確認結果、未決事項一覧、代替案棄却理由をレビュー入力として渡す
- ブロック条件: 4 ドキュメントのいずれかが未作成、または UT-08 命名衝突確認が未完了の場合は Phase 3 に進まない
