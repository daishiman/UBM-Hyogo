# Phase 6: Test Additions

Phase 4 のテスト計画に従い実装する。各 spec の to-be 状態:

## TagQueuePanel.component.spec.tsx（task-B）

既存ケース（8 件）はそのまま pass。追加:

```ts
it("renders Avatar in each queue item", () => {
  // initial.items 2件 → role=img の Avatar が 2 件以上
});

it("shows TAGGED subsection when resolved items exist", () => {
  // status=resolved を 1 件含む initial → getByTestId("admin-tag-queue-resolved")
});

it("review panel has sticky-top class", () => {
  // getByTestId("admin-tag-review-panel").className contains "sticky-top"
});
```

## AdminSectionErrorClient.spec.tsx（task-A）

```ts
describe.each([
  ["ADMIN_FETCH_401", "セッションが切れています"],
  ["ADMIN_FETCH_403", "権限がありません"],
  ["ADMIN_FETCH_404", "API に到達できません"],
  ["ADMIN_FETCH_500", "サーバー設定エラー"],
])("code=%s", (code, expectedTitle) => {
  it("renders matching recovery hint", () => {
    render(<AdminSectionErrorClient sectionLabel="x" code={code} message="..." />);
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });
});
```

## server-fetch.spec.ts（task-A）

```ts
it("warns once when 404 and NODE_ENV != production", async () => {
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("NODE_ENV", "development");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
  await expect(fetchAdmin("/admin/tags/queue")).rejects.toThrow(/failed: 404/);
  expect(spy).toHaveBeenCalledOnce();
});

it("does not warn when NODE_ENV is production", async () => {
  // 同上で NODE_ENV=production → spy.calls === 0
});
```
