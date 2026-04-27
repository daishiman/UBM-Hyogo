# UT-31: 監視運用月次サイクル化（閾値レビュー / Email 到達確認）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-31 |
| タスク名 | 監視運用月次サイクル化（閾値レビュー / Email 到達確認） |
| 優先度 | LOW |
| 推奨Wave | Wave 2 完了後（UT-08-IMPL 安定運用判断時） |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし（運用 UT として独立） |
| 組み込み先 | - |
| 起票理由 | UT-08 Phase 10 MINOR-02 / MINOR-03 を運用ルーチンとして正式化するため。UT-08-IMPL は実装スコープ、本 UT は実装後の運用継続スコープに分離する |

## 目的

UT-08-IMPL でモニタリング・アラート機構が稼働開始した後の **月次運用サイクル**（閾値見直し / Email 経路生存確認 / WAE データ点上限確認 / UptimeRobot 疎通確認）を運用カレンダーに固定化し、誤報率と未検知率に基づく継続的改善を回す。アラート疲れ防止と CRITICAL 通知有効化判断（誤報率 1 件/月以下が 30 日連続）の客観評価データを蓄積する。

## スコープ

### 含む

- 月次レビューの実施日（毎月 1 営業日）と所要時間の固定化
- 4 項目の月次チェック手順書（運用ハンドブック）作成
  - 閾値月次レビュー（誤報率 / 未検知率 → 緩和 or 厳格化判断）
  - CRITICAL 経路 Email テスト送信（生存確認）
  - WAE data points 月次累計確認（70% 到達でサンプリング切替判断）
  - UptimeRobot monitor 数 / Slack 疎通確認
- レビュー結果ログテンプレート（月次 1 ファイル、過去 6 ヶ月分保管）
- 異常検出時の対応フロー（誤報率 > 5% の閾値緩和 / 未検知発生時の厳格化）
- CRITICAL 通知有効化判断ゲート（誤報率 1 件/月以下が 30 日連続）の客観条件文書化

### 含まない

- WAE 計装コード・アラートワーカー実装（→ UT-08-IMPL）
- 閾値そのものの初期定義（→ UT-08 `alert-threshold-matrix.md` が SSOT）
- 自動レポーティングダッシュボード（無料枠制約のため手動運用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-08-IMPL（モニタリング/アラート実装） | 監視機構が稼働しレビュー対象データが蓄積されている必要がある |
| 上流 | UT-08 `alert-threshold-matrix.md` | 閾値の初期値および月次レビュー方針の SSOT |
| 連携 | UT-30（05a outputs 生成） | `cost-guardrail-runbook.md` に月次運用サイクルへの導線を追記 |

## 着手タイミング

> **着手前提**: UT-08-IMPL の実装完了 + 1 ヶ月以上の稼働データ蓄積。監視機構が動いていない状態で運用ハンドブックだけ作っても机上論になるため、最低 1 サイクルの実データを伴って初稿を起こす。

## 苦戦箇所・知見

**MINOR-02 / MINOR-03 を「運用」として独立 UT 化する判断**
UT-08-IMPL の実装前ゲートチェックリスト（implementation-guide.md §2.9）に統合してしまうと、Wave 2 実装完了後の運用フェーズで責務オーナーが曖昧になる。実装スコープ（UT-08-IMPL）と運用継続スコープ（本 UT）を分離し、後者は運用担当者へ明確に引き渡す。

**アラート疲れと客観条件の作り込み**
「誤報率 1 件/月以下が 30 日連続」のような客観条件を文書化しないと、CRITICAL 通知有効化判断が属人的になり、結果としてアラート疲れの再現につながる。本 UT で客観条件を SSOT 化し、UT-08-IMPL の `alert-threshold-matrix.md` の段階導入計画と整合させる。

**Email 月次到達確認の実施タイミング**
Cloudflare Email Routing は休止すると経路が黙って失効する場合がある。「毎月 1 営業日に CRITICAL 経路でテストメールを送信し、配送先 `ALERT_EMAIL_TO` で受信できることを確認する」という固定運用にしないと、いざ CRITICAL 発生時に通知が届かない事象が起きうる。

**WAE data points サンプリング切替の判定**
WAE 無料枠は月次 data points 上限あり。70% 到達時に `api.request` のサンプリングを 100% → 10% に切り替える判断を月次レビュー時点で実施しないと、月末上限到達でデータ欠損が発生する。閾値判断ルールと操作手順を運用ハンドブックに固定化する。

**UptimeRobot 50 monitors 上限の中長期管理**
無料プランは 50 monitors。Wave 2 着手時点では 4 monitors（prod-pages-top / prod-api-health / staging-pages-top / staging-api-health）で十分だが、ステージング環境やマイクロサービス追加で増える。月次レビューで monitors 数の増加トレンドを記録し、上限近くで有料プラン or 削減判断を起こす。

## 実行概要

- 運用ハンドブック（`doc/operations/monitoring-monthly-review.md` 仮）を新規作成
  - 月次レビュー実施日（毎月 1 営業日）と所要時間（30 分目安）
  - 4 項目チェック手順（閾値レビュー / Email テスト / WAE data points / UptimeRobot 疎通）
  - レビュー結果ログテンプレート（過去 6 ヶ月保管、`doc/operations/monitoring-review-logs/YYYY-MM.md`）
  - 異常検出時の対応フロー（誤報率 > 5% / 未検知発生）
  - CRITICAL 通知有効化判断ゲート（誤報率 1 件/月以下が 30 日連続）の客観条件
- UT-30 完了後、`05a/outputs/phase-05/cost-guardrail-runbook.md` 末尾に運用ハンドブックへの導線を追記
- UT-08 `documentation-changelog.md` または UT-08-IMPL 完了時のレビューで、本 UT が実施タイミングに到達した旨を確認

## 完了条件

- [ ] 運用ハンドブック（`monitoring-monthly-review.md`）が作成され、4 項目の月次チェック手順が記載されている
- [ ] レビュー結果ログテンプレートが作成され、過去 6 ヶ月保管ルールが文書化されている
- [ ] 誤報率 > 5% / 未検知発生時の対応フローが文書化されている
- [ ] CRITICAL 通知有効化判断ゲート（誤報率 1 件/月以下が 30 日連続）の客観条件が文書化されている
- [ ] 初回月次レビュー実施結果が `monitoring-review-logs/` 配下にログ化されている
- [ ] 運用カレンダー（GitHub Issue or 1Password Notes 等）に毎月 1 営業日の月次レビューが定期登録されている
- [ ] UT-08-IMPL の安定運用判断（CRITICAL 通知有効化）が本サイクルの観測データを根拠としている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/alert-threshold-matrix.md` | 閾値 SSOT / 月次レビュー方針 |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-12/implementation-guide.md` | §2.9 / §2.11 月次運用化項目 |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-12/unassigned-task-detection.md` | current #4 / #5（MINOR-02 / MINOR-03 formalize 元） |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md` | Email サブ通知 / CRITICAL 経路 |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/wae-instrumentation-plan.md` | WAE data points 月次累計 / サンプリング切替条件 |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/runbook-diff-plan.md` | 05a runbook 月次チェック追加項目（§3.3） |
