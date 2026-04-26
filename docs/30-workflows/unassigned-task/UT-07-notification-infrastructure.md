# UT-07: 通知基盤設計と導入

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-07 |
| タスク名 | 通知基盤設計と導入 |
| 優先度 | LOW |
| 推奨Wave | Wave 2以降 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

バンドマン向けに、イベント通知・締め切りリマインダー等をメール・LINE・Slack等の複数チャネルで配信できる通知基盤を設計・実装する。Wave 1 のアプリケーションコア機能が安定稼働した後、ユーザー体験向上のために導入する。

## スコープ

### 含む
- 通知チャネルの選定と設計（メール / LINE Messaging API / Slack Incoming Webhook）
- 通知イベント定義（イベント登録・変更・キャンセル、締め切りリマインダー等）
- Cloudflare Workers を使った通知送信処理の実装
- 通知テンプレート（件名・本文）の作成
- 通知配信の失敗時リトライ方針の定義
- 配信状況ログの設計（D1 への記録）
- 通知オプトイン/オプトアウト設定の仕組み

### 含まない
- Wave 1 のコア機能実装（UT-09 など）
- 有料メール配信 SaaS の本格契約（MVP はメール or LINE のいずれか一方で可）
- プッシュ通知（Web Push / FCM）
- SMS 通知

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | アプリケーションコア機能（Wave 1 全タスク） | 通知トリガーとなるイベントデータが D1 に格納されている必要がある |
| 上流 | UT-09（Sheets→D1 同期ジョブ実装） | 通知対象データが D1 に揃っていること |
| 上流 | UT-04（D1 データスキーマ設計） | 通知配信ログの格納テーブルが必要 |
| 下流 | - | 現時点で後続タスクの依存なし |

## 苦戦箇所・知見

**LINE Messaging API の認証フロー複雑性**
LINE Messaging API はチャネルアクセストークンの管理が必要で、短命トークン（2時間）と長命トークン（無期限だが失効リスク）の使い分けが難しい。1Password Environments でトークンを管理し、Cloudflare Workers の Secret で注入する設計が安全。

**複数チャネルへの配信抽象化**
メール・LINE・Slack でインターフェースが異なるため、Adapter パターンで `NotificationChannel` インターフェースを定義しないと将来チャネルが増えるたびに実装が肥大化する。最初から抽象化しておく。

**Cloudflare Workers の無料プランにおける外部 API 呼び出し制限**
Workers 無料プランは 1 リクエストあたり CPU 時間が 10ms（サブリクエスト数も制限あり）。大量通知を1リクエスト内で逐次送信すると制限に引っかかるため、Cron Trigger + Queue（Cloudflare Queues）への切り出しを検討する。

**通知の重複送信防止**
Cron Trigger が複数 Worker インスタンスで同時実行された場合、同じ通知が複数回送信されるリスクがある。D1 側で「配信済みフラグ」を持つか、Cloudflare Durable Objects で排他制御するかを設計段階で決定する必要がある。

## 実行概要

- `NotificationChannel` インターフェースを定義し、メール・LINE・Slack の各 Adapter を実装する
- 通知イベントの種別一覧（`notification_events` テーブル）と配信ログ（`notification_delivery_log` テーブル）を D1 スキーマに追加する
- Cloudflare Workers Cron Trigger でバッチ通知ジョブを実装し、未送信イベントを定期スキャン→送信→ログ記録する
- 配信失敗時は指数バックオフでリトライし、最大 3 回失敗したら dead letter として記録する
- 1Password Environments で外部サービスの API キー（LINE チャネルアクセストークン等）を管理し、wrangler.toml の `[vars]` ではなく Secrets として注入する

## 完了条件

- [ ] 通知チャネル（最低 1 チャネル）の設計ドキュメントが作成されている
- [ ] `NotificationChannel` インターフェースと最低 1 つの Adapter 実装がコードに存在する
- [ ] 通知配信ログが D1 に記録されることを確認するテストが通過している
- [ ] Cron Trigger による通知ジョブが dev 環境で動作確認済みである
- [ ] 重複送信防止の仕組みが実装・確認されている
- [ ] オプトアウト設定がある場合、オプトアウト済みユーザーに通知が送られないことを確認している
- [ ] API キーが Secret 経由で注入され、コードにハードコードされていないことを確認している

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/10-notification-auth.md | 通知・認証要件の確認 |
| 必須 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 無料枠・コスト制約の確認 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-07 の原典記録 |
| 参考 | https://developers.line.biz/ja/docs/messaging-api/ | LINE Messaging API 公式ドキュメント |
