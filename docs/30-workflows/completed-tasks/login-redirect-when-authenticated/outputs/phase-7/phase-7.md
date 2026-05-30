# Phase 7 — カバレッジ確認

## 1. カバレッジ対象範囲

| 対象                                | line 目標 | branch 目標 | 備考                              |
| ----------------------------------- | --------- | ----------- | --------------------------------- |
| `apps/web/src/lib/url/safe-next.ts` | 100%      | 100%        | 純関数。16 ケースで主要分岐を網羅 |
| `apps/web/app/login/page.tsx`（変更行のみ） | 100% | 100% | session 分岐 2 経路 × next 3 経路 |

**広域カバレッジ目標は設定しない**（変更箇所のみ局所検証）。

## 2. 実行コマンド

```bash
mise exec -- pnpm exec vitest run --coverage \
  apps/web/src/lib/url/__tests__/safe-next.spec.ts \
  apps/web/app/login/__tests__/page.spec.tsx
```

## 3. 期待 coverage 出力

```
File                    | % Lines | % Branch | % Funcs
src/lib/url/safe-next.ts|  100    |  100     |  100
app/login/page.tsx (変更行) |  100  |  100     |  100
```

## 4. 未到達分岐があった場合

- ケース追加または `/* istanbul ignore next */` 注釈（ただし safe-next.ts では使用しない）
- branch 未到達は仕様欠落の証拠として扱い、Phase 6 に戻す

## 5. DoD

- [ ] `safe-next.ts` line/branch 100%
- [ ] `page.tsx` 変更行 line/branch 100%
