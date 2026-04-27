# UT-17: Cloudflare Analytics アラート設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-17 |
| タスク名 | Cloudflare Analytics アラート設定 |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-06) |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

Cloudflare の無料枠使用量（Pages ビルド数・Workers リクエスト数・D1 読み書き数）が閾値に近づいた際に自動通知を受け取れるアラートを設定する。01b タスクで確立した Analytics モニタリング（AC-4）を強化し、無料枠超過による予期しない課金を防ぐ。

## スコープ

### 含む
- Cloudflare Notifications の設定（メール / Webhook）
- 無料枠使用量アラートの閾値設定（Pages / Workers / D1 / R2）
- アラート通知先の設定（Slack Webhook または メールアドレス）
- 週次使用量レポートの自動送信設定（可能であれば）

### 含まない
- カスタムメトリクスの収集（→ アプリケーション層のモニタリングタスク UT-08 で対応）
- Workers の詳細パフォーマンス分析（→ UT-18 で対応）
- 有料プランの高度なアラート機能（→ 無料枠で対応できる範囲に限定）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | アラート対象リソース（Pages / Workers / D1）の確定が前提 |
| 上流 | UT-07 (通知基盤設計) | 通知先（Slack チャンネル等）が確定していること |
| 連携 | UT-14 (WAF / Rate Limiting) | WAF ブロック急増アラートと統合して管理 |
| 連携 | UT-18 (Workers CPU モニタリング) | CPU time アラートと統合して管理 |
| 連携 | UT-08-IMPL (モニタリング/アラート実装) | アプリケーション層のWAE計装・カスタムアラートと責務を分離 |

## UT-08 / UT-17 / UT-18 責務境界

| タスク | 責務 |
| --- | --- |
| UT-17 | Cloudflare native usage alerts（Pages / Workers / D1 / R2 の無料枠使用量） |
| UT-18 | Workers CPU time の確認手順・CPU超過調査フロー |
| UT-08-IMPL | WAE 計装、アプリケーションエラー、D1 query failure、Cron sync failure、Slack/Email custom alert |

## 着手タイミング

> **着手前提**: UT-07（通知基盤設計）で通知先（Slack / メール）が確定した後に着手すること。本番稼働後の実使用量を見てから閾値を調整する。

| 条件 | 理由 |
| --- | --- |
| UT-07 完了（推奨） | 通知先が確定していないとアラートの送信先を設定できない |
| 本番稼働後1〜2週間 | 実使用量のベースラインを把握してから閾値を設定するため |

## 苦戦箇所・知見

**1. Cloudflare 無料プランのアラート機能制限**
Cloudflare Notifications は無料プランでも利用可能だが、設定できるアラートの種類が限られる。Workers の使用量超過アラートは設定できるが、細かいメトリクス（CPU time ピーク等）のアラートは有料機能。無料で設定できるアラートの一覧を事前に確認し、対応できないものは外部モニタリングツール（UptimeRobot 等）で補完することを検討。

**2. 閾値の設定タイミング**
本番稼働前に閾値を設定すると、テストトラフィックでアラートが誤発火する可能性がある。本番稼働後1〜2週間の実使用量データを収集してから閾値を設定することを推奨。閾値は「無料枠の80%」を目安に設定し、余裕を持たせる。

**3. Webhook 通知の信頼性**
Cloudflare から Slack Webhook へ通知する場合、Slack の Webhook URL が無効になると通知が届かない（サイレント障害）。Webhook の動作確認を定期的に行う仕組み（月次のテスト通知等）を設けることを推奨。

## 実行概要

- Cloudflare Dashboard > Notifications から通知設定を開く
- メール通知先（またはWebhook URL）を登録
- Workers リクエスト使用量アラートを設定（無料枠 10万req/日 の80%で通知）
- D1 使用量アラートを設定（無料枠 500万行読み/日 の80%で通知）
- Pages ビルド数アラートを設定（無料枠 500ビルド/月 の80%で通知）
- アラートのテスト通知を実行して動作確認

## 完了条件

- [ ] Cloudflare Notifications で通知先が設定済み
- [ ] Workers / D1 / Pages の使用量アラートが設定済み
- [ ] アラートのテスト通知が正常に届くことが確認済み
- [ ] アラート閾値と通知先がドキュメント化済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | アラート対象リソースの確認 |
| 参考 | UT-07（通知基盤設計） | 通知先（Slack チャンネル等）の確認 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare 無料枠の詳細 |
