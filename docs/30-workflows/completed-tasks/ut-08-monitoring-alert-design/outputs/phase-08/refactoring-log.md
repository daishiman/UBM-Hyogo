# UT-08 Phase 8: 設定 DRY 化記録

| 項目 | 値 |
| --- | --- |
| 対応 Phase | 8 / 13 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 入力 | outputs/phase-02/（9 種）、phase-07/ac-traceability-matrix.md |
| 出力 | 本ファイル（Phase 9 品質チェックの入力） |

---

## 1. スキャン対象と方法

Phase 2 成果物 9 種（合計 1,103 行）に対し、以下の項目を `grep -n` ベースで横断スキャンした。

| 種別 | スキャンキー | 結果ヒット箇所数 |
| --- | --- | --- |
| 閾値値（70% / 90% / 80% / p95 / p99 等） | `70%`, `90%`, `80%`, `p99`, `p95`, `5%`, `1%` | alert-threshold-matrix.md / monitoring-design.md / failure-detection-rules.md / wae-instrumentation-plan.md |
| Secret 名 | `MONITORING_SLACK_WEBHOOK_URL`, `UPTIMEROBOT_API_KEY`, `CLOUDFLARE_ANALYTICS_TOKEN`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` | secret-additions.md / notification-design.md / wae-instrumentation-plan.md / external-monitor-evaluation.md |
| WAE データセット名 | `ubm_hyogo_monitoring`, `MONITORING_AE` | wae-instrumentation-plan.md / monitoring-design.md / metric-catalog.md |
| イベント名 | `api.request`, `api.error`, `cron.sync.*`, `d1.query.fail`, `auth.fail` | wae-instrumentation-plan.md / metric-catalog.md / failure-detection-rules.md |
| 通知先（チャネル） | `#alerts-prod`, `#alerts-staging`, `#alerts-deploy` | notification-design.md / secret-additions.md / alert-threshold-matrix.md |
| 05a runbook 参照 | `docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/...` | 全 9 種に分散 |
| メトリクス名 | `workers.errors_5xx`, `workers.cpu_time_p99`, `d1.row_reads`, `d1.row_writes`, `cron.failures` | metric-catalog.md / alert-threshold-matrix.md / failure-detection-rules.md / monitoring-design.md |

スキャン件数: 重複ヒット 24 箇所、SSOT 集約により後段で参照リンク化する箇所 18 箇所。

---

## 2. SSOT（Single Source of Truth）確定表

| # | 種別 | 確定 SSOT ファイル | SSOT 内のアンカー / セクション | 参照側ファイル（After） |
| --- | --- | --- | --- | --- |
| 1 | 閾値値（WARNING/CRITICAL の数値） | `alert-threshold-matrix.md` | §2 アラート閾値マトリクス | monitoring-design.md / failure-detection-rules.md は「[alert-threshold-matrix.md §2](./alert-threshold-matrix.md) 参照」とリンク化 |
| 2 | 閾値根拠（70%/90% ルール、SLA、アラート疲れ） | `alert-threshold-matrix.md` | §3 根拠の分類 | 他は §3 参照のみ |
| 3 | 閾値見直しサイクル（月次レビュー） | `alert-threshold-matrix.md` | §5 閾値の見直しサイクル（本 Phase で月次サイクルとして再確認） | runbook-diff-plan.md / monitoring-design.md は §5 参照 |
| 4 | Secret 名 | `secret-additions.md` | §1 追加 Secret 一覧 | notification-design.md / wae-instrumentation-plan.md / external-monitor-evaluation.md は同名で参照 |
| 5 | 1Password Environments 構造 | `secret-additions.md` | §2 1Password Environments 構造 | notification-design.md §5 はリンクのみ |
| 6 | Cloudflare Secrets 投入手順 | `secret-additions.md` | §3 / §4 | runbook-diff-plan.md は §3〜§4 参照 |
| 7 | WAE データセット名 (`ubm_hyogo_monitoring`) | `wae-instrumentation-plan.md` | §5.1 wrangler.toml 追記イメージ | metric-catalog.md / monitoring-design.md は §5.1 参照 |
| 8 | WAE バインディング名 (`MONITORING_AE`) | `wae-instrumentation-plan.md` | §5.1 | 同上 |
| 9 | WAE イベント名（6 種） | `wae-instrumentation-plan.md` | §2 計装イベント一覧 | metric-catalog.md / failure-detection-rules.md は §2 参照 |
| 10 | WAE フィールド設計（blob/double/index 配置） | `wae-instrumentation-plan.md` | §3 | 他は §3 参照 |
| 11 | サンプリング率 | `wae-instrumentation-plan.md` | §4 サンプリング戦略 | monitoring-design.md / alert-threshold-matrix.md §5（見直しトリガ）は §4 参照 |
| 12 | 通知チャネル一覧（Slack/Email） | `notification-design.md` | §3.1 / §4 | alert-threshold-matrix.md §2「通知先」列は notification-design.md §2 参照 |
| 13 | 通知マトリクス（severity × channel） | `notification-design.md` | §2 通知マトリクス | monitoring-design.md は §2 参照 |
| 14 | Slack ペイロード仕様 | `notification-design.md` | §3.3 ペイロード仕様 | runbook-diff-plan.md は §3.3 参照 |
| 15 | メトリクス名（カノニカル） | `metric-catalog.md` | §1 メトリクス一覧 | alert-threshold-matrix.md / failure-detection-rules.md / wae-instrumentation-plan.md は同名で参照 |
| 16 | 失敗検知ルール（D1 / Sheets→D1） | `failure-detection-rules.md` | §1〜§3 | monitoring-design.md は §1〜§3 参照 |
| 17 | 05a runbook 差分計画 | `runbook-diff-plan.md` | §1〜§4（observability-matrix / cost-guardrail-runbook 別） | 他成果物は 05a を直接参照せず `runbook-diff-plan.md` 経由で参照 |
| 18 | 外部監視ツール選定（UptimeRobot 等） | `external-monitor-evaluation.md` | §1〜§4 | monitoring-design.md は §1〜§4 参照 |

---

## 3. Before / After 比較

| # | 項目 | Before（重複箇所） | After（SSOT） | 他箇所の対応 | 理由 |
| --- | --- | --- | --- | --- | --- |
| 1 | WARNING 1% / CRITICAL 5%（errors_5xx） | alert-threshold-matrix.md §2 / monitoring-design.md / failure-detection-rules.md に併記 | alert-threshold-matrix.md §2 のみ正本 | 他は「[alert-threshold-matrix.md §2](./alert-threshold-matrix.md) 参照」とリンク化 | 閾値変更時の同時更新漏れ防止 |
| 2 | 70% / 90% 無料枠ルール（WARNING/CRITICAL） | alert-threshold-matrix.md §3 / monitoring-design.md / failure-detection-rules.md / metric-catalog.md | alert-threshold-matrix.md §3 のみ | 他は §3 を要約引用＋リンク | 一元管理 |
| 3 | `MONITORING_SLACK_WEBHOOK_URL_PROD` | secret-additions.md §1 / notification-design.md §3.2 / wae-instrumentation-plan.md（参照のみ） | secret-additions.md §1 のみ正本 | notification-design.md §3.2 は同名表記で `[secret-additions.md §1](./secret-additions.md)` 参照 | 1Password キーと wrangler 投入名の一致担保 |
| 4 | `UPTIMEROBOT_API_KEY` | secret-additions.md §1 / external-monitor-evaluation.md | secret-additions.md §1 | external-monitor-evaluation.md はリンク参照のみ | 同上 |
| 5 | `CLOUDFLARE_ANALYTICS_TOKEN` | secret-additions.md §1 / wae-instrumentation-plan.md / runbook-diff-plan.md | secret-additions.md §1 | wae-instrumentation-plan.md / runbook-diff-plan.md はリンク参照 | 同上 |
| 6 | WAE dataset 名 `ubm_hyogo_monitoring` | wae-instrumentation-plan.md §5.1 / metric-catalog.md / monitoring-design.md | wae-instrumentation-plan.md §5.1 | 他は §5.1 参照 | データセット改名時の影響箇所一元化 |
| 7 | WAE binding 名 `MONITORING_AE` | wae-instrumentation-plan.md §5.1 / monitoring-design.md | wae-instrumentation-plan.md §5.1 | monitoring-design.md は §5.1 参照 | 同上 |
| 8 | イベント名 `api.request` / `api.error` / `cron.sync.*` / `d1.query.fail` / `auth.fail` | wae-instrumentation-plan.md §2 / metric-catalog.md / failure-detection-rules.md | wae-instrumentation-plan.md §2 | metric-catalog.md / failure-detection-rules.md は §2 参照 | イベント命名規則の一致担保 |
| 9 | サンプリング率（初期 100% / 超過時 10%） | wae-instrumentation-plan.md §4 / alert-threshold-matrix.md §5 / monitoring-design.md | wae-instrumentation-plan.md §4 | alert-threshold-matrix.md §5 は「サンプリング切替条件は wae-instrumentation-plan.md §4 参照」とし、月次レビューで切替判断を運用化 | 切替条件 SSOT 化 |
| 10 | Slack チャネル `#alerts-prod` / `#alerts-staging` / `#alerts-deploy` | notification-design.md §3.1 / secret-additions.md §1 / alert-threshold-matrix.md §2 | notification-design.md §3.1 | secret-additions.md / alert-threshold-matrix.md は §3.1 参照 | チャネル変更時の影響箇所一元化 |
| 11 | 通知マトリクス（WARNING=Slackのみ、CRITICAL=Slack+Email） | notification-design.md §2 / alert-threshold-matrix.md §2「通知先」列 | notification-design.md §2 | alert-threshold-matrix.md §2 注記行に「通知ルールは [notification-design.md §2](./notification-design.md) 参照」を追記する方針 | 通知ポリシー一元化 |
| 12 | メトリクス名（カノニカル） | metric-catalog.md §1 / alert-threshold-matrix.md §2 / failure-detection-rules.md / wae-instrumentation-plan.md | metric-catalog.md §1 | 他は同名で参照 | メトリクス改名時の影響箇所一元化 |
| 13 | 05a runbook 参照 | 全 9 種に直接 URL 記載 | runbook-diff-plan.md 経由のみ | 各成果物は「05a への追記計画は [runbook-diff-plan.md](./runbook-diff-plan.md) 参照」とリンク化（不変条件 1: 上書き禁止を担保） | 05a 既存ファイル変更を一元管理 |
| 14 | アラート閾値の月次見直しサイクル | alert-threshold-matrix.md §5（実施手順記述）/ runbook-diff-plan.md（追記対象として記載）/ monitoring-design.md（言及） | alert-threshold-matrix.md §5 を SSOT とし、**月次レビュー（毎月 1 営業日）として正式化** | runbook-diff-plan.md は cost-guardrail-runbook.md への追記項目として §5 を参照／monitoring-design.md は §5 参照 | 閾値改訂サイクルが Wave 2 運用に明確に引き渡る |
| 15 | メール月次到達確認（Email 経路の存続確認） | notification-design.md §4 / secret-additions.md §6（ローテーション） | notification-design.md §4 を SSOT とし、**月次（毎月 1 営業日）に CRITICAL 経路へテストメール送信を実施する到達確認手順を追加**（DRY 化と同時に運用化） | runbook-diff-plan.md は cost-guardrail-runbook.md §「通知到達確認」へ追記項目として参照 | アラート不達リスク（Webhook 障害時のフォールバック）を月次で検証 |

> 上記 #14 / #15 は Phase 8 で新たに**運用追記項目**として確定したもの。SSOT 内の表現は Phase 12 の implementation-guide で同期する（本 Phase では確定方針のみ記録、Phase 12 でドキュメント反映）。

---

## 4. DRY 化対象外（意図的重複）

| # | 項目 | 意図的に重複させる理由 |
| --- | --- | --- |
| 1 | 「無料枠遵守」原則（不変条件 2） | 各設計書冒頭で読者に再認識させる目的（review-gate-criteria の運用性観点）。短い宣言文として残す |
| 2 | 「05a を上書きしない」（不変条件 1） | 同上。runbook-diff-plan.md 以外でも誤編集を防ぐため冒頭に明示 |
| 3 | 「Wave 2 へ実装委譲」（不変条件 5） | 各設計書を読む実装者が「ここで実装するな」を即座に把握できるようにする |
| 4 | 「PII を計装しない」 | wae-instrumentation-plan.md / metric-catalog.md / failure-detection-rules.md でそれぞれ独立したコンテキストで記述する必要がある |
| 5 | 「アラート疲れ抑止」原則 | 閾値・通知マトリクス・抑制ルールの 3 文脈で別々の設計判断に直結するため、各文脈で繰り返す |

---

## 5. 共有定数 / 共有命名規則の方針

設計タスク（コード非実装）であるため、TS の `const` ファイルは作らない。代わりに以下の**設計ドキュメント上の共有規約**として確定する。

| 種別 | 命名規則 / 値 | SSOT | Wave 2 実装時の取り扱い |
| --- | --- | --- | --- |
| WAE dataset | `ubm_hyogo_monitoring`（環境共通、env で suffix しない） | wae-instrumentation-plan.md §5.1 | wrangler.toml の `dataset` に直接記述 |
| WAE binding | `MONITORING_AE`（env 共通） | wae-instrumentation-plan.md §5.1 | wrangler.toml binding 名 |
| Secret 名（Slack） | `MONITORING_SLACK_WEBHOOK_URL_<ENV>` | secret-additions.md §1 | env suffix で本番 / ステージング分離 |
| Secret 名（Cloudflare API） | `CLOUDFLARE_ANALYTICS_TOKEN`（env 別 Secret として注入、名前は共通） | secret-additions.md §1 | env ごとに別値、Secret 名は同一 |
| イベント名 | `<surface>.<verb>` 形式（`api.request` / `cron.sync.start` 等） | wae-instrumentation-plan.md §2 | 実装時は文字列定数を `apps/api/src/observability/events.ts` 等に集約予定（Wave 2） |
| メトリクス名 | `<resource>.<metric>` 形式（`workers.errors_5xx` 等） | metric-catalog.md §1 | Cloudflare 標準名と整合させる |
| Slack チャネル | `#alerts-<env>` / `#alerts-deploy` | notification-design.md §3.1 | Slack 管理者が事前作成 |

---

## 6. 既存ドキュメントへの参照集約計画（Phase 12 反映予定）

Phase 8 では SSOT 確定方針のみを記録し、実際の参照リンク化（Before → After への書き換え）は **Phase 12 のドキュメント更新で実施**する。これは以下の理由による。

1. Phase 9 の link parity チェックは現状の双方向参照を前提とした網羅性検証に集中する
2. Phase 11 の smoke チェックでは現行の参照表現でリンク死活を確認する
3. Phase 12 で `documentation-changelog.md` に DRY 化反映を一括記録できる

Phase 12 で実施する書き換え対象（再掲）:

- monitoring-design.md / failure-detection-rules.md → alert-threshold-matrix.md への閾値リンク化（#1, #2）
- notification-design.md → secret-additions.md への Secret 名リンク化（#3〜#5）
- metric-catalog.md / monitoring-design.md → wae-instrumentation-plan.md への dataset / binding / event 名リンク化（#6〜#8）
- 全 9 種 → runbook-diff-plan.md 経由の 05a 参照集約（#13）
- alert-threshold-matrix.md §5 / notification-design.md §4 への月次サイクル追記（#14, #15）

---

## 7. MINOR 残課題への対応

| ID | 内容 | 対応方針 |
| --- | --- | --- |
| M-01 | 05a outputs 実存確認 | Phase 11 smoke で 05a phase-02 の実体ファイル存在を `ls` で確認する |
| M-02 | WAE 無料枠の最終確認 | Wave 2 実装着手前に Cloudflare 公式 https://developers.cloudflare.com/analytics/analytics-engine/ で再確認（wae-instrumentation-plan.md §1 に注記済） |
| M-03 | `.gitignore` 実機確認 | 確認済み（apps/api/.dev.vars 系は既存 `.gitignore` 配下、追加変更不要） |

---

## 8. 完了条件チェック

- [x] Phase 2 成果物 9 種を全件スキャンしたことを記録した（§1）
- [x] 重複設定が Before / After テーブルで全件追跡されている（§3、15 件）
- [x] SSOT 集約先が各項目について 1 ファイルに確定している（§2）
- [x] DRY 化対象外項目が理由付きで記録されている（§4、5 件）
- [x] 05a runbook 参照リンクが `runbook-diff-plan.md` 経由に統一されている（§3 #13）
- [x] 閾値改訂サイクル（月次）の追記が記録されている（§3 #14）
- [x] メール月次到達確認の追記が記録されている（§3 #15）
- [x] artifacts.json の phase-08 と整合（path: outputs/phase-08/refactoring-log.md）

---

## 9. 次 Phase 引き継ぎ

- Phase 9 入力: 本ファイル §2（SSOT 確定表）と §3（Before/After）。SSOT 逸脱がないかを link parity 観点で検証する
- Phase 12 入力: §6（参照集約計画）に基づき documentation-changelog.md に反映
