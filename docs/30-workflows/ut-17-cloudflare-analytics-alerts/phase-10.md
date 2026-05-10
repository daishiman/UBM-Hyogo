# Phase 10: 統合・運用準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 統合・運用準備 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 9 (実装着手) |
| 次 Phase | 11 (受入テスト・evidence) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | T11（runbook 反映 / 月次ヘルスチェック整備）の実施 Phase。relay Worker 本番稼働後の運用 SOP を確定する。 |

---

## 目的

T10 本番デプロイ後、relay Worker と Cloudflare Notification Policy が安定稼働するための
運用 SOP（Standard Operating Procedure）を整備する。

---

## 10-1. runbook 作成計画

### 新規 1: `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`

UT-17 専用の **「アラート受信時の一次対応フロー」** を新規作成する:

```markdown
## アラート受信時の一次対応フロー（UT-17 連携）

Cloudflare Notifications → relay Worker → Slack channel 経由で以下のいずれかが届いた場合:

| アラート | 一次対応 |
| --- | --- |
| Workers リクエスト数 80% 到達 | Cloudflare Dashboard → Workers Analytics で消費源 Worker を特定。本リポジトリ内のクロール / 大量呼出箇所を確認 |
| D1 読み取り行数 80% 到達 | `bash scripts/cf.sh d1 list` で対象 DB を確認。`apps/api` の query 最適化箇所を特定 |
| Pages ビルド数 80% 到達 | GitHub Actions の deploy 頻度を確認。CI で過剰 deploy していないか調査 |
| R2 Class A 80% 到達 | `bash scripts/cf.sh r2 list-buckets` でバケット使用状況確認 |
| Slack 通知が**届かない**月次ヘルスチェック | UT-17 月次ヘルスチェック runbook（後述）に従い疎通確認 |

### エスカレーション基準
- 95% 到達: 即時対応（クォータ超過の有料化リスク）
- 80% 到達: 24 時間以内に消費源確認
```

### 追記対象 2: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（新規）

```markdown
# UT-17 alert-relay 月次ヘルスチェック runbook

## 目的
Slack Incoming Webhook URL は無効化されてもサイレント障害となるため、月次で疎通確認する。

## 実施周期
毎月第 1 営業日

## 手順
1. Cloudflare Dashboard → Notifications → 各 Policy の「Send Test Notification」を押下（4 policy 全て）
2. Slack `#ubm-alerts` にテスト通知が 4 件到達することを確認
3. 到達しない場合:
   - Slack 側の Webhook を Apps 設定で確認
   - Webhook URL が revoke されている場合は新規発行 → 1Password 更新 → `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --env production`
   - cf-webhook-auth 不一致が原因なら Phase 7 rotation runbook を参照
4. 結果は月次運用記録または該当 Issue / PR evidence に追記する

## 結果記録フォーマット

| 実施日 | 担当 | Policy 1 | Policy 2 | Policy 3 | Policy 4 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | name | PASS | PASS | PASS | PASS | - |
```

---

## 10-2. オンコール対応フロー

| 段階 | 対応 |
| --- | --- |
| 0. Slack で通知受信 | 通知本文の「メトリクス名」「閾値」「現在値」を確認 |
| 1. メトリクス特定 | 10-1「アラート受信時の一次対応フロー」テーブルを参照 |
| 2. 消費源調査 | Cloudflare Dashboard で対象リソースの過去 24h Analytics を確認 |
| 3. 緊急対応 | 90% 超過時は WAF / レート制限の緊急投入を検討（UT-14 連携） |
| 4. 恒久対応 | 消費源の最適化 / クォータ拡張の判断（無料枠維持の方針との整合） |
| 5. 振り返り | 同種アラートが月内に 3 回以上発生した場合、閾値見直しを Phase 12 unassigned-task として起票 |

---

## 10-3. 月次ヘルスチェック手順

10-1 の月次 runbook に従う。本 Phase ではこの runbook を**作成**するのみ（初回実施は本タスク完了後の翌月）。

| 項目 | 値 |
| --- | --- |
| 周期 | 月次（毎月第 1 営業日） |
| 担当 | プロジェクトオーナー（solo dev） |
| 所要時間 | 10 分 |
| 失敗時のエスカレーション | Phase 7 rotation runbook |

---

## 10-4. 監視メトリクス（relay Worker 自体）

relay Worker 自体の健全性も観測対象:

| メトリクス | 取得方法 | 異常判定 |
| --- | --- | --- |
| relay Worker のリクエスト数 | Cloudflare Dashboard Workers Analytics | 月内に 0 件なら Cloudflare Notifications 側の destination 設定切れを疑う |
| relay Worker の error rate | 同上 | 5% を超える場合は payload 仕様変更の可能性 |
| relay Worker の P95 レイテンシ | 同上 | 5 秒超は Slack 側の遅延を疑う |

> 上記メトリクスのカスタムアラート化は **UT-08-IMPL の責務**（本タスクスコープ外）。本 Phase では「観測すべき項目」として明記するのみ。

---

## 10-5. Phase 12 same-wave sync 準備

Phase 12 で以下のタスクと整合確認する事項を本 Phase で抽出:

| 関連タスク | 整合確認項目 |
| --- | --- |
| UT-08-IMPL | Slack channel `#ubm-alerts` の共通使用、メッセージフォーマット衝突の有無 |
| UT-07 | 通知基盤決定との整合 |
| UT-14 | `/internal/alert-relay` への WAF 設定方針 |
| UT-18 | Workers CPU time 確認手順との重複なし確認 |
| 05a parallel observability | incident / observability runbook との責務重複確認 |

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 11 受入テスト | runbook 内容を AC-7（runbook 整備）の検証に使用 | 本 Phase で完成させる |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md | 一次対応 runbook |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-07.md | rotation runbook 連携 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-08.md | rollback runbook 連携 |
| 参考 | CLAUDE.md「solo 運用ポリシー」 | オンコール体制の前提 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/operations-readiness.md | 10-1〜10-5 の運用準備サマリー |
| 新規 | docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md | 「アラート受信時の一次対応フロー」 |
| 新規 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 月次ヘルスチェック runbook |
| メタ | artifacts.json | phase-10 を completed に更新 |

---

## 完了条件

- [ ] `ut-17-cloudflare-usage-alert-response.md` が新規作成済み
- [ ] 月次ヘルスチェック runbook が新規作成済み
- [ ] オンコール対応フロー 6 段階が明記済み
- [ ] relay Worker 自体の監視メトリクス（リクエスト数 / error rate / P95）が「観測すべき項目」として記述済み
- [ ] Phase 12 same-wave sync 確認項目（5 タスク）が抽出済み

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-10 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 11（受入テスト・evidence）
- 引き継ぎ事項:
  - `operations-readiness.md` の内容は Phase 11 AC-7（runbook 整備）の検証対象
  - 月次 runbook と rotation runbook（Phase 7）の重複がないことを Phase 11 link チェックで確認
- ブロック条件: 既存 runbook を上書きしてしまった場合は元の状態に復旧してから追記方式に修正
