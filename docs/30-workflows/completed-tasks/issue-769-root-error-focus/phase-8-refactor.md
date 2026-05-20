# Phase 8: リファクタリング — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 本タスクでのリファクタリング方針

**実施しない**。

差分は約 4 行で最小。`useEffect` 内に副作用が 2 つ（log + focus）あるが、これを 2 つの useEffect に分離すると以下のデメリットがある:

- 順序保証が React の rule に依存し脆くなる
- 依存配列が同一 `[error]` のため分離する技術的理由がない
- 既存 TC-U-06/TC-U-07 が依存している「同 useEffect 内副作用」の前提が崩れる

## 2. 将来の抽出候補（本タスク外）

### useAutoFocusOnMount(ref) 共通 hook

- **対象**: i05 (`/login/error.tsx`) と i06（本タスク）両方が merge された後
- **配置案**: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- **シグネチャ案**: `useAutoFocusOnMount<T extends HTMLElement>(ref: RefObject<T>, opts?: { preventScroll?: boolean }): void`
- **抽出条件**:
  - i05 / i06 が両方 merge 済
  - `/profile/error.tsx` / `/admin/error.tsx` も同パターンに統一する判断が下る
- **本タスクでの扱い**: Phase 12 の `unassigned-task-detection.md` に横展開候補として記録し、現時点では未タスク化しない

## 3. naming / 型レビュー

| 識別子 | 評価 |
|---|---|
| `headingRef` | OK（既存 React 命名規約に従う） |
| `useRef<HTMLHeadingElement>` | OK（h1 要素に対する正確な generic） |
| `tabIndex={-1}` | OK（JSX は number、HTML は string "-1" になる） |

## 4. dead code 検出

- 追加コードに不要な import / 未使用変数なし
- 既存 `Link` / `logger` の import は維持

## 5. lint / format

```bash
mise exec -- pnpm lint
```

eslint / boundaries / dependency-cruiser / stablekey-literal いずれも違反なし想定。

## 6. 判定

本タスクではリファクタリング作業なし。Phase 9 QA へ進む。
