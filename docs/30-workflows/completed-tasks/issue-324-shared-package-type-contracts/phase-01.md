# Phase 01: 要件定義

[実装区分: 実装仕様書]

## 目的

Issue #324 (UT-08A-05) の AC を整理し、既存 `packages/shared/src/types/ids.spec.ts` でカバー済の 2 件を除いた未カバー 5 件を機能要件として確定する。

## 入力

- GitHub Issue #324（CLOSED / COMPLETED 表記だが AC 未充足）
- `docs/30-workflows/completed-tasks/UT-08A-05-shared-package-type-test.md`（元仕様書 / completed trace）
- `packages/shared/src/types/ids.spec.ts`（既存カバレッジ）
- `packages/shared/src/branded/index.ts`（brand 型正本）
- `packages/shared/src/zod/viewmodel.ts`（view-model schema 正本）
- `packages/shared/src/schemas/admin/`（admin schema 群）

## 既存カバレッジ（実装不要）

| ID | AC | 既存テストファイル |
| --- | --- | --- |
| EX-1 | plain string → branded への代入禁止（7 brand 全種） | `packages/shared/src/types/ids.spec.ts` L23-43 |
| EX-2 | MemberId ↔ ResponseId の相互排他 | `packages/shared/src/types/ids.spec.ts` L45-48 |

## 機能要件（本タスクで実装）

| AC | 内容 | 検証手段 |
| --- | --- | --- |
| AC-1 | `ResponseId` と `ResponseEmail` の相互排他型エラー | `expectTypeOf<X>().not.toMatchTypeOf<Y>()` 双方向 |
| AC-2 | view-model output の必須 field 欠落の型エラー固定 | `@ts-expect-error` + 不完全 object literal |
| AC-3 | zod parse 入力型と推論型の一致 (`z.input` ≡ `z.output` ≡ `z.infer`) | `expectTypeOf<z.input<typeof S>>().toEqualTypeOf<z.output<typeof S>>()` |
| AC-4 | public schema と admin schema の混入防止（型レベル） | `expectTypeOf<PublicMemberListView>().not.toMatchTypeOf<AdminMemberListView>()` 等 |
| AC-5 | CI 専用 type-test suite の独立性確保（apps/api 442 件と非干渉） | `packages/shared` filter 単独実行で完結すること |

## 非機能要件

- ファイル名は `*.spec.ts` のみ（不変条件 #8）。`*.test-d.ts` 禁止。
- vitest `expectTypeOf` を採用し、`tsd` / `vitest typecheck mode` は導入しない。
- 既存 `pnpm typecheck` パイプラインで `.spec.ts` 内の `@ts-expect-error` がそのまま検査対象となる。

## 出力

- 本 phase 仕様書のみ（コード変更なし）。
- AC 5 件の確定リスト。

## 完了条件 (DoD)

- [ ] AC-1..AC-5 の判定基準が表で確定している。
- [ ] 既存カバレッジ 2 件と本タスク 5 件の境界が明示されている。
- [ ] 採用ツール選定（vitest `expectTypeOf` のみ）の根拠が記録されている。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| AC 解釈ぶれ（"type-contracts.test-d.ts" の文字列） | 不変条件 #8 によりファイル名は `__tests__/type-contracts.spec.ts` に読み替え（index.md 参照） |
| 既存カバレッジ重複 | 本 phase で EX-1 / EX-2 を明示し本ファイルでは再実装しない |
