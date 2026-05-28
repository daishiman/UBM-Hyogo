# Phase 4: テスト計画

[実装区分: 実装仕様書]

## テスト対象 × レイヤ

| Lane | レイヤ | spec file | 主ケース |
|------|--------|-----------|---------|
| A | apps/api unit (D1 lane) | `apps/api/src/routes/admin/schema.contract.spec.ts` | (a) authenticated `GET /schema/diff` → 200 + items 配列 / (b) unauthenticated → 401 / (c) recommendedStableKeys 同梱 |
| B | apps/web unit (vitest) | `apps/web/app/(admin)/admin/schema/page.spec.tsx` | (a) ok 分岐: page-head / current-revision / stats grid-4 / SchemaDiffPanel / revisions / alias-history 全て描画 / (b) err 分岐: PageHead + AdminSectionErrorClient のみ描画、stale fallback なし |
| C | apps/web unit (vitest) | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | (a) `hideInlineStats={true}` で stats 行 0 件 / (b) diff card class `diff-{type}` を描画 |
| D | apps/web unit (vitest) | 既存 `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` 追記 | label "スキーマ" の getByText が hit |
| E (visual) | Playwright | `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts` + existing admin smoke specs | (a) visual-chromium で screenshot evidence 作成 / (b) `/admin/schema` の new heading / landmark を固定 / (c) axe は既存 full-smoke で確認 |

## 期待値仕様

### Lane A `schema.contract.spec.ts`

```ts
describe("GET /admin/schema/diff (admin auth)", () => {
  it("returns 200 with DiffListView shape", async () => {
    const res = await app.request("/admin/schema/diff", {
      headers: { Cookie: adminSessionCookie() },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      revisionId: expect.any(String),
      hash: expect.any(String),
      items: expect.any(Array),
    });
  });
  it("returns 401 without auth", async () => { /* ... */ });
  it("returns 403 for non-admin", async () => { /* ... */ });
});
```

### Lane B page.spec.tsx

```ts
describe("/admin/schema page (ok branch)", () => {
  it("renders PageHead with eyebrow ADMIN / SCHEMA", async () => { /* ... */ });
  it("renders CURRENT REVISION card with revisionId/hash", async () => { /* ... */ });
  it("renders 4 stat cards (Unresolved/Added/Changed/Removed)", async () => { /* ... */ });
  it("renders SchemaDiffPanel with hideInlineStats=true", async () => { /* ... */ });
  it("renders REVISIONS list and ALIAS HISTORY in grid-2", async () => { /* ... */ });
});
describe("/admin/schema page (err branch)", () => {
  it("renders AdminSectionErrorClient and skips stats/panel/revisions", async () => { /* ... */ });
});
describe("/admin/schema page (token guard)", () => {
  it("contains no HEX color literal", async () => {
    const src = await readFile(pageFile, "utf-8");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
```

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run 'apps/web/app/(admin)/admin/schema/page.spec.tsx'
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/api test --run apps/api/src/routes/admin/schema.contract.spec.ts
ADMIN_SCHEMA_DIFF_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-11/screenshots mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/admin-schema-diff.spec.ts --project=visual-chromium
```

## カバレッジ目標

- Lane A: contract spec によりルート expose を 100% 保証（unit lane）
- Lane B: page.tsx の全 export / sub component を spec から呼ぶ（branch coverage 100%）
- Lane C: SchemaDiffPanel の新 prop `hideInlineStats` を両分岐
- Lane D: AdminSidebar の label 配列を assertion で固定

## ネガティブケース

- ペイロード `items=[]`（空 diff）でも stats=0/0/0/0 が描画されることを確認
- `revisions=undefined` で `<SchemaRevisionsList>` が空状態 placeholder を描画する
