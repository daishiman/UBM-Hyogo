# UT-15: WAF / Rate Limiting ルール設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-15 |
| タスク名 | WAF / Rate Limiting ルール設定 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 2+ |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元タスク | 01b-parallel-cloudflare-base-bootstrap (UN-04) |

## 目的

API エンドポイントへの DoS 攻撃対策・不正リクエストフィルタリングを Cloudflare WAF（Web Application Firewall）と Rate Limiting で実装する。本番トラフィックが発生した後の実データに基づいて閾値を設定し、正常リクエストをブロックせずに攻撃を防御できる構成を確立する。

## スコープ

### 含む
- Cloudflare WAF マネージドルールセットの有効化・設定
- API エンドポイント向け Rate Limiting ルールの設定
- IP ベースのブロックリスト設定方針
- 誤検知（False Positive）対応フローの定義
- WAF/Rate Limiting ログの確認方法

### 含まない
- DDoS 対策（Cloudflare の自動 DDoS 防御は別途有効化済み）
- アプリケーション層の認証・認可ロジック（→ アプリケーションコードで対応）
- Bot 管理（Cloudflare Bot Management は有料機能、別途検討）
- mTLS による API クライアント認証（→ 別途高度なセキュリティタスク）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | Cloudflare ゾーン設定の確定が前提 |
| 上流 | UT-15 (カスタムドメイン設定) | 独自ドメインで WAF を有効にするにはドメインが Cloudflare ゾーン管理下にある必要がある |
| 上流 | 本番デプロイ（UT-06） | 本番トラフィックのパターンに基づいて閾値を設定するため |

## 着手タイミング

> **着手前提**: 本番トラフィックが発生した後、実際のリクエストパターンを観察してから閾値を設定すること。本番稼働前に厳格なルールを設定すると正常リクエストをブロックするリスクがある。

| 条件 | 理由 |
| --- | --- |
| 本番デプロイ完了（UT-06） | トラフィックパターンの把握なしに閾値設定は困難 |
| カスタムドメイン設定完了（UT-15） | WAF は Cloudflare ゾーン管理下のドメインに適用される |
| 本番稼働から1〜2週間後 | 正常トラフィックのベースラインを把握するため |

## 苦戦箇所・知見

**1. Rate Limiting 閾値の設定が困難**
閾値が低すぎると正常ユーザーをブロック、高すぎると攻撃を防げない。Cloudflare Analytics で正常時の API リクエスト数を把握し、ピーク時の3〜5倍を閾値の出発点とすることを推奨。設定後は1週間以上 Simulate モードで運用し、誤検知がないことを確認してから Enforce モードへ移行する。

**2. Workers と WAF の適用順序**
Cloudflare WAF → Workers の順で処理されるため、WAF でブロックされたリクエストは Workers に到達しない。WAF ルールが Workers のビジネスロジックに影響しないよう、API パス設計と WAF ルールを整合させる必要がある。

**3. 無料プランの WAF 機能制限**
Cloudflare 無料プランでは WAF マネージドルールセットの一部しか利用できない。カスタムルールは5件まで。Pro プラン（$20/月）以上で全マネージドルールが利用可能。初期は無料枠の範囲でベーシックな設定を行い、本番稼働後に有料プラン移行を検討すること。

**4. 地域ブロック（Geo Blocking）の副作用**
特定国からのアクセスをブロックする場合、VPN 経由のアクセスや CDN 経由のリクエストが想定外にブロックされるケースがある。地域ブロックは慎重に適用し、ビジネス要件として必要な場合のみ設定する。

## 実行概要

- Cloudflare ダッシュボードで WAF マネージドルールセットを有効化（Simulate モードで開始）
- API エンドポイント（`/api/*`）向け Rate Limiting ルールを設定（Simulate モード）
- Cloudflare Analytics で1週間程度のリクエストパターンを観察
- 誤検知がないことを確認後、Enforce モードへ移行
- Rate Limiting のカスタムレスポンス設定（429 エラーレスポンスのカスタマイズ）
- アラート設定（UT-16 と連携して WAF ブロック急増時の通知を設定）

## 完了条件

- [ ] WAF マネージドルールセットが有効化済み
- [ ] API エンドポイント向け Rate Limiting ルールが設定済み
- [ ] Simulate モードで1週間以上運用し、誤検知なしが確認済み
- [ ] Enforce モードへの移行が完了
- [ ] 誤検知対応フロー（ホワイトリスト追加手順）がドキュメント化済み
- [ ] WAF/Rate Limiting ログの確認方法がドキュメント化済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md | Cloudflare ダッシュボード操作の参考 |
| 必須 | UT-15（カスタムドメイン設定） | WAF 適用対象ドメインの確定 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare セキュリティ設定方針 |
