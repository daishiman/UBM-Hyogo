# UT-07B-FU-01-FOLLOWUP DLQ monitoring dashboard - タスク指示書

## メタ情報

```yaml
issue_number: 502
task_id: UT-07B-FU-01-FOLLOWUP-dlq-monitoring-dashboard
task_name: schema alias back-fill Queue / DLQ 監視ダッシュボード整備
category: type:operability
target_feature: schema alias back-fill Queue split (Cloudflare Queue / Cron)
priority: low
scale: small
status: 未実施
source_phase: docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-06
dependencies:
  - UT-07B-FU-01-schema-alias-backfill-queue-cron-split
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-01-FOLLOWUP-dlq-monitoring-dashboard |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| 分類 | operability / observability |
| 対象機能 | schema alias back-fill Queue split |
| 優先度 | low |
| 見積もり規模 | small |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-06 |
| issue_number | #502 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-07B-FU-01 は schema alias back-fill を Cloudflare Queue / Cron で分割し、`backfill_cpu_budget_exhausted` retryable continuation と dedupe / failed_items_json による retry / dead-letter 記録を実装した。Queue / DLQ binding は `wrangler.toml` 上の宣言と `apps/api/src/index.ts` の consumer shim に存在し、`schemaDiffQueue.ts` repository は `retry_count` と `failed_items_json` の永続化点を持つ。

### 1.2 問題点・課題

ランタイム上で Queue 滞留・DLQ 投入・retry 過剰は `failed_items_json` と `retry_count` を SQL で個別に問い合わせる以外に観測手段が無い。Cloudflare Queue / Workers Analytics へのダッシュボード integration が未整備で、運用者が back-fill 滞留・DLQ 蓄積を気付かないリスクがある。

### 1.3 放置した場合の影響

- DLQ 投入が静かに蓄積し、特定 schema diff の back-fill が永久に未完了のまま残る
- `retry_count` が想定値を超えても気づかず、CPU budget exhausted のループが課金面で増える
- `backfill.status='exhausted'` が運用上正常か異常か判断できない

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare Queue メトリクス（messages, dead-letters, retries）と D1 上の `schema_diff_queue.failed_items_json` / `retry_count` を観測可能にし、back-fill 滞留・DLQ 蓄積・retry 過剰を運用者が単一ビューで判断できる状態にする。

### 2.2 最終ゴール

- Cloudflare Queue / DLQ のメトリクスが Workers Analytics / dash で参照可能
- D1 `schema_diff_queue` の `retry_count > N` / `failed_items_json IS NOT NULL` を集計する read-only クエリが runbook 化されている
- 異常基準（DLQ 件数しきい値、retry_count しきい値、`exhausted` 滞留時間）が文書化されている
- Cloudflare Queue / DLQ の binding 名と D1 schema が aiworkflow-requirements skill から逆引きできる

### 2.3 スコープ

#### 含む

- Cloudflare Queue / DLQ メトリクスのダッシュボード設定（手動でも可）
- D1 集計クエリ runbook 追加
- 異常しきい値の文書化
- aiworkflow-requirements skill の references / topic-map / quick-reference 追記

#### 含まない

- Pager / 通知基盤の追加（別タスクで扱う）
- Queue / DLQ 構造の変更
- API contract / backfill workflow の変更
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-07B-FU-01 の Cloudflare Queue / DLQ binding が staging または production に作成済み（user 承認後）
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` が適用済み
- `scripts/cf.sh` 経由で D1 / Workers にアクセス可能

### 3.2 推奨アプローチ

1. Cloudflare dash で Queue / DLQ メトリクスを確認し、手動でも記録できる項目を確定する
2. D1 集計クエリを `scripts/` または runbook に追加する
3. しきい値（DLQ ≥ 1 で要調査、retry_count ≥ 3 で要調査、`exhausted` が 24h 以上滞留で要調査など）を保守的に決める
4. aiworkflow-requirements の `references/` 配下に「DLQ 監視」topic を追加し、`topic-map` / `keywords.json` / `quick-reference` を更新する

---

## 4. 実行手順

### Phase 1: 観測対象の棚卸し

1. `wrangler.toml` の Queue / DLQ binding を確認する
2. `apps/api/src/repository/schemaDiffQueue.ts` で `retry_count` / `failed_items_json` / `last_error` / `last_processed_at` の更新点を確認する
3. Cloudflare dash 上で Queue / DLQ のメトリクス画面と存在する内蔵指標を確認する

### Phase 2: D1 集計クエリ作成

1. DLQ 投入相当（`failed_items_json IS NOT NULL`）を集計する read-only SQL を作成する
2. retry 過剰（`retry_count >= N`）を集計する read-only SQL を作成する
3. `exhausted` 状態の滞留期間を集計する read-only SQL を作成する

### Phase 3: ダッシュボード / runbook 整備

1. Cloudflare dash 側のスクリーンショットまたは手順を runbook 化する
2. D1 集計クエリを runbook に貼り付ける
3. 異常しきい値とエスカレーション先を runbook に書く

### Phase 4: aiworkflow-requirements 反映

1. `references/` に DLQ 監視 topic を追加
2. `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` を再生成する

### Phase 5: 検証

1. ローカル D1 fixture で集計 SQL が壊れないことを確認
2. `pnpm indexes:rebuild` で skill index が drift しないことを確認

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] DLQ 投入数が観測可能
- [ ] `retry_count` 過剰が観測可能
- [ ] `exhausted` 滞留が観測可能
- [ ] 異常しきい値が文書化されている

### 品質要件

- [ ] 集計 SQL が read-only
- [ ] Queue / DLQ の binding 名と D1 schema が aiworkflow-requirements から逆引きできる
- [ ] 既存 schema や API contract に変更がない

### ドキュメント要件

- [ ] runbook が `docs/` 配下または skill references 配下に配置されている
- [ ] `topic-map` / `keywords.json` の drift がない（`pnpm indexes:rebuild` で確認）

---

## 6. 検証方法

### 集計 SQL 動作確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "SELECT COUNT(*) FROM schema_diff_queue WHERE failed_items_json IS NOT NULL"
```

期待: read-only に集計が返る。

### skill index drift 確認

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
```

期待: 反映済みの差分のみ。drift 無し。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| DLQ 監視を自動化しないまま放置 | 中 | runbook と D1 集計 SQL を最小整備し、手動で定期確認できる状態にする |
| しきい値が厳しすぎて誤検知 | 低 | 初期は保守的（DLQ ≥ 1、retry ≥ 3）にし、staging 観測後に見直す |
| skill index に drift | 低 | `pnpm indexes:rebuild` を Phase 4 で実行 |

---

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`
- `apps/api/wrangler.toml`

---

## 9. 備考

UT-07B-FU-01 で「Queue dead-letter monitoring dashboard」は runtime operation 領域として記録のみされ、formalize されていなかった。本タスクで正式化する。Cloudflare Queue / DLQ 作成と本番反映は別 user 承認イベント前提で、ここではダッシュボード / runbook / 集計 SQL の整備に責務を限定する。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/repository/schemaDiffQueue.ts`、`apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- 症状: Queue 投入後の retry 経路と DLQ 投入経路は実装内に存在するが、ランタイム観測の単一エントリポイントが無い。`failed_items_json` / `retry_count` / `last_error` を読む集計手段が runbook に未整備で、観測責務がコードと運用で分断されている。
- 参照: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
