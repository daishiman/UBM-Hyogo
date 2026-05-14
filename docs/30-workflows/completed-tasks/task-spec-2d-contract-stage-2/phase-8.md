# Phase 8: リファクタリング

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 8 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 本 phase で行うこと

| # | 項目 | 内容 |
|---|------|------|
| 1 | import 並び順整理 | `@ubm-hyogo/shared` → relative の順に固定 |
| 2 | fixture 変数命名統一 | `xxxItem` / `xxxRequestBody` / `xxxResponseBody` 命名規約 |
| 3 | `as const` の付与漏れ確認 | type-level 抽出が機能するために必須 |
| 4 | describe ラベルの統一 | `${METHOD} ${path}` を describe label として固定 |

---

## 2. 本 phase で行わないこと（明示）

| # | 項目 | 理由 |
|---|------|------|
| 1 | fixture inline → 別ファイル化（`fixtures/admin-stage-2.ts`） | **Stage 2 範囲では行わない**。正本ソース §3 / §4 で「2d test 内 inline、別ファイル化は Phase 8 リファクタの責務外」と確定済 |
| 2 | `DeleteBodyZ` の `packages/shared` 昇格 | **別 PR の責務**。不変条件 #6 |
| 3 | 既存 route の internal logic 変更 | Stage 2 contract 検証のスコープ外 |
| 4 | 2a/2b/2c spec の fixture 同期 | 各 sub-task の責務（本 task の Phase 12 でドキュメント側に注記するのみ） |

---

## 3. 検証

| # | command | 期待 |
|---|---------|------|
| 1 | `pnpm --filter @ubm-hyogo/api test contract-stage-2` | 7 describe pass、fail 0 |
| 2 | `pnpm lint apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | exit 0 |
| 3 | `wc -l apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 200-260 範囲内 |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| phase role | minimal refactor |

## 目的

Green 後に import order、fixture naming、`as const`、describe label を整え、fixture 別ファイル化や shared 昇格へ広げない。

## 実行タスク

1. import order を固定する。
2. fixture 変数名を `xxxItem` / `xxxRequestBody` / `xxxResponseBody` に揃える。
3. `as const` と describe label を確認する。
4. スコープ外 refactor を行わないことを確認する。

## 参照資料

- `phase-2.md`
- `phase-5.md`
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`

## 成果物

- refactor checklist
- scope guard
- post-refactor test evidence

## 完了条件

- [x] import / naming / `as const` / describe label が統一されている
- [x] fixture 別ファイル化を行っていない
- [x] shared 昇格を行っていない
- [x] タスク100%実行確認: Phase 8 の実行タスクをすべて完了してから Phase 9 へ進む

## 統合テスト連携

Refactor 後も focused Vitest、typecheck、lint を再実行し、Phase 11 evidence に最終結果だけを保存する。
