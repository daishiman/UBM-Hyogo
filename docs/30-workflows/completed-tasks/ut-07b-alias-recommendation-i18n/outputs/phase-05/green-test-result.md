# Phase 5 — GREEN 実装結果

## 判定

completed。

## 実装内容

- `apps/api/src/services/aliasRecommendation.ts` に `normalizeLabelForCompare` を追加。
- `recommendAliases` で diff label と candidate label を同じ helper で前処理してから `levenshtein` に渡す。
- section / position 加点、stableKey dedupe、topN 制限は変更なし。

## GREEN 証跡

Phase 11 実行で `apps/api/src/services/aliasRecommendation.spec.ts` 20 tests PASS を確認した。
