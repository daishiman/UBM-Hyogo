# UT-08-IMPL: モニタリング/アラート実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-08-IMPL |
| タスク名 | モニタリング/アラート実装 |
| 優先度 | HIGH |
| 推奨Wave | Wave 2以降 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 上流設計 | `docs/30-workflows/ut-08-monitoring-alert-design/` |
| 元タスク | UT-08（spec_created） |

## 目的

UT-08 の設計成果物を入力として、WAE 計装・アラートワーカー・通知・外形監視・Secret 展開を実装する。設計完了と実装完了を混同しないため、本タスクで Wave 2 の実作業を管理する。

## スコープ

### 含む

- `apps/api/src/observability/wae.ts` などの WAE writer abstraction
- Hono middleware からの `api.request` / `api.error` 計装
- D1 wrapper からの `d1.query.fail` 計装
- Cron handler からの `cron.sync.start` / `cron.sync.end` 計装
- アラートワーカー（Cron 1min）と alert-rule tests
- Slack Webhook / Email fallback の notifier abstraction
- `observability/thresholds.ts` または設定ファイルによる閾値管理
- `MONITORING_AE` binding / Secret / Variables の env validation
- UptimeRobot monitor 設定
- 05a runbook への差分追記 PR または 05a 側タスクへの引き渡し

### 含まない

- 有料監視 SaaS 導入
- セキュリティ監視 / WAF 設定（UT-15 系）
- 通知基盤そのものの実装（UT-07）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-08 monitoring-alert-design | メトリクス・閾値・イベント名・Secret 名のSSOT |
| 上流 | UT-09 Sheets→D1 同期ジョブ | `cron.sync.*` の実イベントと失敗分類を確定する |
| 連携 | UT-07 通知基盤 | MVPはSlack direct、UT-07完了後に通知基盤経由へ移行検討 |
| 連携 | UT-13 認証実装 | `auth.fail` イベント採否を確定する |
| 連携 | UT-17 Cloudflare Analytics アラート | Cloudflare native usage alerts との責務境界 |
| 連携 | UT-18 Workers CPU time モニタリング | CPU time メトリクス・調査手順との責務境界 |
| ゲート | 05a outputs 生成 | `observability-matrix.md` / `cost-guardrail-runbook.md` の追記先実体が必要 |

## 責務境界（UT-17 / UT-18 との分離）

| タスク | 責務 |
| --- | --- |
| UT-17 (Cloudflare Analytics アラート) | Cloudflare native usage alerts（Pages / Workers / D1 / R2 の無料枠使用量しきい値） |
| UT-18 (Workers CPU time モニタリング) | Workers CPU time 確認手順・1015 エラー対応フロー |
| 本タスク (UT-08-IMPL) | WAE application 層計装・カスタムアラート・Slack/Email 通知・UptimeRobot 外形監視 |

## 実装前ゲート

- [ ] 05a outputs 個別ファイルが生成済み、または追記先を 05a 側タスクで確定済み
- [ ] WAE 無料枠（保存期間・data points 上限）を実装直前の公式情報で再確認済み
- [ ] UT-09 の Cron 間隔・エラー分類が確定済み
- [ ] UT-07 経由にするか Slack direct MVP にするかを実装時点で再確認済み
- [ ] `auth.fail` イベント採否を UT-13 と確認済み

## 受入条件

- [ ] `MONITORING_AE` binding と `ubm_hyogo_monitoring` dataset が設定されている
- [ ] `api.request` / `api.error` / `d1.query.fail` / `cron.sync.start` / `cron.sync.end` が WAE に書き込まれる
- [ ] PII（email / userId / IP）が WAE data point に入らない
- [ ] alert rule が `alert-threshold-matrix.md` の WARNING / CRITICAL を参照し、ハードコード散在がない
- [ ] Slack Webhook 失敗時の Email fallback がある
- [ ] 同一 metric + severity の 30 分 dedupe が実装されている
- [ ] UptimeRobot monitors が設定され、死活監視テストが通過している
- [ ] 05a runbook 差分追記または追記タスクへの引き渡しが完了している
- [ ] `apps/api` の対象テストと env validation テストが PASS している

## 苦戦箇所・知見

**設計タスクと実装タスクの境界線引き**
UT-08 を `spec_created` で閉じ、実装は本 UT-08-IMPL に分離する判断は Phase 12 close-out 時点で確定した。設計タスクの完了条件に「Cloudflare Workers 計装」「外形監視設定」「アラート通知配信」を含めると `completed` 判定が曖昧になり、Wave 2 引き渡しタイミングで責務が混乱する。`spec_created` UI close-out ルール（task-specification-creator SKILL.md）に従い、設計成果物のみで完了判定し、実装は別 UT で `completed` に昇格させる構造が正解。

**WAE 無料枠の不確実性と着手前ゲート**
WAE（Workers Analytics Engine）の保存期間 / 月次 data points 上限は Cloudflare 公式が明記していない時期があり、UT-08 設計時点では暫定値で設計した。UT-08-IMPL 着手直前に**必ず公式情報で再確認**することが Phase 10 §7 M-02 として記録されている。設計時点の暫定値を実装でハードコードしないように、`apps/api/src/observability/thresholds.ts` 等の設定ファイルで管理すること。

**アラート疲れと段階導入計画**
初期から CRITICAL を全部電話通知すると誤報でユーザーが鳴き分けできなくなる（オオカミ少年）。`alert-threshold-matrix.md` の段階導入計画（初期は WARNING のみ通知、CRITICAL は記録のみ → 誤報率 1 件/月以下 30 日連続で CRITICAL 通知有効化）を実装で**ハードコードせず**設定値として持ち、UT-31 の月次レビュー結果に応じて切り替え可能にする。

**identifier drift 防止（メトリクス名 / イベント名）**
`api.request` / `api.error` / `cron.sync.start` / `cron.sync.end` / `d1.query.fail` / `auth.fail` の 6 イベント名はコード・閾値マトリクス・通知設計・runbook の 4 箇所で参照される。コード側で命名を変えると SSOT との drift が発生し、アラートが鳴らないまたは誤った通知になる。**識別子の SSOT は `wae-instrumentation-plan.md`** であり、コード変更時は先に SSOT を更新してからコードに反映する（逆順禁止）。

**05a outputs 個別ファイルの DEFERRED 解消**
UT-08 Phase 11 で M-01 として「05a outputs 個別ファイル（observability-matrix.md / cost-guardrail-runbook.md）が未生成」が記録され、PASS_WITH_OPEN_DEPENDENCY 判定となった。実装着手前ゲートとして UT-30 で個別ファイルを実体化する必要がある。本 UT 単独では解決できない外部依存。

**Slack Webhook 失敗時の Email fallback の dedupe**
Slack Webhook が 5xx / timeout で失敗した際、Email fallback を試行するが、その時に **30 分 dedupe key を維持する**実装が必要。dedupe を考慮しないと、Webhook 復旧後に同じインシデントが Slack + Email の両方で重複通知される。`AlertDecision.dedupeKey` を notifier 側で持ち回す設計（implementation-guide.md §2.3）。

**PII 混入リスクの抑止**
WAE data point に email / userId / IP を**絶対に書かない**。`error.message` も redact してから格納する。コードレビューで PII チェックの観点を必ず入れること（Phase 6 failure-case-matrix.md）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-12/implementation-guide.md` | Wave 2 実装ガイド |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/wae-instrumentation-plan.md` | WAE dataset / event / field SSOT |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/alert-threshold-matrix.md` | 閾値 SSOT |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/notification-design.md` | 通知設計 |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/failure-detection-rules.md` | 失敗検知ルール |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md` | Secret / Variables |
| 関連 | `docs/30-workflows/unassigned-task/UT-30-05a-outputs-individual-files-generation.md` | 実装前ゲート（05a outputs 生成） |
| 関連 | `docs/30-workflows/unassigned-task/UT-31-monitoring-monthly-operations.md` | 実装後の月次運用サイクル |
| 参考 | docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md | 責務境界確認 |
| 参考 | docs/30-workflows/unassigned-task/UT-18-workers-cpu-monitoring.md | 責務境界確認 |
