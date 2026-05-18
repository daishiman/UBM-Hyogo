# Phase 12 — implementation guide

## Part 1: 中学生レベル

フォームの質問名は、見た目がほとんど同じでもコンピューターには違う文字として見えることがある。たとえば全角の `ＩＤ` と半角の `ID`、余分な空白が入った名前など。

今回の変更では、候補を比べる前に文字の形と空白をそろえる。そろえてから距離を比べるので、管理者に出す stableKey 候補の順番が表記揺れでぶれにくくなる。

ただし、意味まで推測するわけではない。大小文字、ひらがなとカタカナ、記号を消す処理は誤一致を増やすため入れていない。

## Part 2: 技術者向け

`apps/api/src/services/aliasRecommendation.ts` に `normalizeLabelForCompare(s: string): string` を追加した。

```ts
return s.normalize("NFKC").trim().replace(/\s+/g, " ");
```

`recommendAliases` は diff label を一度 normalize し、candidate label も同じ helper で normalize してから `levenshtein` に渡す。sectionKey 一致加点、position 一致加点、stableKey dedupe、topN は不変。

## 検証

- `aliasRecommendation.spec.ts`: 20 tests PASS。
- `schema.contract.spec.ts`: 16 tests PASS（collision `409 stable_key_collision` contract）。
- `apps/api` suite: 48 files / 300 tests PASS。
- 初回 esbuild mismatch は `ESBUILD_BINARY_PATH` 明示で環境復旧し、最終 exit code 0。

## Phase 11 NON_VISUAL evidence

UI / DOM / CSS / screenshot 対象 route は変更していないため、`outputs/phase-11/screenshots/` は作成しない。Phase 11 の代替証跡は次の tracked files とする。

| File | Role |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 判定サマリ |
| `outputs/phase-11/manual-test-result.md` | focused / wider regression 結果 |
| `outputs/phase-11/manual-smoke-log.md` | 実行コマンド、exit code、PASS summary |
| `outputs/phase-11/link-checklist.md` | workflow 内リンク確認 |
| `outputs/phase-11/ui-sanity-visual-review.md` | screenshot 不要理由 |

## 既知制限

大小文字統一、カタカナ/ひらがな変換、記号除去、辞書/embedding ベース recommendation は対象外。response shape / DB schema / UI は変更しない。
