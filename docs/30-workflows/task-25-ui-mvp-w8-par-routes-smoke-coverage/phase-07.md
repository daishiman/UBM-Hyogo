# Phase 7: カバレッジ確認（19 routes × 5 軸）

## 1. 対象範囲

本タスクは docs-only / NON_VISUAL のため、code coverage（line / branch）は **対象外**。
代わりに **matrix coverage**（19 routes × 5 軸 = 95 セル）の埋まり具合を測る。

## 2. coverage 目標

| 軸 | 目標 | 計算 |
|----|------|------|
| status | 19/19（100%） | 全 route に expected status / redirect を記載 |
| DOM | 19/19（100%） | 全 route に少なくとも 1 つの landmark or testid |
| token | 19/19（100%） | 全 route に「verify-design-tokens 委譲」または runtime 観測点 |
| a11y | 19/19（100%） | 全 route に axe profile（or `N/A + 理由`） |
| interaction | 18/19 以上（≥ 94.7%） | 共通 3 のうち `loading.tsx` は interaction `N/A` 許容 |
| visual baseline | 4/19（21%） | 4 baseline + 15 routes は `—` で完全列挙 |

## 3. 不足セルの扱い

- `N/A` を入れる場合は隣接の脚注で **理由 + future task 候補** を明記
- 純粋な空欄は禁止

## 4. measurement

```bash
# 95 セル中、N/A 含む記載数を数える（手動で目視 + 簡易 awk）
# 期待: 95 / 95
```
