# Unassigned Task Detection — Issue #408 Cloudflare Audit Logs 監視

本タスクの仕様策定中に検出した派生 follow-up タスクを記録する。**0 件でも必須出力**であるが、本タスクでは 4 件を検出した。各候補は別 unassigned-task spec として `docs/30-workflows/unassigned-task/` 配下に起票することを後続で推奨する。

## 検出 follow-up（4 件）

### FU-01: alerting 経路に Slack 通知を追加（既存タスクへ統合候補）

- **目的**: 現状 alerting は GitHub Issue 起票のみ。on-call 即応性向上のため Slack incoming webhook を併用する経路を追加する。
- **優先度**: LOW
- **着手判断基準**: alerting 運用開始後、Issue 起票通知の検知遅延が 30 分超のケースが月 1 件以上発生した場合に着手。
- **想定 spec パス**: 既存 Slack 通知系タスク（例: `task-obs-slack-notify-001.md`）へ統合候補。重複起票を避けるため本サイクルでは新規ファイルを作らない。

### FU-02: 90 日以上の長期 cold storage 化

- **目的**: D1 の 30 日 TTL を超えた audit log を R2 等の cold storage へエクスポートし、半期監査・コンプライアンス対応に備える。
- **優先度**: LOW
- **着手判断基準**: 半期監査要件が確定した時点、または D1 容量が 50% を継続して超過した場合に着手。
- **spec パス**: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-02-cold-storage.md`

### FU-03: 異常検知 ML モデル化

- **目的**: 現状の閾値ベース判定では false positive / false negative の tune コストが嵩むため、教師データを蓄積した上で異常検知 ML モデルへ置換する。
- **優先度**: LOW
- **着手判断基準**: 閾値運用が 90 日以上安定し、誤検知率 ≤ 5% を維持しつつもチューニングコストが月 4h を超えた場合。
- **spec パス**: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md`

### FU-04: GitHub Actions audit log との統合

- **目的**: Cloudflare 単独の audit log だけでは Token 漏洩経路の追跡が不足する場合がある。GitHub Actions audit log（org level）を取り込み、cross-source correlation で漏洩経路を特定可能にする。
- **優先度**: MEDIUM
- **着手判断基準**: 本タスク本番化後、HIGH alert が 1 件でも発生した時点、または Org Owner 権限による audit log 取得経路が確立した時点で着手。
- **spec パス**: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md`

## 起票プロセス

1. FU-02〜FU-04 は本レビューサイクル内で `unassigned-task/` 配下に個別 spec として起票済み。
2. FU-01 は既存 Slack 通知系タスクと重複する可能性が高いため、新規起票せず統合候補として記録する。
3. 着手判断は Issue #408 の production runtime green 化 → 7 日 baseline 学習完了後に再評価する。

## 0 件時の運用ルール（参考）

検出 0 件の場合でも本ファイルは作成し、`## 検出 follow-up（0 件）— 確認済み・派生タスクなし` を 1 行記載する。本タスクは 4 件検出のため該当しない。
