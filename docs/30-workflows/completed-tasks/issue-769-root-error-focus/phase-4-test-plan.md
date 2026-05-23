# Phase 4: テスト計画 — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. テスト範囲

| 種別 | 範囲 | 本タスクでの扱い |
|---|---|---|
| 単体（vitest + RTL） | RouteError コンポーネント | **追加**（TC-U-09 のみ） |
| 結合 / E2E (Playwright) | error boundary を runtime で発火させる経路 | **対象外**（既存 task-22 regression smoke で a11y baseline 取得時に観察） |
| Visual | NON_VISUAL タスク | **対象外** |

## 2. 追加テストケース

**追加先**: `apps/web/app/__tests__/error.component.spec.tsx`

### TC-U-09a: focus が h1 に当たる

```tsx
describe("TC-U-09: mount 時に h1 へ focus が移譲される", () => {
  it("focuses h1 on mount", () => {
    const reset = vi.fn();
    render(<RouteError error={makeError({ digest: "focus-test" })} reset={reset} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(h1);
  });
});
```

**期待値**: `document.activeElement === h1` を満たす。

### TC-U-09b: h1 に tabIndex=-1 が付与される

```tsx
it("h1 has tabIndex=-1 to allow programmatic focus", () => {
  const reset = vi.fn();
  render(<RouteError error={makeError()} reset={reset} />);
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(h1.getAttribute("tabindex")).toBe("-1");
});
```

**期待値**: h1 の DOM 属性 `tabindex === "-1"`。

### TC-U-09c: focus が `preventScroll: true` で呼ばれる

```tsx
it("calls focus with preventScroll=true", () => {
  const reset = vi.fn();
  const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
  render(<RouteError error={makeError()} reset={reset} />);
  expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  focusSpy.mockRestore();
});
```

**期待値**: `HTMLElement.prototype.focus` が引数 `{ preventScroll: true }` で呼ばれる。

## 3. 既存テストへの regression 想定

| 既存 TC | 影響 |
|---|---|
| TC-U-01〜TC-U-05 | 描画内容変更なし → PASS 継続 |
| TC-U-06: `logger.error` 1 回呼び出し | useEffect 内副作用追加のみ、logger 呼び出し回数は不変 → PASS 継続 |
| TC-U-07: 同 error 再 render で logger 1 回 | 同上、依存配列 `[error]` も不変 → PASS 継続 |
| TC-U-08: token utility migration | className 変更なし → PASS 継続 |

## 4. 実行コマンド

```bash
# 全 web test
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run error.component

# 単体 file
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/__tests__/error.component.spec.tsx

# 型 + lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 5. カバレッジ目標

- Statements: TC-U-09 追加で `error.tsx` の useEffect 内 focus 行が covered になる
- Branches: optional chaining `headingRef.current?.focus()` の null branch は ref が常に bind される本実装で実行されない（許容）

## 6. Test Doubles

| 対象 | 方式 | 既存/新規 |
|---|---|---|
| `logger.error` | `vi.mock` (file 冒頭) | 既存 |
| `HTMLElement.prototype.focus` | `vi.spyOn` (TC-U-09c 内) | **新規**（テスト終了時 `mockRestore()` で必ず復元） |

## 7. 失敗時の切り分け

| 症状 | 想定原因 | 対応 |
|---|---|---|
| `document.activeElement` が body | useEffect が走っていない / `headingRef.current` が null | ref bind 漏れ確認 |
| tabindex="-1" 不在 | h1 への props 付与漏れ | jsx 修正 |
| `preventScroll: true` 未指定 | focus 引数漏れ | 実装修正 |

## 8. Phase 5 への引き継ぎ

- 実装は Phase 2 §4 After の通り
- TC-U-09a/b/c を `__tests__/error.component.spec.tsx` 末尾に追加
- TC-U-09c の `vi.spyOn` は他 TC への副作用を避けるため `mockRestore()` を必ず呼ぶ
