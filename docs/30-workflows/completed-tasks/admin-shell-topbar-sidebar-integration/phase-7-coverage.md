# Phase 7: カバレッジ

## 方針

- 変更ブロック単位の差分 coverage 80% を目標
- `isActive.ts` は **100% 行 / 分岐カバレッジ** (純関数のため必達)
- `AdminSidebar.tsx` は branch coverage (badge 表示 on/off / group 別描画 / active 1 件のみ) を網羅
- 全体 coverage 閾値は親 workflow / `pnpm coverage` の既定に従う (本 task で閾値変更しない)

## 計測コマンド

```bash
mise exec -- pnpm --filter web test -- --coverage --run components/layout
```

## 確認項目

- `coverage/coverage-summary.json` で対象ファイル群 (`components/layout/*`) の statement / branch / function いずれも 80% 以上
- `isActive.ts` のみ 100% 線
- 未到達 branch があれば Phase 6 spec を追補
