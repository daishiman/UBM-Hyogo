# per-sync write cap 連続到達時のオペレーション通知設計 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 03b-followup-006-per-sync-cap-alert                                           |
| タスク名     | per-sync write cap 連続到達時のオペレーション通知設計                          |
| 分類         | 運用整備                                                                      |
| 対象機能     | sync-forms-responses cron の per-sync write cap (200) 到達検知 / アラート通知 |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 03b Phase 12 unassigned-task-detection #9                                     |
| 発見日       | 2026-04-28                                                                    |
| 引き取り候補 | 05a-parallel-observability-and-cost-guardrails 系（observability / runbook 整備） |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03b で `apps/api/src/jobs/sync-forms-responses.ts` に **per-sync write cap = 200 件** を実装した。これは Cloudflare D1 の無料枠（write 100k/day）を 1 回の cron 実行で枯渇させないためのガードであり、上限到達時は残バックログを次回 cron（15 分後）に持ち越す設計とした。

しかし、**「上限到達が一時的なバックログ消化なのか、Forms 回答が爆発的に増え続けているのか」を区別する観測ロジック** はタスク内に組み込めなかった。1 回限りの上限到達は無害だが、連続到達は構造的な問題（回答急増 / 旧バックログの未消化 / 異常 retry）を示すため、運用通知の閾値設計が必要になる。

### 1.2 問題点・課題

- per-sync cap (200) 到達フラグを `sync_jobs.metrics_json.write_count` に記録できる土台はあるが、**連続 N 回 hit を検知する仕組みが無い**
- Cloudflare Analytics / Logpush へのカスタムイベント送出経路が未定義
- アラートチャネル（メール / GitHub issue 自動起票 / Slack 等）が specs / observability 設計タスクで未決定
- 閾値（例: 3 回連続 = 45 分）と escalation ポリシーの正本が無い
- D1 無料枠 (write 100k/day) を 200 × 96 cron/day = 19,200 write/day に抑える前提が崩れた場合の影響評価が無い

### 1.3 放置した場合の影響

- 回答急増・retry storm が発生してもオペレータが気付かず、D1 無料枠を圧迫し続け、最悪 write throttling で全機能が劣化する
- バックログの構造的滞留を検知できず、フォーム回答が会員ディレクトリに反映されないラグが拡大する
- post-mortem 時に「いつから cap 到達が連続化したか」を遡及調査できない（メトリクスが無いため）

---

## 2. 何を達成するか（What）

### 2.1 目的

`sync-forms-responses` cron の per-sync write cap が **連続 N 回到達した時点で、運用チャネルに自動通知** が飛ぶ仕組みを設計し、閾値・チャネル・escalation を specs に正本化する。

### 2.2 最終ゴール

- per-sync cap 到達フラグが `sync_jobs.metrics_json` に明示的フィールド (`writeCapHit: boolean`) として記録される
- 直近 N 回の sync_jobs 行を走査して **連続 cap hit 回数** を算出するロジックが実装されている
- 閾値超過時に Cloudflare Analytics へカスタムイベント (`sync_write_cap_consecutive_hit`) が emit される
- アラートチャネル（推奨: GitHub issue 自動起票 + メール）と escalation 階段が specs に明文化されている
- D1 無料枠への影響評価（200 × 96 = 19,200 write/day vs 100k/day 上限の余裕）が runbook に記載されている

### 2.3 スコープ

#### 含むもの

- `sync_jobs.metrics_json` schema に `writeCapHit` フィールド追加
- 連続 hit 検知ロジック（直近 N 行を `started_at` 降順で取得 → 連続 hit count）
- Cloudflare Analytics / Logpush へのカスタムイベント送出経路設計
- 閾値（N=3 推奨 / 45 分相当）と通知チャネル選定の意思決定記録
- D1 無料枠影響評価（write_count / day モニタリング設計）
- runbook 1 ページ（連続 cap hit 検知時のオペレータ手順）

#### 含まないもの

- アラートチャネル本体の構築（Slack workspace 設定 / GitHub issue template 整備等は 05a 側）
- per-sync cap (200) 自体のチューニング（03b 実装の責務）
- Forms 回答急増時の sharding / 並列化（別タスク）
- cron 間隔変更（15 分 → より短く）の判断（observability 側）

### 2.4 成果物

- `apps/api/src/jobs/sync-forms-responses.ts` の `metrics_json` 拡張差分
- 連続 hit 検知ロジック（`sync-forms-responses` 内 or 別 helper）
- Cloudflare Analytics カスタムイベント emit 実装
- specs 追記（observability / cost guardrail 節）
- runbook ドキュメント（`doc/00-getting-started-manual/` 配下 or 05a outputs）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 03b の `apps/api/src/jobs/sync-forms-responses.ts` per-sync write cap = 200 実装が main にマージ済み
- `sync_jobs` テーブルが `metrics_json TEXT` 列を持っている
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の cron / observability 節を参照可能
- Cloudflare Analytics Engine binding を `apps/api/wrangler.toml` に追加できる権限がある
- 不変条件 #5（D1 直接アクセスは apps/api に閉じる）を理解している

### 3.2 実行手順

1. 現状把握: `sync-forms-responses.ts` の per-sync cap 実装箇所を読み、`metrics_json` の現在の shape を確定
2. `metrics_json` schema に `writeCapHit: boolean` を追加（後方互換: 既存行は absent = false 扱い）
3. 連続 hit 検知ロジックを設計: 直近 N=3 行を `sync_jobs ORDER BY started_at DESC LIMIT 3` で取得 → 全行 `writeCapHit === true` なら escalation
4. Cloudflare Analytics Engine binding を `wrangler.toml` に追加し、`sync_write_cap_consecutive_hit` イベントを emit
5. 閾値・チャネル・escalation 階段を specs に記載（推奨案: N=3 で GitHub issue 自動起票 + N=6 でメール通知）
6. D1 無料枠影響評価を runbook に追記（200 × 96 cron/day = 19,200 write/day < 100k/day の安全マージン）
7. unit test / integration test で `writeCapHit` 記録と連続検知ロジックを検証

### 3.3 受入条件 (AC)

- AC-1: `sync_jobs.metrics_json.writeCapHit` が cap 到達時 `true`、未到達時 `false` で記録されている
- AC-2: 直近 3 行すべて `writeCapHit === true` の場合、Cloudflare Analytics に `sync_write_cap_consecutive_hit` イベントが emit される
- AC-3: 閾値（N=3）と通知チャネル（GitHub issue 自動起票 / メール / Slack 等）が specs に明文化されている
- AC-4: D1 無料枠への影響評価（write/day 試算と余裕度）が runbook に記載されている
- AC-5: 連続 cap hit 検知時のオペレータ手順（バックログ滞留調査 / Forms 回答急増判定 / cron 間隔調整）が runbook 化されている
- AC-6: unit test で `writeCapHit` フラグ記録と連続検知ロジックがカバーされている

---

## 4. 苦戦箇所 / 学んだこと（03b で得た知見）

### 4.1 上限到達の意味づけが二系統ある

03b 実装で per-sync 上限 200 件は導入できたが、「上限到達が一時的なバックログなのか、Forms 回答が爆発的に増えているのか」を区別する閾値ロジックを観測基盤側に持ち込めなかった。次回 cron で消化するため動作には影響しないが、放置すると無料枠を圧迫する可能性があり、アラート閾値を明文化したい。

### 4.2 metrics_json の schema 拡張は前方互換が必須

`sync_jobs` は既に運用中の cron が書き込んでおり、`metrics_json` の shape を破壊的に変更すると既存行の解釈が壊れる。`writeCapHit` のような新フィールドは **absent = false** で解釈する方針を helper 関数に閉じ込める設計が安全。

### 4.3 Cloudflare Analytics Engine と Logpush の選択

Cloudflare Analytics Engine（カスタムイベント）は無料枠で 25M write/month あり、本ユースケース（cron 96 回/day × 1 イベント = 2,880/month）なら十分。Logpush は有料プラン必須のため MVP では避ける。この選択は specs に固定して後続タスクが迷わないようにする。

### 4.4 escalation 階段の決め方

「3 回連続 = 45 分は人間の昼休み内で見逃せる長さ」という運用観点から、N=3 で issue 起票（非同期通知）、N=6（90 分連続）でメール通知（同期通知）の二段階を推奨する。Slack は MVP のチャネル選定が未確定のため、specs で `notification.channel` を一段抽象化しておく。

---

## 5. 関連リソース

- `apps/api/src/jobs/sync-forms-responses.ts` - per-sync write cap = 200 実装
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #9 - 発見元
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` - cron / observability 設計指針
- `doc/00-getting-started-manual/specs/08-free-database.md` - D1 無料枠の根拠（write 100k/day）
- `apps/api/wrangler.toml` - Analytics Engine binding 追加先
- 引き取り候補: 05a-parallel-observability-and-cost-guardrails 系タスク（observability / runbook 整備）
