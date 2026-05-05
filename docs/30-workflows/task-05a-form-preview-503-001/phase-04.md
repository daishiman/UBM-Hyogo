# Phase 4: テスト作成 (RED) — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 4 / 13 |
| wave | 05a-bugfix |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

`/public/form-preview` 503 root cause を unit/route 層から検出する RED テストを追加する。実装は Phase 5 で行う。

## 実行タスク

1. 既存テスト `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` の 3 ケースを把握する。完了条件: happy / null / D1 fail の 3 ケースが既存である事実を記録する。
2. TC-RED-01 / TC-RED-02 / TC-RED-03 を追加する。完了条件: `pnpm --filter @ubm-hyogo/api test get-form-preview` が RED (未実装/未配線で fail)。
3. route 層 `apps/api/src/routes/public/index.test.ts` への 503 mapping 観点追加要否を判定する。完了条件: 追加するか not-needed を outputs/phase-04/main.md に記録する。

## 参照資料

- `apps/api/src/use-cases/public/get-form-preview.ts`
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`
- `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts`
- `packages/shared/src/errors.ts`（UBM-5500 → 503 mapping）
- `docs/30-workflows/task-05a-form-preview-503-001/index.md`

## 実行手順

- 対象 directory: `docs/30-workflows/task-05a-form-preview-503-001/`
- 本仕様書作成ではアプリケーションコードの実装、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 の runbook に従う。

## 統合テスト連携

- 上流: 04a public API implementation, 08a-A public use-case coverage hardening
- 下流: Phase 5（GREEN 実装 + staging schema sync）, Phase 6（異常系拡充）, Phase 7（カバレッジ）

## 多角的チェック観点

- #1 schema 固定禁止（mock fixture を schema 集約構造で生成）
- #5 public boundary（auth 不要 endpoint）
- #14 schema 集約（fieldCount/sectionCount 整合）
- 未実装を RED と区別し PASS と扱わない

## サブタスク管理

- [ ] 既存テスト構造を確認する
- [ ] TC-RED-01〜03 のテスト名・assert・mock 構造を確定する
- [ ] route 層追加判定を outputs に記録する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- TC-RED-01 / TC-RED-02 / TC-RED-03 の名称・期待値・mock fixture が文章で再現可能なレベルで記録される
- 各テストの実行コマンドと RED 確認手順が記録される
- route 層追加可否の判定が「追加 / 不要」のいずれかで明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を実行していない
- [ ] outputs/phase-04/main.md にテスト追加内容が網羅されている

## 次 Phase への引き渡し

Phase 5 へ、追加すべきテストケース・期待 assert・mock fixture を渡す。
