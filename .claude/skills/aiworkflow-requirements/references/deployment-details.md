# デプロイメント (Deployment) / detail specification

> 親仕様書: [deployment.md](deployment.md)
> 役割: detail specification

## UBM-Hyogo API Worker Cron（03a / 03b / 09b）

09b current facts（2026-05-01）として、`apps/api/wrangler.toml` の cron は `0 * * * *`（legacy Sheets hourly sync）、`0 18 * * *`（03a schema sync / 03:00 JST）、`*/15 * * * *`（03b Forms response sync）の 3 件である。legacy hourly cron の撤回と runtime 設定整理は UT21-U05（`docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md`）に委譲し、09b は docs-only / spec_created のため runtime 設定を変更しない。

## モニタリングとアラート

### ヘルスチェックエンドポイント設計

#### 基本ヘルスチェック（`/api/health`）

| 項目             | 仕様                                 |
| ---------------- | ------------------------------------ |
| ステータスコード | 200                                  |
| レスポンス       | ステータスとタイムスタンプを含むJSON |
| 実行時間         | 100ms以内                            |
| 内容             | サーバー稼働状況のみ                 |

#### 詳細ヘルスチェック（`/api/health/detailed`）

| チェック項目     | 説明                   |
| ---------------- | ---------------------- |
| データベース接続 | Tursoへの接続確認      |
| 外部API疎通      | 依存サービスの応答確認 |
| メモリ使用量     | 閾値超過の検出         |

### 監視すべきメトリクス（ゴールデンシグナル）

| シグナル         | 測定項目          | 目標値           |
| ---------------- | ----------------- | ---------------- |
| レイテンシ       | p50, p95, p99     | p95 < 500ms      |
| トラフィック     | リクエスト数/分   | ベースライン把握 |
| エラー           | エラー率          | < 1%             |
| サチュレーション | CPU、メモリ使用率 | < 80%            |

### Discord通知

#### 通知レベル

| レベル   | トリガー                           | 対応期限   |
| -------- | ---------------------------------- | ---------- |
| Critical | サービスダウン、エラー率>10%       | 即座に対応 |
| Warning  | エラー率5-10%、パフォーマンス劣化  | 24時間以内 |
| Info     | デプロイ成功、定期バックアップ完了 | 記録のみ   |

#### 通知抑制

- 同じアラートの連続送信を防止（5分間隔）
- メンテナンスモード時は通知を停止

### エラー追跡（Sentry推奨）

#### 導入メリット

- スタックトレースの自動収集
- ユーザー影響の可視化
- リリースバージョンとの紐付け
- 無料枠：月5,000イベント

#### 設定時の注意点

- DSNは環境変数で管理する
- 開発環境のエラーは送信しない
- 既知のエラー（404等）は除外する
- 機密情報はサニタイズする

---

## デプロイチェックリスト

### リリース前の確認事項

#### コード品質

- [ ] すべてのテストが通過
- [ ] 型エラーがない
- [ ] Lintエラーがない
- [ ] セキュリティ脆弱性がない

#### 機能検証

- [ ] ステージング環境で動作確認
- [ ] クリティカルパスのテスト
- [ ] パフォーマンステスト
- [ ] モバイルブラウザでの動作確認

#### ドキュメント

- [ ] CHANGELOGを更新
- [ ] READMEを必要に応じて更新
- [ ] APIドキュメントを更新（該当時）

### 本番デプロイ時の注意点

#### 推奨タイミング

- 平日10-16時（問題発生時に対応可能）
- トラフィックが比較的低い時間帯

#### 避けるべきタイミング

- 金曜日午後（週末に問題持ち越しリスク）
- 祝日前日
- 大規模キャンペーン中

#### デプロイ後の対応

**成功時**

- Discord/Slackで完了通知
- リリースノート公開
- 24時間は監視を継続

**失敗時**

- 即座にロールバック
- 失敗原因の分析
- 修正後の再デプロイ計画

---

## GitHub Secrets / Variables の要件

| 名前 | 種別 | 用途 | 必須 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflareデプロイ認証 | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Repository Variable | Cloudflare account 識別。workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で参照 | Yes |
| `CLOUDFLARE_WORKERS_DOMAIN` | Variable | バックエンドヘルスチェックURL | Yes |
| `DISCORD_WEBHOOK_URL` | Secret | Discord通知用WebhookURL | No |

### セキュリティ要件

| 要件       | 説明                               |
| ---------- | ---------------------------------- |
| 設定場所   | GitHubリポジトリのSettingsから設定 |
| 注入方法   | 環境変数として安全に注入           |
| マスク処理 | ログに出力されないようマスク処理   |

---

### UT-08 モニタリング設計連携

UT-08（`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/`）で WAE 計装・閾値・通知・外形監視の SSOT を確定。Wave 2 実装タスク（UT-08-IMPL）でデプロイ後の監視確認チェック（WAE dataset / Slack webhook / UptimeRobot monitor）を CD post-deploy smoke に組み込む。詳細は `workflow-ut08-monitoring-alert-design-artifact-inventory.md` を参照。

---
