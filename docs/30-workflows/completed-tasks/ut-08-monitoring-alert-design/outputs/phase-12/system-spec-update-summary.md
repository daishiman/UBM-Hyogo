# UT-08 システム仕様更新サマリー — Phase 12（spec_created close-out）

| 項目 | 値 |
| --- | --- |
| 対応 Phase | 12 / 13 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| close-out モード | `spec_created` UI task close-out（Step 1-A〜1-C を N/A 扱いにせず same-wave sync で閉じる） |
| Step 2 判定 | **実施**（design-local domain sync として閾値・Secret 名・監視設定候補を本サマリーに登録） |

---

## Step 1-A: 完了タスク記録（必須）

| 更新対象 | 更新内容 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/ut-08-monitoring-alert-design/index.md` | 状態 = `spec_created`（既記載済、同期確認） | 同期済（artifacts.json `status: spec_created` と整合） |
| `.claude/skills/task-specification-creator/LOGS.md` | UT-08 完了行を追記（`2026-04-27 UT-08 monitoring-alert-design Phase 1-12 完了 / spec_created`） | 同期済 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | 監視設計タスクの完了記録を追記（`2026-04-27 UT-08 監視・アラート設計 spec_created 到達`） | 同期済 |
| `.claude/skills/task-specification-creator/references/resource-map.md` | `monitoring` / `alert` / `observability` / `WAE` / `UptimeRobot` の導線として UT-08 を追加 | 同期済 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 同上 | 同期済 |

> 4 ファイル更新ルール（LOGS.md 2 件 + index 2 件）遵守。`task-specification-creator` には `references/topic-map.md` が存在しないため、実在する `references/resource-map.md` に導線を追加した。

---

## Step 1-B: 実装状況テーブル更新（必須）

UT-08 は **`spec_created`**（仕様書作成のみ完了、実装は Wave 2 へ委譲）であり、`completed` ではない。

| 対象テーブル | 行 | ステータス |
| --- | --- | --- |
| 上位 task-workflow / unassigned-task-index 等の実装状況テーブル | UT-08 行 | **`spec_created`** |
| Phase 1〜10 の主成果物 | 全配置済 | `completed`（Phase 単位） |
| Phase 11 / 12 / 13 | 本 Phase / 次 Phase / 後続 Phase | `pending`（Phase 12 完了で `completed` に更新） |

> 実コード実装（apps/api 計装・アラートワーカー）は **Wave 2 実装タスクで `completed`** に昇格する。

---

## Step 1-C: 関連タスクテーブル更新（必須）

| 関連タスク | 関係 | 更新内容（備考列に追記） |
| --- | --- | --- |
| UT-09（Sheets→D1 同期ジョブ実装） | UT-08 設計の主要対象 | 「UT-08 監視・アラート設計（spec_created）が `cron.sync.*` イベント名・閾値の正本。実装着手時に [`failure-detection-rules.md`](../phase-02/failure-detection-rules.md) §3 を入力として参照」 |
| UT-07（通知基盤） | アラート通知チャネルとして利用可能（任意） | 「アラート通知チャネルとして UT-08 [`notification-design.md`](../phase-02/notification-design.md) で MVP 構成（Slack 一次 + Email サブ）を確定。UT-07 完了後に通知基盤経由へ移行検討」 |
| 05a parallel observability | 上流（手動 runbook の継承元） | 「UT-08 で自動監視追加分は [`runbook-diff-plan.md`](../phase-02/runbook-diff-plan.md) に差分追記計画として保持。05a 既存ファイルへの直接書込は Wave 2 実装末尾の別 PR で実施」 |
| UT-13（認証実装） | `auth.fail` イベントの整合 | 「UT-08 wae-instrumentation-plan.md `auth.fail` イベントは UT-13 仕様確認後に採否確定（任意イベント）」 |

---

## Step 2: システム仕様更新（条件付き）— **実施判定**

### 判定マトリクス

| 観点 | 判定 |
| --- | --- |
| 新規インターフェース追加 | **なし**（設計のみ。WAE 計装コード・通知 API 実装は Wave 2 へ委譲） |
| 既存インターフェース変更 | なし |
| 新規定数 / 設定値 | **あり**（閾値・Secret 名・データセット名・イベント名）。ただし設計成果物内 SSOT に閉じ、global skill spec への昇格はしない |
| 結論 | **Step 2 実施**（design-local domain sync として、閾値・Secret 名・監視設定候補を本サマリーに登録） |
| 再判定条件 | Wave 2 実装タスク開始時に、実コード・API・定数ファイルへ昇格するかを再判定する |

### Step 2 design-local domain sync 登録項目

#### A. 閾値（SSOT: alert-threshold-matrix.md）

| 項目 | 値 | 出典 |
| --- | --- | --- |
| Workers エラー率 WARNING / CRITICAL | 1% / 5% | alert-threshold-matrix.md §2 |
| Workers CPU p99 WARNING / CRITICAL | 8 ms / 9.5 ms | 同上 |
| Workers duration p95 WARNING / CRITICAL | 1500 ms / 3000 ms | 同上 |
| Subrequests WARNING / CRITICAL | 40 / req / 48 / req | 同上 |
| 無料枠 70% / 90% ルール（Workers requests 月次, D1 reads/writes 日次） | 70 / 90 | 同上 |
| D1 query failures WARNING / CRITICAL | 5 min 3 件 / 10 件 | 同上 |
| Cron failures WARNING / CRITICAL | 24h 1 件 / 連続 2 回 | 同上 |
| 通知抑制 | 同種 30 分 1 件、5 件以上はサマリ通知 | alert-threshold-matrix.md §4 |

#### B. Secret 名・データセット名・イベント名

| 種別 | 値 | 出典 |
| --- | --- | --- |
| WAE binding | `MONITORING_AE` | wae-instrumentation-plan.md §5.1 |
| WAE データセット名 | `ubm_hyogo_monitoring` | 同上 |
| WAE イベント名 | `api.request` / `api.error` / `cron.sync.start` / `cron.sync.end` / `d1.query.fail` / `auth.fail`（任意） | wae-instrumentation-plan.md §2 |
| Slack Webhook Secret 名 | `MONITORING_SLACK_WEBHOOK_URL_PROD` / `_STAGING` / `_DEPLOY` | secret-additions.md §1 |
| Cloudflare Analytics Token | `CLOUDFLARE_ANALYTICS_TOKEN` | 同上 |
| UptimeRobot API Key | `UPTIMEROBOT_API_KEY`（任意） | 同上 |
| Email 設定 | `ALERT_EMAIL_TO` / `ALERT_EMAIL_FROM`（GitHub Variables） | 同上 |

#### C. 監視設定候補（外部）

| 項目 | 値 |
| --- | --- |
| 外部監視ツール | UptimeRobot 無料 50 monitors / 5 min |
| Monitor 候補 | `prod-pages-top` / `prod-api-health` / `staging-pages-top` / `staging-api-health` |
| ダウン判定 | 連続 2 回（10 min） |

> 上記は **設計成果物内 SSOT に閉じる**。`apps/api/src/constants/` 等のコード定数化は Wave 2 で再判定。

### Wave 2 再判定条件

- WAE 計装コードを実装する際、`MONITORING_AE` binding 名を `apps/api/wrangler.toml` に書く
- アラートワーカー実装時、閾値を**ハードコードせず**設定ファイル（例: `apps/api/src/observability/thresholds.ts`）か `wrangler.toml` `[vars]` 経由で管理する
- 閾値変更時は **alert-threshold-matrix.md を SSOT として更新** → コードへ反映（逆順禁止、identifier drift 防止）

---

## Phase 12 実施判定サマリー

| Step | 判定 | 実施 |
| --- | --- | --- |
| Step 1-A | 必須 | 実施（4 ファイル更新） |
| Step 1-B | 必須 | 実施（`spec_created` で確定） |
| Step 1-C | 必須 | 実施（UT-09 / UT-07 / 05a / UT-13 の 4 関連タスク） |
| Step 2 | 条件付き | **実施**（design-local domain sync。Wave 2 で再判定） |

> SKILL.md 「`spec_created` UI task の Phase 12 close-out ルール」遵守。Step 1-A〜1-C を **N/A 扱いにせず**全実施。
