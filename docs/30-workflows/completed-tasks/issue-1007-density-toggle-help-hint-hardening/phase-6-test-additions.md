# Phase 6: テスト拡充（fail path / 回帰 guard）

`[実装区分: 実装仕様書]`

## 6.1 追加する fail path / edge ケース

| TC | 名称 | 期待 |
|----|------|------|
| TC-11 | 3 配置でも id unique | `<DensityToggle/>` × 3 で全 description id・aria-describedby が重複ゼロ |
| TC-12 | close 後の再 open | Escape で閉じた後、summary click で再度開ける（listener が正しく再 add される） |
| TC-13 | open 中の Tab | open 中に focus を dl 内へ移しても close しない（pointerdown/keydown 以外で閉じない） |
| TC-14 | comfy 以外 value で初期 aria-checked | `value="list"` で list radio が `aria-checked="true"`（回帰 guard） |

## 6.2 回帰 guard（AC-7）

既存 4 test に加え、以下を回帰として固定:
- HelpHint dl の dt/dd が各 3 件（`getAllByRole("term")`/`("definition")` length 3）
- `density=dense` の URL replace、`comfy` の param 削除

## 6.3 実行コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
```

## 完了条件
- fail path / 回帰 guard が追加され、全 PASS であること。
