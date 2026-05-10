# UT-17 Implementation Guide

## Part 1: 概念（中学生レベル）

家計に使いすぎ警告を出すように、Cloudflare の無料枠が減ってきたら警告を出すしくみ。
無料枠で使える基本形は「メール通知 + 対応手順書 (runbook)」だけ。
Webhook が使えるアカウントなら、Cloudflare からの英語アラートを日本語の Slack メッセージに**翻訳して中継する小さな Worker**（リレー Worker）を立てて、見やすい通知を Slack に届ける。

| 用語 | やさしい説明 |
| --- | --- |
| Cloudflare Notifications | Cloudflare が「使いすぎそうです」と知らせる通知機能 |
| Webhook | あるサービスから別のサービスへ自動でお知らせを送る入口 |
| Relay Worker | Cloudflare の通知を受け取り、Slack 用に整えて送り直す小さな中継係 |
| Secret | パスワードのように隠して管理する値 |
| Slack Block Kit | Slack メッセージを見やすい部品に分けて表示する形式 |
| Runtime smoke | 本物に近い環境で最低限の動作を確認するテスト |

### 必須サブセクション

1. **なぜ Cloudflare 無料枠アラートが必要か**
   Cloudflare の無料枠（Workers 10万req/日、D1 5GB、Pages 500ビルド/月、R2 10GB）を超過すると、即座に課金が始まる。突発的なトラフィックや誤デプロイで「気付いたら数千円」という事故を防ぐため、80% 到達時に事前警告を受け取る仕組みが必要。家計簿で「電気使用量があと 20% で上限です」と知らせるのと同じ。

2. **なぜ relay Worker が必要か**
   Cloudflare 標準の Notifications は英語メールのみで、運用者全員が即座に意味を取れない。重要度・現在値・閾値・対応 runbook リンクを日本語の Slack メッセージに整形して全員が見るチャンネルへ届ける「翻訳係」を Worker として独立させる。

3. **なぜ cf-webhook-auth 検証が必要か**
   `/internal/alert-relay` は public endpoint で、URL を知っていれば誰でも POST できる。攻撃者が偽アラートを Slack に流し込み運用者を疲弊・誤誘導させる事故を防ぐため、Cloudflare が送ってくる `cf-webhook-auth` ヘッダの値が事前共有 secret と一致するかを timing-safe 比較で検証する。印鑑照合と同じ。

4. **なぜ 1Password 経由なのか**
   Slack Webhook URL や `CF_WEBHOOK_AUTH_SECRET` を `.env` 平文や docs に貼ると、GitHub push の瞬間に secret scan で検知され、誰でも Slack に投稿可能になる。1Password Vault `cloudflare-alert-relay/*` を正本とし、`.env` には `op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL` のような参照のみを置き、`scripts/cf.sh` 経由で Cloudflare Secrets に動的注入する。

5. **アラートが来たら何をするか**
   Slack 通知本文の runbook リンク（`docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`）を開く = 取扱説明書を読む。一次対応フロー（メトリクス特定 → Dashboard 確認 → 緩和 or スケール判断）が手順化されているので、アラートを見た人が runbook の手順に沿って動けば良い。

6. **なぜ plan gate で完結させるか**
   Free plan では Webhook destination が使えないアカウントもあるため、ベースライン（メール通知 + runbook）を必ず動かす設計にしてある。Pro 以上または Webhook 利用可なアカウントのみ relay Worker を有効化することで、無料運用者にも課金運用者にも家計を圧迫しない設計。

## Part 2: 技術契約

| 項目 | 契約 |
| --- | --- |
| Baseline | Cloudflare Notifications email + runbook |
| Optional relay | `POST /internal/alert-relay`（本サイクルで実装済） |
| 認証 | `cf-webhook-auth` ヘッダ固定シークレット ↔ `CF_WEBHOOK_AUTH_SECRET` |
| 不採用認証 | `X-CF-Alert-Signature`, body HMAC, timestamp 署名（Cloudflare 公式契約として未公開） |
| Runtime secrets | `SLACK_WEBHOOK_URL`, `CF_WEBHOOK_AUTH_SECRET` |
| Runtime vars | `CF_ALERT_DASHBOARD_URL`, `CF_ALERT_RUNBOOK_URL` |
| 出力フォーマット | 日本語 Slack Block Kit（severity ヘッダ + 現在値 / 閾値 / 残量 + Dashboard / runbook リンク） |
| Retry | 429 / 5xx / network error は最大 3 回 exponential backoff (200ms/500ms/1500ms)。その他 4xx は即失敗 |
| Dedup | 同一 `(metric, policy/name, minute)` は 5 分間 in-memory dedup |

### Phase 11 evidence 一覧

AC-1〜AC-9 の evidence は Phase 11 の `acceptance-evidence` および evidence-bundle で参照する。各 AC の正規パスは以下（実体は `outputs/phase-11/` 配下、詳細は evidence-bundle で参照）。

| AC | 概要 | evidence パス |
| --- | --- | --- |
| AC-1 | cf-webhook-auth 検証（正常 / 不一致 / 欠落） | `outputs/phase-11/acceptance-evidence/AC-1.md` |
| AC-2 | 4 metric 種別の payload → Slack Block 整形 | `outputs/phase-11/acceptance-evidence/AC-2.md` |
| AC-3 | 日本語整形（severity / 現在値 / 閾値 / 残量 / リンク） | `outputs/phase-11/acceptance-evidence/AC-3.md` |
| AC-4 | Slack 429 / 5xx retry（200ms/500ms/1500ms） | `outputs/phase-11/acceptance-evidence/AC-4.md` |
| AC-5 | redacted error（Slack URL / secret 非露出） | `outputs/phase-11/acceptance-evidence/AC-5.md` |
| AC-6 | dedup（5 分・同一 metric/policy/minute） | `outputs/phase-11/acceptance-evidence/AC-6.md` |
| AC-7 | env 駆動 Dashboard / runbook URL | `outputs/phase-11/acceptance-evidence/AC-7.md` |
| AC-8 | Free baseline と Webhook relay の plan gate 分離 | `outputs/phase-11/acceptance-evidence/AC-8.md` |
| AC-9 | NON_VISUAL skip evidence（visual-verification-skip.md） | `outputs/phase-11/visual-verification-skip.md` |

### UT-08-IMPL との責務境界

| タスク | 責務 | データソース |
| --- | --- | --- |
| **UT-17（本タスク）** | Cloudflare native usage alerts（無料枠 80% 到達などのアカウントメトリクス） | Cloudflare Notifications（Workers / D1 / Pages / R2 plan limits） |
| **UT-08-IMPL** | WAE custom alerts（アプリ独自のビジネスメトリクス・カスタムログ） | Workers Analytics Engine（WAE）の SQL 集計結果 |

両タスクは Slack 通知 channel を共有し得るが、Notification Policy ／ relay endpoint ／ payload schema は独立する。relay Worker は UT-17 専用で、UT-08-IMPL は別 Worker または別 endpoint を持つ。

### 将来拡張ポイント

- **95% アラートの追加**: 80% に加え 95% Notification Policy を追加し severity を `critical` で送る。formatter の severity 判定は `cloudflare-alert-formatter.ts` で拡張可能。
- **Workers CPU time 統合（UT-18）**: 現状の 4 metric には Workers CPU time を含めていない。UT-18 で CPU time の取得・閾値・アラート手順を整備し、本 relay Worker への合流可否を判断する。
- **WAF レート制限（UT-14）**: `/internal/alert-relay` は public endpoint のため、UT-14 で WAF レート制限ルールを設定し、cf-webhook-auth 検証の前段に bot/spam 防御層を追加する。

## Part 3: 本サイクルで実装したもの

### 新規ファイル（apps/api）

- `src/types/cloudflare-notification.ts` — Cloudflare payload 型 / `AlertMetric`
- `src/lib/cf-webhook-auth.ts` — pure function 検証
- `src/lib/cloudflare-alert-formatter.ts` — payload → 日本語 Slack Block Kit
- `src/lib/slack-sender.ts` — Slack 送信 + retry + redacted error
- `src/middleware/verify-cf-webhook-auth.ts` — Hono middleware
- `src/routes/internal/alert-relay.ts` — `POST /internal/alert-relay`
- 4 つの test ファイル（27 ケース）

### 編集ファイル

- `src/env.ts` — `CF_WEBHOOK_AUTH_SECRET` / `SLACK_WEBHOOK_URL` を `Env` に追加
- `src/index.ts` — `app.route("/internal/alert-relay", createAlertRelayRoute())`

### 新規 runbook

- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` — アラート受信時の一次対応フロー
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` — 月次 webhook 生死確認手順

## Part 4: 検証結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | PASS（137 files / 969 tests） |
| `mise exec -- pnpm exec vitest run apps/api/src/lib/__tests__/cf-webhook-auth.test.ts apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts apps/api/src/lib/__tests__/slack-sender.test.ts apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | PASS（33/33） |

## Part 5: 外部操作残（次サイクル / ユーザー実施）

本サイクルではコード実装のみ完了。以下はユーザー側で外部 console / CLI 実行が必要。

| サブタスク | 実施内容 |
| --- | --- |
| T1 | 1Password に `SLACK_WEBHOOK_URL` 登録（`op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL`） |
| T2 | `bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --env staging` × 2 環境、同 `SLACK_WEBHOOK_URL` |
| T8 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` + curl テスト |
| T9 | Cloudflare Dashboard で Notification Policy 4 種設定 (Workers / D1 read+write / Pages / R2) |
| T10 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` + Policy 切替 |

## Part 6: 不変条件チェック

- D1 直接アクセスは `apps/api` に閉じる: 本タスクは D1 アクセスなし
- Secret は 1Password → Cloudflare Secrets / `.env` は `op://` のみ: コードに実値ハードコードなし
- Cloudflare CLI は `bash scripts/cf.sh` 経由のみ: 外部操作 T2/T8/T10 で遵守宣言
- UT-08 と責務重複なし: 本タスクは Cloudflare native usage alerts のみ
- Slack メッセージは日本語 + メトリクス / 現在値 / 閾値 / 残量 / リンク: formatter test FMT-01〜08 で担保
- cf-webhook-auth 固定シークレット必須: middleware test ROUTE-01/06/07 で担保

## Part 7: スクリーンショット

NON_VISUAL タスクのため UI スクリーンショットなし（`outputs/phase-11/visual-verification-skip.md` 参照）。
Slack 表示の実物確認は T8/T10 完了後に外部実施する。
