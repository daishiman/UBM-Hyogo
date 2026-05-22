# Phase 11: 手動テスト（NON_VISUAL）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | 手動テスト |
| タスク種別 | implementation / NON_VISUAL |
| 視覚証跡 | 不要（screenshots 作成しない） |
| 代替証跡 | 自動 vitest 結果 + 既知制限リスト |

## 目的

サービス層 (`apps/api/src/services/aliasRecommendation.ts`) の pure function 改修であり、UI / API response shape / DOM render の変更がないため NON_VISUAL を宣言し、自動 vitest 結果を主証跡とする。

## NON_VISUAL 宣言（[WEEKGRD-03]）

| 項目 | 値 |
| --- | --- |
| 非視覚的理由 | サービス層 pure function 改修のみ。UI / API response shape / DOM render 変更なし |
| 代替証跡 | vitest 結果サマリ + 既知制限リスト |

> Phase 11 では実地操作（ブラウザ UI 操作）は要求しない（[Feedback BEFORE-QUIT-001]）。

## 実行タスク

1. NON_VISUAL 宣言を `outputs/phase-11/ui-sanity-visual-review.md` に記録する
2. `aliasRecommendation.spec.ts` を実行し全 20 ケース PASS を確認する
3. 実行記録（実行日時 / Node / pnpm / OS / describe ごとの PASS/FAIL）を `manual-test-result.md` に記録する
4. 既知制限（大小文字 / カタカナ↔ひらがな / 括弧除去 は対象外）を列挙する
5. `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` を作成する
6. `screenshots/` ディレクトリは作成しない

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

期待: 全 20 ケース PASS。

## 既知制限

- NFKC で吸収しない揺れ（大小文字 / カタカナ↔ひらがな / 括弧除去 / ステミング）は **意図的に対象外**
- `normalizeLabelForCompare` は副作用なし pure function。response shape / DB / endpoint は不変

## 参照資料

- `outputs/phase-04/red-test-result.md`
- `outputs/phase-05/green-test-result.md`
- `outputs/phase-06/expanded-test-result.md`
- `outputs/phase-10/final-review-result.md`

## 統合テスト連携

- 20 ケース PASS ログを Phase 12 implementation-guide の視覚証跡セクション代替として参照
- `/admin/schema/diff` の response shape 不変のため新規 E2E test 追加なし

## 成果物

- `outputs/phase-11/main.md`（Phase 11 サマリ）
- `outputs/phase-11/manual-test-result.md`（証跡ソース / 実施情報 / 仕様判断根拠 / 実行記録の 4 セクション）
- `outputs/phase-11/manual-smoke-log.md`（vitest 実行ログ）
- `outputs/phase-11/link-checklist.md`（workflow 内リンク確認結果）
- `outputs/phase-11/ui-sanity-visual-review.md`（NON_VISUAL 宣言）

## 完了条件

- [ ] 自動テスト 20 ケース PASS のログが記録されている
- [ ] NON_VISUAL 宣言と非該当理由が明記されている
- [ ] 既知制限が列挙されている
- [ ] `outputs/phase-11/` に main.md / manual-smoke-log.md / link-checklist.md が揃っている
- [ ] `screenshots/` ディレクトリが作成されていない
