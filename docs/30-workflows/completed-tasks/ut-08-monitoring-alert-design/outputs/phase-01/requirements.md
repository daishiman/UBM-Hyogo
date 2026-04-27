# UT-08 Phase 1: 要件定義

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 1 / 13 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 対象 AC | AC-1〜AC-11（Phase 1 で正式承認） |

本書は Phase 2 設計の入力として、論点・スコープ・AC・既存資産・無料枠仕様を確定する。

---

## 1. 真の論点（3 点）

### 論点 1: 05a 責務境界の未確定

`docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails`（以下 05a）は「手動確認可能な観測点を優先する」方針で、自動アラートを意図的にスコープ外にしている。
UT-08 はその次のステップとして自動監視を追加するが、05a の成果物（`observability-matrix.md` / `cost-guardrail-runbook.md`）を上書きしないこと、および「自動化に昇格する観測点 / 手動のまま据え置く観測点」の線引きを Phase 2 設計の前に確定する必要がある。
境界が曖昧なまま進むと 05a 手動 runbook と UT-08 自動 runbook が二重管理になり、運用コストが増える。

**解消方針**: Phase 2 で `runbook-diff-plan.md` を別ファイルとして作成し、05a 成果物には触れず差分追記計画として記録する（不変条件 1）。Phase 3 レビュー観点 2 で整合性を確認する。

### 論点 2: Cloudflare 無料プラン制約

Cloudflare Workers Analytics Engine（以下 WAE）と Cloudflare Analytics は構造化イベント収集と SQL クエリを提供するが、無料プランでは以下の制約がある（公式確認値 / 推測値の区別は §6 参照）。

- WAE 書込上限と保存期間
- Workers 無料プラン: 100,000 requests/day、10ms CPU/req、最大 50 subrequests
- D1 無料枠: row reads 5,000,000/day、row writes 100,000/day、storage 5GB
- WAE 計装は Workers コードへの埋め込みが必要で、無料枠を超過するサンプリング戦略を取ると突然停止するリスクがある
- D1 はクエリ単位の実行時間を Workers ログに自動出力しないため、`console.log` 計装か Dashboard 集計の定期チェックを選ぶ必要がある

**解消方針**: Phase 2 `wae-instrumentation-plan.md` でサンプリング率（初期 100%、超過リスク確認時に `api.request` を 10% へ切替）を明示。`metric-catalog.md` で各メトリクスの取得元（Cloudflare Analytics / WAE / D1 Dashboard）を分離記載。

### 論点 3: アラートノイズ抑止と閾値設計トレードオフ

緩い閾値は誤報頻発（アラート疲れ）、厳しい閾値は本物の障害見逃し。少人数運用が前提のため iterative なアプローチが必須。

**解消方針**: 不変条件 3 として「初期は WARNING のみ運用、CRITICAL は対応実績を見ながら段階導入」を確定。Phase 2 `alert-threshold-matrix.md` に WARNING/CRITICAL 双方の閾値を併記しつつ、運用フェーズ別（初期 / 安定運用後）で推奨運用を分けて記載する。

---

## 2. スコープ確定

### 含む

- Cloudflare Workers / Pages / D1 / Cron の主要メトリクス収集設計
- WARNING / CRITICAL 二段階アラート閾値の定義
- 通知設計（メール / Slack Incoming Webhook）と Secret 取り扱い
- 外部監視ツール選定評価（UptimeRobot 等の無料プラン比較）
- WAE 計装計画（イベント名 / フィールド / sampling）
- 05a runbook との差分追記計画
- D1 クエリ失敗・Sheets→D1 同期失敗（UT-09 連携）の検知ルール
- ダッシュボード設計（Cloudflare Analytics / 外部ツール）
- 1Password Environments で管理する追加 Secret 一覧

### 含まない

- 計装コードの実装（Wave 2 実装タスクへ委譲、不変条件 5）
- 有料監視 SaaS 契約（Datadog / NewRelic / Sentry 有料 等、不変条件 2）
- アプリケーション APM・OpenTelemetry SDK 組込み
- UT-07 通知基盤の実装そのもの（連携先としての参照のみ）
- セキュリティ監視・WAF 設定（UT-15 系）

---

## 3. 受入条件 (AC) 承認

index.md で定義された AC-1〜AC-11 を Phase 1 で正式承認する。

| AC | 概要 | 検収 Phase |
| --- | --- | --- |
| AC-1 | 自動化対象メトリクス一覧（Workers / Pages / D1 / Cron） | Phase 2 |
| AC-2 | WARNING / CRITICAL 閾値と根拠 | Phase 2 |
| AC-3 | 通知チャネル設計と Secret 取り扱い | Phase 2 |
| AC-4 | 外部監視ツール選定評価 | Phase 2 |
| AC-5 | WAE 計装計画（イベント名 / フィールド / sampling） | Phase 2 |
| AC-6 | 05a runbook 差分追記計画 | Phase 2 |
| AC-7 | D1 クエリ失敗・Sheets→D1 同期失敗の検知ルール | Phase 2 |
| AC-8 | 監視設計総合まとめ（AC-1〜AC-7 を束ねる） | Phase 2 |
| AC-9 | 設計レビュー結果（GO / NO-GO） | Phase 3 |
| AC-10 | 05a 成果物との smoke 整合性 | Phase 11 |
| AC-11 | 1Password Environments で管理する追加 Secret 一覧 | Phase 2 |

承認: AC-1〜AC-11 を Phase 1 で正式承認する。

---

## 4. 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | 自動監視/アラート設計が Wave 2 実装の障害検知速度向上に直結するか | CONDITIONAL | 各 Phase 2 成果物に Wave 2 で参照する具体項目（メトリクス名・閾値・Secret 名）が含まれること |
| 実現性 | Cloudflare 無料プラン + 外部無料監視ツールで AC-1〜AC-11 を満たせるか | CONDITIONAL | WAE 無料枠仕様（§6）の再確認結果が Phase 2 に反映されること、UptimeRobot 5 分間隔の SLA 許容を Phase 2 評価で合意すること |
| 整合性 | 05a 既存成果物と差分追記方針で衝突なく共存できるか | CONDITIONAL | Phase 2 `runbook-diff-plan.md` が 05a を上書きしない方針で記述され、Phase 3 レビュー観点 2 で PASS すること |
| 運用性 | 初期 WARNING + CRITICAL 段階導入が少人数運用に耐えるか | CONDITIONAL | `alert-threshold-matrix.md` に運用フェーズ別の閾値（初期 / 安定運用後）が併記されること |

全項目 CONDITIONAL。Phase 2〜3 で解消条件を満たせば GO。

---

## 5. 既存資産インベントリ

| 資産 | 確認結果 | 本タスクでの扱い |
| --- | --- | --- |
| 05a observability-matrix.md | 存在前提（上流参照） | 自動化候補メトリクスの一次ソース、上書き禁止 |
| 05a cost-guardrail-runbook.md | 存在前提（上流参照） | 無料枠ガードレール手動 runbook、差分追記方針 |
| `apps/api` 計装コード | 既存計装は Wave 2 実装タスクで新規追加する前提 | Phase 2 の `wae-instrumentation-plan.md` で配置先のみ定義 |
| `apps/web` 計装コード | 同上 | apps/web は D1 直アクセス禁止（不変条件 5）。計装は Pages Analytics 中心 |
| 通知基盤 (UT-07) | 未実装の前提 | UT-08 で Webhook URL を Secret として直接保持する構成を設計 |
| 1Password Environments | `CLAUDE.md` で方針定義済 | 追加 Secret の正本配置先 |
| Cloudflare Dashboard | Wave 1 完了済の前提で閲覧可能 | Phase 2 ダッシュボード設計の前提 |
| 外部監視ツール契約 | 既存契約なしの前提 | Phase 2 `external-monitor-evaluation.md` で新規導入候補を評価 |

---

## 6. WAE / Cloudflare 無料枠仕様の再確認

公式確認値と推測値を区別する。Phase 2 設計時に最終確認すること。

| 項目 | 値 | 出典区分 |
| --- | --- | --- |
| Workers 無料プラン リクエスト上限 | 100,000 req/day | 公式確認値（developers.cloudflare.com/workers/platform/limits） |
| Workers CPU 時間 / req | 10 ms（無料） / 30 s（Paid） | 公式確認値 |
| Workers Subrequests / req | 50（無料） / 1000（Paid） | 公式確認値 |
| D1 row reads / day | 5,000,000（無料） | 公式確認値（developers.cloudflare.com/d1/platform/limits） |
| D1 row writes / day | 100,000（無料） | 公式確認値 |
| D1 storage | 5 GB（無料） | 公式確認値 |
| WAE 書込上限 | 25,000,000,000 data points/月 相当（Paid 込みの目安、無料枠は明記少） | 2026-04 時点の推測値、Phase 2 設計時に再確認必須 |
| WAE 保存期間 | 公式確認値（最新仕様 https://developers.cloudflare.com/analytics/analytics-engine/ で要再確認） | 2026-04 時点の推測値（過去は 31 日とされていたが変動の可能性あり） |
| Pages リクエスト | 無制限（無料） | 公式確認値 |
| Pages ビルド回数 | 500 builds/月（無料） | 公式確認値 |

**結論**: WAE 無料枠の正確な値（特に保存期間と data points 上限）は 2026-04 時点では公式ページに散在しており、Phase 2 `wae-instrumentation-plan.md` の冒頭で「最終確認日 / 引用 URL / 数値」を明記する運用とする。サンプリング設計は保守的（初期 100%、増加時に低下）に組む。

---

## 7. UptimeRobot 等の無料プラン候補（一次リスト）

| ツール | 無料プラン上限 | 監視間隔 | 通知方式 | 備考 |
| --- | --- | --- | --- | --- |
| UptimeRobot | 50 monitors | 5 min | Email / Slack / Webhook | 老舗、無料枠が広い |
| BetterStack (Better Uptime) | 10 monitors | 3 min | Email / Slack / Webhook / SMS（限定） | UI が良い、本数少ない |
| Cronitor | 5 monitors | 1 min | Email / Slack / Webhook | Cron 監視に強い |
| Hyperping | 1 monitor | 1 min | Email / Slack | 上限が厳しい |
| Cloudflare Health Checks | Pro 以上有料 | - | - | 不採用（無料枠外） |

Phase 2 `external-monitor-evaluation.md` で本リストを比較表として展開し、採用候補を確定する。MVP では UptimeRobot を主候補、Cronitor を Cron 監視のサブ候補として評価する。

---

## 8. 不変条件（Phase 2 以降に継承）

1. 05a 成果物（observability-matrix.md / cost-guardrail-runbook.md）を上書きしない
2. 監視ツールは無料プラン範囲に限定する
3. アラート閾値は WARNING 中心で初期運用、CRITICAL は実績ベース段階導入
4. アラート用 Secret は 1Password Environments で管理し、コードにハードコードしない
5. 本タスクは設計成果物のみを出力し、計装コードは Wave 2 実装タスクへ委譲

---

## 9. Phase 2 への引き継ぎ事項

- 真の論点 3 点と各解消条件
- スコープ（含む/含まない）
- AC-1〜AC-11 の正式承認
- 4 条件評価結果（全項目 CONDITIONAL）と解消条件
- 既存資産インベントリ（特に通知基盤未実装・既存計装なしの前提）
- WAE / Cloudflare 無料枠仕様（公式確認値 / 推測値の区別）
- UptimeRobot 等の一次候補リスト
- 不変条件 1〜5

### Phase 2 で確定すべき事項

- 各メトリクスの取得元（Cloudflare Analytics / WAE / D1 Dashboard）
- WAE サンプリング率の初期値と切替条件
- WARNING / CRITICAL 閾値の数値
- Secret 名の正式名称（`MONITORING_SLACK_WEBHOOK_URL` 等）
- 05a runbook への追記範囲（差分計画として記述、上書き禁止）

---

## 10. 完了条件チェック

- [x] 真の論点 3 点が文書化されている
- [x] 4 条件評価が記録され CONDITIONAL の解消条件が明示されている
- [x] AC-1〜AC-11 が Phase 1 で正式承認されている
- [x] 既存資産インベントリが記録されている
- [x] WAE 無料枠と UptimeRobot 無料プランの仕様が再確認されている
- [x] Phase 2 への引き継ぎ事項が明記されている
- [x] `outputs/phase-01/requirements.md`（本書）が作成されている
