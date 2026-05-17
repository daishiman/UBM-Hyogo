# Phase 2 — 設計 実行結果

## 判定

completed。

## 設計

`apps/api/src/services/aliasRecommendation.ts` に `normalizeLabelForCompare(s: string): string` を追加し、`recommendAliases` の Levenshtein 入力だけを正規化する。

```ts
s.normalize("NFKC").trim().replace(/\s+/g, " ")
```

section / position の加点、stableKey dedupe、topN 制限は既存挙動を維持する。

## 変更対象

- `apps/api/src/services/aliasRecommendation.ts`
- `apps/api/src/services/aliasRecommendation.spec.ts`
- 正本仕様と workflow evidence
