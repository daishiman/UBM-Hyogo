# Phase 4: テスト計画 — `/profile/error.tsx`

**[実装区分: 実装仕様書]**

## 1. テスト範囲

hook 単体と root/profile/login/admin error boundary の focused tests を追加・更新し、合計 5 files / 31 ケースを検証する。E2E（playwright）追加は本タスクスコープ外（task-22 regression smoke 側で別途検討）。

## 2. テストケース

### T1: マウント直後に h1 が focus を受ける

```ts
it("mount すると h1 に focus が移譲される", async () => {
  render(<ProfileError error={mkError()} reset={vi.fn()} />);
  const heading = await screen.findByRole("heading", { level: 1 });
  expect(document.activeElement).toBe(heading);
  expect(heading).toHaveAttribute("tabindex", "-1");
});
```

### T2: `error.digest` 表示

```ts
it("error.digest が存在するとき エラーID が表示される", () => {
  render(<ProfileError error={mkError({ digest: "abc123" })} reset={vi.fn()} />);
  expect(screen.getByText(/エラーID:/)).toBeInTheDocument();
  expect(screen.getByText("abc123")).toBeInTheDocument();
});
```

### T3: 外側コンテナの aria 属性

```ts
it("外側コンテナに role=alert と aria-live=assertive が付与される", () => {
  render(<ProfileError error={mkError()} reset={vi.fn()} />);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveAttribute("aria-live", "assertive");
});
```

### T4: logger.error 呼び出し

```ts
it("logger.error が event=error.boundary.caught で 1 度だけ呼ばれる", () => {
  const spy = vi.spyOn(logger, "error").mockImplementation(() => {});
  const err = mkError({ digest: "xyz" });
  render(<ProfileError error={err} reset={vi.fn()} />);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith({
    event: "error.boundary.caught",
    digest: "xyz",
    err,
  });
});
```

## 3. fixture / helper

```ts
function mkError(overrides: Partial<{ digest: string; message: string }> = {}): Error & { digest?: string } {
  const e = new Error(overrides.message ?? "boom") as Error & { digest?: string };
  if (overrides.digest) e.digest = overrides.digest;
  return e;
}
```

## 4. mock 方針

- `next/link` は jest 環境では実コンポーネント可動。mock 不要。
- `logger`: `vi.spyOn(logger, "error")` で副作用を捕捉。global mock は不要（root の test と同方針）。
- `process.env.NODE_ENV`: dev stack 表示の検証は本タスクスコープ外（root test でも限定的）。必要なら別 followup。

## 5. coverage 期待値

- Lines: 95%+（dev stack 分岐は production NODE_ENV 既定で未到達となり許容）
- Branches: 80%+（`error.digest` 有無 / dev 分岐の 2 軸のうち digest 軸を 2 ケースでカバー）

## 6. 実行コマンド

```bash
pnpm exec vitest run apps/web/app/profile/__tests__/error.component.spec.tsx
```
