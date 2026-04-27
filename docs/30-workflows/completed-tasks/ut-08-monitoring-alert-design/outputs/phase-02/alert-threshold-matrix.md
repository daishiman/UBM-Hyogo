# UT-08 Phase 2: アラート閾値マトリクス (AC-2)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-2 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 不変条件 | 「初期 WARNING 中心、CRITICAL は対応実績を見ながら段階導入」（不変条件 3） |

各メトリクスの WARNING / CRITICAL 閾値と根拠（無料枠 / SLA / アラート疲れ抑止）を併記する。運用フェーズ別（**初期運用** / **安定運用後**）の推奨運用も明示し、アラート疲れを抑止する。

---

## 1. 運用フェーズ別の方針

| 運用フェーズ | 方針 | 期間目安 |
| --- | --- | --- |
| 初期運用 | WARNING のみ通知。CRITICAL は記録のみ（通知抑制） | 本番リリース後 2〜3 ヶ月 |
| 安定運用後 | WARNING / CRITICAL とも通知。閾値は実績ベースで調整 | 安定運用判断後 |

「安定運用判断」の基準: WARNING の誤報率が 1 件 / 月以下に収束し、過去 30 日で実障害（人手対応）が発生していること。

---

## 2. アラート閾値マトリクス

| メトリクス | WARNING（初期運用） | CRITICAL（段階導入） | 評価窓 | 根拠 | 通知先 |
| --- | --- | --- | --- | --- | --- |
| `workers.errors_5xx 率` | 1% | 5% | 直近 5 min | アラート疲れ抑止 + SLA（99% 可用性） | Slack（一次） |
| `workers.cpu_time_p99` | 8 ms | 9.5 ms | 直近 5 min | 無料枠 10ms 上限の 80% / 95% | Slack |
| `workers.duration_p95` | 1500 ms | 3000 ms | 直近 5 min | UX SLA + アラート疲れ抑止 | Slack |
| `workers.subrequests` | 40 / req | 48 / req | サンプル個別 | 無料枠 50 上限の 80% / 96% | Slack |
| `workers.requests` 月次累計 | 無料枠 70%（2,100,000/月） | 無料枠 90%（2,700,000/月） | 月初リセット | 無料枠超過予防 | Slack + Email |
| `d1.row_reads` 日次累計 | 無料枠 70%（3,500,000/day） | 無料枠 90%（4,500,000/day） | 24h | 無料枠 5,000,000/day | Slack + Email |
| `d1.row_writes` 日次累計 | 無料枠 70%（70,000/day） | 無料枠 90%（90,000/day） | 24h | 無料枠 100,000/day | Slack + Email |
| `d1.query_failures` | 5 min で 3 件以上 | 5 min で 10 件以上 | 直近 5 min | 散発的失敗の早期検知 / アラート疲れ抑止（連続条件） | Slack |
| `cron.failures`（Sheets→D1） | 24h で 1 件 | 連続 2 回失敗 | 24h | 同期ジョブの単発エラー許容 / 連続失敗で本格対応 | Slack + Email |
| `cron.duration_ms` | 4 min | 9 min | ジョブ毎 | Cron Trigger の慣習的 timeout 想定（5min / 10min） | Slack |
| `synthetic.http_status` ダウン | 連続 2 回（10 min） | 連続 4 回（20 min） | 連続条件 | UptimeRobot 5 分間隔 / アラート疲れ抑止（瞬断除外） | Slack + Email |
| `pages.builds_failed` | 1 件 | 連続 2 件 | デプロイ毎 | デプロイは試行回数少 / 連続失敗で本格対応 | Slack |

---

## 3. 根拠の分類

### 無料枠ベース（70% / 90% ルール）

- WARNING = 70% / CRITICAL = 90% を基本とする
- 月次累計系（Workers requests）は月初リセット、日次累計系（D1 reads/writes）は 24h 窓
- 90% で警告 → 100% 到達の前に対応する余地を残す

### SLA ベース

- 可用性 SLA は MVP では 99% 目標（明文化なし）。エラー率 1% を WARNING、5% を CRITICAL
- レスポンス SLA は p95 1500ms（UX 体感）/ 3000ms（明確に遅い）

### アラート疲れ抑止ベース

- 単発エラーで CRITICAL 発報しない（連続条件、件数閾値、評価窓を併用）
- D1 query 失敗は 1 件 / 5min ではなく **3 件 / 5min** を WARNING の起点とする
- 外形監視は瞬断除外のため **連続 2 回ダウン** を WARNING 起点

---

## 4. 通知抑制（rate limiting）

| 抑制ルール | 内容 |
| --- | --- |
| 重複通知抑制 | 同一メトリクス + 同一 severity の通知は 30 分以内 1 件まで |
| グループ通知 | 同時刻 5 件以上のアラートは件数サマリのみ Slack 通知 |
| 夜間抑制（任意） | 22:00〜07:00 は WARNING を翌朝サマリへ集約（CRITICAL のみ即時） |

実装は Wave 2。本仕様書では設計方針のみ記載。

---

## 5. 閾値の見直しサイクル

- 月次レビュー: 過去 30 日の誤報件数と未検知件数を集計
- 誤報率 > 5% / 月の閾値は緩める
- 未検知（事後対応で発覚した障害）が出た閾値は厳しくする
- レビューは [runbook-diff-plan.md](./runbook-diff-plan.md) で 05a cost-guardrail-runbook.md への追記項目として扱う

---

## 6. CRITICAL 段階導入のチェックリスト

CRITICAL を有効化する前に以下を確認する。

- [ ] WARNING の誤報率が直近 30 日で 1 件 / 月以下
- [ ] WARNING からの一次対応が runbook 化されている
- [ ] CRITICAL 受信時の代理対応者が決まっている
- [ ] CRITICAL の通知音 / 緊急連絡フローが Slack で確認済み
