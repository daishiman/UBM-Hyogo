# Phase 6: テスト追加

[実装区分: 実装仕様書]

## 追加 / 変更 spec ファイル一覧

| Path | 操作 | ケース数 |
|------|------|---------|
| `apps/web/app/(admin)/admin/schema/page.spec.tsx` | 新規 | 2 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 追記 | +1 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | 追記 | +1 |
| `apps/web/playwright/page-objects/AdminSchemaPage.ts` + existing `/admin/schema` Playwright specs | 更新 | stale heading / landmark expectations |
| `apps/api/src/routes/admin/schema.contract.spec.ts` | 既存確認 | `GET /schema/diff` contract |

## page.spec.tsx ケース仕様

```ts
describe("AdminSchemaPage", () => {
  it("renders PageHead with eyebrow ADMIN / SCHEMA", async () => {
    mockSafeServerFetch.mockResolvedValue({ ok: true, data: makeDiff() });
    const ui = await AdminSchemaPage();
    render(ui);
    expect(screen.getByText("ADMIN / SCHEMA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "スキーマ差分のレビュー" })).toBeInTheDocument();
  });

  it("renders CurrentRevisionCard with revisionId and hash", async () => { /* ... */ });

  it("renders 4 stat cards in grid-4", async () => {
    const ui = await AdminSchemaPage();
    render(ui);
    expect(screen.getAllByTestId("admin-stat")).toHaveLength(4);
  });

  it("passes hideInlineStats=true to SchemaDiffPanel", async () => { /* ... */ });

  it("renders REVISIONS + ALIAS HISTORY grid-2", async () => {
    const ui = await AdminSchemaPage();
    render(ui);
    expect(screen.getByTestId("admin-schema-bottom-grid")).toBeInTheDocument();
  });

  it("on err: renders AdminSectionErrorClient and no stats/panel/revisions", async () => {
    mockSafeServerFetch.mockResolvedValue({ ok: false, error: { code: "ADMIN_FETCH_404", message: "..." } });
    const ui = await AdminSchemaPage();
    render(ui);
    expect(screen.getByText(/Schema diff の読み込みに失敗/)).toBeInTheDocument();
    expect(screen.queryAllByTestId("admin-stat")).toHaveLength(0);
    expect(screen.queryByTestId("admin-schema-bottom-grid")).toBeNull();
  });
});

describe("AdminSchemaPage tokens guard", () => {
  it("source contains no HEX color literal", async () => {
    const src = await readFile(
      resolve(__dirname, "../page.tsx"),
      "utf-8",
    );
    expect(src).not.toMatch(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/);
  });
});
```

## SchemaDiffPanel.component.spec.tsx 追記ケース仕様

```ts
describe("SchemaDiffPanel hideInlineStats", () => {
  it("hides inline stats row when hideInlineStats=true", () => {
    render(<SchemaDiffPanel initial={makeDiff()} hideInlineStats />);
    expect(screen.queryByText("0 件")).toBeNull();
  });
  it("renders diff card classes", () => {
    render(<SchemaDiffPanel initial={makeDiff()} />);
    expect(screen.getByText("added-1").closest(".schema-field-card")?.className).toContain("diff-added");
  });
});
```

## AdminSidebar.component.spec.tsx 追記

```ts
it("renders 'スキーマ' nav item linking to /admin/schema", () => {
  render(<AdminSidebar />);
  const link = screen.getByRole("link", { name: "スキーマ" });
  expect(link).toHaveAttribute("href", "/admin/schema");
});
```

既存「schema」期待値の assertion があれば削除（rename）。

## Playwright existing `/admin/schema` specs

既存の `admin-schema-diff.spec.ts` / `admin-pages.spec.ts` / `full-smoke.spec.ts` / task-specific schema specs は、旧 heading `schema 差分` と旧 `[data-testid="admin-schema-section"]` を参照しない。新 UI の landmark は次で固定する。

```ts
await expect(page.getByRole("heading", { name: "項目別の差分" })).toBeVisible();
await expect(page.locator('[data-page="admin-schema"]')).toBeVisible();
```

> `playwright.config` の `visual-chromium` project で既存 visual spec が screenshot evidence を生成する。authenticated staging screenshot は user-gated の Phase 11 evidence として分離する。

## 期待実行結果

| Command | 期待 |
|---------|------|
| `pnpm --filter @ubm-hyogo/web test --run` | page / panel / sidebar regression を含め PASS |
| `pnpm --filter @ubm-hyogo/api test --run apps/api/src/routes/admin/schema.contract.spec.ts` | 既存 schema contract PASS（D1 lane 必要） |
| `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium` | screenshot evidence PASS（runtime access がある場合） |
