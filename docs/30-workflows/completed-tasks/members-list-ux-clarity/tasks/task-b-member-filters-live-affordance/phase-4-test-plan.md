<!-- workflow: members-list-ux-clarity / task: B / phase: 4 -->

[実装区分: 実装仕様書]

# Phase 4 — テスト計画 (Task B)

> 前提: [phase-2-design.md](./phase-2-design.md) / [phase-3-design-review.md](./phase-3-design-review.md)

## 1. テストファイル一覧

| 種別 | パス | 内容 |
| ---- | ---- | ---- |
| 修正 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 既存 7 ケース後方互換維持 + AC-B-1 / AC-B-2 / AC-B-5 / AC-B-8 ケース追加 |
| 新規 | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | AC-B-3 / AC-B-4 / AC-B-5 / AC-B-9 検証 |

> 注: 新規 spec は `*.spec.tsx` のみ (CLAUDE.md 不変条件 #8)。`*.test.tsx` は禁止。

## 2. 既存 7 ケースの修正方針 (`MemberFilters.client.spec.tsx`)

| # | 既存ケース | 修正方針 |
| - | --------- | -------- |
| 1 | "form[role=search] / 3 つの Select / クリアボタンをレンダーする" | クリアボタンの assertion (`[data-role="clear"]` + `disabled=true`) を **「`hasFilters=false` のとき `[data-component="selected-filters-bar"]` が描画されない」** に置換 |
| 2 | "ゾーンを選択すると router.replace が呼ばれる" | 変更なし (zone Select 挙動は不変) |
| 3 | "tag が指定済みの場合 active-tags リストを描画し × ボタンで削除できる" | `[data-role="active-tags"]` selector を `[data-component="selected-filters-bar"] [data-filter-key="tag"]` に変更。`#foo ×` button name 検証は維持 |
| 4 | "フィルタ条件があるときクリアボタンが活性化し、押下で /members に遷移する" | `[data-role="clear"]` selector を `[data-component="selected-filters-bar"] [data-role="clear-all"]` に変更。`disabled=false` 検証は削除 (描画されていれば active 前提) |
| 5 | "topTags を渡すと TagPicker chip が描画される" | 変更なし (TagPicker 挙動は不変) |
| 6 | "選択済みが上限に達すると未選択 chip は aria-disabled で no-op" | 変更なし (TagPicker 内部挙動は不変) |
| 7 | "clear-all ボタンで /members に router.replace される" | selector を `getByRole("button", { name: "すべてクリア" })` に維持 (button name は不変) |
| 8 | "mobile summary 行 (filters-summary-mobile) が描画され expanded を切替できる" | 変更なし |

## 3. 追加ケース (`MemberFilters.client.spec.tsx`)

### TC-B-MF-01: AC-B-1 hint + aria-describedby

```ts
it("Search 直下に live-filter-hint を表示し form に aria-describedby が紐付く", () => {
  const { container } = render(<MemberFilters initial={baseInitial} />);
  const hint = container.querySelector('[data-role="live-filter-hint"]');
  expect(hint).toBeTruthy();
  expect(hint?.id).toBe("member-filters-hint");
  expect(hint?.textContent).toMatch(/入力すると自動で絞り込まれます/);
  const form = container.querySelector('[data-component="member-filters"]');
  expect(form?.getAttribute("aria-describedby")).toBe("member-filters-hint");
});
```

### TC-B-MF-02: AC-B-2 result-count with role=status

```ts
it("totalCount/displayedCount を渡すと aria-live 領域に件数が表示される", () => {
  render(
    <MemberFilters initial={baseInitial} totalCount={42} displayedCount={20} />,
  );
  const live = screen.getByRole("status");
  expect(live.getAttribute("aria-live")).toBe("polite");
  expect(live.getAttribute("aria-atomic")).toBe("true");
  expect(live.getAttribute("data-role")).toBe("result-count");
  expect(live.textContent).toMatch(/42 件中 20 件/);
});

it("totalCount===displayedCount のときは省略形になる", () => {
  render(
    <MemberFilters initial={baseInitial} totalCount={7} displayedCount={7} />,
  );
  expect(screen.getByRole("status").textContent).toMatch(/7 件を表示/);
});

it("totalCount===0 のときは『該当者なし』を表示する", () => {
  render(
    <MemberFilters initial={baseInitial} totalCount={0} displayedCount={0} />,
  );
  expect(screen.getByRole("status").textContent).toMatch(/該当者なし/);
});
```

### TC-B-MF-03: AC-B-5 hasFilters=false で SelectedFiltersBar 非描画

```ts
it("hasFilters=false のとき SelectedFiltersBar は描画されない", () => {
  const { container } = render(<MemberFilters initial={baseInitial} />);
  expect(
    container.querySelector('[data-component="selected-filters-bar"]'),
  ).toBeNull();
});

it("q が指定されていれば SelectedFiltersBar が描画される", () => {
  const { container } = render(
    <MemberFilters initial={{ ...baseInitial, q: "山田" }} />,
  );
  expect(
    container.querySelector('[data-component="selected-filters-bar"]'),
  ).toBeTruthy();
});
```

## 4. `SelectedFiltersBar.client.spec.tsx` 新規ケース

### TC-B-SFB-01: hasFilters=false で null

```ts
it("hasFilters=false のとき null を返す", () => {
  const { container } = render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "all", status: "all", tag: [] }}
      hasFilters={false}
      onClearOne={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
  expect(container.firstChild).toBeNull();
});
```

### TC-B-SFB-02: q chip の描画と解除

```ts
it("q が空でないと chip が描画される", () => {
  const onClearOne = vi.fn();
  render(
    <SelectedFiltersBar
      filters={{ q: "山田", zone: "all", status: "all", tag: [] }}
      hasFilters={true}
      onClearOne={onClearOne}
      onClearAll={vi.fn()}
    />,
  );
  const chip = screen.getByRole("button", {
    name: "キーワード絞り込みを解除",
  });
  expect(chip.textContent).toContain("キーワード: 山田");
  fireEvent.click(chip);
  expect(onClearOne).toHaveBeenCalledWith("q", "山田");
});
```

### TC-B-SFB-03: zone / status chip の描画

```ts
it("zone='0_to_1' で『ゾーン: 0→1』chip が描画される", () => {
  render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "0_to_1", status: "all", tag: [] }}
      hasFilters={true}
      onClearOne={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
  expect(screen.getByText(/ゾーン: 0→1/)).toBeTruthy();
});

it("status='member' で『種別: 正会員』chip が描画される", () => {
  render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "all", status: "member", tag: [] }}
      hasFilters={true}
      onClearOne={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
  expect(screen.getByText(/種別: 正会員/)).toBeTruthy();
});
```

### TC-B-SFB-04: tag chip 個別解除

```ts
it("tag chip × クリックで onClearOne('tag', code) が呼ばれる", () => {
  const onClearOne = vi.fn();
  render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "all", status: "all", tag: ["foo", "bar"] }}
      hasFilters={true}
      onClearOne={onClearOne}
      onClearAll={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "タグfooを解除" }));
  expect(onClearOne).toHaveBeenCalledWith("tag", "foo");
});
```

### TC-B-SFB-05: sort は chip 化されない

```ts
it("filters に sort が存在しない型のため、chip 列には sort が含まれない", () => {
  const { container } = render(
    <SelectedFiltersBar
      filters={{ q: "", zone: "0_to_1", status: "all", tag: [] }}
      hasFilters={true}
      onClearOne={vi.fn()}
      onClearAll={vi.fn()}
    />,
  );
  // sort 関連 selector や text が存在しないこと
  expect(container.textContent).not.toMatch(/並び替え/);
  expect(container.textContent).not.toMatch(/sort/i);
});
```

### TC-B-SFB-06: clear-all button

```ts
it("clear-all button クリックで onClearAll が呼ばれる", () => {
  const onClearAll = vi.fn();
  render(
    <SelectedFiltersBar
      filters={{ q: "山田", zone: "all", status: "all", tag: [] }}
      hasFilters={true}
      onClearOne={vi.fn()}
      onClearAll={onClearAll}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "すべてクリア" }));
  expect(onClearAll).toHaveBeenCalled();
});
```

## 5. 実行コマンド

```bash
# Task B 局所
mise exec -- pnpm --filter @ubm/web vitest run \
  src/components/public/__tests__/MemberFilters.client.spec.tsx \
  src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx

# 周辺の回帰
mise exec -- pnpm --filter @ubm/web typecheck
mise exec -- pnpm --filter @ubm/web lint
```

## 6. TDD 順序

1. RED-1: 既存 `MemberFilters.client.spec.tsx` の修正版を書き、Phase 2 設計の selector 変更で fail させる
2. RED-2: 新規 `SelectedFiltersBar.client.spec.tsx` を書き、未実装で fail させる
3. RED-3: 追加 TC-B-MF-01..03 を書き fail させる
4. GREEN: Phase 5 実装で順次緑化

## 7. DoD

- [x] 既存 7 ケースの修正方針が表で示されている
- [x] 追加ケースが AC ID と紐付いている
- [x] テスト命名規則 `*.spec.tsx` を遵守
- [x] 実行コマンドが明示されている
- [x] TDD 順序が記述されている
