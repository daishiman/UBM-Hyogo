# Phase 7: テスト設計

[実装区分: 実装仕様書]

Vitest（unit / integration） / Playwright smoke / jest-axe をどのファイルにどのケースで書くかを確定する。
DoD G-14-1..10 の検証手段。

---

## 1. テスト構成サマリ

| 層 | ツール | 対象 | コマンド |
|----|------|------|---------|
| unit | Vitest + Testing Library | `_components/*.tsx` | `pnpm --filter web test -- profile` |
| fetch mock | Vitest + `vi.mock` | submit payload 検証 | 同上 |
| a11y | jest-axe（Vitest 内） | 4 領域 + Dialog open | 同上 |
| e2e smoke | Playwright | `/profile` 画面遷移 | `pnpm --filter web test:e2e -- profile-smoke` |
| token gate | grep | `apps/web/app/profile/**` | `rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile` |

---

## 2. Vitest 単体テスト

### 2.1 `__tests__/PublicVisibilityBanner.test.tsx`（new）

```ts
describe("PublicVisibilityBanner", () => {
  it.each([
    [{ publishState: "public",  authGateState: "active" },         "success", /公開中/],
    [{ publishState: "member_only", authGateState: "active" },         "info",    /会員限定公開/],
    [{ publishState: "hidden", authGateState: "active" },         "warning", /非公開/],
    [{ publishState: "public",  authGateState: "rules_declined" },  "warning", /規約.*同意/],
    [{ publishState: "public",  authGateState: "deleted" },        "danger",  /削除待ち/],
  ])("props=%j → tone=%s, title matches %s", async (props, tone, re) => {
    render(<PublicVisibilityBanner {...props} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-tone", tone);
    expect(screen.getByText(re)).toBeInTheDocument();
  });

  it("no axe violation", async () => {
    const { container } = render(<PublicVisibilityBanner publishState="public" authGateState="active" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### 2.2 `__tests__/StatusSummary.test.tsx`（rebuild）

ケース:
- fields[] 空 → empty state 表示
- 全 public → 全 Badge `tone="info"`
- mixed (public/hidden) → Badge tone が混在
- `rulesConsent === "declined"` → warn Badge 表示
- `authGateState === "rules_declined"` → 補助 Badge 表示

### 2.3 `__tests__/RequestActionPanel.test.tsx`（追記）

| ケース | 期待 |
|-------|------|
| pending visibility あり | 公開範囲変更ボタン disabled、`<RequestPendingBanner type="visibility">` 表示 |
| pending delete あり | 削除ボタン disabled、`<RequestPendingBanner type="delete">` 表示 |
| pending 無し | 両 button enabled |
| pendingRequests key なし | disabled しない（API mirror は pending のみを object key として返す） |

### 2.4 `__tests__/VisibilityRequestDialog.test.tsx`（追記）

```ts
import { fetchAuthed } from "@/src/lib/fetch/authed";
vi.mock("@/src/lib/fetch/authed");

it("client island submit calls fetchAuthed with correct payload", async () => {
  vi.mocked(fetchAuthed).mockResolvedValue({ ok: true, requestId: "r1" });
  render(<VisibilityRequestClient disabled={false} currentState="public" />);
  await user.click(screen.getByLabelText(/非公開/));
  await user.type(screen.getByLabelText(/理由/), "test");
  await user.click(screen.getByRole("button", { name: /申請する/ }));
  expect(fetchAuthed).toHaveBeenCalledWith("/me/visibility-request", expect.objectContaining({
    method: "POST",
    body: expect.stringContaining(`"desiredState":"hidden"`),
  }));
});

it("submit disabled when note > 500 chars", () => {…});
it("cancel calls onClose", () => {…});
it("ESC closes dialog", () => {…});
```

### 2.5 `__tests__/DeleteRequestDialog.test.tsx`（追記）

| ケース | 期待 |
|-------|------|
| confirmText 不一致 | submit disabled |
| confirmText="削除を申請する" 完全一致 + composition 終了 | submit enabled |
| composition 中（`onCompositionStart` 後） | submit disabled |
| submit 成功 | onClose 呼ばれる + fetchAuthed 1 回 |
| submit 失敗 (500) | `<RequestErrorMessage>` 表示 + Sentry capture (mock) |

### 2.6 `__tests__/RequestPendingBanner.test.tsx`（追記）

- type="visibility" → 「公開範囲変更の申請を確認中」
- type="delete" → 「アカウント削除の申請を確認中」
- submittedAt が日本ロケールで表示される

### 2.7 `__tests__/RequestErrorMessage.test.tsx`（追記）

- `role="alert"` + `aria-live="polite"` 付与
- `onDismiss` 渡すと閉じる button 表示
- 渡さないと button 非表示

---

## 3. jest-axe（a11y）

各 component のテスト末尾に:

```ts
it("no axe critical violation", async () => {
  const { container } = render(<Component {...defaults} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

特に Dialog open 時の a11y は別 it で:

```ts
it("dialog open: focus trap + role=dialog", async () => {
  render(<VisibilityRequestDialog open … />);
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby");
});
```

---

## 4. Playwright smoke（`e2e/profile-smoke.spec.ts` への append）

| ケース | 前提 (fixture) | 期待 |
|-------|---------------|------|
| 未ログインで `/profile` | session なし | URL が `/login?redirect=/profile` に遷移 |
| 公開中 | publishState=public | `[data-region="public-visibility-banner"]` に「公開中」、4 領域 visible |
| 会員限定公開 | publishState=member_only | 「会員限定公開」表示、StatusSummary に public/hidden mix |
| 非公開 | publishState=hidden | 「非公開」warning Banner |
| pending visibility | mock pendingRequests | `RequestPendingBanner type=visibility` visible、申請 button disabled |
| pending delete | mock pendingRequests | 削除 button disabled |
| Dialog open | publish=public | trigger click → `role="dialog"` 出現、Tab で外に出ない（focus trap） |
| selector contract | any authenticated fixture | 5 selector visible or openable: `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog` |
| 削除確認入力 | open delete dialog | 「削除を申請する」打鍵まで submit disabled |

fixture：`apps/web/playwright/fixtures/profile.ts` を新規 or 既存に追加。
mock は `apps/web/app/api/me/[...path]/route.ts` を MSW で stub するか、Playwright の `page.route()` で stub。

---

## 5. token gate

```bash
rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile
```

- `apps/web/app/profile/**` 内に HEX (`#[0-9a-fA-F]{3,8}`) が出現したら fail
- `bg-[#…]` / `text-[#…]` の Tailwind arbitrary value も fail
- 既存実装の HEX 残存があれば本 task 内で除去

---

## 6. テスト実行手順

```bash
# 全部
mise exec -- pnpm --filter web test -- profile

# 個別
mise exec -- pnpm --filter web test -- PublicVisibilityBanner
mise exec -- pnpm --filter web test -- StatusSummary
mise exec -- pnpm --filter web test -- RequestActionPanel
mise exec -- pnpm --filter web test -- VisibilityRequestDialog
mise exec -- pnpm --filter web test -- DeleteRequestDialog
mise exec -- pnpm --filter web test -- RequestPendingBanner
mise exec -- pnpm --filter web test -- RequestErrorMessage

# Playwright
mise exec -- pnpm --filter web test:e2e -- profile-smoke

# tokens
rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile
```

---

## 7. 完了条件

- 7 件の Vitest spec が編集済 / 1 件が新規作成
- jest-axe assertion が全 component に存在
- Playwright spec に 8 ケース append
- token gate / typecheck / lint / 全テスト green
