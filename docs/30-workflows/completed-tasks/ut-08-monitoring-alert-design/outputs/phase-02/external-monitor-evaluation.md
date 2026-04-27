# UT-08 Phase 2: 外部監視ツール評価 (AC-4)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-4 |
| 親ドキュメント | [monitoring-design.md](./monitoring-design.md) |
| 評価対象 | 無料プランの SaaS 外形監視ツール |
| 不変条件 | 無料プラン範囲限定（不変条件 2） |

Cloudflare 内部メトリクスでは検知できない「ユーザ視点での到達性」を補完する外形監視ツールを比較評価する。

---

## 1. 比較表

| ツール | 無料 monitor 数 | 監視間隔（無料） | HTTPS | 通知 | API | Status Page | 採否 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **UptimeRobot** | 50 | 5 min | ○ | Email / Slack / Webhook / Telegram | ○ | 公開 Status Page あり | **採用候補（一次）** |
| BetterStack (Better Uptime) | 10 | 3 min | ○ | Email / Slack / Webhook / SMS（限定） | ○ | あり | サブ候補 |
| Cronitor | 5 | 1 min | ○ | Email / Slack / Webhook | ○ | あり | Cron 監視のサブ候補 |
| Hyperping | 1 | 1 min | ○ | Email / Slack | ○ | あり | 上限が厳しく不採用 |
| Cloudflare Health Checks | (Pro 以上) | - | - | - | - | - | 不採用（無料枠外） |
| StatusCake | 10 | 5 min | ○ | Email / Slack | ○ | あり | サブ候補 |

（2026-04 時点の無料プラン仕様。最終確認は導入時に各ツールの pricing ページを再参照。）

---

## 2. 採用判定

### 一次採用: UptimeRobot

理由:

1. 無料 monitor 数が 50 と最大 → 本番 + ステージング + 機能別エンドポイントを十分カバー可
2. 5 分間隔は SLA「99% 可用性」目標に対して許容範囲（1 日中ダウンしないと外れない水準）
3. Slack Webhook 通知をネイティブ対応 → 通知設計と直結
4. 老舗で運用実績多く、API 経由の monitor 管理も可能
5. Status Page 機能が無料で付帯 → 任意で公開可

### サブ採用: Cronitor（Cron 失敗監視のみ）

UptimeRobot は HTTP 死活監視中心で、Cron ジョブの実行確認には弱い。Cronitor の Cron Heartbeat（dead man's switch）を `cron.sync.start/end` に併用することで、Cron が起動しなくなった場合の検知を補強できる。無料 5 monitors で十分。

ただし MVP 初期では UptimeRobot のみで運用し、`cron.failures` は WAE 計装で検知する設計（[failure-detection-rules.md](./failure-detection-rules.md)）を採る。Cronitor は Wave 2 後の運用評価で導入判断。

---

## 3. UptimeRobot 設定設計（Wave 2 入力）

### 3.1 Monitor 一覧（候補）

| Monitor 名 | URL | Type | 間隔 | 期待ステータス |
| --- | --- | --- | --- | --- |
| `prod-pages-top` | `https://<production-domain>/` | HTTP(s) | 5 min | 200 |
| `prod-api-health` | `https://<production-domain>/api/health` | HTTP(s) | 5 min | 200 |
| `staging-pages-top` | `https://<staging-domain>/` | HTTP(s) | 5 min | 200 |
| `staging-api-health` | `https://<staging-domain>/api/health` | HTTP(s) | 5 min | 200 |

`/api/health` は apps/api のヘルスチェックエンドポイントを想定（実装は Wave 2、未実装なら一旦 `/` のみで起動）。

### 3.2 通知設定

- Alert Contact: `MONITORING_SLACK_WEBHOOK_URL_PROD`（[notification-design.md](./notification-design.md)）
- ダウン判定: 連続 2 回（10 min）失敗
- 復旧通知: 連続 1 回成功で復旧

### 3.3 Secret / API Key

- `UPTIMEROBOT_API_KEY` （任意、CI で monitor を IaC 管理する場合のみ）
- 1Password Environments に格納、CI 以外では参照しない

---

## 4. SLA との整合性

UptimeRobot 5 分間隔監視で検知漏れになるのは「5 分以内に復旧する瞬断」のみ。
これは SLA 99%（月間ダウン許容 7h12m）に対して十分小さく、許容できる。
1 分間隔監視が必要になった場合はサブツール（Cronitor / Hyperping 等）の追加を検討する。

---

## 5. 棄却した選択肢

| 候補 | 棄却理由 |
| --- | --- |
| Cloudflare Health Checks (Pro 以上) | 無料枠外、不変条件 2 違反 |
| Datadog Synthetic | 有料、不変条件 2 違反 |
| Pingdom | 無料プラン廃止 |
| 自前 Cron で外形監視を実装 | 監視対象自身（Cloudflare Workers）で監視するのは観測者効果問題、無料枠も消費 |

---

## 6. 移行・撤退方針

UptimeRobot の無料プラン仕様が縮小された場合の代替案:

1. BetterStack 10 monitors / 3 min へ移行（重要 endpoints 10 件に絞る）
2. それも不可なら Status Page だけ残し、内部監視（Cloudflare Analytics + 手動チェック）に縮退

撤退時の Secret 削除手順は [notification-design.md](./notification-design.md) §5「ローテーション」と同じ流れで実施。
