# Phase 1: 分析・スコープ確定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 種別 | 分析 |
| 入力 | 親 spec parallel-09、Issue #749 本文、`apps/web` 現状コード |
| 出力 | `outputs/phase-1/spec-extraction-map.md`、AC-1〜AC-11、19×6 baseline matrix |

## 目的

- parallel-09 で配置済みの 6 primitive 群と 19 routes の対応マトリクスを baseline 計測する
- 受入条件（AC-1〜AC-11）を index.md と本 Phase に列挙する
- spec ↔ current code anchor を 1:1 で固定する

## 実行タスク

1. `spec-extraction-map.md` を作成し、正本仕様 ↔ 実コード anchor を表にする（完了）
2. `grep -rn '<input' apps/web/src/components/admin/ apps/web/src/components/public/DensityToggle.client.tsx` で baseline 残存数を計測（baseline: 15 件）
3. `grep -rln 'useAdminMutation' apps/web/src` で baseline 採用ファイル数を計測（baseline: 1 panel + lib + features hook）
4. 19 routes × 6 primitive の baseline matrix を index.md に固定（完了）
5. AC-1〜AC-11 を index.md に列挙（完了）

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`
- `apps/web/src/components/ui/{FormField,EmptyState,Pagination,Icon}.tsx`
- `apps/web/src/components/admin/Breadcrumb.tsx`
- `apps/web/src/lib/useAdminMutation.ts` / `apps/web/src/features/admin/hooks/useAdminMutation.ts`

## 実行手順

```bash
# baseline grep（記録目的・read-only）
grep -rn '<input' apps/web/src/components/admin/ apps/web/src/components/public/DensityToggle.client.tsx
grep -rln 'useAdminMutation' apps/web/src
grep -rln "from \"@/components/admin/Breadcrumb\"" apps/web/app
grep -rln "from \"@/components/ui/EmptyState\"" apps/web/app apps/web/src
grep -rln "from \"@/components/ui/Pagination\"" apps/web/app apps/web/src
```

## 統合テスト連携

なし（分析 Phase）

## 多角的チェック観点

- baseline matrix の `X` セルが Phase 4 の実装対象と 1:1 で対応するか
- `Icon` 既採用前提が真であるか（grep で確認）
- 親 spec parallel-09 の primitive 群定義と実コードの export が一致するか

## サブタスク管理

| ID | 内容 | 状態 |
| --- | --- | --- |
| P1-T1 | baseline grep 3 種記録 | ready |
| P1-T2 | AC-1〜AC-11 確定 | done |
| P1-T3 | 19×6 matrix 固定 | done |

## 成果物

- `outputs/phase-1/spec-extraction-map.md`
- `index.md` 内の baseline matrix + AC 列挙

## 完了条件

- [ ] baseline 計測値（`<input>` 15 / useAdminMutation 1 panel / Breadcrumb 0 admin route / EmptyState 0 / Pagination 0）が記録されている
- [x] AC-1〜AC-11 が index.md に列挙されている
- [x] spec-extraction-map.md が存在する
- [ ] coverage AC（既定 80%）が完了条件に含まれる → Phase 6 完了条件側で記載

## タスク100%実行確認【必須】

- [x] Phase 1 outputs が `outputs/phase-1/` 配下に存在
- [x] AC 列挙が index.md にある
- [x] Phase 4 NO-GO 条件が spec-extraction-map.md に明記

## 次Phase

→ Phase 2（設計：adapter / 命名規約 / grep gate 設計）
