# UT-18: Workers CPU time モニタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-18 |
| タスク名 | Workers CPU time モニタリング |
| 優先度 | LOW |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-07) |

## 目的

Cloudflare Workers の CPU time 制限（無料プラン: バースト10ms / 通常0.5ms）に対するモニタリングを設定し、CPU 超過によるリクエスト失敗（1015 エラー）を早期検知できる体制を整える。パフォーマンスの劣化を定量的に把握し、必要に応じて最適化の判断材料を提供する。

## スコープ

### 含む
- Workers Analytics での CPU time メトリクス確認手順の確立
- CPU time 制限に近づいた際のアラート設定（可能な範囲で）
- CPU time 消費の多いリクエストパスの特定方法
- Workers ログを使ったパフォーマンス計測方針
- CPU 制限超過時のエラー対応フロー

### 含まない
- Workers のコード最適化実装（→ 各機能実装タスクで対応）
- Durable Objects / WebSockets の CPU 制限対応（→ 別途検討）
- 有料プランへのアップグレード判断（→ ビジネス判断として別途実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Workers（`ubm-hyogo-api`）の稼働が前提 |
| 上流 | 本番デプロイ（UT-06） | 実トラフィックでの CPU time を計測するため |
| 連携 | UT-16 (Analytics アラート) | CPU アラートと使用量アラートを統合管理 |
| 連携 | UT-08 (モニタリング/アラート設計) | アプリケーション層のモニタリングと統合 |

## UT-08 / UT-17 / UT-18 責務境界

| タスク | 責務 |
| --- | --- |
| UT-17 | Cloudflare native usage alerts（無料枠使用量） |
| UT-18 | Workers CPU time の確認手順・CPU超過調査フロー |
| UT-08-IMPL | WAE 計装、アプリケーション層のカスタムアラート、Slack/Email通知 |

## 着手タイミング

> **着手前提**: 本番デプロイ（UT-06）が完了し、実トラフィックが発生した後に着手すること。テスト環境の CPU time と本番環境では大きく異なるケースがある。

| 条件 | 理由 |
| --- | --- |
| 本番デプロイ完了（UT-06） | 実トラフィックでの CPU time を計測するため |
| 本番稼働から1〜2週間後 | CPU time のベースラインを把握するため |

## 苦戦箇所・知見

**1. CPU time の制限が厳格**
Cloudflare Workers 無料プランの CPU time 制限は「バースト10ms / 通常0.5ms」と非常に厳格。JSON パース・暗号化処理・大量の配列操作などで容易に超過する。外部 API（Sheets / D1 / OpenAI）への待機時間は CPU time にカウントされないが、レスポンスのパース処理はカウントされる点に注意。

**2. CPU 超過のエラーが判別しにくい**
CPU time 超過による 1015 エラーは通常の 500 エラーと外見が似ており、原因特定が困難。Workers ログを有効化し、`Date.now()` を各処理の前後に挿入してタイミングを計測するデバッグ手法を標準的な調査フローとして文書化しておくことを推奨。

**3. wrangler tail でのリアルタイム計測**
`wrangler tail --format=json | jq '.cpuTime'` コマンドでリアルタイムの CPU time を確認できる。本番問題発生時の調査では `wrangler tail` が最も高速な診断ツールになる。このコマンドと確認方法を手順書に含めておくこと。

**4. モニタリングの空白地帯**
Cloudflare Analytics ダッシュボードでは CPU time の分布（パーセンタイル）を確認できるが、特定のリクエストパスごとの CPU time 内訳は無料プランでは確認困難。Sentry や DataDog（有料）への統合でより詳細なトレースが可能になる。初期は `console.time()` / `console.timeEnd()` を Workers コード内に仕込む軽量な計測方法を採用する。

## 実行概要

- Workers Analytics ダッシュボードで CPU time メトリクスの確認方法を文書化
- `wrangler tail` コマンドによるリアルタイム計測手順を文書化
- CPU time 超過（1015 エラー）発生時の調査フローを定義
- Workers コード内での計測方法（`console.time` / `Date.now`）のベストプラクティスを定義
- CPU アラート設定（Cloudflare Notifications で可能な範囲）

## 完了条件

- [ ] CPU time メトリクスの確認方法がドキュメント化済み
- [ ] `wrangler tail` を使ったリアルタイム計測手順が文書化済み
- [ ] CPU 超過エラー（1015）の調査フローが定義済み
- [ ] Workers コード内での計測ベストプラクティスが定義済み
- [ ] CPU アラートが設定済み（設定可能な範囲で）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-02/cloudflare-topology.md | Workers 構成の確認 |
| 参考 | UT-08（モニタリング/アラート設計） | アプリケーション層のモニタリングとの統合 |
| 参考 | UT-16（Analytics アラート設定） | CPU アラートの統合管理 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Workers 制限・設定方針 |
