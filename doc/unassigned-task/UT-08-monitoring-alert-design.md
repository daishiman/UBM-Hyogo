# UT-08: モニタリング/アラート設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-08 |
| タスク名 | モニタリング/アラート設計 |
| 優先度 | LOW |
| 推奨Wave | Wave 2以降 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails |

## 目的

Cloudflare Analytics および外部監視ツールを組み合わせて、システムの可用性・無料枠消費・障害を継続的に観測し、問題を早期に検知してアラートを発報できる仕組みを構築する。05a-parallel-observability-and-cost-guardrails で定義した手動観測・runbook を自動監視へ発展させることが主目的である。

## スコープ

### 含む
- Cloudflare Workers / Pages / D1 の主要メトリクス収集設計（エラーレート・レスポンスタイム・CPU使用量・無料枠消費率）
- アラート閾値の定義（WARNING / CRITICAL 二段階）
- 障害通知先の設計（メール or Slack Webhook）
- 外部監視ツール選定（UptimeRobot 等の無料プラン範囲）
- D1 クエリ失敗・Sheets 同期失敗の検知ルール
- アラート発報から対応完了までの runbook 更新（05a との差分）
- ダッシュボード設計（Cloudflare Analytics / 外部ツール）

### 含まない
- 有料監視 SaaS の契約（無料枠内に限定）
- アプリケーション APM（コードレベルのトレーシング）
- 通知基盤（UT-07）のメトリクス監視
- セキュリティ監視・WAF 設定

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Wave 1 全タスク（01〜06タスク群） | 監視対象となるサービスが全てデプロイ済みであること |
| 上流 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails | 手動観測・runbook の基盤設計を継承し、自動化を追加する |
| 上流 | UT-09（Sheets→D1 同期ジョブ実装） | 同期ジョブの失敗検知が主要監視対象の一つ |
| 下流 | UT-07（通知基盤設計と導入） | アラート通知チャネルとして通知基盤を活用できる（任意） |

## 苦戦箇所・知見

**05a との責務境界の曖昧さ**
05a-parallel-observability-and-cost-guardrails は「手動確認可能な観測点の優先」を方針としており、自動アラートは意図的にスコープ外にされている。UT-08 はその次のステップとして自動監視を追加するが、05a の成果物（observability-matrix.md・cost-guardrail-runbook.md）を上書きしないよう、差分として追記する方針を取る。設計時に 05a の担当者と境界を合意しておくこと。

**Cloudflare Analytics API の制約**
Cloudflare Analytics は Workers Analytics Engine（WAE）を使うことで構造化ログをクエリできるが、WAE への書き込みは Workers コードへの計装が必要。無料プランでの利用可否と保存期間（デフォルト 31 日）を事前に確認すること。

**外部監視ツールの HTTPS チェック頻度制限**
UptimeRobot 無料プランは監視間隔が 5 分。5 分以内に起きた瞬断は検知できない。SLA 要件と照合し、許容できるかを先に合意しておく。

**アラートノイズ問題**
閾値設定が緩すぎると誤報が頻発し、担当者が無視するようになる（アラート疲れ）。初期は WARNING のみ運用し、対応実績を見ながら CRITICAL の閾値を調整する iterative アプローチを採ること。

**D1 クエリメトリクスの取得**
D1 はネイティブにクエリ単位の実行時間を Workers ログに出力しない。`console.log` でタイミングを計装するか、D1 のダッシュボード（Cloudflare Dashboard）の集計値を定期チェックするかを選択する必要がある。

## 実行概要

- 05a の成果物（observability-matrix.md）を参照し、自動化対象メトリクスを選定して監視設計書（`monitoring-design.md`）を作成する
- Cloudflare Workers Analytics Engine への計装コードを `apps/api` に追加し、エラーレート・レスポンスタイムを収集する
- UptimeRobot（または同等の無料サービス）で外形監視を設定し、エンドポイントの死活監視を自動化する
- Slack Incoming Webhook または メールで障害アラートを受信できるよう通知設定を行い、Secret は 1Password Environments 経由で管理する
- 05a の runbook を UT-08 の成果物として差分更新し、手動チェック項目を自動検知ルールに置き換えた箇所を明記する

## 完了条件

- [ ] 監視設計書（monitoring-design.md）が作成されており、メトリクス・閾値・通知先が定義されている
- [ ] Cloudflare Workers に計装コードが追加され、dev 環境でメトリクスが収集されることを確認している
- [ ] 外形監視が設定され、エンドポイントのダウン検知テストが通過している
- [ ] アラート通知が設定先（Slack or メール）に届くことを確認している
- [ ] 05a の runbook との差分・継承関係が設計書に明記されている
- [ ] 新規 Secret が 1Password Environments に格納され、コードにハードコードされていない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 手動観測・runbook の基盤設計を継承するための起点 |
| 必須 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md | observability-matrix の詳細確認 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-08 の原典記録 |
| 参考 | https://developers.cloudflare.com/analytics/analytics-engine/ | Workers Analytics Engine 公式ドキュメント |
