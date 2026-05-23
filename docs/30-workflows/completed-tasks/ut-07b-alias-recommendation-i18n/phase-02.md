# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 名称 | 設計 |
| 既存コンポーネント再利用 | あり（`levenshtein` / `recommendAliases` を温存し helper のみ追加） |

## 目的

Phase 1 の機能要件を満たす最小設計を確定する。helper の API、`recommendAliases` への組み込みポイント、test fixture 構造、validation path を固定する。

## 実行タスク

1. helper API（`export function normalizeLabelForCompare(s: string): string`）を確定する
2. 実装スケッチ `s.normalize("NFKC").trim().replace(/\s+/g, " ")` を採用する
3. `recommendAliases` 内 `levenshtein` 呼び出しを両辺 normalize に差し替える 1 行差分を確定する
4. section / position 加算スコア（+10 / +5）の不変条件を明示する
5. test fixture 4 ケース（i18n-1〜i18n-4）の入出力を設計する
6. validation path（unit / typecheck / lint）を列挙する
7. 既存コンポーネント再利用判定を記録する

## 変更対象ファイル

| パス | 変更種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/services/aliasRecommendation.ts` | 編集 | helper 追加 + `levenshtein` 呼び出し 1 行差し替え |
| `apps/api/src/services/aliasRecommendation.spec.ts` | 編集 | 多言語 fixture 4 ケース追加 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集（Phase 12 で同期） | `recommendedStableKeys` の比較前処理を 1 行追記（shape 不変） |

## helper API 設計

```ts
export function normalizeLabelForCompare(s: string): string {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ");
}
```

| 入力 | 出力 |
| --- | --- |
| `"Full　name"` | `"Full name"` |
| `"  email  address  "` | `"email address"` |
| `""` | `""` |

## 適用ポイント

```ts
// before
-levenshtein(diff.label, e.label)
// after
-levenshtein(normalizeLabelForCompare(diff.label), normalizeLabelForCompare(e.label))
```

## test fixture 4 ケース

| ID | 入力 | existing | 期待 |
| --- | --- | --- | --- |
| i18n-1 | `"氏名"` | `"氏名"` を含む | 当該 stableKey が `r[0]` |
| i18n-2 | `"Phone　number"` (U+3000) | `"Phone number"` | 当該 stableKey が `r[0]` |
| i18n-3 | `" Full   name "` | `"Full name"` | 当該 stableKey が `r[0]` |
| i18n-4 | `"電話番号"` | `"氏名"` / `"メール"` / `"電話番号"` | `r[0]` が `"電話番号"`、誤一致なし |

## 参照資料

- `apps/api/src/services/aliasRecommendation.ts:1-74`
- Phase 1 出力 `outputs/phase-01/main.md`
- MDN `String.prototype.normalize` リファレンス

## 統合テスト連携

- Phase 4 の test 設計で「両辺 normalize 適用」「shape 不変」を validation 観点として渡す
- `GET /admin/schema/diff` の API 統合 test は response shape 不変のため新規追加なし

## 成果物

`outputs/phase-02/main.md` に helper API / 1 行差分 / fixture 4 ケース / 再利用判定を記録。

## 完了条件

- [ ] helper シグネチャ・実装スケッチが固定されている
- [ ] 適用ポイントが 1 行差分として明記されている
- [ ] fixture 4 ケース表が記載されている
- [ ] 既存コンポーネント再利用判定が記録されている
- [ ] `outputs/phase-02/main.md` が存在する
