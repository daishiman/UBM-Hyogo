# issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | UT-07B-FU-01-FOLLOWUP schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| GitHub Issue | #502（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #502`。親タスク名 `UT-07B-FU-01` は通常テキスト参照） |
| 親タスク | UT-07B-FU-01-schema-alias-backfill-queue-cron-split |
| 起票元仕様 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` |
| 検出仕様書 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`（U-1 / operability follow-up source） |
| 作成日 | 2026-05-07 |
| ステータス | spec_created |
| 総 Phase 数 | 13 |
| taskType | docs-only（実態優先：成果物は runbook markdown 追加 / 集計 SQL は runbook 内 code block / aiworkflow-requirements references 追加 / skill index 再生成のみ） |
| visualEvidence | NON_VISUAL |
| Wave | 2（UT-07B-FU-01 staging / production デプロイ済み前提） |
| 優先度 | low |
| 見積もり規模 | small（runbook 1 章 + 集計 SQL 3 種 + skill references 1 topic + index 再生成） |

---

## 実装区分

`[実装区分: ドキュメントのみ]`

判定根拠（CONST_004 例外条件適用）:

- 本タスクの成果物は **(a) runbook markdown 追加、(b) D1 集計 SQL を runbook 内 code block として記載、(c) `.claude/skills/aiworkflow-requirements/references/` への DLQ 監視 topic 追加、(d) `pnpm indexes:rebuild` による skill index 再生成** に完結する。
- ソース（`apps/api/src/**`）/ テスト / 設定（`wrangler.toml` / migration / D1 schema）の変更を**一切伴わない**。
- 集計 SQL は `SELECT` のみで構成し、`INSERT` / `UPDATE` / `DELETE` を含まない（AC-7 read-only 不変条件）。
- 異常閾値超過に応じて retry / alert / pager 統合などの**実装が必要となった場合は、本仕様書スコープ外として別 unassigned task を起票**する（起票元仕様「含まない」節に明記）。
- したがって、ユーザー指示「デフォルトは実装仕様書」「実態優先」を踏まえても、本タスクは目的達成にコード変更が**不要**であるため、ドキュメントのみ仕様書として作成する。

CONST_005 必須項目の取り扱い:

- 「変更対象ファイル」「テスト方針」「ローカル実行コマンド」「DoD」は本仕様書内で実装仕様書同等の粒度で記述する（後続実行者が迷わない粒度を確保）。
- ただし「関数シグネチャ」「型定義」「コードテスト」は本タスクの責務外のため空欄ではなく **N/A（コード変更なし）** と明記する。

---

## 目的

UT-07B-FU-01 で導入した schema alias back-fill の **Cloudflare Queue / DLQ binding** と D1 `schema_diff_queue` テーブルの failure 永続化列（`retry_count` / `failed_items_json` / `last_error` / `last_processed_at` / `backfill_status='exhausted'`）を観測可能にし、運用者が **back-fill 滞留・DLQ 蓄積・retry 過剰** を単一 runbook + read-only D1 SQL で判断できる状態を確立する。

UT-07B-FU-01 のリリース時点では Queue / DLQ メトリクスへのダッシュボード integration が未整備で、`failed_items_json` / `retry_count` は SQL を個別に書かない限り観測不能だった。本タスクは「観測責務がコードと運用の間で分断されている状態」を解消し、aiworkflow-requirements skill から Queue / DLQ binding 名と D1 schema を逆引きできる正本ベースラインを確定する。

---

## スコープ

### 含む

- Cloudflare Queue / DLQ メトリクス観測手順の runbook 化（dash 画面 / Workers Analytics 内蔵指標 / `scripts/cf.sh queues list` フォールバック）
- D1 集計 SQL 3 種の runbook 化（DLQ 投入相当: `failed_items_json IS NOT NULL` / retry 過剰: `retry_count >= 3` / exhausted 滞留: 24h 以上）
- 異常閾値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）と判定根拠の文書化
- エスカレーション分岐の文書化（観測のみで終結 / 別 unassigned task 起票）
- `.claude/skills/aiworkflow-requirements/references/` 配下に「DLQ 監視」topic を追加
- `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` の再生成（`pnpm indexes:rebuild`）
- 集計 SQL は `bash scripts/cf.sh d1 execute ...` 経由で実行する旨を runbook に明記（`wrangler` 直接禁止）

### 含まない

- Pager / 通知基盤（Slack / PagerDuty 等）の追加実装（必要時は別 unassigned task として起票）
- Queue / DLQ 構造の変更、`wrangler.toml` / migration の変更
- `apps/api/src/repository/schemaDiffQueue.ts` / `schemaAliasBackfillBatch.ts` / API contract の変更
- D1 schema の変更（migration `0014_schema_diff_queue_dedupe_failure.sql` は適用済前提）
- production への commit / push / PR 作成（PR は Phase 13 の責務）

---

## 受入条件（AC）

- AC-1: Cloudflare Queue / DLQ メトリクスの観測手順（dash 画面 / Workers Analytics 内蔵指標 / `scripts/cf.sh queues list` フォールバック）が runbook に記載されている
- AC-2: D1 集計 SQL（DLQ 投入: `failed_items_json IS NOT NULL` / retry 過剰: `retry_count >= 3` / exhausted 滞留: 24h 以上）が runbook に記載されている
- AC-3: 異常しきい値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）が文書化されている
- AC-4: エスカレーション先と次アクション分岐（観測のみ → 別 unassigned task 起票）が runbook に明記されている
- AC-5: aiworkflow-requirements skill の `references/` に DLQ 監視 topic が追加されている
- AC-6: `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` が drift なし（`pnpm indexes:rebuild` で確認）
- AC-7: 集計 SQL が read-only（`INSERT` / `UPDATE` / `DELETE` を含まない）
- AC-8: Queue / DLQ binding 名（`SCHEMA_ALIAS_BACKFILL_QUEUE` / `schema-alias-backfill[-staging]` / `schema-alias-backfill[-staging]-dlq`）と D1 schema（`schema_diff_queue` の監視対象列）が aiworkflow-requirements から逆引きできる
- AC-9: 既存 schema / API contract / Queue 構造の変更がない
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS
- AC-11: Phase 12 strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）に加え、runbook 本体と aiworkflow-requirements skill 同期が完了

---

## Phase 一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義（真の論点 / 観測対象棚卸し / 苦戦箇所） | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計（集計 SQL / runbook 構造 / skill references 追記） | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | 検証戦略（NON_VISUAL / read-only SQL / fixture） | [phase-04.md](phase-04.md) | spec_created |
| 5 | 仕様 runbook 作成（gh / cf.sh sequence / 集計 SQL） | [phase-05.md](phase-05.md) | spec_created |
| 6 | 異常系（しきい値誤検知 / DLQ ゼロ件 / fixture 欠落） | [phase-06.md](phase-06.md) | spec_created |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | spec_created |
| 8 | DRY 化 / 仕様間整合 | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動検証（NON_VISUAL 縮約 / staging fixture 集計） | [phase-11.md](phase-11.md) | contract_ready_runtime_pending |
| 12 | ドキュメント更新（runbook / skill references / changelog） | [phase-12.md](phase-12.md) | completed |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | pending_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                          (異常系欠落→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
                              ↓
                       (read-only / 不変条件 drift→戻り)
```

Phase 3 で「集計 SQL の read-only 性 / runbook 構造の AC 充足 / skill references 追記構造」が MAJOR / MINOR / PASS で評価され、Phase 10 で「不変条件 1〜7 影響なし」「Queue / DLQ / D1 schema が無変更」「閾値根拠が起票元仕様と整合」を最終確認する。

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | なし | コード変更なし |
| 2 | consent キーは `publicConsent` / `rulesConsent` 統一 | なし | コード変更なし |
| 3 | `responseEmail` は system field | なし | コード変更なし |
| 4 | Google Form schema 外は admin-managed data として分離 | なし | コード変更なし |
| 5 | D1 直接アクセスは `apps/api` 限定 | なし | 集計 SQL は `scripts/cf.sh d1 execute` 経由（`apps/api` binding 内 D1 を運用 read-only で参照するのみで、コード経路の D1 アクセス点は不変） |
| 6 | GAS prototype は本番昇格しない | なし | GAS 非対象 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | なし | フォーム関連変更なし |

---

## 参照情報

- 起票元仕様: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`
- 親タスク source spec: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`
- 対象 binding / queue: `apps/api/wrangler.toml`（`SCHEMA_ALIAS_BACKFILL_QUEUE` / `schema-alias-backfill[-staging]` / `schema-alias-backfill[-staging]-dlq`）
- 対象 D1 table: `schema_diff_queue`（migration: `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`）
- 対象 repository: `apps/api/src/repository/schemaDiffQueue.ts`
- 追記先 references: `.claude/skills/aiworkflow-requirements/references/`（DLQ 監視 topic 新規）
- 集計 SQL 実行ラッパー: `scripts/cf.sh`
- exemplar 参照: `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`
