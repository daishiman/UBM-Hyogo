# Phase 7 — カバレッジ確認

## 1. 対象 / 目標

| ファイル | line | branch | 根拠 |
|---------|------|--------|------|
| `PublicConsentCallout.tsx` | 100% | 100% | 3 状態 + fallback 4 分岐は全件テスト可能 |
| `useBulkRepublish.ts` | ≥ 95% | ≥ 90% | 全成功 / 一部失敗 / 全失敗 / reset / 二重起動 |
| `BulkRepublishDrawer.tsx` | ≥ 90% | ≥ 85% | UI interaction main paths |
| `AllHiddenFallback.tsx` | 100% | — | 静的 render |
| `app/(public)/members/page.tsx`（追加分岐） | ≥ 90% | ≥ 90% | C-P1..C-P6 で網羅 |

## 2. 実行コマンド

```bash
mise exec -- pnpm --filter @repo/web exec vitest run --coverage \
  app/\(member\)/profile/_components/__tests__/PublicConsentCallout.spec.tsx \
  src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx \
  src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts \
  src/components/public/__tests__/AllHiddenFallback.spec.tsx \
  app/\(public\)/members/__tests__/page.spec.tsx
```

`coverage-final.json` を `outputs/phase-07/` へ保存。

## 3. リポジトリ全体 threshold

3-source drift lint（issue-255 既導入）が回帰しないこと:
- `package.json` / `vitest.config.ts` / `codecov.yml` の thresholds 整合

## 4. 完了条件

- [x] ファイル別 line/branch 目標明示
- [x] coverage 出力経路明示
- [x] 既存 3-source drift lint へ影響なしを記録
