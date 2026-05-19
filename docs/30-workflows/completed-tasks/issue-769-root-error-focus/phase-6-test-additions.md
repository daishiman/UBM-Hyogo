# Phase 6: テスト追加 — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. 追加対象ファイル

| Path | 種別 |
|---|---|
| `apps/web/app/__tests__/error.component.spec.tsx` | modify（TC-U-09a/b/c 追記） |

## 2. 追加コード差分

ファイル末尾、`describe("RouteError", ...)` ブロック内の `TC-U-08` 直後・閉じカッコ前に追加。

```tsx
  describe("TC-U-09: mount 時に h1 へ focus が移譲される", () => {
    it("focuses h1 on mount", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError({ digest: "focus-test" })} reset={reset} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(document.activeElement).toBe(h1);
    });

    it("h1 has tabIndex=-1 to allow programmatic focus", () => {
      const reset = vi.fn();
      render(<RouteError error={makeError()} reset={reset} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1.getAttribute("tabindex")).toBe("-1");
    });

    it("calls focus with preventScroll=true", () => {
      const reset = vi.fn();
      const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
      try {
        render(<RouteError error={makeError()} reset={reset} />);
        expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      } finally {
        focusSpy.mockRestore();
      }
    });
  });
```

## 3. 既存 TC との独立性

- TC-U-09 は `vi.spyOn(HTMLElement.prototype, "focus")` を 1 ケース内で開始→`finally` 終了する
- `afterEach` の `vi.clearAllMocks()` で他 spy も自動クリアされる
- TC-U-06 / TC-U-07 の `logger.error` 呼び出し回数検証は本追加に非依存

## 4. 負例（不要）

negative test（focus 移譲されない条件）は本タスクのスコープ外。`error` prop 必須のため null/undefined ケースは型システム側で防がれる。

## 5. 実行と期待

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component
```

期待: `apps/web/app/__tests__/error.component.spec.tsx` の全 13 ケース（既存 10 + TC-U-09 3）が 0 fail で PASS。

## 6. snapshot 等の副生成物

- snapshot 生成なし
- coverage report は Phase 7 で別途取得
