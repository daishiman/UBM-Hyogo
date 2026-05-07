# Phase 8: DRY 化 / 仕様間整合

[実装区分: ドキュメントのみ]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| GitHub Issue | #502（CLOSED 維持 / `Refs #502`） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 仕様間整合 |
| 作成日 | 2026-05-07 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

issue #502 は親タスク UT-07B-FU-01（schema alias back-fill Queue / Cron split）の Phase 12 で `unassigned-task-detection.md` に検出され、起票元 `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` として形式化された follow-up である。本仕様書（issue-502 ディレクトリ）はその起票元 unassigned task spec を **正本（formalized task specification）** に昇格させる位置付けとなる。

本 Phase は、起票元 unassigned task spec / 親タスク UT-07B-FU-01 の Phase 12 検出記述 / `aiworkflow-requirements` skill references の DLQ 監視 topic / 既存 deployment-gha runbook / 既存 observability runbook の 5 系統に **重複・矛盾** が残ったまま Phase 11 着手に進まないことを担保する。重複が残ると、後続実行者が「DLQ 監視手順の正本 / Queue binding 名の出典 / しきい値の出典」をどの文書から読むべきかを判断できず、references への二重追記事故・matching not found 事故を誘発する。

implementation を伴わない docs-only タスクであるため、DRY 化対象は (1) 起票元 unassigned task spec の昇格境界、(2) 親 UT-07B-FU-01 Phase 12 の trace 追記、(3) 新規 runbook と既存 deployment / observability runbook の役割分担、(4) skill references 単一追記 topic、(5) Queue / DLQ 命名と D1 schema の一意出典 の 5 軸に絞る。

---

## DRY 化対象表

| # | 重複候補 | 削除方針 | 単一正本 | 適用範囲 |
| --- | --- | --- | --- | --- |
| 1 | 起票元 unassigned task spec（`docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`）の Phase 1〜5 実行手順 | 本仕様書 Phase 5（runbook）に **昇格**。起票元には「本仕様書（`docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/`）に昇格済み」trace を 1 行残し、本文は link 参照に縮約 | 本仕様書 `phase-05.md` + `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 起票元 unassigned task spec / 本仕様書 全 phase |
| 2 | 親タスク UT-07B-FU-01 Phase 12 `unassigned-task-detection.md` の DLQ 監視 detection 記述 | Phase 12 detection 表に「本仕様書（issue-502）にて formalize 済み」trace を追記。検出根拠はそのまま残し、formalize 後の正本 path を 1 行 link で示す | 本仕様書 `index.md` + 親 UT-07B-FU-01 Phase 12 detection 表 | 親 UT-07B-FU-01 Phase 12 outputs |
| 3 | 既存 `references/deployment-gha.md` / observability 系 runbook と新規 DLQ 監視 runbook | 新規 `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` は **schema alias back-fill 専用 DLQ** に責務を限定。既存 deployment-gha runbook には「DLQ 監視は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` を参照」link 1 行のみ追加し、しきい値 / SQL は転記しない | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 既存 deployment-gha / observability runbook 全体 |
| 4 | `aiworkflow-requirements` skill references への DLQ 監視 topic 追加 | `references/dlq-monitoring.md`（新規）または既存 deployment 系 references の **DLQ 監視 sub-topic** にのみ追記。他 references（api-endpoints.md / database-schema.md / task-workflow-active.md 等）には書かない | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（または相当 deployment 系 references） | skill references 全体 |
| 5 | Queue / DLQ 命名 と D1 `schema_diff_queue` schema の出典 | binding 名（`SCHEMA_ALIAS_BACKFILL_QUEUE` / `schema-alias-backfill[-staging][-dlq]`）は `apps/api/wrangler.toml` を **唯一の source of truth** とし、references / runbook は要約のみ転記。schema 構造は `retry_count` / `failed_items_json` / `last_error` / `last_processed_at` が `0014_schema_diff_queue_dedupe_failure.sql`、`backfill_status` が `0008_schema_alias_hardening.sql` を source とする | `apps/api/wrangler.toml` / `apps/api/migrations/0008_schema_alias_hardening.sql` / `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | 本仕様書 全 phase + skill references + runbook |
| 6 | 異常しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）の記述 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §5 のみ正本。references / aggregation.md / changelog は値をリンク参照とし、再記述しない（必要時のみ要約として転記しつつ、変更時は runbook §5 のみを更新） | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §5 | 本仕様書 全 phase + skill references |

---

## 仕様間整合確認チェックリスト

- [ ] `artifacts.json` の `phases[*]` と `index.md` の Phase 一覧表が **Phase 番号 / 名称 / spec ファイル名** で完全一致
- [ ] `artifacts.json` の `ac` と `index.md` の AC 一覧（AC-1〜AC-11）が件数・内容で完全一致
- [ ] `aiworkflow-requirements` skill 正本（`references/dlq-monitoring.md` または相当 + `indexes/`）への影響が他 references（api-endpoints / database-schema / task-workflow-active 等）に **波及していない**
- [ ] GitHub Issue 番号「#502」と Refs 表記「`Refs #502`」が全 phase ファイル / index.md / artifacts.json で統一（`Closes #502` 不可）
- [ ] 起票元 unassigned task spec の status が「formalized」trace 1 行で更新されている（本タスクの Phase 12 ドキュメント更新で実施予定）
- [ ] 親 UT-07B-FU-01 Phase 12 `unassigned-task-detection.md` の該当行に「本仕様書にて formalize 済み」trace 追記が予定されている
- [ ] 新規 `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` の章構成が既存 runbook 規約（見出しレベル / テーブル列順）と整合
- [ ] Queue / DLQ binding 名と D1 schema の出典が `wrangler.toml` / migration ファイルのみで、references / runbook は要約のみであることが grep で確認できる

---

## DRY 違反検出コマンド例

```bash
# DLQ 監視 / schema_diff_queue 関連の記述が複数 references に
# 散らばっていないかを機械検証する
rg -n "schema_diff_queue|schema-alias-backfill|SCHEMA_ALIAS_BACKFILL_QUEUE" \
  .claude/skills/aiworkflow-requirements/references/

# Refs 表記の統一確認（#502 / Refs 表記の drift 検出 / Closes 検出）
rg -n "#502|Closes #502" docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/

# しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）の重複記述検出
rg -n "DLQ ≥ 1|retry.*≥ 3|exhausted.*24h|exhausted.*24 h" \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/ \
  .claude/skills/aiworkflow-requirements/references/ \
  docs/runbooks/

# 既存 deployment-gha / observability runbook への波及検出
rg -n "schema alias back-fill|schema-alias-backfill" \
  docs/runbooks/ \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md
```

期待される結果:

- 1 つ目: `references/dlq-monitoring.md`（または相当 deployment 系 references の DLQ sub-topic）にのみ hits、他 references で 0 件
- 2 つ目: PR 文面方針が `Refs #502` で統一、`Closes #502` 0 件
- 3 つ目: しきい値値が複数ファイルで literal 重複していない（runbook §5 が唯一の値出典）
- 4 つ目: 新規 runbook `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` への link 1 行のみ既存 runbook に存在、転記なし

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1〜7 | （CLAUDE.md 記載の不変条件すべて） | 影響なし | コード変更なし・docs-only タスクのため、不変条件 1〜7 すべてに影響しない。特に不変条件 5（D1 直接アクセスは `apps/api` に閉じる）は本タスクが `bash scripts/cf.sh d1 execute` 経由で read-only に限定するため抵触しない |

---

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 起票元 unassigned task / 親 UT-07B-FU-01 Phase 12 / 既存 deployment-gha runbook / 既存 observability runbook / skill references の 5 系統重複を整理し、後続実行者が DLQ 監視を skill references の単一 topic に追記する経路を確定 |
| 実現性 | PASS | grep + 文書追記のみで完結、新規ツール導入なし |
| 整合性 | PASS | 不変条件 1〜7 への影響なし、CONST_004 例外（docs-only）と整合、Queue / DLQ 命名と D1 schema の出典が `wrangler.toml` / migration に一意化 |
| 運用性 | PASS | DRY 違反検出 grep コマンドが Phase 9 機械検証として再利用可能 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（昇格境界 / 親 trace / runbook 役割分担 / skill references 単一 topic / 命名出典 / 違反検出 grep 結果） |
| メタ | artifacts.json | Phase 8 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] DRY 化対象表（6 件）すべてに単一正本 path が指定されている
- [ ] 仕様間整合確認チェックリスト 8 項目すべて確認済み
- [ ] DRY 違反検出 grep が想定結果（他 references 波及 0 件 / `Closes #502` 0 件 / しきい値 literal 重複 0 件）を返す
- [ ] 起票元 unassigned task spec への trace 追記方針が Phase 12 引き渡し条件として記述
- [ ] 親 UT-07B-FU-01 Phase 12 detection 表への trace 追記方針が Phase 12 引き渡し条件として記述
- [ ] 既存 deployment-gha / observability runbook への新規 runbook link 方針（転記なし / link 1 行のみ）が記述
- [ ] outputs/phase-08/main.md が作成済み

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、変更対象は markdown ファイルのみ。

---

## 次 Phase への引き渡し

- 次 Phase: 9（品質保証）
- 引き継ぎ事項: DRY 化済み単一正本 path 表（Phase 9 link 検証 / 用語統一の前提）、skill references 単一追記 topic の方針、起票元 / 親 Phase 12 への trace 追記計画、Queue/DLQ 命名・D1 schema の出典一意化方針
- ブロック条件: skill references への波及範囲が DLQ 監視 topic を超える / 起票元 spec への trace 追記計画が未確定 / Refs 表記が `Refs #502` で統一されていない / Queue/DLQ 命名の出典が複数ファイルに分散している

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 命名の唯一出典 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 schema の唯一出典 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として DRY 違反検出 grep、`pnpm indexes:rebuild` drift 0、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。

## 受入条件（AC）— index.md と完全一致

- AC-1: Cloudflare Queue / DLQ メトリクス観測手順が runbook に記載
- AC-2: D1 集計 SQL（DLQ 投入 / retry 過剰 / exhausted 滞留）が runbook に記載
- AC-3: 異常しきい値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）文書化
- AC-4: エスカレーション先と次アクション分岐が runbook に明記
- AC-5: aiworkflow-requirements skill `references/` に DLQ 監視 topic 追加
- AC-6: `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` drift なし
- AC-7: 集計 SQL が read-only（UPDATE/DELETE/INSERT 不在）
- AC-8: Queue / DLQ binding 名と D1 schema が aiworkflow-requirements から逆引き可
- AC-9: 既存 schema / API contract / Queue 構造の変更なし
- AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）全 PASS
- AC-11: Phase 12 strict 7 成果物 + runbook 本体 + aiworkflow-requirements 同期完了

本 Phase は **AC-5（references 単一 topic）/ AC-6（正本導線同期の前提整理）/ AC-8（出典一意化）/ AC-9（既存変更なし）** の DRY 化裏付けを担う。

## 苦戦箇所【記入必須】

- 既存 `references/deployment-gha.md` には GitHub Actions / Cloudflare deployment 系の運用 know-how が集約されており、DLQ 監視を **そこに追記**するか **別 references（`dlq-monitoring.md`）として新設**するかで責務粒度が揺れた。本 Phase では「DLQ 監視は schema alias back-fill 専用の運用 topic で、既存 deployment-gha からは link 参照のみ」と分離し、混入を防ぎつつ既存 runbook を肥大化させない方針に確定した
- Queue / DLQ binding 名と D1 schema を references / runbook / aggregation.md など複数箇所に literal 転記しがちだが、変更時に DRY 違反として drift する。本 Phase では「`apps/api/wrangler.toml` と migration ファイルが唯一の出典 / 他文書は要約のみ」を明文化し、Phase 9 の grep 検証で literal 重複を機械検出するルートを担保した
