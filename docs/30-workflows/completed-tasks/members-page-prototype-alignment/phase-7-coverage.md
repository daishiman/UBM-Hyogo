# Phase 7: カバレッジ

## 1. 対象範囲

| ファイル | 期待 line coverage |
|---|---|
| `DensityToggle.client.tsx` | ≥ 90%（新版は薄いラッパなので容易） |
| `MemberCard.tsx` | ≥ 85% |
| `MemberFilters.client.tsx` | ≥ 80%（既存ベース） |
| `MemberTable.tsx` | ≥ 75% |

## 2. 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run --coverage
```

## 3. リポジトリ閾値（参照）

`references/quality-gates.md §7.5` に従い E2E lines coverage ≥ 80%。本タスクは公開ページ単機能の整形のため、unit 側で上記閾値を満たせば十分。

## 4. 完了条件

- coverage report 取得
- 上表の閾値を満たす（満たさない場合は Phase 6 に戻ってケース追加）
