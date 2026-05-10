# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Cloudflare Notifications のダッシュボード設定だけでなく、Cloudflare → Slack 間の英語ペイロードを日本語に整形して中継する Worker のコード実装を伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 (UT-17) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

UT-17 Cloudflare Analytics アラート設定タスクの必要性・スコープ・受入条件を確定し、下流 Phase の手戻りを防ぐ。
特に「UT-08 で完了済の WAE カスタムアラートとの責務境界」「Cloudflare plan gateで設定可能なネイティブアラートの範囲」「Slack 日本語化リレー Worker の必要性と配置先」という 3 つの論点を早期に特定し、Phase 2 設計に適切なインプットを渡す。
本タスクは設計成果物に加えて Slack 日本語化リレー Worker のコード実装を伴うため、Phase 4 以降の実装フェーズで利用する設計詳細を Phase 2 で具体的に確定させる方針を Phase 1 で承認する。

## 真の論点

UT-17 の本質的な問題は以下の 3 点である。

1. **UT-08 との責務境界の固定化**:
   UT-08 (モニタリング/アラート設計) は WAE 計装によるアプリ層イベント（D1 query failure / Cron sync failure / アプリエラー）の検知を責務として完了している。UT-17 はその次のレイヤーとして、Cloudflare プラットフォームの無料枠使用量（Workers req / D1 read+write / Pages build / R2）のネイティブアラートを担う。境界を曖昧にすると、同じイベントが二重通知される、または設計の重複によりメンテナンスコストが二倍になる。Phase 1 で「UT-17 はプラットフォーム使用量、UT-08 はアプリ層イベント」という線引きを不変条件として確定する。

2. **Cloudflare plan gateのネイティブアラート制約**:
   Cloudflare Notifications はplan gateでも Workers Daily Requests / D1 Read+Write / Pages Build などの使用量アラートが設定可能だが、CPU time ピークなどの細粒度メトリクスは有料機能。R2 Class A operations の使用量アラートもplan gateでの可否を再確認する必要がある。Phase 1 で公式仕様を確認し、対応不可なメトリクスは UT-18 や外部監視で補完する方針を Phase 2 へ申し送る。

3. **Slack 日本語化リレー Worker の必要性と配置先**:
   Cloudflare Notifications が直接 Slack Webhook へ送信したペイロードは英語かつ Cloudflare 独自フォーマットで、運用者が一目で「どのメトリクスが何 % に達したか」を把握しにくい。少人数運用では受信即座に判断する必要があるため、英語ペイロードを日本語ブロック形式に整形して Slack へ転送する中継 Worker をリポジトリ内に持つ判断をする。配置先は (a) `apps/api/src/routes/internal/alert-relay.ts` として既存 API に同居させる案、(b) 新規 `apps/alert-relay` ワーカーとして独立させる案がある。Phase 2 でトレードオフ（独立性 vs 運用簡素化）を整理し決定するが、Phase 1 では「リレー Worker をリポジトリ管理下のコードとして実装する」方針自体を承認する。

## 依存境界と責務

| 種別 | 対象 | 本タスクとの境界 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap | アラート対象リソース（Workers / D1 / Pages / R2）が Cloudflare 上にデプロイ済みであることが前提 |
| 上流 | UT-07 (通知基盤設計) | Slack Workspace / チャンネル / Webhook URL の準備が完了している前提 |
| 上流 | UT-08-IMPL (モニタリング/アラート設計) | アプリ層 WAE 計装と責務分離する境界線を固定する。同じ Slack チャンネルを共有するか分離するかを Phase 2 で決定 |
| 連携 | UT-14 (WAF / Rate Limiting) | WAF ブロック急増アラートと通知統合運用 |
| 連携 | UT-18 (Workers CPU モニタリング) | CPU time アラートと通知統合運用 |
| 対象外 | WAE 計装による独自イベント検知 | UT-08 完了済のため対象外 |
| 対象外 | Workers CPU 個別観測 | UT-18 の責務 |
| 対象外 | 有料プラン専用アラート | plan gate範囲に限定 |
| 対象外 | アプリケーション APM | コードレベルトレーシングは対象外 |

## 価値とコスト評価

- **初回提供価値**: Cloudflare 無料枠超過による予期しない課金を 80% / 95% の段階閾値で事前検知できる。Slack 日本語化リレーにより、運用者は通知を受け取った瞬間に「どのリソースが何 % 残っているか」を母国語で即座に判断できる。
- **初回に払わないコスト**: 有料 SaaS、APM、CPU 個別観測（UT-18）、WAF アラート（UT-14）、WAE カスタム計装（UT-08）。
- **設計コスト**: 4 種類の Phase 2 成果物（alert-policy-matrix / relay-worker-design / slack-message-format / secret-management）に加えて、リレー Worker のコード設計（入出力契約・cf-webhook-auth 認証・エラーハンドリング）を含めるため、設計分量は中規模。
- **実装コスト**（Phase 4 以降想定）: リレー Worker 約 200〜400 行、wrangler.toml 1 件、Cloudflare Notifications ダッシュボード設定 4〜8 件、テスト通知の動作確認 1 セット。
- **運用コスト**: Slack Webhook URL 失効監視（月次ヘルスチェック）、cf-webhook-auth シークレットローテーション、閾値の本番ベースライン後再調整。

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 無料枠超過予防 + 日本語通知が少人数運用の障害早期検知に直結するか | CONDITIONAL |
| 実現性 | Cloudflare plan gate Notifications + Workers + Slack Webhook の組合せで AC-1〜AC-10 を満たせるか | CONDITIONAL |
| 整合性 | UT-08 既存通知設計と命名・チャンネルが衝突せず共存できるか | CONDITIONAL |
| 運用性 | WARNING/CRITICAL 二段階閾値 + 月次ヘルスチェックで運用継続可能か | CONDITIONAL |

判定が CONDITIONAL である主要条件:

- Cloudflare plan gateで R2 Class A operations のアラートが設定可能か Phase 2 設計前に再確認する
- UT-08 が既に予約している Slack Secret 名（`MONITORING_SLACK_WEBHOOK_URL`）と本タスクの Secret 名・チャンネルが衝突しないことを Phase 2 で合意する
- Cloudflare Notifications の Webhook destination が「カスタムヘッダ送信可能」であることを Phase 2 設計前に再確認する（cf-webhook-auth 署名ヘッダの送信に必要）

## 既存資産インベントリ

| 資産 | 確認対象 | 確認方法 |
| --- | --- | --- |
| UT-08 notification-design.md | 既存 Slack Webhook 設計（`MONITORING_SLACK_WEBHOOK_URL`） | `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md` を参照 |
| UT-08 secret-additions.md | 既に予約済の Secret 命名 | 同上 outputs/phase-02/secret-additions.md |
| 01b cloudflare-topology.md | アラート対象リソース | `docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md` |
| `apps/api` ルート構造 | リレー Worker 配置候補 (a) の参照ベース | repository を確認し、`src/routes/internal/` の有無を Phase 2 で確認 |
| `apps/` 配下のワーカー構造 | リレー Worker 配置候補 (b) の前例 | `apps/web` / `apps/api` 以外の独立 Worker が存在するかを Phase 2 で確認 |
| 1Password Environments | Secret 配置先 | CLAUDE.md のシークレット管理セクション |
| Cloudflare Dashboard | Notifications 設定可否 | plan gateで設定可能なメトリクス一覧を Phase 2 設計前に再確認 |
| Slack Workspace / Channel | 通知先 | UT-07 で確定済（前提） |
| `scripts/cf.sh` | Cloudflare CLI ラッパー | リポジトリルート確認、Secrets 投入時に利用 |

## スコープ確定

### 含む

- Cloudflare Notifications のネイティブ無料枠アラート設定
  - Workers Daily Requests
  - D1 Read 使用量
  - D1 Write 使用量
  - Pages Build 使用量
  - R2 Class A operations（plan gateで可能な場合）
- WARNING (80%) / CRITICAL (95%) の二段階閾値
- メール通知 + Webhook 通知（リレー Worker 宛）
- Slack 日本語化リレー Worker の設計
  - 入出力ペイロード契約
  - cf-webhook-auth 固定シークレット 認証
  - 日本語メッセージフォーマット（`blocks` 形式）
  - エラーハンドリング・リトライ
  - 配置先決定（`apps/api` 内 internal route または `apps/alert-relay`）
- Secret 設計（`SLACK_WEBHOOK_URL` / `CF_WEBHOOK_AUTH_SECRET`）
- Webhook 失敗時のフォールバック（メール併用 + 月次ヘルスチェック）
- テスト通知の手動トリガー手順と動作確認手順
- 関連 runbook 追記方針

### 含まない

- WAE カスタム計装（UT-08 で完了済）
- Workers CPU 個別観測（UT-18 の責務）
- WAF アラート（UT-14 の責務）
- 有料プラン機能（Health Checks Pro 等）
- アプリ APM・コードレベルトレーシング
- UT-07 通知基盤の実装本体
- リレー Worker のコード実装そのもの（Phase 4 以降の実装フェーズへ委譲。本 Phase は要件のみ）

## 受入条件 (AC) 確認

index.md で定義された AC-1〜AC-10 を Phase 1 で正式承認する。
Phase 2 の各成果物が AC-1〜AC-9 に、Phase 3 が AC-10 にそれぞれ対応する。

## 用語集

| 用語 | 意味 |
| --- | --- |
| Cloudflare Notifications | Cloudflare Dashboard から設定する通知配信機能。Notification Policy に閾値・対象・送信先を定義する |
| Notification Policy | アラート発火条件と送信先のセット |
| Webhook Destination | Cloudflare Notifications がイベントを HTTP POST する宛先。任意のカスタムヘッダ送信が可能 |
| cf-webhook-auth | Cloudflare generic webhook が送る固定シークレットヘッダ。リレー側は `CF_WEBHOOK_AUTH_SECRET` と定数時間比較し、body HMAC は採用しない |
| WAE (Workers Analytics Engine) | Cloudflare Workers 上でカスタムイベントを集計クエリ可能にする機能。UT-08 が責務として保有 |
| 日本語化リレー Worker | Cloudflare Notifications が送出した英語ペイロードを受信し、日本語 Slack ブロックに整形して Slack Incoming Webhook へ転送する中継 Worker |
| Slack Incoming Webhook | Slack の指定チャンネルへ HTTP POST でメッセージ投稿する公式機構 |
| ベースライン取得 | 本番稼働後 1〜2 週間の実トラフィック使用量を観測し、閾値を実態に合わせて再調整するための初期データ収集期間 |

## 実行タスク

- [ ] index.md / 原典 `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md` を読み、前提条件を確認する
- [ ] UT-08 完了済成果物（notification-design.md / secret-additions.md）を確認し、責務境界と Secret 命名衝突の有無を確認する
- [ ] 真の論点 3 点（UT-08 責務境界 / plan gate制約 / リレー Worker 必要性と配置先）を文書化する
- [ ] スコープ（含む/含まない）を確定する
- [ ] 受入条件 AC-1〜AC-10 を Phase 1 で正式承認する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を記録する
- [ ] 既存資産インベントリ（UT-08 成果物 / 01b トポロジ / `apps/api` 構造 / `scripts/cf.sh`）を洗い出す
- [ ] Cloudflare plan gate Notifications の対応メトリクスと R2 アラート可否を再確認する
- [ ] Cloudflare Notifications Webhook destination のcf-webhook-auth ヘッダ仕様を再確認する
- [ ] `outputs/phase-01/requirements.md` を作成する

## 統合テスト連携

本 Phase は要件定義のみで、実装コード・Cloudflare ダッシュボード設定・Secret 投入を実行しない。統合テスト連携は Phase 4 以降の実装フェーズで本 Phase 成果物を入力として実施する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 4〜 実装フェーズ | リレー Worker 実装、Notifications 設定、cf-webhook-auth 認証実装、Slack 疎通テスト | 設計・検証観点を Phase 2 へ申し送る |
| UT-07 | 通知基盤との接続 | Slack Webhook URL 提供元として参照 |
| UT-08 | 既存通知チャンネル / Secret との衝突回避 | Phase 2 で命名衝突確認を実施 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md | タスク概要・AC・不変条件 |
| 必須 | docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md | UT-17 原典タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/index.md | UT-08 責務境界の照合元 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md | UT-08 通知設計（命名衝突確認） |
| 必須 | CLAUDE.md | Secret 管理 / `scripts/cf.sh` / D1 アクセス境界 |
| 参考 | https://developers.cloudflare.com/notifications/ | Cloudflare Notifications 公式 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Webhook destination 設定 |
| 参考 | https://api.slack.com/messaging/webhooks | Slack Incoming Webhook 仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare バインディング・Secrets |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（論点・スコープ・AC・4条件評価・既存資産インベントリ・用語集） |

## 完了条件

- [ ] 真の論点 3 点（UT-08 責務境界 / plan gate制約 / リレー Worker 必要性と配置先）が文書化されている
- [ ] 4 条件評価が PASS / FAIL / CONDITIONAL のいずれかで記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-10 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリ（UT-08 成果物 / 01b トポロジ / `apps/api` 構造）が記録されている
- [ ] Cloudflare plan gate Notifications 対応メトリクスと Webhook カスタムヘッダ可否が再確認されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Cloudflare Notifications 仕様変更 / Slack Webhook 仕様変更 / UT-08 通知設計の更新）を確認済み
- 次 Phase への引き継ぎ事項を記述

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 真の論点・AC・スコープ・4 条件評価の CONDITIONAL 解消条件・既存資産インベントリ・UT-08 命名衝突確認結果を Phase 2 設計の入力として渡す
- ブロック条件: 本 Phase の `outputs/phase-01/requirements.md` が未作成、または CONDITIONAL の解消条件が未記録の場合は Phase 2 に進まない
