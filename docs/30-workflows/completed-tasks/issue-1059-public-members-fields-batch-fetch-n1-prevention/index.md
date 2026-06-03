# issue-1059: 公開 members list の fields 一括取得 N+1 防止

## 概要

`apps/api/src/use-cases/public/list-public-members.ts` に残る **fields N+1**（member 毎に
`listFieldsByResponseId` をループ await）を、`response_id IN (...)` の 1 batch query へ置換して
解消する。tags 側（`expand=tags`）は issue-224 で `listTagsByMemberIds` により batch 化済みで、
本タスクは同じ use-case に残った **summary fields**（氏名/ニックネーム/職業/居住地/UBMゾーン/
会員種別）の N+1 を対称的に解消する積み残しタスク。

- GitHub Issue: **#1059**（state: **OPEN** / ユーザー指示によりタスク仕様書作成中も状態は変更しない）
- 発見元: issue #224 Phase 12 unassigned-task-detection U-2
- 由来仕様書: `docs/30-workflows/completed-tasks/issue-224-followup-001-public-members-fields-batch-fetch-n1-prevention.md`
- 実装区分: **実装仕様書**（コード変更を伴う / CONST_004 デフォルト）
- タスク種別: implementation / visualEvidence: **NON_VISUAL** / implementation_mode: **new**
- 優先度: 低 / 規模: 小

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1059-public-members-fields-batch-fetch-n1-prevention |
| タスク種別 | implementation / NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| visualEvidence | NON_VISUAL |
| 親 issue | #1059（#224 follow-up-001） |
| 対象ファイル | `apps/api/src/repository/responseFields.ts`（追加） / `apps/api/src/use-cases/public/list-public-members.ts`（編集） |
| テスト | `apps/api/src/repository/__tests__/responseFields.repository.spec.ts`（拡充） / `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（回帰追加） |
| 不変条件 | #5（D1 アクセスは apps/api に閉じる）/ view converter fail-close #2/#3/#11 |

## 受入条件（AC）

- **AC-1**: `responseFields.ts` に `listFieldsByResponseIds`（`response_id IN (...)` の 1 query）を追加する。
- **AC-2**: `list-public-members.ts` の per-member fields ループを廃し、`response_id`(=`current_response_id`) でキー化した `Map` に groupBy する。
- **AC-3**: fields クエリ数が member 件数 N に依存しない（**≦ 1 回**）ことを検証する回帰テストを追加する。
- **AC-4**: view 出力 `PublicMemberListResponse` の **形状・値は不変**（既存 use-case テストが緑のまま）。
- **AC-5**: tags 側ロジック・D1 schema・endpoint・Google Form 仕様・`apps/web` を一切変更しない（スコープ外厳守）。
- **AC-6**: `mise exec -- pnpm typecheck` / `lint` / 対象 vitest が全て緑。

## Phase 構成

| Phase | 名称 | 状態 | 仕様書 |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | [phase-01.md](phase-01.md) |
| 2 | 設計 | completed | [phase-02.md](phase-02.md) |
| 3 | 設計レビュー | completed | [phase-03.md](phase-03.md) |
| 4 | テスト作成 | completed | phase-04.md |
| 5 | 実装 | completed | phase-05.md |
| 6 | テスト拡充 | completed | phase-06.md |
| 7 | カバレッジ確認 | completed | phase-07.md |
| 8 | リファクタリング | completed | phase-08.md |
| 9 | 品質保証 | completed | phase-09.md |
| 10 | 最終レビュー | completed | phase-10.md |
| 11 | 手動テスト（NON_VISUAL） | completed | phase-11.md |
| 12 | ドキュメント更新 | completed | phase-12.md |
| 13 | PR作成（user-gated） | spec_created | phase-13.md |

## スコープ外（未タスク化せず本サイクル外と確定する範囲）

- tags 側ロジックの変更（issue-224 で完了済み）
- D1 schema 変更 / 新 endpoint / Google Form 仕様変更 / `apps/web` 変更（不変条件 #5）
- pagination・filter・sort ロジックの変更（本タスクは fetch 経路の N+1 のみ対象）

> 本タスクは単一責務・小規模で、後続の実装プロンプト（03.実装.md）の **1 サイクル内で完了可能**
> なスコープに収まる（CONST_007）。分割・先送りは行わない。
