<!-- workflow: members-list-ux-clarity / task: A / phase: 7 -->

# Phase 7 — カバレッジ確認 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

## 1. カバレッジ対象 (局所スコープ)

本タスクで変更/新規作成したファイルのみ。**全体カバレッジは対象外** ([Feedback BEFORE-QUIT-002] 対応)。

| ファイル | line 目標 | branch 目標 |
| -------- | --------- | ----------- |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 100% | 100% (`comfy` 分岐 / `else` 分岐 / `sp` truthy / falsy) |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 100% | 100% (items empty / non-empty) |
| `apps/web/src/components/ui/Segmented.tsx` (sublabel 分岐のみ) | 既存維持 + sublabel 分岐 100% | sublabel undefined / defined 双方カバー |

## 2. 計測コマンド

```bash
mise exec -- pnpm --filter @ubm/web vitest run \
  --coverage \
  --coverage.include='src/components/public/DensityToggle.client.tsx' \
  --coverage.include='src/components/public/DensityToggle.client.tsx' \
  --coverage.include='src/components/ui/Segmented.tsx' \
  src/components/public/__tests__/DensityToggle.client.spec.tsx
```

## 3. 期待出力

```
File                                       | % Stmts | % Branch | % Funcs | % Lines
-------------------------------------------|---------|----------|---------|--------
DensityToggle.client.tsx                   |   100   |   100    |   100   |   100
DensityToggle.client.tsx                        |   100   |   100    |   100   |   100
Segmented.tsx                              |   100   |   100    |   100   |   100
```

## 4. 不足時の補強方針

- `Segmented` の sublabel undefined 分岐は TC-A10 で担保
- `HelpHint` items empty path はテスト追加 (`<HelpHint triggerLabel="..." items={[]} />` で `<dl>` が空のまま render)
- 上記でも 100% に満たない場合は Phase 6 へ戻り fail path を追加

## 5. DoD

- [ ] 対象 3 ファイルの line / branch coverage が 100%
- [ ] coverage report が `apps/web/coverage/` 配下に出力されている (証跡)
- [ ] 局所スコープが明示されている (全体 coverage は対象外)
