# issue-776-schema-alias-bulk-resolve — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `issue-776-schema-alias-bulk-resolve` |
| 由来 Issue | [#776 serial-05-step-03 followup-002: schema alias bulk resolve UI](https://github.com/daishiman/UBM-Hyogo/issues/776) |
| Issue state | `CLOSED`（実装未完了のまま close されたため、本ワークフローで実装を遂行する） |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `feature-extension`（既存 single-resolve UI に bulk mode を追加） |
| 親 workflow | `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/` |
| 元 unassigned-task spec | `docs/30-workflows/unassigned-task/serial-05-step-03-followup-002-schema-alias-bulk-resolve.md` |
| 優先度 | 中 |
| 見積もり規模 | 中 |
| PR base | `dev` |

## 実装区分

**[実装区分: 実装仕様書]**

判定根拠:
- 対象タスクは `SchemaDiffPanel.tsx` への bulk selection UI 追加、`apps/web/src/lib/admin/api.ts` への bulk helper 追加（および必要なら `apps/api/src/routes/admin/schema.ts` への bulk endpoint 追加）を含む。
- 「動作させる」性質のタスクであり、ドキュメント変更だけでは Issue #776 の目的（admin 運用負荷の軽減）は達成不能。
- コード調査の結果、現行コードベースに `bulk` / `batch` / `selected` / `checkbox` の実装は **一切存在しない**（`SchemaDiffPanel.tsx` 261行、`api.ts` 159行、`apps/api/src/routes/admin/schema.ts` 380行 を grep 確認済）。Issue は CLOSED だが機能としては未実装。
- 元 unassigned-task spec が CONST_005 必須項目（変更対象ファイル・関数シグネチャ・テスト・実行コマンド・DoD）の素材を保持しているため、実装仕様書として展開する。

## Issue #776 現状調査サマリ

| 項目 | 状態 |
| --- | --- |
| Issue 状態 | CLOSED（2026-05-18 @daishiman、state_reason: null） |
| `SchemaDiffPanel.tsx` の bulk 実装 | 実装済み（bulk mode / checkbox / select-all / 50件上限 alert / modal mount） |
| `apps/web/src/lib/admin/api.ts` の bulk helper | 実装済み（`postSchemaAliasBulk` bounded fan-out / row result callback / network 分類） |
| `apps/api/src/routes/admin/schema.ts` の batch endpoint | **未実装**（`POST /schema/aliases` のみ、`:batch` なし） |
| 親 workflow Phase 12 unassigned-task §3 「alias bulk resolve」 | consumed |
| 結論 | Issue は CLOSED だが機能未実装だったため、本ワークフローで local implementation + evidence capture まで遂行済み |

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
| 11 | 手動テスト/Evidence | `phase-11-manual-test.md` |
| 12 | 実装ガイド | `phase-12-documentation.md` |
| 13 | PR 作成 | `phase-13-pr-creation.md` |

## スコープ（CONST_007: 1 サイクル完了原則）

本ワークフローは **後続の `03.実装.md` 1 サイクル内で完了**できる粒度に設計されている。先送り（バックログ送り）は行わない。

### 含むもの

- `SchemaDiffPanel` への bulk selection UI（行 checkbox / select-all per category / 選択件数バッジ）
- batch confirm modal（選択 diff 一覧 + 個別 stableKey 入力 + recommendation auto-fill）
- bulk submit progress UI と partial failure 表示
- `apps/web/src/lib/admin/api.ts` への `postSchemaAliasBulk` helper（client-side bounded fan-out 実装、row-level progress + aggregate 集計）
- 既存 `postSchemaAlias` を維持し回帰なし
- spec 文書更新（`docs/00-getting-started-manual/specs/11-admin-management.md`）
- spec test 追加（`SchemaDiffPanel.component.spec.tsx` / `api.spec.ts`）
- Phase 11 evidence: bulk select / batch modal / partial failure の desktop 1280 / mobile 375 screenshot

### 含まないもの（独立 followup として既に分離済）

- alias rollback / undo（followup-004 として別 Issue）
- diff history view（followup-003 として別 Issue）
- admin notification（別 Issue）

### bulk endpoint 新設の扱い

Phase 2 設計判断として、**初期実装は API 変更なしの client-side bounded fan-out 経路**で実装する（API 契約変更を回避し、1 サイクル完了原則 CONST_007 を優先）。N HTTP 往復のコストは Phase 9 計測で評価し、bottleneck と判明した場合のみ別 followup として bulk endpoint を切り出す。

## 不変条件

1. 既存 API endpoint surface のみ使用（`POST /admin/schema/aliases` を loop 呼び出し、新 endpoint は追加しない）
2. design token は OKLch のみ（CLAUDE.md 不変条件3 / `verify-design-tokens` gate green）
3. env access は `getEnv()` / `getPublicEnv()` 経由
4. test file は `*.spec.tsx` / `*.spec.ts` 固定（`*.test.*` 禁止 / CLAUDE.md 不変条件8）
5. `useAdminMutation` / `postSchemaAlias` 既存 contract は破壊禁止（bulk path は新規 helper で並走）
6. D1 直接アクセス禁止（`apps/web` から `apps/api` 経由のみ）

## 参照リンク

- Issue: https://github.com/daishiman/UBM-Hyogo/issues/776
- 元 unassigned-task spec: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-002-schema-alias-bulk-resolve.md`
- 親 workflow: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`（`postSchemaAlias`, `SchemaAliasApplyBody`）
- `apps/api/src/routes/admin/schema.ts`（`POST /schema/aliases`）
- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`
