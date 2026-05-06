# Phase 8: リファクタリング — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 8 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |

## 目的

`/public/form-preview` 503 root cause の修復後コードを CONST_005 観点で読み直し、Before/After/理由のテーブルで明示してから DRY/可読性向上の最小差分のみ適用する。API 仕様（response shape）と他 public route には触れない。

## 実行タスク

1. Phase 5-7 で確定した実装と既存 helper (`apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts`) の重複を確認する。完了条件: 重複候補を Before/After 表で特定する。
2. 503 早期検知の structured logging 追加要否を判定する。完了条件: 追加する場合の log shape と追加しない場合の理由が記録される。
3. リファクタ範囲を `apps/api/src/use-cases/public/get-form-preview.ts` と test helper に閉じる。完了条件: スコープ外（API 仕様変更・他 public route）に手を入れていないことを確認。

## 参照資料

- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`
- `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts`
- `apps/api/src/routes/public/form-preview.ts`
- `packages/shared/src/errors.ts`
- `docs/30-workflows/task-05a-form-preview-503-001/outputs/phase-02/main.md`

## 実行手順

- 対象 directory: `docs/30-workflows/task-05a-form-preview-503-001/`
- 本仕様書作成ではアプリケーションコードへの編集、deploy、commit、push、PR 作成を行わない。
- 実装サイクルでは Phase 5 で記述した変更点に Before/After 表を後付けし、純粋な構造改善のみ commit する。

## 統合テスト連携

- 上流: Phase 7 カバレッジ確認、05a public form-preview implementation
- 下流: Phase 9 品質保証（typecheck/lint/test 三点 gate）

## 多角的チェック観点

- 不変条件 #1: schema をコードに固定しない（schema_versions 動的解決を維持）
- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる
- 不変条件 #14: schema 集約点 `schema_versions` × `schema_questions` を破壊しない
- Feedback RT-03: 対象/Before/After/理由のテーブル形式必須

## リファクタ候補（Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `get-form-preview.ts` の null 分岐 | `if (!latest) throw new ApiError({ code: "UBM-5500" })` のみ | 同分岐に `console.warn` ではなく構造化 log（`logger.warn({ event: "schema_versions_missing" })`）を 1 行追加（既存 logger 利用可能な場合のみ） | 503 の早期検知。staging tail で root cause を即時識別可能にする |
| test helper | 各テストで D1 mock を直接生成 | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` に `buildEmptySchemaD1()` / `buildSchemaD1WithVersion()` を追加して再利用 | DRY、AC-4 で追加するケースの可読性向上 |
| `routes/public/form-preview.ts` | 変更なし | 変更なし（error mapping は `packages/shared/src/errors.ts` に閉じる） | スコープ外。API 仕様の不変条件遵守 |

> logger が apps/api に未導入であれば本リファクタは **見送り** とし、Before のままにする（過剰実装回避）。判断結果は outputs/phase-08/main.md に記録する。

## サブタスク管理

- [ ] Before/After 表が確定している
- [ ] structured logging 追加可否が記録されている
- [ ] スコープ外（API 仕様・他 route）に手を入れていない
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- リファクタ対象が Before/After/理由のテーブル形式で記録される
- API 仕様 / response shape 変更がない
- helper 再利用または structured logging のいずれか（または両方見送り）の判断根拠が明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] スコープ外（他 public route、API 仕様）に踏み込んでいない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、リファクタ後の対象ファイル一覧と検証コマンド (`pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test`) を渡す。
