# Phase 7: カバレッジ確認

`[実装区分: 実装仕様書]`

## 7.1 対象範囲（局所指定）

変更したファイル/ブロックのみを対象とし、他は対象外（FB-BEFORE-QUIT-002）。

| ファイル | 対象ブロック | 目標 |
|----------|--------------|------|
| `DensityToggle.client.tsx` | `descId` / `useEffect`(Escape + pointerdown + cleanup) / `detailsRef.current.open` 判定 / Icon 描画 | focused branch coverage |
| `Icon.tsx` | `case "help"` | line 100% |
| `icons.ts` | union 追加（型のみ・実行行なし） | 対象外 |

## 7.2 AC-9（listener leak）の coverage 証跡

- `useEffect` の `if (!open) return`（close 分岐）と cleanup（remove）の両 branch を TC-10/TC-12 で踏むことを明示。
- open=true → false 遷移で cleanup が呼ばれる branch を実測でカバー。

## 7.3 実行コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx --coverage
```

## 完了条件
- 変更ブロックの line/branch カバレッジ実測値を証跡に残し、close 分岐と cleanup が踏まれていること。
