# Phase 4: テスト戦略 (Red)

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 前 Phase | 3 (データモデル / 契約) |
| 次 Phase | 5 (実装 Green) |
| 状態 | completed |

## 目的

実装着手前に Red テストを `*.spec.tsx` で作成し、Phase 5 で GREEN に転じる契約を固定する。

> CLAUDE.md 不変条件: 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。

## 追加するテスト

### 1. `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`（新規）

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CallToActionCTA } from "../CallToActionCTA";

const HREF = "https://example.test/form";

describe("CallToActionCTA", () => {
  it("default 見出し・本文・CTA ラベルを表示する", () => {
    render(<CallToActionCTA responderUrl={HREF} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "メンバー情報の掲載をお願いします",
    );
    expect(screen.getByRole("link", { name: "回答フォームを開く" })).toBeInTheDocument();
  });

  it("CTA は responderUrl を href に持ち、外部リンク属性が付与される", () => {
    render(<CallToActionCTA responderUrl={HREF} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link).toHaveAttribute("href", HREF);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("root section に data-component=call-to-action-cta を持つ", () => {
    const { container } = render(<CallToActionCTA responderUrl={HREF} />);
    const section = container.querySelector('section[data-component="call-to-action-cta"]');
    expect(section).not.toBeNull();
  });

  it("カスタム heading / body / ctaLabel が反映される", () => {
    render(
      <CallToActionCTA responderUrl={HREF} heading="H" body="B" ctaLabel="L" />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("H");
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "L" })).toBeInTheDocument();
  });
});
```

### 2. `apps/web/app/__tests__/page.spec.tsx`（既存編集）

> 既存 spec の構成を Phase 5 実装着手前に確認し、無ければ新規 `apps/web/app/page.spec.tsx` として作成する。

追加 assertion:

- HomePage を render した結果に `data-component="call-to-action-cta"` を持つ section が 1 個含まれる
- レンダリング順序: `members.items.length > 0` fixture では `Hero → Stats → ZoneIntro → Timeline → MemberGrid → CallToActionCTA`（DOM 上で後方に出現）
- `members.items.length === 0` fixture では `MemberGrid` 不在でも `CallToActionCTA` が `<main>` の最終 `[data-component]` として出現

```ts
it("MemberGrid がある場合は後ろに CallToActionCTA が描画される", async () => {
  const { container } = render(await HomePage());
  const sections = Array.from(container.querySelectorAll("[data-component]"));
  const idx = (name: string) =>
    sections.findIndex((el) => el.getAttribute("data-component") === name);
  expect(idx("member-grid")).toBeGreaterThanOrEqual(0);
  expect(idx("call-to-action-cta")).toBeGreaterThan(idx("member-grid"));
});

it("MemberGrid がない場合も CallToActionCTA は main の最終 section に描画される", async () => {
  const { container } = render(await HomePage());
  const sections = Array.from(container.querySelectorAll("main [data-component]"));
  expect(sections.at(-1)?.getAttribute("data-component")).toBe("call-to-action-cta");
});
```

> Server Component の async render については既存 spec のパターンに合わせる（mock API fetch を含む場合は既存 helper を流用）。

### 3. design-tokens grep gate（CI 既設）

新規 `CallToActionCTA.tsx` / `.module.css`（または同等）に対し、`verify-design-tokens` が
HEX 直書き / `bg-[#` / `text-[#` を検出しないこと。新規 spec ではなく既設 CI gate に依存。

## Red 確認手順

Phase 5 実装前に下記が **FAIL** することを確認:

```bash
pnpm test -- CallToActionCTA.component.spec
pnpm test -- apps/web/app/__tests__/page.spec
```

## 完了条件

- 上記 spec ファイルが新規作成され Red 状態
- `vitest` runner で対象 spec が discover される
