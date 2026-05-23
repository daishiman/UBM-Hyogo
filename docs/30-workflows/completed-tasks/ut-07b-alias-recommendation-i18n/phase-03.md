# Phase 3: 設計レビューゲート

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 名称 | 設計レビュー |
| ゲート種別 | Phase 4 着手前判定 |

## 目的

Phase 1-2 の設計に対し、Phase 4 着手前のゲート判定を行う。設計に不備があればここで差し戻す。

## 実行タスク

1. 責務分離（pure function / 副作用なし）を確認する
2. 過剰一致防止（NFKC 以外の変換が含まれない）を確認する
3. 後方互換（response shape / 既存 fixture 不変）を確認する
4. 命名一貫性（camelCase helper / `*.spec.ts`）を確認する
5. CLAUDE.md 不変条件 #1 / #8 / D1 boundary 違反がないことを確認する
6. NON_VISUAL 宣言と代替証跡定義の一致を確認する
7. PASS / FAIL を判定する

## レビュー観点

| 観点 | チェック | 判定基準 |
| --- | --- | --- |
| 責務分離 | helper が pure function | string 入出力のみ |
| 過剰一致防止 | NFKC 以外の変換なし | 括弧除去 / ステミング / 大小文字統一なし |
| 後方互換 | response shape / 既存 fixture 不変 | 既存 5 ケース温存 |
| 命名一貫性 | camelCase + `*.spec.ts` | OK |
| 不変条件 | DB / schema / endpoint 不変 | OK |
| エビデンス分類 | NON_VISUAL 宣言一致 | OK |

## 判定

- **PASS**: Phase 4 へ進む
- **FAIL（条件付き）**: negative case が設計に含まれていない / helper export が public でない
- **FAIL（再設計）**: response shape 変更や DB schema 変更が混入

## 参照資料

- `outputs/phase-01/main.md`
- `outputs/phase-02/main.md`
- CLAUDE.md 不変条件セクション

## 統合テスト連携

- 本 Phase は test 実行なし
- 判定結果（PASS）を Phase 4 の test 作成着手の前提条件として渡す

## 成果物

`outputs/phase-03/design-review-result.md` に観点ごとの判定結果と最終 PASS/FAIL を記録。

## 完了条件

- [ ] 全レビュー観点が PASS と記録されている
- [ ] Phase 4 着手の根拠が明文化されている
- [ ] `outputs/phase-03/design-review-result.md` が存在する
