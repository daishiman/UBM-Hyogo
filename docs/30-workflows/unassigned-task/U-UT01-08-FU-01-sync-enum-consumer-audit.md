# U-UT01-08-FU-01: sync enum consumer audit

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-08-FU-01 |
| タスク名 | sync enum consumer audit |
| 親タスク | U-UT01-08 sync enum canonicalization |
| 優先度 | MEDIUM |
| 状態 | unassigned |
| 起票日 | 2026-04-30 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

U-UT01-08 で確定した sync enum canonical set を、UI / monitoring / aggregation / shared view model の consumer 側が安全に受け取れるか監査する。実 migration や writer rewrite は UT-04 / UT-09 / U-UT01-10 が担い、本タスクは consumer assumption の検出と必要最小限の追従実装を扱う。

## スコープ

### 含む

- `running` / `success` / `admin` を前提にする admin UI、monitoring aggregation、audit query、shared view model の grep 監査
- `packages/shared/src/types/viewmodel/index.ts` の `schemaSync` / `responseSync` が generic UI state か sync enum consumer かの分類
- `apps/api/src/sync/scheduled.ts` などの aggregation query が canonical `completed` を参照できるかの確認
- 必要な場合の consumer label / query / test 更新

### 含まない

- D1 migration 作成・適用（UT-04）
- sync writer literal rewrite（UT-09）
- shared canonical type / Zod schema 新規実装（U-UT01-10）

## 受入条件

- [ ] `rg -n "running|success|admin" apps packages` の sync consumer 該当箇所が分類済みである
- [ ] UI 表示値、monitoring 集計値、audit query のいずれも canonical migration 後に silent drift しない
- [ ] generic UI state と sync enum consumer を混同しない分類表が成果物に存在する
- [ ] UT-04 / UT-09 / U-UT01-10 との責務境界が明記されている

## 起票理由

U-UT01-08 の docs-only close-out で、`packages/shared/src/types/viewmodel/index.ts` や monitoring/audit query に残る旧値 consumer assumption が検出された。範囲が API / Web / shared / observability にまたがるため、同タスク内で実装せず follow-up として分離する。
