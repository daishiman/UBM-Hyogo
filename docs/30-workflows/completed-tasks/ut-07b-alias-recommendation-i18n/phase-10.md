# Phase 10: 最終レビューゲート

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 名称 | 最終レビュー |
| ゲート種別 | Phase 11 着手前判定 |

## 目的

Phase 11 へ進める前の最終 acceptance / blocker 判定を行う。MINOR 指摘があれば Phase 12 で未タスク化する。

## 実行タスク

1. `normalizeLabelForCompare` の export を `grep` で確認する
2. `recommendAliases` 内 Levenshtein が normalized label 同士で呼ばれていることを `git diff` で確認する
3. 多言語 fixture 4 ケース（i18n-1〜i18n-4）の存在を確認する
4. 既存英語 fixture 5 ケースが regress していないことを確認する
5. response shape 不変（`apps/api/src/routes/admin/schema*` の diff が空）を確認する
6. Phase 5-9 各成果物に typecheck / lint / test PASS の記録があることを確認する
7. blocker 0 件・MINOR 指摘リストを生成する

## 判定マトリクス

| 受入条件 | 判定方法 | PASS/FAIL |
| --- | --- | --- |
| helper export | `grep -n "export function normalizeLabelForCompare" apps/api/src/services/aliasRecommendation.ts` | — |
| levenshtein normalize 両辺 | `git diff -- apps/api/src/services/aliasRecommendation.ts` | — |
| i18n fixture 4 ケース | spec ファイル grep | — |
| 既存 5 ケース regress なし | 既存 describe diff が無編集 | — |
| response shape 不変 | `git diff -- apps/api/src/routes/admin/schema*` が空 | — |
| typecheck / lint / test PASS | Phase 5-9 成果物 | — |

## blocker / MINOR 判定

- **blocker**: response shape 変更 / DB schema 変更 / 既存 fixture regress
- **MINOR**: JSDoc 表現 / helper 配置位置 / export 順序 → Phase 12 Task 4 で未タスク化候補

## 参照資料

- `outputs/phase-05/` 〜 `outputs/phase-09/`
- `apps/api/src/services/aliasRecommendation.ts`
- `apps/api/src/services/aliasRecommendation.spec.ts`

## 統合テスト連携

- blocker 0 件を Phase 11 手動テスト着手の前提条件として渡す
- MINOR 指摘は Phase 12 Task 4 「未タスク検出レポート」に転記される

## 成果物

`outputs/phase-10/final-review-result.md` に判定結果と MINOR 指摘リストを記録。

## 完了条件

- [ ] blocker 0 件
- [ ] MINOR 指摘は Phase 12 Task 4 へ転記する旨が記載されている
- [ ] `outputs/phase-10/final-review-result.md` が存在する
