# Phase 5 — 同期方式詳細比較

## 比較表

| 評価軸 | Push（Sheets→D1直接） | Poll（Worker定期pull） | Webhook（変更通知） | Cron Triggers（pull方式） |
|--------|---------------------|---------------------|-------------------|------------------------|
| 実現性 | NG（D1はWorkers bindingのみ。外部から直接書き込み不可） | OK | NG（Google Workspace有料プラン必要） | OK |
| Quota対策 | N/A | バッチ+Backoff可 | 変更イベント件数依存 | バッチ+Backoff可 |
| 冪等性 | 低（push側の制御が必要） | 高（response_id UPSERT） | 中（イベント重複の恐れ） | 高（response_id UPSERT） |
| 運用コスト | 高（Sheets側スクリプト管理） | 低 | 中（webhook登録・更新管理） | 低 |
| 無料枠 | 不適合 | 適合 | 不適合 | 適合 |
| **採択** | **NG** | **候補** | **NG** | **採択** |

---

## Cron Triggers 採択の詳細根拠

### 1. アーキテクチャ整合性

CLAUDE.md不変条件5: 「D1への直接アクセスは `apps/api` に閉じる」

Push方式ではSheetsからD1への直接経路が必要となり、この不変条件に違反する。Cron TriggerはWorker内で処理が完結し、D1は常にapps/api経由でアクセスされる。

### 2. Quota管理の容易さ

Cron Triggersは同期のタイミングをWorker側が完全制御するため、Sheetsへのリクエスト間隔・バッチサイズを自由に調整できる。Webhookではイベント発生頻度が外部依存となり、quota管理が困難。

### 3. 冪等性の保証

`response_id` を主キーとしたUPSERTにより、Cronが重複実行されても同一結果を保証。障害復旧時の再実行も安全。

### 4. 実装コスト

Workers の `scheduled` ハンドラに同期ロジックを追加するだけ。外部インフラ（Webhookエンドポイント・PubSub等）の追加不要。

---

## 不採択方式の除外理由

### Push方式

D1はWorkers bindingを介したアクセスのみをサポート。外部サービス（Sheets GAS等）からD1への直接書き込みは技術的に不可能。

### Webhook方式

Google Sheets の変更通知（Pub/Sub Notifications）はGoogle Workspace Business以上が必要。本プロジェクトは無料枠前提のため不採択。

### Poll方式（単純ポーリング）

Cron Triggersと本質的に同一だが、Cloudflare WorkersのCron Triggerを使わない場合は外部スケジューラが必要になる。Cron Triggersが利用可能なため、単純Pollではなく公式機能を使用する。
