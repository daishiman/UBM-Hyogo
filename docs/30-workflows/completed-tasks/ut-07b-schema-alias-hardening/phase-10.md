# Phase 10: 最終レビューゲート / Go-No-Go

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビューゲート / Go-No-Go |
| 作成日 | 2026-05-01 |
| 前 Phase | 9（品質保証） |
| 次 Phase | 11（手動検証 / NON_VISUAL 縮約 + 大規模実測 evidence） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| タスク分類 | implementation（final review gate） |

## 目的

Phase 1〜9 で蓄積した要件 / 設計（DB 制約・再開可能 back-fill・retryable contract・大規模実測 plan）/ 設計レビュー / 検証戦略 / runbook（migration / rollback / API contract）/ 異常系 / AC マトリクス / DRY 化 / 品質保証 の各成果物を横断レビューし、AC-1〜AC-10 すべての達成状態と 4 条件最終判定（PASS / MINOR / MAJOR）を確定する。

本タスクは **implementation / NON_VISUAL / spec_created** 段階であり、Phase 11 で staging 大規模実測 evidence を残し、Phase 12 で 7 必須成果物を作成し、Phase 13 で user_approval 後に commit / push / PR 作成を行う。ゆえに Phase 10 GO 判定の本質は **「本仕様書のみで Phase 11 staging 実測と Phase 12 ドキュメント更新が手戻りなく実行できる粒度に達しているか」** である。具体的には:

- DB constraint（partial UNIQUE）/ 再開可能 back-fill（cursor + status）/ retryable HTTP contract（5 ケース）の 3 軸が Phase 2 で唯一の正本として確定している
- migration / rollback / API contract update の runbook が Phase 5 で実行可能粒度
- 異常系（衝突 / CPU budget / 部分失敗）が Phase 6 で網羅
- 性能検証合否基準（10K / 50K / 100K × 6 軸）が Phase 9 で PASS / MINOR / MAJOR で確定
- 不変条件 #5（D1 直接アクセスは apps/api 限定）への違反 0 が Phase 8 / 9 で機械検証可能

これらが揃って初めて Phase 11 staging 実測と Phase 12 7 必須成果物への引き渡しが可能となる。

---

## 実行タスク

1. **AC-1〜AC-10 達成状態評価**: 各 AC を spec_created 視点で評価する（完了条件: 全 10 件に「仕様確定」「Phase 11 で確定予定」「Phase 12 で確定予定」のいずれかが付与）。
2. **4 条件最終再評価**: 価値性 / 実現性 / 整合性 / 運用性 の 4 観点を再確定する（完了条件: PASS / MINOR / MAJOR が一意に決定、根拠付き）。
3. **Go-No-Go 判定基準の適用**: 6 つの Go 条件すべての充足、または MAJOR 1 件で差し戻しを判定する（完了条件: GO / NO-GO 判定が明示）。
4. **Phase 11 / Phase 12 / Phase 13 引き渡し条件の確定**: 大規模実測 evidence、7 必須成果物、user_approval 必須の commit / push / PR 計画を明文化する（完了条件: 各 Phase の入力 / 出力 / 制約が表化）。
5. **不変条件 #5 への影響最終チェック**: migration / repository / workflow / route すべてが apps/api 内に閉じていることを最終確認する（完了条件: `rg apps/web/src` での D1 binding 参照 0 を Phase 9 結果で確定）。
6. **MAJOR 検出時の差し戻しルート確定**: db-constraint / resumable-backfill / retryable-contract / large-scale-measurement の各成果物に対する差し戻し先 Phase を確定する（完了条件: MAJOR 種別 × 差し戻し先表が完成）。
7. **後続タスク（follow-up）への申し送り**: queue / cron 分離（Phase 11 結果次第） / 監視アラート / admin UI polling 対応 / shared 配置 の 4 件を follow-up 候補として整理する（完了条件: 各 follow-up に「本タスクで起票するか / 別タスクで判断するか」の判定）。
8. **open question を Phase 11 / 12 へ送り出す**: 残課題の受け皿 Phase を指定する（完了条件: 全件に受け皿明示）。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-03.md | 設計レビューゲート（base case） |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-09.md | QA 結果 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md | AC / 不変条件 / 直交関係 |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様 |
| 必須 | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/implementation-guide.md | 親タスク完了済仕様 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | 関連タスク（migration 順序関係） |
| 参考 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-10.md | 最終レビュー観点の参照事例 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-10.md | 最終レビュー観点の参照事例 |

---

## Go / No-Go 判定マトリクス（AC × 達成状態）

> **評価基準**: implementation / spec_created 段階のため、「契約文書 + コード設計が完備し、Phase 11 staging 実測 / Phase 12 ドキュメント更新 / Phase 13 PR 作成（user_approval 後）が手戻りなく実行できる粒度」で判定する。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | `schema_questions(revision_id, stable_key)` 同一 revision collision を DB constraint + repository pre-check の二段防御で保証 | 仕様確定（partial UNIQUE 設計 + pre-check 維持） | Phase 2 db-constraint-design.md + apps/api 実装 | PASS |
| AC-2 | 既存データ衝突検出 SQL と rollback 手順 + UT-04 / 本 migration 適用順序 | 仕様確定 | Phase 5 migration-runbook.md / rollback-runbook.md | PASS |
| AC-3 | alias 確定と back-fill 継続の状態分離、CPU budget 超過後の再実行で残件のみ処理（idempotent） | 仕様確定（cursor + status 設計） | Phase 2 resumable-backfill-design.md + apps/api 実装 | PASS |
| AC-4 | `backfill_cpu_budget_exhausted` retryable failure の API contract（HTTP status / response body）+ route test 境界 | 仕様確定（HTTP 5 ケース） | Phase 2 retryable-contract-design.md + Phase 5 api-contract-update.md | PASS |
| AC-5 | 10,000 行以上の `response_fields` fixture を staging D1 / Workers 実測、batch 数 / CPU 時間 / retry 回数 evidence | Phase 11 で確定予定（合否基準は Phase 9 で確定） | outputs/phase-11/manual-evidence.md | 引き渡し |
| AC-6 | 実 DB schema（`response_fields` カラム不在）と仕様書差分の吸収方針が明示 | 仕様確定（07b 正本を継続採用） | Phase 1 main.md + Phase 5 migration-runbook.md | PASS |
| AC-7 | unit / route / workflow tests が collision / retryable failure / idempotent retry / CPU budget 超過を網羅 | 仕様確定（Phase 4 検証戦略 + Phase 9 単体検証コマンド） | Phase 4 test-strategy.md + 各 test ファイル | PASS（Phase 11 で実行 PASS 確認） |
| AC-8 | 不変条件 #5（D1 直接アクセス apps/api 限定）違反 0 | 仕様確定（Phase 9 で `rg apps/web/src` 0 件確認） | 本 Phase + Phase 9 main.md | PASS |
| AC-9 | 4 条件評価が全 PASS で根拠付き | 本 Phase で確定 | 下記 4 条件最終再評価 | PASS |
| AC-10 | Phase 12 で 7 必須成果物確認 | Phase 12 で確定予定 | outputs/phase-12/*.md | 引き渡し |

---

## 4 条件最終再評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DB 物理制約 + 責務分離 + retryable contract + 大規模実測 evidence の 4 軸を一括で閉じる。並列 apply の silent collision、back-fill 部分失敗による中間不整合、本番想定データ量での未検証リスクを同時に解消し、schema diff alias workflow を運用に載せられる状態に昇格する。 |
| 実現性 | PASS | partial UNIQUE / cursor 管理 / 202 contract / fixture 生成いずれも既存スタック（D1 SQLite / Workers / wrangler / vitest）で実装可能。migration 1〜2 本 + repository / workflow / route の局所更新 + test 追加 + staging 実測の中規模見積もりで完結。 |
| 整合性 | PASS | 不変条件 #5 を侵さない（migration / repository / workflow / route すべて apps/api 内）。UT-04 schema 変更とも独立適用可。Phase 8 DRY 化で値ドメイン / DDL / 命名規約の単一正本化済み。親タスク 07b 完了済仕様の上書きなし。 |
| 運用性 | PASS | 衝突検出 SQL → 解消 → partial UNIQUE 適用の 2 段階順序が固定。retryable response（202 + retryable: true）で再実行手順が明確。Phase 9 で性能合否基準（10K / 50K / 100K × 6 軸）が PASS / MINOR / MAJOR 閾値で確定し、Phase 11 evidence で「PASS と言い切れる」運用へ移行できる。 |

**最終判定: GO（4 条件全 PASS）**

---

## Go-No-Go 判定基準

### Go 条件（6 件すべて満たすこと）

- [x] **DB constraint 確定**: partial UNIQUE index DDL + 既存衝突検出 SQL + rollback 手順 + UT-04 適用順序が Phase 2 / Phase 5 で唯一の正本として記述
- [x] **再開可能 back-fill 確定**: `schema_diff_queue.backfill_cursor / backfill_status` カラム追加 migration + workflow Stage 1 / Stage 2 分離 + idempotent 性証明（cursor 進行表）が Phase 2 で記述
- [x] **retryable HTTP contract 確定**: HTTP 200 / 202 in_progress / 202 exhausted / 409 / 422 の 5 ケース + failure code 2 種が Phase 2 で記述、route test 観点が Phase 4 / Phase 9 で確定
- [x] **大規模実測合否基準確定**: 10,000 / 50,000 / 100,000 行 × dryRun / apply / retry / CPU / `backfill.status` / batch サイズの 6 軸合否基準が Phase 9 で PASS / MINOR / MAJOR 閾値表化
- [x] **不変条件 #5 遵守**: migration / repository / workflow / route すべて apps/api 内、`rg apps/web/src` で D1 binding 参照 0 件を Phase 9 で機械検証
- [x] **AC × 成果物トレース完備**: AC-1〜AC-10 が Phase 9 トレーサビリティ表で空セル 0、Phase 11 / 12 で確定予定の 3 件（AC-5 / AC-9 / AC-10）も引き渡し条件明示

### No-Go 条件（いずれか 1 つでも MAJOR で差し戻し）

| MAJOR 条件 | 差し戻し先 |
| --- | --- |
| partial UNIQUE index DDL が確定していない or 既存衝突検出 SQL を欠く | Phase 2（db-constraint-design.md）|
| `backfill_cursor / backfill_status` 設計の idempotent 性証明が cursor 進行表で示されていない | Phase 2（resumable-backfill-design.md）|
| HTTP 5 ケース contract or failure code 2 種が抜ける | Phase 2（retryable-contract-design.md）|
| 大規模実測合否基準が曖昧（PASS / MINOR / MAJOR 境界未確定） | Phase 9（main.md）or Phase 2（large-scale-measurement-plan.md）|
| 不変条件 #5 違反検出（`apps/web` から D1 binding 直接参照） | Phase 2 / Phase 8（設計と DRY 化双方）|
| 親タスク 07b 完了済仕様への上書き / 全文転記が残る | Phase 8（DRY 化）|

**判定: GO（6 件すべて充足、MAJOR 0 件）**

---

## 不変条件 #5 への影響最終チェック

| チェック項目 | 確認方法 | 結果 |
| --- | --- | --- |
| migration の配置 | `apps/api/migrations/00NN_*.sql` 配下 | PASS |
| repository の配置 | `apps/api/src/repository/schemaQuestions.ts` | PASS |
| workflow の配置 | `apps/api/src/workflows/schemaAliasAssign.ts` | PASS |
| route の配置 | `apps/api/src/routes/admin/schema.ts` | PASS |
| `apps/web` から D1 binding 直接参照 | `rg "DB\|D1Database\|env\.DB" apps/web/src` | 期待 0 件（Phase 9 / Phase 11 で実測） |
| `packages/shared` への配置 | 本タスクスコープ外（Phase 8 で follow-up 確定） | PASS |

**最終判定: 不変条件 #5 遵守、違反 0**

---

## Phase 11 / Phase 12 / Phase 13 への引き渡し条件

### Phase 11（手動検証 / NON_VISUAL 縮約 + 大規模実測 evidence）

- 本タスクは **implementation / NON_VISUAL / visualEvidence=NON_VISUAL** のため、screenshot 不要。
- 代替 evidence として以下を Phase 11 で作成:
  - `outputs/phase-11/main.md`: Phase 11 全体サマリー
  - `outputs/phase-11/manual-evidence.md`: staging D1 / Workers での 10,000 / 50,000 / 100,000 行実測ログ（CLI 出力 / curl response body / wallclock 計測値）
  - `outputs/phase-11/link-checklist.md`: link 検証結果（リンク切れ 0 を ✅ で記録）
- 入力: Phase 9 性能検証合否基準 / Phase 5 runbook / Phase 2 large-scale-measurement-plan.md
- 出力: AC-5 確定 + queue / cron 分離 follow-up 起票判断結果
- 所要時間: fixture 投入 + 実測 + 記録で 2-4 時間（fixture サイズに依存）

### Phase 12（ドキュメント更新 / 7 必須成果物）

- Phase 12 で以下 7 必須成果物を作成:
  1. `outputs/phase-12/main.md` - サマリー
  2. `outputs/phase-12/implementation-guide.md` - DB constraint / 再開可能 back-fill / retryable contract の実装ガイド + 中学生レベル説明
  3. `outputs/phase-12/system-spec-update-summary.md` - `aiworkflow-requirements/references/{api-endpoints,database-schema,task-workflow-active}.md` への同期差分
  4. `outputs/phase-12/documentation-changelog.md` - 本タスク docs 追加分の changelog
  5. `outputs/phase-12/unassigned-task-detection.md` - 残課題（queue / cron 分離 / 監視 / admin UI polling / shared 配置）の formalize
  6. `outputs/phase-12/skill-feedback-report.md` - task-specification-creator skill への feedback
  7. `outputs/phase-12/phase12-task-spec-compliance-check.md` - 7 必須成果物の自己整合性チェック
- 入力: Phase 8 DRY 化結果 / Phase 11 実測 evidence
- 出力: AC-10 確定 + `pnpm indexes:rebuild` で indexes 再生成
- `aiworkflow-requirements` 同期は本 Phase で 1 回にまとめる（Phase 8 で差分を集約済み）

### Phase 13（PR 作成 / user_approval 必須）

- Phase 13 は `pending_user_approval`。GitHub Issue #293 は CLOSED のまま、再 OPEN しない。
- PR 文面では **`Closes #293` を使わず `Refs #293` を採用** する（close 主導はしない、index.md 注意事項に明記済み）。
- `git commit` / `git push` / `gh pr create` の実行手順はユーザー明示承認後の操作として扱う。
- PR 説明文に本 Go-No-Go 判定結果 + Phase 11 実測 evidence サマリー + Phase 12 system-spec 同期差分を転記する計画を Phase 12 で確定。

---

## MAJOR 検出時の差し戻しルート

| MAJOR 種別 | 差し戻し先 Phase | 差し戻し対象成果物 |
| --- | --- | --- |
| partial UNIQUE 設計の不備（DDL / 衝突検出 SQL / rollback 不足） | Phase 2 | `outputs/phase-02/db-constraint-design.md` |
| 再開可能 back-fill 設計の不備（idempotent 証明欠落 / cursor 進行表不備） | Phase 2 | `outputs/phase-02/resumable-backfill-design.md` |
| retryable contract 設計の不備（HTTP 5 ケース欠落 / failure code 不整合） | Phase 2 | `outputs/phase-02/retryable-contract-design.md` |
| 大規模実測 plan / 合否基準の不備 | Phase 2 / Phase 9 | `outputs/phase-02/large-scale-measurement-plan.md` / `outputs/phase-09/main.md` |
| migration runbook の粒度不足（適用順序 / rollback 手順 / UT-04 関係） | Phase 5 | `outputs/phase-05/migration-runbook.md` / `outputs/phase-05/rollback-runbook.md` |
| 異常系の網羅不足（衝突 / CPU budget / 部分失敗の検証ケース欠落） | Phase 6 | `outputs/phase-06/failure-cases.md` |
| 不変条件 #5 違反 | Phase 2 / Phase 8 | 該当設計成果物 + DRY 化結果 |
| DRY 化不全（重複転記 / 親タスク 07b 上書き） | Phase 8 | `outputs/phase-08/main.md` |

> 本 Phase での MAJOR 検出は 0 件。差し戻しは発生しない。

---

## 後続タスク（follow-up）への申し送り

| follow-up 候補 | 本タスクでの起票 | 別タスクで判断 | 備考 |
| --- | --- | --- | --- |
| queue / cron 分離（Phase 11 で 100,000 行 > 5 retry / `failed` 多発時） | 起票しない | Phase 11 結果次第で Phase 12 unassigned-task-detection.md にて formalize | 実装は別タスク |
| 監視アラート（`backfill.status='failed'` 検知の閾値設計） | 起票しない | 別タスク（監視ダッシュボード）で起票 | Phase 12 unassigned-task-detection.md に candidate として送出 |
| admin UI polling 対応（202 / retryable response の自動 retry / 進捗表示） | 起票しない | 別タスク（admin UI 改修）で起票 | Phase 12 unassigned-task-detection.md に candidate |
| `packages/shared/src/types/zod` への HTTP response body 型 / enum 配置 | 起票しない | admin UI から参照する必要が確定した時点で別タスクで判断 | Phase 8 で base case 確定済み（apps/api 内のみ） |

---

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 100,000 行実測で恒常的に CPU 超過する場合の queue / cron 分離実装 | Phase 11 結果次第で別タスク（follow-up 起票・条件は Phase 11 evidence で確定） | open（Phase 11 で判定） |
| 2 | admin UI 側の 202 / retryable レスポンス対応（自動 polling） | 別タスク（管理画面 UI 改修） | Phase 12 unassigned-task-detection.md に送出 |
| 3 | `aiworkflow-requirements/references/api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` 同期更新 | 本タスク Phase 12（documentation 同期） | Phase 8 で差分集約済み |
| 4 | 監視アラート（`backfill.status='failed'` 検知）の閾値設計 | 別タスク（監視ダッシュボード） | Phase 12 unassigned-task-detection.md に送出 |
| 5 | `packages/shared/src/types/zod` 配置（admin UI 参照確定後） | 別タスク（shared 配置判断 + admin UI 改修） | Phase 12 unassigned-task-detection.md に candidate 送出 |
| 6 | partial UNIQUE 適用前の既存データ衝突解消手順（`unknown` 戻し / 手動マージ）の実運用 | Phase 11（staging で衝突検出 SQL を実行し 0 件確認） / Phase 12 implementation-guide.md | open（Phase 11 で確定） |

---

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 / Phase 9 の AC トレース表を基に、AC-1〜AC-10 を spec_created 視点で評価。

### ステップ 2: 4 条件最終再評価
- Phase 3 base case 判定 + Phase 9 QA 結果を継承し、本 Phase で再確認。

### ステップ 3: Go 条件 6 件の充足チェック
- DB constraint / 再開可能 back-fill / retryable contract / 大規模実測合否 / 不変条件 #5 / AC トレース を順次確認。

### ステップ 4: 不変条件 #5 への影響最終チェック
- migration / repository / workflow / route の配置確認 + `rg apps/web/src` 0 件確認方針。

### ステップ 5: MAJOR 検出時の差し戻しルート確認
- 本 Phase で MAJOR 0 を確認、ルールのみ記述。

### ステップ 6: Phase 11 / 12 / 13 引き渡し条件確定
- 大規模実測 evidence + 7 必須成果物 + user_approval 必須 PR 計画を明文化。

### ステップ 7: follow-up と open question を次 Phase / 別タスクへ送出
- 4 件の follow-up + 6 件の open question すべてに受け皿明示。

### ステップ 8: outputs/phase-10/go-no-go.md に判定を記述

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に大規模実測 evidence 作成（screenshot 不要、manual-evidence.md + link-checklist.md） |
| Phase 12 | 7 必須成果物作成、open question / follow-up を unassigned-task として formalize、`aiworkflow-requirements` 同期 PR を 1 回に集約 |
| Phase 13 | GO/NO-GO 結果を PR description に転記（Issue #293 は CLOSED のまま `Refs #293` で参照） |
| 親タスク 07b 完了 | 07b 既存 test の regression 0 + 既存 implementation-guide の保護を Phase 13 PR で確認 |
| UT-04（関連） | partial UNIQUE migration 順序関係 + canonical 値ドメインを Phase 12 system-spec-update-summary.md 経由で UT-04 に引き渡し |

---

## 多角的チェック観点

- **価値性**: GO 判定により Phase 11 staging 実測 + Phase 12 ドキュメント更新 + Phase 13 PR 作成（user_approval 後）が手戻りなく実行可能。
- **実現性**: 既存スタック（D1 SQLite partial index / Workers / wrangler / vitest）で完結、新規ツール導入なし。
- **整合性**: 不変条件 #5 遵守（apps/api 内完結）、親タスク 07b 完了済仕様の保護、UT-04 schema 変更との独立性確保。
- **運用性**: Phase 9 性能合否基準 + Phase 5 runbook + Phase 11 大規模実測 evidence で「PASS と言い切れる」運用昇格状態。
- **認可境界**: admin endpoint のみ更新。public route / 認証境界への影響 0。
- **無料枠**: D1 storage 増分は `schema_diff_queue` カラム 2 つ（TEXT NULL）のみ、reads / writes は fixture 投入時の一時的増加のみ（投入後削除可）。
- **PR 文面方針**: `Refs #293`（`Closes #293` 不採用）/ user_approval 必須 / Phase 11 evidence と Phase 12 system-spec 同期差分の転記。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-10 達成状態評価 | 10 | spec_created | 10 件 |
| 2 | 4 条件最終再評価 | 10 | spec_created | 全 PASS |
| 3 | Go 条件 6 件の充足チェック | 10 | spec_created | 全充足 |
| 4 | Phase 11 / 12 / 13 引き渡し条件確定 | 10 | spec_created | 大規模実測 + 7 必須成果物 + user_approval PR |
| 5 | 不変条件 #5 への影響最終チェック | 10 | spec_created | 違反 0 |
| 6 | MAJOR 差し戻しルート確認 | 10 | spec_created | MAJOR 0 |
| 7 | follow-up 4 件 + open question 6 件 送出 | 10 | spec_created | 受け皿 Phase / 別タスク指定 |
| 8 | go-no-go.md 作成 | 10 | spec_created | GO で確定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・4 条件最終再評価・Go 条件 6 件・不変条件 #5・後続タスク着手可能性・MAJOR 差し戻し・Phase 11/12/13 引き渡し・follow-up / open question |
| メタ | artifacts.json | Phase 10 状態の更新 |

---

## 完了条件

- [ ] AC-1〜AC-10 全件に達成状態が付与（PASS / 引き渡し が明示）
- [ ] 4 条件最終再評価が全 PASS（根拠付き）
- [ ] Go 条件 6 件すべて充足が確認
- [ ] 不変条件 #5 への影響最終チェックで違反 0
- [ ] MAJOR 0 件で差し戻しなしが確定
- [ ] Phase 11 / Phase 12 / Phase 13 引き渡し条件が明文化（大規模実測 / 7 必須成果物 / user_approval PR）
- [ ] follow-up 4 件 + open question 6 件すべてに受け皿 Phase or 別タスクが指定
- [ ] outputs/phase-10/go-no-go.md が作成済み
- [ ] GO 判定で確定

---

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4 条件 × Go 条件 × 不変条件 #5 × MAJOR × Phase 11/12/13 引き渡し × follow-up × open question の 8 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`
- 親タスク 07b 完了済仕様への上書きなし、`Refs #293` 方針確認済み

---

## 次 Phase への引き渡し

- 次 Phase: 11（手動検証 / NON_VISUAL 縮約 + 大規模実測 evidence）
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - NON_VISUAL タスクであり screenshot 不要、`manual-evidence.md` + `link-checklist.md` を採用
  - 大規模実測（10,000 / 50,000 / 100,000 行 staging D1 / Workers）の合否基準（Phase 9 で確定）
  - queue / cron 分離 follow-up 起票条件（100,000 行で > 5 retry / `failed` 多発で MAJOR 判定 → Phase 12 unassigned-task に送出）
  - Phase 12 で 7 必須成果物作成計画 + `aiworkflow-requirements` 同期 PR
  - Phase 13 は user_approval 必須、`Refs #293`（CLOSED 維持）
  - open question #1 / #6 を Phase 11 で確定、#2-#5 を Phase 12 / 別タスクで処理
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS / 引き渡し でないものが残る
  - Go 条件 6 件のいずれかが未充足
  - 不変条件 #5 違反が検出される
  - 親タスク 07b 完了済仕様への上書き / 全文転記が残る
  - shared 配置 / queue 分離が「未決」のまま Phase 11 に進む
