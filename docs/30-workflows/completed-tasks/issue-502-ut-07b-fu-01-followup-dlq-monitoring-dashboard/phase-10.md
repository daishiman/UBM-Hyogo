# Phase 10: 最終レビューゲート

> [実装区分: ドキュメントのみ]（CONST_004 例外条件適用 / NON_VISUAL / Wave 2 / 優先度 low / 規模 small）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01-FOLLOWUP schema alias back-fill DLQ 監視ダッシュボード整備 |
| GitHub Issue | #502（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #502`） |
| Phase 番号 | 10 / 13（**Gate Phase**） |
| Phase 名称 | 最終レビューゲート |
| 作成日 | 2026-05-07 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証 / NON_VISUAL 縮約 / staging 集計 SQL 実行） |
| 状態 | spec_created |
| taskType | docs-only（CONST_004 例外適用） |
| visualEvidence | NON_VISUAL |
| Wave | 2 |
| 実装区分 | **ドキュメントのみ** |

---

## 目的

Phase 1〜9 の成果（要件 / 設計 / 集計 SQL / runbook 構造 / しきい値設計 / AC マトリクス / DRY / QA）を横断レビューし、Phase 11 着手の **3 つの gate** を通過するかを確定する:

- **Gate A: runbook 配置先確定**
- **Gate B: 設計レビュー再確認**
- **Gate C: user_approval（commit / push / PR は user-gated）**

本タスクは時間依存ではなく構造依存（Queue / DLQ binding / D1 schema が UT-07B-FU-01 で確定済み）であるため、Gate A は外部時間ではなく「runbook 配置先と skill references 追記先の確定」に置く。Gate A NO-GO の場合は該当 phase に差し戻し、`spec_created` 据え置きとする。

---

## Gate A: runbook 配置先と skill references 追記先の確定

### 確認項目

- [ ] **runbook 本体配置先確定**: `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`（既存 `docs/runbooks/` 配下の `release-create.md` / `retention-physical-delete.md` / `post-release-long-term-observation.md` と同階層命名規約に整合）
- [ ] **aiworkflow-requirements references 追記先確定**: `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`（新規 topic ファイル）
- [ ] **changelog fragment 配置先確定**: `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md`
- [ ] **indexes 再生成方針確定**: 新 topic 追加につき `pnpm indexes:rebuild` 実行必須（`topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` の 4 indexes 全件再生成）
- [ ] **Queue / DLQ binding 名 / D1 列名 / migration ID 固定値の正本化**: Queue prod=`schema-alias-backfill` / staging=`schema-alias-backfill-staging` / DLQ prod=`schema-alias-backfill-dlq` / staging=`schema-alias-backfill-staging-dlq` / Queue binding 変数 `SCHEMA_ALIAS_BACKFILL_QUEUE` / D1 table `schema_diff_queue` / 列 `retry_count` `failed_items_json` `last_error` `last_processed_at` `backfill_status` / Migration `0008_schema_alias_hardening.sql` + `0014_schema_diff_queue_dedupe_failure.sql`

判定: 全 5 項目充足で **PASS**、いずれか 1 件未充足で **NO-GO**（差し戻し先: 該当 phase）。

### NO-GO 時の据え置きルール

- Issue #502 は CLOSED のまま維持（再 OPEN しない）
- `artifacts.json` の `phases[*].status` は `spec_created` のまま据え置き
- NO-GO 判定理由を `outputs/phase-10/gate-a-no-go.md` に記録（任意）
- 再起動時は本 Phase から再開、Phase 1〜9 は再実行不要

---

## Gate B: 設計レビュー再確認

### 確認項目

- [ ] **Phase 1〜9 が AC-1〜AC-11 を網羅**: AC マトリクス（Phase 7）の全 AC が Phase 1〜9 のいずれかの成果物で達成可能（空セル 0）
- [ ] **集計 SQL 3 種が read-only 制約**: (1) DLQ 投入相当（`failed_items_json IS NOT NULL`）/ (2) retry 過剰（`retry_count >= 3`）/ (3) `exhausted` 滞留 24h 超（`backfill_status='exhausted'` AND `last_processed_at <= datetime('now','-24 hours')`）の 3 種すべて `SELECT` のみ、`INSERT` / `UPDATE` / `DELETE` 不在を `phase-04.md` または `phase-06.md` で再確認
- [ ] **しきい値の保守的設定**: DLQ ≥ 1（最初の 1 件で要調査）/ retry ≥ 3（3 回失敗で要調査）/ exhausted 滞留 ≥ 24h（24 時間以上未進行で要調査）が `phase-05.md` runbook に明記
- [ ] **エスカレーション分岐**: しきい値超過時の次アクション（Cloudflare dash 確認 → D1 集計 SQL → `failed_items_json` 内容精査 → root cause 別 unassigned task 起票）が runbook に記述
- [ ] **redaction 戦略確定**: D1 集計結果に schema 差分内容（PII 含む可能性）が混入する可能性があるため、staging 観測時の出力を `outputs/phase-11/aggregation.md` に追記する際の redaction 対象（`token` / `bearer` / `secret` / `Authorization` / `email` / `responseEmail`）が `phase-04.md` に記述
- [ ] **DRY 違反 0**: skill references 波及が `dlq-monitoring.md`（新規 topic）のみ、既存 `deployment-gha.md` / `database-d1.md` 等への重複追記なし
- [ ] **Refs 方針統一**: `Refs #502`（`Closes #502` 不採用）が全 phase で統一

判定: 全 7 項目充足で **PASS**、いずれか 1 件未充足で **NO-GO**（差し戻し先: 該当 phase）。

---

## Gate C: user_approval（commit / push / PR は user-gated）

- [ ] Phase 13 PR 作成は **明示承認後のみ**（ユーザーが「PR 作成」「diff-to-pr」等を明示するまで実行しない）
- [ ] GitHub Issue #502 は **CLOSED 据え置き**、再 OPEN しない方針を再確認
- [ ] PR 文面は `Refs #502`（`Closes #502` を採用しない）
- [ ] `git commit` / `git push` / `gh pr create` はユーザー明示承認後の操作

判定: 上記 4 項目すべて方針確認済みで **PASS**（実行はユーザー明示後）。

---

## 4 条件評価最終確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DLQ 静的蓄積・retry 過剰ループ・`exhausted` 永続滞留を運用者が単一 runbook で観測可能になり、課金面・データ整合面の沈黙的劣化を早期検知できる |
| 実現性 | PASS | Cloudflare dash 既存メトリクス + D1 read-only SELECT + markdown runbook + skill references 追記のみで完結、新規ツール導入なし、コスト増 0 |
| 整合性 | PASS | 不変条件 1〜7 への影響 0（特に #5: D1 直接アクセスを `apps/api` に閉じる原則を `bash scripts/cf.sh d1` 経由でのみ遵守）、CONST_004 例外（docs-only）と整合、Queue / DLQ 構造変更なし、API contract 変更なし |
| 運用性 | PASS | しきい値 3 種（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）の保守的設定で初動誤検知を抑え、staging 観測後に見直す方針を runbook に明記。`bash scripts/cf.sh` ラッパー経由で `op run` による secret 動的注入を保ち、wrangler 直接実行禁止ポリシーに整合 |

すべて PASS。

---

## ゲート結果テンプレ表

下記は Phase 10 実行時に `outputs/phase-10/gate-result.md` に記入するテンプレート。

| 項目 | 値 |
| --- | --- |
| 結論 | **PASS** / **NO-GO** のいずれか |
| Gate A 判定 | PASS / NO-GO（差し戻し先 phase を併記） |
| Gate B 判定 | PASS / NO-GO（差し戻し先 phase を併記） |
| Gate C 判定 | PASS（方針確認のみ、実行は user 明示後） |
| レビュー日 | YYYY-MM-DD |
| レビュアー | （担当者名） |
| 次アクション | Phase 11 着手 / 該当 phase 差し戻し |

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | 影響なし | 本タスクは Queue / DLQ 監視で form schema には触れない |
| 2 | consent キー統一 (`publicConsent` / `rulesConsent`) | 影響なし | consent 系には触れない |
| 3 | `responseEmail` を system field 扱い | 影響なし | system field には触れない |
| 4 | Google Form schema 外データを admin-managed に分離 | 影響なし | admin-managed にも触れない |
| 5 | D1 直接アクセスを `apps/api` に閉じる | 影響なし | 集計 SQL は `bash scripts/cf.sh d1 execute` 経由（運用者手動・read-only）であり、`apps/web` からのアクセス追加なし |
| 6 | GAS prototype を本番昇格させない | 影響なし | GAS には触れない |
| 7 | MVP では Google Form 再回答を本人更新の正式経路 | 影響なし | back-fill 監視であり本人更新経路には触れない |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/gate-result.md | 3 Gate 判定結果（A: 配置先確定 / B: 設計レビュー / C: user_approval）+ 結論 + 次アクション |
| ドキュメント（任意） | outputs/phase-10/gate-a-no-go.md | NO-GO 時の判定理由 + 差し戻し先 phase 記録 |
| メタ | artifacts.json | Phase 10 状態の更新 |

---

## 受入条件 / 完了条件チェックリスト

- [ ] Gate A の 5 項目すべてが PASS / NO-GO で評価され、配置先・追記先・indexes 再生成方針・固定値正本化が確定
- [ ] Gate B の 7 項目すべてが PASS / NO-GO で評価
- [ ] Gate C の 4 項目すべてが方針確認済み
- [ ] 4 条件評価が全 PASS
- [ ] ゲート結果テンプレ表に従い `outputs/phase-10/gate-result.md` 作成
- [ ] NO-GO 時は据え置きルール（Issue CLOSED 維持 / artifacts.json `spec_created` 据え置き / 差し戻し先 phase 明記）が記録
- [ ] AC-1〜AC-11 全項目の達成見込みが Phase 1〜9 のいずれかで確認できている

---

## AC 達成見込み確認（AC-1〜AC-11）

| AC | 達成 phase | 確認 |
| --- | --- | --- |
| AC-1: Cloudflare Queue / DLQ メトリクス観測手順 runbook 記載 | Phase 5 / 12 | runbook 章立てで Queue dash 手順 / DLQ 件数確認手順を含む |
| AC-2: D1 集計 SQL 3 種が runbook 記載 | Phase 4 / 12 | DLQ 相当 / retry 過剰 / exhausted 滞留 の 3 SQL を runbook に貼付 |
| AC-3: 異常しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）文書化 | Phase 5 / 12 | runbook しきい値節 |
| AC-4: エスカレーション先と次アクション分岐が runbook 明記 | Phase 5 / 12 | runbook エスカレーション節 |
| AC-5: aiworkflow-requirements skill `references/` に DLQ 監視 topic 追加 | Phase 12 | `dlq-monitoring.md` 新規追加 |
| AC-6: indexes 4 種 drift なし | Phase 12 | `pnpm indexes:rebuild` 後に `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` drift 0 |
| AC-7: 集計 SQL が read-only | Phase 4 / 6 | `SELECT` のみ確認、`INSERT` / `UPDATE` / `DELETE` 不在 |
| AC-8: Queue / DLQ binding 名と D1 schema が逆引き可 | Phase 12 | runbook + skill references で binding 名 / 列名 / migration を相互参照 |
| AC-9: 既存 schema / API / Queue 構造変更なし | Phase 1〜13 全て | コード変更ゼロ、docs-only |
| AC-10: 4 条件評価全 PASS | 本 Phase | 上記 4 条件評価表 |
| AC-11: Phase 12 strict 7 成果物 + runbook 本体 + aiworkflow-requirements 同期完了 | Phase 12 | strict 7 ファイル + runbook + references / changelog / indexes |

---

## 変更対象ファイル / 関数シグネチャ / unit / integration / e2e tests

**N/A（コード変更なし）**

本タスクは docs-only / CONST_004 例外適用のため、コード単体テスト・統合テスト・E2E テストは存在しない。

---

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証 / NON_VISUAL 縮約 / staging 集計 SQL 実行）
- 引き継ぎ事項:
  - Gate A 判定結果（runbook 配置先 / skill references 追記先 / changelog fragment 配置先 / indexes 再生成方針 / 固定値正本）
  - Gate B 設計レビュー結果（差し戻し 0 で Phase 11 へ）
  - Gate C user_approval 方針（Phase 13 まで保留）
  - 集計 SQL 3 種の最終形（read-only 確認済）
- ブロック条件:
  - Gate A のいずれかが NO-GO → 該当 phase に差し戻し
  - Gate B のいずれかが NO-GO → 該当 phase に差し戻し
  - Gate C 方針が未確認 → Phase 13 PR 作成不可

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 名の正本 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | retry_count / failed_items_json 更新点の正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 schema の正本 |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として Phase 11 staging 集計 SQL の `jq empty` PASS、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期、`pnpm indexes:rebuild` drift 0 を検証ゲートとする。
