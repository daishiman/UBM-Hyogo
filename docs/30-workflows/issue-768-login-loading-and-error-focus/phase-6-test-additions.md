# Phase 6: テスト追加

Phase 5 で実装した `loading.spec.tsx` / `error.spec.tsx` に加え、以下の補足ケースを追加検討する。

## 1. 追加候補ケース

| TC | 観点 | 追加要否 | 理由 |
|---|---|---|---|
| L-05 | `motion-safe:animate-pulse` class 付与 | optional | jsdom では prefers-reduced-motion を再現できない。E2E に委譲 |
| E-08 | StrictMode 二重 render で console.error 2 回 / focus 1 回 | optional | StrictMode は dev のみ。production runtime 影響なし。skip 可 |
| E-09 | `preventScroll: true` 引数検証 | 必須 | `vi.spyOn(HTMLElement.prototype, "focus")` で `.focus({ preventScroll: true })` の引数を assert |

## 2. E-09 実装スケッチ

```tsx
it("E-09: focus が preventScroll: true で呼ばれる", () => {
  const focusSpy = vi.spyOn(HTMLHeadingElement.prototype, "focus");
  render(<LoginError error={new Error("boom")} reset={vi.fn()} />);
  expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  focusSpy.mockRestore();
});
```

## 3. 既存テストへの影響

- 既存 `apps/web/app/login/_components/__tests__/LoginCard.component.spec.tsx` 等は変更不要（boundary 層と独立）
- `apps/web/app/login/_components/__tests__/LoginPanel.component.spec.tsx` も影響なし

## 4. 実行

```bash
mise exec -- pnpm --filter @ubm/web test -- app/login
```

`app/login` 配下の全 spec PASS を確認する。
