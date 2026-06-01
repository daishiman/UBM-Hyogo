# Phase 9: 品質保証

`[実装区分: 実装仕様書]`

## 9.1 QA チェックリスト

| # | 項目 | コマンド / 確認 | 期待 |
|---|------|-----------------|------|
| Q1 | 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| Q2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| Q3 | design token gate（AC-8） | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | exit 0（HEX 直書きゼロ） |
| Q4 | focused test | `mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 全 PASS |
| Q5 | 新規 primitive 不在 | `grep -rn "help-hint\|name=\"help\"" apps/web/src` | DensityToggle / Icon / icons / CSS のみ |
| Q6 | HEX 直書き不在 | `grep -rnE "#[0-9a-fA-F]{3,6}" apps/web/src/components/public/DensityToggle.client.tsx apps/web/src/components/ui/Icon.tsx` | 0 件 |

## 9.2 不変条件チェック

- #8: 追加テストは `*.spec.tsx`（新規 `*.test.tsx` なし）→ 既存 spec に追記のみ。
- task-02/18 系: `apps/web/src` に `127.0.0.1` 等のローカル endpoint 焼き込みなし。
- D1 直接アクセスなし（UI のみ）。

## 完了条件
- Q1〜Q6 全 PASS、不変条件 violation ゼロ。
