# issue-837-schema-alias-bulk-rollback — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `issue-837-schema-alias-bulk-rollback` |
| 由来 Issue | [#837 serial-05-step-03 followup-006: schema alias 複数一括 rollback](https://github.com/daishiman/UBM-Hyogo/issues/837) |
| Issue state | `CLOSED`（実装未着手のまま close されている。closed のまま本ワークフローで実装仕様を作成する） |
| workflow_state | `implemented_local_evidence_captured`（automation-30 再検証で実装仕様書のみの close-out を是正し、apps/web 実装・focused tests・typecheck・正本仕様同期まで完了） |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `feature-extension`（既存 single rollback UI / single rollback endpoint に bulk mode を追加） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` |
| 兄弟参照 workflow | `docs/30-workflows/completed-tasks/issue-776-schema-alias-bulk-resolve/`（bulk resolve の client-side fan-out を構造テンプレートとして踏襲） |
| 元 unassigned-task spec | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md` |
| 優先度 | 低（issue label: `priority:low`） |
| 見積もり規模 | 中 |
| PR base | `dev` |

## 実装区分

**[実装区分: 実装仕様書]**

判定根拠:

- 対象タスクは `SchemaDiffPanel.tsx` の HistoryPane への bulk rollback selection UI 追加、`apps/web/src/lib/admin/api.ts` への bulk rollback helper 追加、新規 modal / hook コンポーネント追加を含む。
- 「複数 alias を一括で rollback できるようにする（動作させる）」性質のタスクであり、ドキュメント変更だけでは Issue #837 の目的（admin の bulk rollback 運用負荷軽減）は達成不能。
- 初回調査では bulk rollback に該当する route / service / client helper / UI は存在しなかった。automation-30 実行で route / D1 schema を増やさず、`apps/web` client helper / HistoryPane bulk UI / modal / hook / focused tests を同サイクルで追加した。
- 元 unassigned-task spec が CONST_005 必須項目（変更対象ファイル・関数シグネチャ・テスト・実行コマンド・DoD）の素材を保持しているため、実装仕様書として展開する。

## Issue #837 現状調査サマリ（最新コード基準）

| 項目 | 状態 |
| --- | --- |
| Issue 状態 | CLOSED（2026-05-23 close、本ワークフローは closed のまま spec 作成） |
| 単体 rollback workflow（`apps/api/src/workflows/schemaAliasRollback.ts`） | 実装済み（Issue #778）。`schemaAliasRollback(c, input)` 単数専用 |
| 単体 rollback endpoint（`apps/api/src/routes/admin/schema.ts`） | 実装済み。`POST /admin/schema/aliases/:aliasId/rollback`（If-Match 楽観ロック） |
| 単体 rollback client helper（`apps/web/src/lib/admin/api.ts`） | 実装済み。`rollbackSchemaAlias(input)` 単数専用 / `RollbackApiError` |
| bulk resolve client helper（`apps/web/src/lib/admin/api.ts`） | 実装済み（Issue #776）。`postSchemaAliasBulk(rows, options)` client-side bounded fan-out（concurrency 8）。**本タスクの構造テンプレート** |
| bulk resolve UI（`SchemaDiffPanel.tsx` / `SchemaDiffBulkResolveModal.tsx` / `useSchemaDiffBulkSelection.ts`） | 実装済み（Issue #776）。bulk **rollback** mode は未実装 |
| bulk rollback（client helper / UI / test） | 実装済み。`rollbackSchemaAliasBulk`、`SchemaDiffBulkRollbackModal`、`useSchemaDiffBulkRollbackSelection`、HistoryPane bulk mode、focused tests を追加 |
| 結論 | Issue は CLOSED のまま `Refs #837` 文脈で実装済み。single rollback（#778）と bulk resolve（#776）の既存 endpoint / UI pattern に整合し、新 API / D1 schema 変更なしで完了 |

## アーキテクチャ決定（Issue「苦戦箇所」への回答）

元 unassigned-task spec の「苦戦箇所」を、現行コード（#776 bulk resolve / #778 single rollback）の確立済みパターンに揃えて以下の通り決定する。

| 苦戦箇所 | 決定 | 根拠 |
| --- | --- | --- |
| transaction 境界（per-alias 独立 commit か全件 atomic か） | **per-alias 独立 commit** | 既存 single rollback workflow が alias 単位で D1 batch を atomic 実行済み。bulk は #776 bulk resolve と同じく client-side per-row fan-out で各 alias の独立 commit を積み上げる。全件 atomic は D1 binding 横断 transaction を web 層から張れず不可能 |
| version mismatch の応答 shape | **per-row `{ aliasId, status, error.kind }` を集約** | 各 row に `{ aliasId, version }` を持たせ、409 (version_mismatch) は該当 row を error として残し、成功分は確定。#776 `SchemaAliasBulkRowResult` の構造を rollback 用に踏襲 |
| audit log 粒度（per-alias 単独 / batch parent-child） | **per-alias `schema_alias.rollback` 記録（既存 endpoint が emit 済み）を正本とする** | 単体 rollback endpoint が既に per-alias で audit_log に記録する。AC「各 alias の rollback 結果を追跡できる」は per-alias 記録で充足。batch parent-child は D1 schema / API 変更を要し、不変条件「API/D1 変更なし」に反するため本タスクのスコープ外（理由付きで [スコープ外] に明記） |
| long-running batch の Workers timeout | **client-side fan-out のため Workers 単発呼び出しは alias 1 件単位**。上限 50 件・concurrency 8 | 各 HTTP は単体 rollback endpoint への 1 リクエストで、Workers の単発 CPU/timeout 制約は single rollback と同一。N 件は client 側で律速。50 件超は分割実行を UI で強制 |
| bulk selection 誤操作防止 | confirm modal + 全選択時の件数表示 + 50 件上限 alert | #776 の confirm modal / 50 件上限パターンを踏襲 |

## 13 Phase 成果物一覧

| Phase | 区分 | 成果物 |
| --- | --- | --- |
| 01 | 要件整理 | `phase-01-requirements.md` |
| 02 | 設計 | `phase-02-design.md` |
| 03 | 設計レビュー | `phase-03-design-review.md` |
| 04 | テスト作成計画 | `phase-04-test-creation.md` |
| 05 | 実装計画 | `phase-05-implementation.md` |
| 06 | テスト拡張 | `phase-06-test-expansion.md` |
| 07 | カバレッジ確認 | `phase-07-coverage-check.md` |
| 08 | リファクタ | `phase-08-refactoring.md` |
| 09 | 品質保証 | `phase-09-quality-assurance.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト/Evidence 計画 | `phase-11-manual-test.md` |
| 12 | 実装ガイド（strict 7 成果物） | `outputs/phase-12/*.md` |
| 13 | PR 作成 | `phase-13-pr-creation.md` |

## スコープ（CONST_007: 1 サイクル完了原則）

本ワークフローは **今回の automation-30 実行サイクル内で local implementation まで完了**した。先送り（バックログ送り）は行わない。

### 含むもの

- `SchemaDiffPanel` の HistoryPane への bulk rollback selection UI（行 checkbox / select-all / 選択件数バッジ / 50 件上限 alert）
- bulk rollback confirm modal（選択 alias 一覧 + aggregate 影響件数 + per-row 結果表示）
- bulk rollback submit progress UI と partial failure / all-fail / all-success の区別表示
- `apps/web/src/lib/admin/api.ts` への `rollbackSchemaAliasBulk` helper（client-side bounded fan-out / row-level progress + aggregate 集計、既存 `rollbackSchemaAlias` を再利用）
- 新規 `SchemaDiffBulkRollbackModal.tsx` / `useSchemaDiffBulkRollbackSelection.ts`
- 既存 single rollback / undo 経路と bulk resolve 経路を維持し回帰なし
- spec 文書更新（`docs/00-getting-started-manual/specs/11-admin-management.md`）
- spec test 追加（modal component / hook / api / panel regression）
- Phase 11 evidence: bulk rollback select / confirm modal / partial failure / all-success の desktop 1280 / mobile 375 screenshot

### 含まないもの

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| 単体 rollback / undo 本体 | Issue #778 で実装完了済み | `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/` |
| 集計再実行（recompute trigger） | followup-005 として独立分離済み | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-005-schema-alias-recompute-trigger.md` |
| rollback notification | followup-007 として独立分離済み | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-007-schema-alias-rollback-notification.md` |
| batch parent-child audit log 構造 | D1 schema migration + API route 変更を要し、本タスク不変条件「API/D1 変更なし」と衝突する独立した DB 設計スコープ。per-alias 記録で AC を充足するため初期実装には不要 | （将来 audit 可視化の必要が出た時点で別 Issue 化。現時点では未起票でよい — per-alias 記録で追跡可能なため gap ではない） |

> **CONST_007 注記**: 上記「含まないもの」のうち単体 rollback / recompute / notification は **既に独立 Issue / unassigned-task として分離済み**であり、本タスクの「分量先送り」ではない。batch parent-child audit は技術的に API/D1 変更が必須で本タスクの client-only スコープと別関心のため除外しているが、per-alias audit で AC を満たすため機能 gap は生じない。

## 不変条件

1. 既存 API endpoint surface のみ使用（`POST /admin/schema/aliases/:aliasId/rollback` を per-alias で fan-out 呼び出し、新 endpoint は追加しない）
2. D1 schema / API route は変更しない
3. design token は OKLch のみ（CLAUDE.md 不変条件・`verify-design-tokens` gate green / HEX 直書き禁止）
4. env access は `getEnv()` / `getPublicEnv()` 経由
5. test file は `*.spec.tsx` / `*.spec.ts` 固定（`*.test.*` 禁止 / CLAUDE.md 不変条件8）
6. 既存 `rollbackSchemaAlias` / `RollbackApiError` / single rollback UI / bulk resolve UI の contract は破壊禁止（bulk rollback path は新規 helper / 新規 component で並走）
7. D1 直接アクセス禁止（`apps/web` から `apps/api` 経由のみ）
8. admin UI の form input は `FormField` 経由を標準とし、新規 `<input>` を直接増やさない（checkbox は selection control のため例外、`aria-label` 必須）

## 参照リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/837
- 元 unassigned-task spec: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`
- 親 workflow（single rollback）: `docs/30-workflows/completed-tasks/issue-778-schema-alias-rollback-undo/`
- 構造テンプレート（bulk resolve）: `docs/30-workflows/completed-tasks/issue-776-schema-alias-bulk-resolve/`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`（HistoryPane / RollbackConfirmModal / UndoToast / bulkMode）
- `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx`（modal 構造の参照元）
- `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts`（hook 構造の参照元）
- `apps/web/src/lib/admin/api.ts`（`rollbackSchemaAlias` / `RollbackApiError` / `postSchemaAliasBulk` / `runWithConcurrency`）
- `apps/api/src/routes/admin/schema.ts`（`POST /schema/aliases/:aliasId/rollback`）
- `apps/api/src/workflows/schemaAliasRollback.ts`（single rollback workflow）
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
