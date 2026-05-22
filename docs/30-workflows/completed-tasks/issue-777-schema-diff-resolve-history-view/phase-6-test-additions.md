# Phase 6: テスト追加

Phase 4 §3-§4 で確定したテストケースを、vitest の describe / it ツリーに落とし込む。本 Phase は spec ファイル 2 件の構造を確定する責務のみを持ち、Phase 5 §2.5 / §2.6 で実体ファイルを作成する。

---

## 1. component spec: `SchemaDiffHistoryPanel.component.spec.tsx`

### 1.1 ファイル配置と命名

| 項目 | 値 |
|---|---|
| ファイル | `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` |
| 命名規約 | `.spec.tsx`（不変条件 #8） |
| import setup | `@testing-library/jest-dom/vitest` は `apps/web/vitest.setup.ts` で global 適用済み（既存）。本 spec で個別 import は不要 |
| fetch モック | `vi.mock("../../../lib/admin/api", () => ({ fetchSchemaAliasHistory: vi.fn() }))` で helper を直接モック。`globalThis.fetch` 差し替えは helper 側 spec で実施 |
| router モック | `vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }))` |

### 1.2 describe / it 階層

```
describe("SchemaDiffHistoryPanel", () => {

  describe("表示・構造", () => {
    it("時系列降順で 5 カラム row を描画する (TC-C-01, TC-C-02)");
    it("shared primitive (Breadcrumb / FormField / Pagination / EmptyState) を再利用する (TC-C-07)");
  });

  describe("観点(i) filter 入力", () => {
    it("actorEmail を入力して submit すると URL search params に反映される (TC-C-03a)");
    it("from / to の date range を URL に反映する (TC-C-03b)");
    it("questionTextLike を URL に反映しない (TC-C-03c)");
    it("actorEmail を入力時に小文字正規化する (TC-C-03d)");
  });

  describe("観点(ii) pagination 操作", () => {
    it("nextCursor あり時に「次の 50 件」ボタンが enabled (TC-C-04)");
    it("「次の 50 件」クリックで cursor 付き fetch が走り items が次ページに置換される (TC-C-05a)");
    it("nextCursor null 時にボタンが disabled または非表示 (TC-C-05b)");
  });

  describe("観点(iii) 空状態", () => {
    it("items 空配列で EmptyState「該当する履歴がありません」を表示する (TC-C-06)");
    it("空状態では Pagination ボタンが描画されない (TC-C-06)");
  });

  describe("観点(iv) fetch error", () => {
    it("追加 fetch が reject すると role=\"alert\" にエラー文言を表示する (TC-C-08b)");
    it("追加 fetch 失敗時も既存 items は保持される (fail-soft, TC-C-08b)");
  });

  describe("アクセシビリティ", () => {
    it("Breadcrumb navigation landmark に admin > schema > history を含む (TC-C-09a)");
    it("テーブルに aria-label=\"resolve 履歴\" を持つ (TC-C-09b)");
    it("filter form に role=\"search\" を持つ (TC-C-09c)");
    it("次ページ fetch 中に container が aria-busy=\"true\" を持つ (TC-C-09d)");
  });

});
```

### 1.3 testing-library クエリ規約

| 取得対象 | 推奨クエリ |
|---|---|
| Breadcrumb | `screen.getByRole("navigation", { name: /breadcrumb|パンくず/i })` |
| 履歴テーブル | `screen.getByRole("table", { name: /resolve 履歴/ })` |
| filter form | `screen.getByRole("search")` |
| input | `screen.getByLabelText("操作者 email")` 等、`FormField` の label から逆引き |
| 次ページボタン | `screen.getByRole("button", { name: /次の 50 件/ })` |
| empty state 文言 | `screen.getByText("該当する履歴がありません")` |
| error 表示 | `screen.getByRole("alert")` |
| aria-busy container | `container.querySelector('[aria-busy="true"]')` または `screen.getByRole("table").closest('[aria-busy]')` |
| 行（時系列順） | `screen.getAllByRole("row")` の先頭が最新（thead を除外して比較） |

### 1.4 モック方針

- `fetchSchemaAliasHistory` は `vi.mock` で完全置換し、`vi.mocked(fetchSchemaAliasHistory).mockResolvedValueOnce({...})` でテスト個別に振る舞いを与える
- `router.replace` の呼び出し引数を `expect(replaceMock).toHaveBeenCalledWith(expect.stringContaining("actorEmail=foo%40example.com"))` で検証
- date input の操作は `fireEvent.change(input, { target: { value: "2026-01-01" } })`
- ボタンクリックは `await userEvent.click(button)`、追加 fetch の解決は `await waitFor(() => expect(...).toBeInTheDocument())`
- MSW は採用しない（apps/web の admin 系慣習に反するため）

### 1.5 fixture データ

```ts
const fixtureItem = (overrides: Partial<SchemaAliasHistoryItem> = {}): SchemaAliasHistoryItem => ({
  auditId: "a1",
  actorEmail: "admin@example.com",
  createdAt: "2026-05-19T10:00:00.000Z",
  beforeStableKey: null,
  afterStableKey: "fullName",
  questionText: "氏名を教えてください",
  ...overrides,
});

const fixturePage = (count = 50, nextCursor: string | null = "cursor-2") => ({
  items: Array.from({ length: count }, (_, i) =>
    fixtureItem({
      auditId: `a${i}`,
      createdAt: new Date(Date.now() - i * 60_000).toISOString(),
    }),
  ),
  nextCursor,
});
```

---

## 2. helper unit spec: `api.spec.ts`（拡張）

### 2.1 既存ファイル末尾への追加

`apps/web/src/lib/admin/__tests__/api.spec.ts` は既存 fetch 直モック方式（`globalThis.fetch = vi.fn()`）を採用済み。同じパターンで以下 describe ブロックを追加する。

### 2.2 describe / it 階層

```
describe("fetchSchemaAliasHistory()", () => {

  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("export を持つ (TC-H-01)");
  it("既定 query で /api/admin/audit?action=schema_diff.alias_assigned&limit=50 を GET する (TC-H-02)");
  it("cursor を URL query に乗せる (TC-H-03)");
  it("actorEmail / from / to を URL query に乗せ、questionTextLike は乗せない (TC-H-04)");
  it("actorEmail を小文字化する (TC-H-04b)");
  it("200 OK で zod parse 成功して投影された items を返す (TC-H-05)");
  it("payload schema 不整合で throw する (TC-H-06)");
  it("HTTP 5xx で throw する (TC-H-07)");
  it("questionTextLike を URLSearchParams に含めない (TC-H-08)");
});

describe("lib/admin/api.ts (不変条件・拡張)", () => {
  it("fetchSchemaAliasHistory 追加後も #11 / #13 不変条件 pattern にマッチしない (TC-H-09)");
});
```

### 2.3 mock response 構造（案 A 前提）

```ts
const auditOk = (items: unknown[], nextCursor: string | null = null) =>
  new Response(JSON.stringify({ ok: true, items, nextCursor, appliedFilters: {} }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

const auditRow = (overrides: Record<string, unknown> = {}) => ({
  auditId: "a1",
  actorId: "u1",
  actorEmail: "admin@example.com",
  action: "schema_diff.alias_assigned",
  targetType: "schema",
  targetId: "q1",
  maskedBefore: { stableKey: null },
  maskedAfter: { stableKey: "fullName", questionText: "氏名" },
  parseError: false,
  createdAt: "2026-05-19T10:00:00.000Z",
  ...overrides,
});
```

### 2.4 URL 検証パターン

```ts
expect(fetchSpy).toHaveBeenCalledTimes(1);
const url = String(fetchSpy.mock.calls[0][0]);
expect(url).toContain("/api/admin/audit?");
expect(url).toContain("action=schema_diff.alias_assigned");
expect(url).toContain("limit=50");
expect(url).toContain("actorEmail=foo%40example.com");
expect(url).not.toContain("questionTextLike=");
```

### 2.5 schema 不整合の throw 検証

```ts
fetchSpy.mockResolvedValueOnce(
  auditOk([{ auditId: 123 /* number だが string 必須 */ }]),
);
await expect(adminApi.fetchSchemaAliasHistory()).rejects.toThrow();
```

---

## 3. 追加検討して見送ったケース

| ケース | 見送り理由 |
|---|---|
| MSW 採用 | 既存 admin api spec が `globalThis.fetch = vi.fn()` で統一されているため、慣習を踏襲して一貫性を取る |
| visual regression (Playwright screenshot) | task-709 baseline 経路は別 PR で運用中。本タスク scope 外 |
| rollback button 起動 | followup-004 で別タスク。本タスクでは row に `data-audit-id` 付与のみで終わる |
| breadcrumb の Link 遷移先 e2e | unit spec では `getByRole("navigation")` 構造確認まで。e2e は playwright-smoke 側で追加判断 |
| reduced-motion での pulse | 本 component は skeleton を持たないため対象外 |

---

## 4. テスト実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  src/lib/admin/__tests__/api.spec.ts
```

全 it が PASS することが本 Phase の DoD。
