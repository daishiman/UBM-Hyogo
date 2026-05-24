# issue-836-schema-alias-recompute-trigger - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Issue #836 のラベルは `type:followup` / `area:admin-ui`。本タスクは「rollback 後の再集計実行（API + UI + audit log + job）」を実装する。`apps/api/migrations/0020_schema_alias_recompute_jobs.sql` 新規、`apps/api/src/workflows/schemaAliasRecompute.ts` 新規、`apps/api/src/routes/admin/schema.ts` への recompute endpoint 追加、`apps/web/src/lib/admin/api.ts` への helper 追加、`apps/web/src/components/admin/SchemaDiffPanel.tsx` の warning 表示を実 recompute 実行 UI へ置換 — いずれもコード変更を伴う。再集計を「動作させる」ことが目的でありコード変更なしには達成不可能なため docs-only 不可（CONST_004）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | issue-836-schema-alias-recompute-trigger |
| タスク名 | schema alias rollback 後の集計再実行（recompute）トリガーを実装する |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger |
| 親 Issue | #836 (CLOSED, 2026-05-23T10:24:48Z) — CLOSED 維持。最新コードに最適化して仕様書化 |
| 親 workflow | docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/ |
| 原典 (unassigned-task) | docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md |
| GitHub Issue URL | https://github.com/daishiman/UBM-Hyogo/issues/836 |
| 作成日 | 2026-05-23 |
| 担当 | delivery |
| 状態 | spec_created（runtime_pending） |
| implementation_mode | new |
| タスク種別 | implementation / VISUAL（admin UI screen diff あり） |
| 優先度 | 中（集計汚染の発見遅延リスク。rollback 後に response_fields が古い stable_key のまま残存） |

## Issue 鮮度調査結論（最新コードへの最適化）

> ユーザー依頼「問題が既に他タスクで直っているか調査し、不要なら不要と伝える / issue が古い可能性があるので最新コードを確認し現在のコードに最適化して根本解決」への回答。

### 調査結果: **未解決（本タスクの実施が必要）**

| 確認対象 | 現コードベース実態（2026-05-23） | 結論 |
| --- | --- | --- |
| recompute 実行 API endpoint | `apps/api/src/routes/admin/schema.ts` に存在しない（`backfill/trigger` は Issue #504 の 50k fixture 専用で別物） | **未実装** |
| recompute workflow | `apps/api/src/workflows/` に `schemaAliasRecompute.ts` 等は存在しない | **未実装** |
| recompute audit action | `audit_log` に `schema_alias.recompute` action の記録経路なし | **未実装** |
| recompute UI | `SchemaDiffPanel.tsx:248-250` に「⚠ 再集計が必要になる可能性 / 再集計実行は本タスク外です（別途運用フォロー）」warning text のみ | **警告表示のみ** |
| rollback 後の response_fields 整復 | `schemaAliasRollback.ts` は soft delete + queue restore + audit のみ。`response_fields.stable_key` は alias の stableKey のまま残存し戻されない | **未整復** |

→ Issue #778（rollback / undo 本体）で `impact.recomputeRequired` フラグ表示までは実装済みだが、**実際の再集計実行は一切未実装**。他タスクでも解決されていない。本タスクの実施が必要。

### 根本問題の最新コードへの最適化（issue 当時 → 現在）

原典 Issue #836 は「集計済みの表示や派生テーブル」が再集計対象と想定していたが、現コードベースには独立した派生集計 view / テーブルは存在しない。**実体としての「派生データ」は `response_fields.stable_key`** である。

| 観点 | 原典 #836 の想定 | 現コードベース実態 | 本タスクで採る最適化方針 |
| --- | --- | --- | --- |
| 再集計対象 | 「集計済み表示・派生テーブル」（抽象） | 派生集計 view / テーブルは未実在。実体は `response_fields.stable_key` | 再集計 = `response_fields` の reverse-backfill（後述） |
| backfill の存在 | 言及なし | resolve 時 `backfillResponseFields()`（`schemaAliasAssign.ts:192-277`）が `__extra__:{questionId}` → `newStableKey` に書き換え | rollback の整復は backfill の逆操作（`alias.stableKey` → `__extra__:{aliasQuestionId}`） |
| idempotency | aliasId × revision × triggerKey | revision 列は `schema_aliases.revision_id` として実在。`trigger_key` は server-side に導出し client から受け取らない | `schema_alias_recompute_jobs` に `(alias_id, stable_key, trigger_key)` UNIQUE を持たせ idempotent 化 |
| 実行契機 | admin 明示操作 or 明示 job trigger | rollback は `schemaAliasRollback` で即時完了（自動再集計なし） | rollback とは別の admin 明示 endpoint。rollback 直後の自動実行はしない |
| status 可視化 | pending / running / failed | rollback 後 alias は soft-deleted 済み | recompute job に `pending/running/completed/failed` を持たせ UI バッジ表示 |

**根本解決の定義**: 「rollback で alias を取り消したのに `response_fields` が古い stableKey のまま残り集計が汚染される」状態を、admin が明示トリガーする idempotent な reverse-backfill（+ audit log + status 追跡）で解消する。

## 採用方針（現コードベース実態に最適化）

**「rollback で取り消された alias の `response_fields` を、admin 明示トリガーで `__extra__:{aliasQuestionId}` へ idempotent に reverse-backfill し、実行を audit_log + job status で追跡する」**

- 再集計ロジックは `backfillResponseFields()` の逆操作として対称実装する（chunk 単位・CPU budget・衝突回避を踏襲）。
- job テーブル `schema_alias_recompute_jobs` で idempotency（`(alias_id, stable_key, trigger_key)` UNIQUE）と status を管理する。
- rollback 直後の自動実行はしない。admin が SchemaDiffPanel の「再集計実行」ボタンを押した時のみ起動する（受入条件 AC-5）。
- web 側 API 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由を標準とする（CLAUDE.md #10）。

## 目的

`/admin/schema` SchemaDiffPanel から、rollback 済み alias の `response_fields` を API + 監査ログ経由で再集計（reverse-backfill）できる経路を追加し、rollback 後に古い stable_key が残存して集計が汚染される問題を解消する。`docs/00-getting-started-manual/specs/11-admin-management.md` の操作原則（操作はすべて API + 監査ログを通る）を recompute 領域でも成立させる。

## スコープ

### 含む

- **D1 migration**: `apps/api/migrations/0020_schema_alias_recompute_jobs.sql`（新規）
  - `schema_alias_recompute_jobs` テーブル新規作成（`job_id` PK, `alias_id`, `stable_key`, `question_id`, `trigger_key`, `status`, `affected_count`, `processed_count`, `updated_count`, `deleted_collision_count`, `cursor`, `recompute_audit_id`, `locked_at`, `locked_by`, `run_token`, `created_by`, `created_at`, `updated_at`, `last_error`）
  - `UNIQUE(alias_id, stable_key, trigger_key)` で idempotency 担保
  - `idx_schema_alias_recompute_jobs_alias`（`alias_id`）index 追加
- **API endpoint**: `apps/api/src/routes/admin/schema.ts` に追加
  - `POST /admin/schema/aliases/:aliasId/recompute`: recompute job 作成 + 実行。response: `{ jobId, aliasId, status, affectedCount, processedCount, updatedCount, deletedCollisionCount, recomputeAuditId }`
  - `GET /admin/schema/aliases/:aliasId/recompute`: 直近 job status 取得。response: `{ jobId, status, affectedCount, processedCount, updatedCount, deletedCollisionCount, lastError, updatedAt } | null`
- **workflow**: `apps/api/src/workflows/schemaAliasRecompute.ts`（新規）
  - reverse-backfill 関数（`alias.stableKey` → `__extra__:{aliasQuestionId}` を chunk + CPU budget で UPDATE）
  - idempotent: 同一 `trigger_key` の再実行で派生件数が二重変動しない
  - audit_log に `schema_alias.recompute` action 記録（`after_json` に `{ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId }`）
- **repository**: `apps/api/src/repository/schemaAliasRecomputeJobs.ts`（新規, または既存 repo へ関数追加）
  - `createOrGetJob()` / `updateJobStatus()` / `getLatestJobByAlias()`
- **web helper**: `apps/web/src/lib/admin/api.ts` に追加
  - `recomputeSchemaAlias(input)` / `getSchemaAliasRecomputeStatus(aliasId)`
  - `RecomputeApiError` exception 型（`RollbackApiError` と同パターン）
- **web UI**: `apps/web/src/components/admin/SchemaDiffPanel.tsx`
  - `SchemaDiffPanel.tsx:248-250` の「再集計実行は本タスク外です」warning を **実 recompute 実行ボタン + status バッジ**へ置換
  - rollback 直後に表示される impact（`recomputeRequired`）から「再集計実行」導線を出す
  - status バッジ: `pending` / `running` / `completed` / `failed`
  - idempotent 再実行ガード: `submitting` 中のみ再押下を disable。server job の `running` は cursor から継続できるため「再集計を続行」操作を許可
  - 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由
- **spec 更新**:
  - `docs/00-getting-started-manual/specs/11-admin-management.md` に recompute 操作仕様追記
  - `docs/00-getting-started-manual/specs/01-api-schema.md` に recompute endpoint 2 本追記
- **test**:
  - `apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts`（新規）: endpoint happy / idempotent re-run / not-found / status GET / audit insertion
  - `apps/api/src/workflows/schemaAliasRecompute.spec.ts`（新規）: reverse-backfill 件数 / idempotency / 衝突回避 / CPU budget exhausted 分岐
  - `apps/web/src/lib/admin/__tests__/api.spec.ts`: `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` ケース追加
  - `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`: 再集計ボタン happy / submitting disable / running continue / failed 表示ケース追加

### 含まない

- **bulk recompute（複数 alias 一括再集計）**: bulk rollback の従属。`serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` のスコープへ残置（CONST_007 例外条件 1）
- **recompute 完了通知（Slack / email）**: 通知チャネル仕様未確定。`serial-05-step-03-followup-007-schema-alias-rollback-notification.md` のスコープへ残置（CONST_007 例外条件 1）
- **Cloudflare Queue 経由の非同期大量 recompute**: 本タスクは同期 chunk + CPU budget exhausted 時の再呼び出し（status=`running` 継続）で完結する。Queue fan-out 化は影響件数が CPU budget を恒常的に超える運用実績が出た場合の将来拡張（未タスク化候補・Phase 12 で formalize）
- **派生集計 view の新規作成**: 現コードに派生 view は未実在。本タスクは `response_fields` 整復に限定する

### CONST_007 例外宣言

bulk recompute（followup-006 既存）・通知（followup-007 既存）は本タスクの recompute 単体経路の**前提条件ではない**。今サイクルに含めると以下が破綻する:
- followup-006: bulk 操作の race condition 設計が recompute 単体の倍以上の検討量。bulk rollback 本体が未着手のため依存元が不在
- followup-007: 通知チャネル仕様（Slack / email）の合意未済

→ いずれも CONST_007 例外条件 1（技術的・整合性的に今サイクル内完了が破綻する明確な理由）に該当。既存 unassigned-task に残置し新規重複起票はしない。Queue fan-out 化は Phase 12 で未タスク化候補として formalize する。**本タスクの recompute 実行 API / UI / audit / job 自体は今サイクル内で完結する。**

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md | 原典 unassigned-task |
| 必須 | docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/index.md | 親タスク（rollback / undo）仕様 |
| 必須 | apps/api/src/workflows/schemaAliasRollback.ts | rollback workflow（recompute の起点・`computeImpact` の対象） |
| 必須 | apps/api/src/workflows/schemaAliasAssign.ts | `backfillResponseFields()`（reverse-backfill の対称元）192-277 |
| 必須 | apps/api/src/routes/admin/schema.ts | endpoint 追加対象（rollback endpoint 376-434 が参考） |
| 必須 | apps/api/src/repository/auditLog.ts | `append()` audit ヘルパー 101-136 |
| 必須 | apps/api/migrations/0001_init.sql | `response_fields` / `schema_diff_queue` DDL（75-81 / 35-47） |
| 必須 | apps/api/migrations/0019_schema_alias_soft_delete.sql | 直前 migration（採番 0020 の根拠） |
| 必須 | apps/web/src/lib/admin/api.ts | helper 追加対象（`rollbackSchemaAlias` 155-195 が参考） |
| 必須 | apps/web/src/components/admin/SchemaDiffPanel.tsx | recompute UI 追加対象（warning 248-250 を置換） |
| 必須 | apps/web/src/features/admin/hooks/useAdminMutation | admin mutation 標準経路（CLAUDE.md #10） |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | 操作仕様追記対象 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | endpoint 仕様追記対象 |
| 必須 | CLAUDE.md | D1 直接アクセス禁止 / `*.spec.{ts,tsx}` 命名 / OKLch token / FormField / useAdminMutation 不変条件 |

## 受入条件 (AC)

### Local Acceptance

- **AC-1**: `POST /admin/schema/aliases/:aliasId/recompute` が recompute job を作成し、`response_fields.stable_key` を `alias.stableKey` → `__extra__:{aliasQuestionId}` へ reverse-backfill する。`schema.recompute.spec.ts` で happy path（affected 件数の整復）を検証する
- **AC-2**: idempotency: 同一 `(alias_id, stable_key, trigger_key)` で recompute を 2 回実行しても `response_fields` の状態が二重変動しない。`schemaAliasRecompute.spec.ts` で「2 回実行後の件数 == 1 回実行後の件数」を検証する
- **AC-3**: recompute 成功時 application `audit_log` に `schema_alias.recompute` action が記録され、`after_json` に `{ jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }` を含む。`schema.recompute.spec.ts` で audit 行の存在と内容を検証する
- **AC-4**: `GET /admin/schema/aliases/:aliasId/recompute` が直近 job の `status`（pending/running/completed/failed）・`affectedCount` / `processedCount` / `updatedCount` / `deletedCollisionCount` / `lastError` を返す。job 不在時は `null` を返す
- **AC-5**: rollback 直後の自動実行をしない。recompute は admin actor の明示操作（SchemaDiffPanel の「再集計実行」ボタン押下 → API 呼び出し）でのみ起動する。`SchemaDiffPanel.component.spec.tsx` でボタン押下 → API 呼び出しの配線を検証する
- **AC-6**: SchemaDiffPanel の `data-role="recompute-warning"`（248-250）を実 recompute 実行 UI（ボタン + status バッジ）へ置換する。`submitting` 中はボタンを disable し、server `running` は「再集計を続行」として再押下可能にする。`SchemaDiffPanel.component.spec.tsx` で happy / submitting disable / running continue / failed 表示を検証する
- **AC-7**: migration `0020_schema_alias_recompute_jobs.sql` が `schema_alias_recompute_jobs` テーブルを作成し、`UNIQUE(alias_id, stable_key, trigger_key)` 制約を持つ。`PRAGMA table_info` / `PRAGMA index_list` で確認できる
- **AC-8**: CPU budget exhausted 時は job を `running` のまま `cursor` を残し、再呼び出しで継続できる。`schemaAliasRecompute.spec.ts` で exhausted → 再開で完了する分岐を検証する
- **AC-9**: web 側 recompute API 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md #10）。`@/lib/useAdminMutation` legacy への新規参照を増やさない
- **AC-10**: design token は OKLch 系既存 token のみ。status バッジ含め `bg-[#xxx]` / HEX 直書きなし（`verify-design-tokens` CI gate pass）
- **AC-11**: 新規 test file は `*.spec.{ts,tsx}` 命名のみ（lefthook `block-test-suffix` pass）
- **AC-12**: D1 直接アクセス禁止不変条件（CLAUDE.md #5）遵守: `apps/web` から D1 binding を直接呼ばない。すべて `lib/admin/api.ts` 経由
- **AC-13**: `11-admin-management.md` に recompute 操作仕様（権限・実行契機・status バッジ・idempotency・audit 記録項目）追記済み。`01-api-schema.md` に recompute endpoint 2 本（path / request / response / error 体系）追記済み

### Runtime Acceptance (Phase 11)

- **RAC-1**: staging で `bash scripts/cf.sh d1 migrations apply` 実行後 `PRAGMA table_info(schema_alias_recompute_jobs)` にカラムが存在する evidence MD
- **RAC-2**: staging `/admin/schema` で実 admin actor が dummy alias の resolve → rollback → recompute を実行し、`audit_log` に 3 行（resolve / rollback / recompute）が記録され、`response_fields` が `__extra__:{qid}` へ戻る runtime evidence（screenshot + SQL query 結果）
- **RAC-3**: VISUAL タスクとして Playwright visual baseline に SchemaDiffPanel recompute ボタン + status バッジの screenshot を追加（task-18 visual-full required check に整合）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | phase-01.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md |
| 3 | 設計レビュー | phase-03.md | spec_created | phase-03.md |
| 4 | テスト作成（TDD Red） | phase-04.md | spec_created | phase-04.md |
| 5 | 実装 | phase-05.md | spec_created | phase-05.md |
| 6 | テスト拡充 | phase-06.md | spec_created | phase-06.md |
| 7 | カバレッジ確認 | phase-07.md | spec_created | phase-07.md |
| 8 | リファクタリング | phase-08.md | spec_created | phase-08.md |
| 9 | 品質保証 | phase-09.md | spec_created | phase-09.md |
| 10 | 最終レビュー | phase-10.md | spec_created | phase-10.md |
| 11 | VISUAL evidence + runtime | phase-11.md | runtime_pending | outputs/phase-11/{visual-baseline,migration-apply,recompute-runtime}.md |
| 12 | 正本同期 | phase-12.md | spec_created | outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md |

## 不変条件

1. **CLOSED Issue を reopen しない**: Issue #836 は CLOSED 維持。Phase 12 fold-state sync で原典 unassigned-task に `consumed_via_issue_836_recompute_trigger_spec` を記述
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding を直接呼ばない（CLAUDE.md #5）
3. **既存 endpoint 互換**: `POST /admin/schema/aliases` の resolve 経路・`/rollback` 経路は touch しない。recompute は別 path で追加（path-namespace 分離）
4. **idempotency 保証**: 同一 `(alias_id, stable_key, trigger_key)` の recompute は派生件数を二重変動させない。job UNIQUE 制約で担保
5. **rollback 非自動連動**: rollback workflow（`schemaAliasRollback.ts`）には recompute 自動実行を追加しない。admin 明示操作のみ
6. **backfill 対称性**: reverse-backfill は `backfillResponseFields()` の衝突回避・chunk・CPU budget パターンを踏襲し、対称に実装する
7. **OKLch token のみ**: status バッジ含め HEX 直書き / `bg-[#xxx]` 禁止（CLAUDE.md UI prototype alignment 不変条件）
8. **`*.spec.{ts,tsx}` 命名**: 新規 test は spec suffix のみ（CLAUDE.md #8）
9. **secret 実値非記載**: evidence MD / artifacts.json に Cloudflare token / D1 binding 実値を残さない
10. **admin mutation 標準経路**: web 側の recompute API 呼び出しは `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md #10）
11. **CONST_007 遵守**: recompute 実行本体は本サイクルで完了。bulk / notification / Queue fan-out は明示分離

## リスクと緩和策

| リスク | 影響度 | 発生確率 | 緩和策 |
| --- | --- | --- | --- |
| reverse-backfill の衝突（`__extra__:{qid}` 行が既存）で UNIQUE 違反 | 高 | 中 | `backfillResponseFields()` と対称の DELETE → UPDATE 衝突回避を Phase 02 algorithm で固定。Phase 04 で衝突ケース必須 |
| idempotency 設計ミスで二重 recompute が派生件数を二重変動 | 高 | 中 | `(alias_id, stable_key, trigger_key)` UNIQUE + 既存 completed job 検出で no-op 返却。Phase 04 で 2 回実行ケース必須 |
| rollback で alias soft-deleted 済みのため alias 情報が取れない | 中 | 中 | recompute は soft-deleted alias を `includeDeleted: true` で取得（`getById` 既存オプション）。Phase 02 で明記 |
| 大量 response の同期 recompute で CPU budget timeout | 中 | 低 | chunk + CPU budget exhausted 時 `running` 継続 + cursor 保存で再開可能。Queue fan-out は将来拡張 |
| audit relation の保存先が Cloudflare `cf_audit_log` と混同される | 中 | 中 | Phase 02 で application `audit_log.after_json.relatedRollbackAuditId` に固定。`cf_audit_log` は変更しない |
| Playwright visual baseline 追加忘れで `visual-full` CI fail | 中 | 中 | Phase 11 で baseline 取得手順を明文化、task-18 visual-full のスコープと整合 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | apps/api/migrations/0020_schema_alias_recompute_jobs.sql | recompute job テーブル migration（AC-7） |
| コード | apps/api/src/workflows/schemaAliasRecompute.ts | reverse-backfill workflow（AC-1, AC-2, AC-8） |
| コード | apps/api/src/repository/schemaAliasRecomputeJobs.ts | job repository（AC-2, AC-4） |
| コード | apps/api/src/routes/admin/schema.ts | recompute endpoint 2 本追加（AC-1, AC-4） |
| コード | apps/web/src/lib/admin/api.ts | `recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` helper |
| コード | apps/web/src/components/admin/SchemaDiffPanel.tsx | recompute 実行 UI + status バッジ（AC-5, AC-6） |
| ドキュメント | outputs/phase-02/api-contract.md | endpoint 設計 |
| ドキュメント | outputs/phase-02/d1-schema-migration.md | migration 設計 |
| ドキュメント | outputs/phase-02/recompute-algorithm.md | reverse-backfill / idempotency 設計 |
| ドキュメント | outputs/phase-02/ui-state-machine.md | recompute UI 状態遷移設計 |
| ドキュメント | outputs/phase-12/*（6 files） | Phase 12 mandatory outputs |
| ドキュメント | outputs/phase-13/pr-summary.md | PR ドラフト |
| 管理 | artifacts.json / outputs/artifacts.json | workflow state |

## Phase マップ

```
phase-01 (要件定義: #836 鮮度調査 + recompute=reverse-backfill 確定)
       │
       ▼
phase-02 (設計: migration / API / recompute algorithm / UI 状態機械)
  ├─ outputs/phase-02/api-contract.md
  ├─ outputs/phase-02/d1-schema-migration.md
  ├─ outputs/phase-02/recompute-algorithm.md
  └─ outputs/phase-02/ui-state-machine.md
       │
       ▼
phase-03 (設計レビュー: AC-1〜AC-13 マッピング)
       │
       ▼
phase-04 (テスト作成: TDD Red, T-01〜T-12 のテスト先行)
       │
       ▼
phase-05〜10 (実装〜最終レビュー)
       │
       ▼
phase-11 (VISUAL evidence + migration apply + recompute runtime)
  ├─ outputs/phase-11/visual-baseline.md
  ├─ outputs/phase-11/migration-apply.md
  └─ outputs/phase-11/recompute-runtime.md
       │
       ▼
phase-12 (正本同期 / 7 必須 output + fold-state sync)
       │
       ▼
phase-13 (PR base=dev / user-gated push)
  └─ outputs/phase-13/pr-summary.md
```

## 注意点

- GitHub Issue #836 は CLOSED 済（2026-05-23T10:24:48Z）。reopen はせず本仕様書で local implementation + 正本同期まで完了する
- closure 時に linked PR・comment なしのため closure 経緯は不明。コード実態（recompute 未実装）が判断根拠
- recompute UI は将来の bulk recompute（followup-006）へ吸収できるよう、`SchemaDiffPanel` 内の分離可能な内部要素（`data-role="recompute-action"` / `data-role="recompute-status"`）で実装する
- recovery D'+0 起算は runbook 正本どおり別経路で user が宣言する
