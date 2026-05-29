<!-- workflow: members-list-ux-clarity / task: B / phase: 6 -->

[実装区分: 実装仕様書]

# Phase 6 — テスト拡充 (Task B)

> 前提: Phase 4 / Phase 5 が GREEN

## 1. 追加するテスト

### TC-B-MF-06: chip 個別解除で URL に反映される (integration風)

```ts
it("zone chip の × で zone=all に reset され URL から zone= が消える", () => {
  render(
    <MemberFilters initial={{ ...baseInitial, zone: "0_to_1" }} />,
  );
  const chip = screen.getByRole("button", { name: "ゾーン絞り込みを解除" });
  fireEvent.click(chip);
  const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
  expect(lastCall).not.toContain("zone=");
});

it("q chip の × で q が空文字に reset される", () => {
  render(<MemberFilters initial={{ ...baseInitial, q: "山田" }} />);
  fireEvent.click(screen.getByRole("button", { name: "キーワード絞り込みを解除" }));
  const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
  expect(lastCall).not.toContain("q=");
});

it("tag chip の × で当該 tag のみ削除される (他 tag は維持)", () => {
  render(
    <MemberFilters initial={{ ...baseInitial, tag: ["foo", "bar"] }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "タグfooを解除" }));
  const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
  expect(lastCall).toContain("tag=bar");
  expect(lastCall).not.toContain("tag=foo");
});
```

### TC-B-MF-07: aria-live 領域が prop 更新で再 render される

```ts
it("totalCount/displayedCount 変更で result-count textContent が変わる", () => {
  const { rerender } = render(
    <MemberFilters initial={baseInitial} totalCount={10} displayedCount={10} />,
  );
  expect(screen.getByRole("status").textContent).toMatch(/10 件を表示/);
  rerender(
    <MemberFilters initial={baseInitial} totalCount={10} displayedCount={3} />,
  );
  expect(screen.getByRole("status").textContent).toMatch(/10 件中 3 件/);
});
```

### TC-B-SFB-07: unknown zone / status は chip 化されない (safety)

```ts
it("zone='unknown_value' は chip 化されない", () => {
  const { container } = render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "unknown_value", status: "all", tag: [] }}
      hasFilters={true}
      onClearOne={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
  expect(
    container.querySelector('[data-filter-key="zone"]'),
  ).toBeNull();
});
```

### TC-B-SFB-08: SelectedTagsBar wrapper の後方互換

新規ファイル: `apps/web/src/components/public/__tests__/SelectedTagsBar.client.spec.tsx` (任意)

```ts
it("SelectedTagsBar (wrapper) は selected が空のとき null", () => {
  const { container } = render(
    <SelectedTagsBar selected={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />,
  );
  expect(container.firstChild).toBeNull();
});

it("SelectedTagsBar (wrapper) は × で onRemove が呼ばれる", () => {
  const onRemove = vi.fn();
  render(
    <SelectedTagsBar
      selected={["ai"]}
      onRemove={onRemove}
      onClearAll={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "タグaiを解除" }));
  expect(onRemove).toHaveBeenCalledWith("ai");
});
```

## 2. 回帰 guard

- 既存 Playwright `members-prototype-alignment.spec.ts` の selector で破壊がないことを Phase 9 で確認 (本 Phase ではコード未変更前提)
- 既存 7 ケースは Phase 4 § 2 の修正方針通り後方互換 PASS

## 3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  src/components/public/__tests__/SelectedTagsBar.client.spec.tsx
```

## 4. DoD

- [ ] TC-B-MF-06..07 / TC-B-SFB-07..08 が PASS
- [ ] 既存 spec 全 GREEN
