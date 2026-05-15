# Phase 8: リファクタリング

> Phase: 8 / 13
> 名称: リファクタリング（過剰抽象化禁止）

---

## 8.1 候補

| # | 候補 | 判定 | 理由 |
|---|------|------|------|
| C1 | `<SkeletonBar />` 共通コンポーネント抽出（h / w を props） | **却下** | 利用箇所 3 ファイル × 各 3 要素 ≒ 9 箇所だが、各 skeleton の形（pill / square / line）が異なり、props 表面積が肥大化する。重複コストよりラッパー導入コストが高く、今回サイクルで未タスク化しない。 |
| C2 | `useFocusOnMount(ref)` custom hook | **採用候補** | login/error.tsx と error.tsx の 2 箇所で `useEffect(() => ref.current?.focus({ preventScroll: true }), [deps])` が完全に同一形になる場合、`apps/web/src/lib/hooks/use-focus-on-mount.ts` に抽出。ただし dep が異なる場合は保留。 |
| C3 | `<Status role="status">` wrapper | **却下** | DOM ノード 1 つを増やすコストに対し得るものが少ない。aria 属性のセットも `role="status"` を直接書くほうが明示的。 |
| C4 | `error-card.tsx` 共通化（login/error と root/error の Card 化） | **条件付き却下** | root/error は既存構造の最小差分を優先する。Phase 5 実装後に完全重複が 2 箇所以上残り、抽出しても props が増えない場合だけ同サイクル内で採用する。 |

---

## 8.2 C2（useFocusOnMount）採用条件

以下すべてを満たす場合に限り抽出:

1. login/error.tsx と root/error.tsx で deps が同一（`[error]`）
2. `preventScroll: true` を全箇所で使う
3. ref の型がすべて `HTMLHeadingElement`

満たさない箇所は素の `useEffect` を維持。

---

## 8.3 命名 / 配置

- 抽出する場合の path: `apps/web/src/lib/hooks/use-focus-on-mount.ts`
- API:

```ts
import { useEffect, type RefObject } from "react";

export function useFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T>,
  deps: unknown[] = []
): void {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

---

## 8.4 テスト

抽出した場合は `apps/web/__tests__/use-focus-on-mount.spec.tsx` を追加し、既存 spec の focus テストは call site をそのまま検証する。

---

## 8.5 完了判定

- C1 / C3 / C4 は却下または同サイクル採用のどちらかに閉じ、曖昧な保留を残さない
- C2 を採用したかどうか implementation-notes に記録
- 採用時は spec 追加とテスト pass を確認

---

## 次フェーズへの引き継ぎ

Phase 9 で typecheck / lint / test / playwright のフル実行を行い、QA を完了させる。
