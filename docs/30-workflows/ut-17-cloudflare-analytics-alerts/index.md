# ut-17-cloudflare-analytics-alerts - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Cloudflare Notifications のダッシュボード設定に加えて、Cloudflare → Slack 間に「日本語化リレー Worker」のコード実装を伴うため。Notification 設定単体は手作業で完結するが、Slack へ届くペイロードを日本語に整形する工程は Worker 上のロジック実装を必須とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-17 |
| タスク名 | Cloudflare Analytics アラート設定 |
| ディレクトリ | docs/30-workflows/ut-17-cloudflare-analytics-alerts |
| Wave | 2 以降 |
| 実行種別 | 設計 + 実装タスク（Cloudflare Notifications 設定 + Slack 日本語化リレー Worker） |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 状態 | implementation_completed_external_ops_pending |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #20（CLOSED） |

## 目的

Cloudflare の無料枠使用量（Workers Daily Requests / D1 Read+Write / Pages Build / R2 Class A）が閾値に近づいた際に、Cloudflare Notifications のネイティブアラートで自動通知を受け取る仕組みを設計・実装する。
Free plan baseline はメール通知 + runbook を正本とし、Professional 以上またはアカウント条件により Webhook が利用可能な場合だけ、Cloudflare Notifications が送出する英語ペイロードを **日本語化リレー Worker** で整形し Slack Incoming Webhook へ転送する。
01b-parallel-cloudflare-base-bootstrap (UN-06) で確立した Analytics モニタリング基盤を強化し、無料枠超過による予期しない課金を防ぎ、少人数運用でも障害兆候を見逃さない運用体制を構築する。

## スコープ

### 含む

- Cloudflare Dashboard > Notifications のネイティブ無料枠アラート設定
  - Workers Daily Requests / D1 Read+Write / Pages Build / R2 Class A
  - WARNING (80%) / CRITICAL (95%) の二段階閾値
  - Free plan baseline はメール通知、Webhook は plan gate 通過時のみ
- Slack 日本語化リレー Worker の設計と実装（Professional 以上 / Webhook 利用可能時）
  - 配置先決定（`apps/api` 内 internal route または新規 `apps/alert-relay`）
  - 入出力ペイロード契約
  - cf-webhook-auth 固定シークレットによる Cloudflare → Worker 認証
  - 日本語メッセージフォーマット（Slack `blocks`）
  - エラーハンドリング・リトライ
- Secret 設計（1Password Environments → Cloudflare Secrets）
  - `SLACK_WEBHOOK_URL`
  - `CF_WEBHOOK_AUTH_SECRET`
- Webhook 失敗時のフォールバック（メール通知併用 / 月次ヘルスチェック）
- テスト通知の手動トリガー手順と動作確認手順
- 関連 runbook（`docs/30-workflows/runbooks/`）への追記方針

### 含まない

- WAE 計装によるカスタムアラート（D1 query failure / Cron sync failure / アプリエラー）→ UT-08 で完了
- Workers CPU 個別モニタリング（CPU time ピーク）→ UT-18 の責務
- WAF ブロック急増アラート → UT-14 連携
- 有料プランの高度なアラート機能（Health Checks Pro 等）
- アプリケーション APM・コードレベルトレーシング
- 通知基盤（UT-07）の実装本体

## 責務境界（UT-08 / UT-17 / UT-18）

| タスク | 責務 |
| --- | --- |
| UT-08（完了済） | WAE 計装によるカスタムアラート（D1 query failure / Cron sync failure / アプリエラー）、閾値マトリクス、外部監視評価 |
| **UT-17（本タスク）** | **Cloudflare Notifications ネイティブ無料枠アラート（Workers req / D1 read+write / Pages build / R2）+ Slack 日本語リレー Worker** |
| UT-18 | Workers CPU time の確認手順・CPU 超過調査フロー |

UT-08 が「アプリ層イベント計装」、UT-17 が「Cloudflare プラットフォーム使用量アラート」、UT-18 が「Workers CPU 個別観測」と責務が完全に分離しており、本タスクで重複は発生しない。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap | アラート対象リソース（Workers / D1 / Pages / R2）の確定が前提 |
| 上流 | UT-07 (通知基盤設計) | 通知先（Slack チャンネル / Webhook URL）が確定していること |
| 上流 | UT-08-IMPL (モニタリング/アラート設計) | アプリ層計装と責務分離する境界線が確定していること |
| 連携 | UT-14 (WAF / Rate Limiting) | WAF ブロック急増アラートと通知統合運用 |
| 連携 | UT-18 (Workers CPU モニタリング) | CPU time アラートと通知統合運用 |
| 下流 | runbooks 追記 | Slack 通知受信時の対応手順を runbook に追記 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md | UT-17 原典タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/index.md | UT-08 責務境界の照合元 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md | UT-08 が定義した通知設計（責務重複チェック） |
| 必須 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | アラート対象リソースの確認 |
| 必須 | CLAUDE.md（リポジトリルート） | Secret 管理 / `scripts/cf.sh` 利用ルール / D1 アクセス境界 |
| 参考 | https://developers.cloudflare.com/notifications/ | Cloudflare Notifications 公式 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Webhook destination 設定手順 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhook 仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Secrets 取り扱い |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: Cloudflare Notifications で Workers Daily Request / D1 Read+Write / Pages Build / R2 Class A の各メトリクスに対し、公式確認済み / 未確認 / 不採用と WARNING (80%) / CRITICAL (95%) の二段階通知方針が `outputs/phase-02/alert-policy-matrix.md` に定義されている
- AC-2: Slack 日本語化リレー Worker の入出力契約・認証方式・配置先が `outputs/phase-02/relay-worker-design.md` に決定され、Webhook 利用不可時はメール通知 baseline にフォールバックする
- AC-3: Slack 通知メッセージは日本語で、メトリクス名・現在値・閾値・残量・確認手順リンクを含むフォーマット例が `outputs/phase-02/slack-message-format.md` に存在する
- AC-4: Slack Webhook URL の 1Password 正本パスと、リレー Worker の wrangler.toml への Secret 登録手順が `outputs/phase-02/secret-management.md` に存在する
- AC-5: Cloudflare generic webhook の `cf-webhook-auth` 固定シークレット（`CF_WEBHOOK_AUTH_SECRET`）による Cloudflare → Worker 認証設計が `outputs/phase-02/relay-worker-design.md` に存在する
- AC-6: テスト通知の手動トリガー手順と動作確認手順が Phase 02 設計内に記載されている
- AC-7: 閾値設定タイミング方針（本番稼働後 1〜2 週間のベースライン取得後に再調整）が `outputs/phase-01/requirements.md` および `outputs/phase-02/alert-policy-matrix.md` に記載されている
- AC-8: Webhook 失敗時のフォールバック（メール通知併用 / 月次ヘルスチェック）が Phase 02 内に記載されている
- AC-9: 関連 runbook（`docs/30-workflows/runbooks/`）への追記方針が Phase 02 内に存在する
- AC-10: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/ |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/design-review.md |
| 4〜10 | 実装計画〜リファクタ | phase-04.md〜phase-10.md | completed | 実コード・テスト・runbook 反映済み |
| 11 | 受入テスト・evidence | phase-11.md | skipped_non_visual | outputs/phase-11/visual-verification-skip.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/ |
| 13 | PR・振り返り | phase-13.md | blocked_pending_user_approval | commit / push / PR は未実行 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| ドキュメント | outputs/phase-02/alert-policy-matrix.md | Cloudflare Notifications アラート閾値マトリクス（AC-1） |
| ドキュメント | outputs/phase-02/relay-worker-design.md | 日本語化リレー Worker 設計（AC-2 / AC-5） |
| ドキュメント | outputs/phase-02/slack-message-format.md | Slack 日本語メッセージフォーマット（AC-3） |
| ドキュメント | outputs/phase-02/secret-management.md | Secret 管理設計（AC-4） |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（AC-10） |

## 不変条件

1. D1 への直接アクセスは `apps/api` に閉じる。リレー Worker からの D1 アクセスは原則禁止し、必要時は API 経由のみ
2. Secret は 1Password Environments を正本とし、`.env` には `op://Vault/Item/Field` 参照のみを記述。実値のコミット禁止
3. Cloudflare CLI 操作は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接呼び出しは禁止
4. 閾値設定は本番稼働後 1〜2 週間のベースライン取得後に再調整する（テストトラフィックでの誤発火防止）
5. UT-08 の責務（WAE カスタム計装）と本タスクの責務（プラットフォーム使用量アラート）を重複させない
6. Slack 通知メッセージは必ず日本語で、メトリクス名・現在値・閾値・残量・確認手順リンクを含む
7. Cloudflare → リレー Worker 間は cf-webhook-auth 固定シークレットで認証する。匿名 Webhook を許容しない

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| Cloudflare plan gateで一部メトリクスのアラートが設定不可 | Phase 1 で公式仕様を再確認し、対応不可なメトリクスは UptimeRobot 等の外部監視で補完する方針を併記 |
| テストトラフィックで閾値が誤発火 | 閾値設定は本番稼働後 1〜2 週間後に行う（不変条件 4） |
| Slack Webhook URL 失効によるサイレント障害 | メール通知併用 + 月次手動ヘルスチェック（AC-8） |
| cf-webhook-auth シークレット漏洩 | 1Password 正本管理 + Cloudflare Secrets 注入のみ。コードへのハードコード禁止 |
| アラート疲れ | WARNING / CRITICAL 二段階設計、CRITICAL は連続条件付き、メッセージは集約可能なフォーマット |
| リレー Worker のコールドスタート遅延で通知遅延 | Cloudflare Workers の特性上ほぼ無視可。タイムアウト 10 秒で監視 |
| 日本語化リレー Worker 自体の障害 | Cloudflare Notifications のメール通知併用でフォールバック（AC-8） |

## 注意点

- Issue #20 は CLOSED だが、unassigned-task として継続管理されていた経緯がある。本タスクで仕様化することで spec_created へ昇格させる
- UT-08 で既に Slack Webhook 設計（`MONITORING_SLACK_WEBHOOK_URL`）が存在するため、Secret 名・チャンネルの命名衝突を Phase 2 で確認する
- Cloudflare Notifications の Webhook destination は HTTPS 必須・カスタムヘッダ対応であることを Phase 1 で再確認する
- 配置先（`apps/api` 内 internal route vs 新規 `apps/alert-relay`）の決定根拠は Phase 2 で記録する
