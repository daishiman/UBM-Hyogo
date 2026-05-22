# Phase 4: テスト作成（RED）

## 事前チェック

- 既存 `RegisterCallout.component.spec.tsx` を参照し、テストパターン（命名規則 `<Name>.component.spec.tsx` / `describe` ブロック構造 / Vitest + `render` + `screen`）に整合させる
- 依存関係整合: `mise exec -- pnpm install` 実行済みであることを確認

## テストファイル

`apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`（新規）

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CallToActionCTA } from "../CallToActionCTA";

describe("CallToActionCTA", () => {
  const RESPONDER_URL = "https://docs.google.com/forms/d/e/test/viewform";

  it("renders heading / body / cta with default props (AC-1, AC-5)", () => {
    const { container } = render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    expect(
      container.querySelector('[data-component="call-to-action-cta"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "メンバー情報の掲載をお願いします" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Google フォーム/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "回答フォームを開く" }),
    ).toBeInTheDocument();
  });

  it("binds responderUrl to anchor href (AC-4)", () => {
    render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link).toHaveAttribute("href", RESPONDER_URL);
  });

  it("sets external link safety attributes target/rel (AC-3)", () => {
    render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const link = screen.getByRole("link", { name: "回答フォームを開く" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("declares dark variant via data-variant attribute", () => {
    const { container } = render(<CallToActionCTA responderUrl={RESPONDER_URL} />);
    const section = container.querySelector('[data-component="call-to-action-cta"]');
    expect(section?.getAttribute("data-variant")).toBe("dark");
  });

  it("allows overriding heading / body / ctaLabel via props", () => {
    render(
      <CallToActionCTA
        responderUrl={RESPONDER_URL}
        heading="カスタム見出し"
        body="カスタル本文"
        ctaLabel="カスタル CTA"
      />,
    );
    expect(screen.getByRole("heading", { name: "カスタム見出し" })).toBeInTheDocument();
    expect(screen.getByText("カスタル本文")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "カスタル CTA" })).toBeInTheDocument();
  });
});
```

## constants の test

`apps/web/src/lib/constants/__tests__/form.spec.ts`（新規）

```ts
import { describe, expect, it } from "vitest";
import { FORM_RESPONDER_URL } from "../form";

describe("FORM_RESPONDER_URL", () => {
  it("matches the canonical value in CLAUDE.md (AC-4)", () => {
    expect(FORM_RESPONDER_URL).toBe(
      "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
    );
  });
});
```

## HomePage integration test（既存 spec があれば追記）

`apps/web/app/__tests__/page.spec.tsx` が存在する場合のみ追記。なければ Phase 6 で扱う。

```tsx
it("mounts CallToActionCTA section after MemberGrid (AC-2)", async () => {
  // HomePage は async server component のため、await して render
  // 既存 page test の fixture / mock を踏襲
  const ui = await HomePage();
  const { container } = render(ui);
  expect(
    container.querySelector('[data-component="call-to-action-cta"]'),
  ).not.toBeNull();
});
```

## TDD RED 期待

| テスト | RED 理由 |
|--------|---------|
| `CallToActionCTA.component.spec.tsx` 全 5 ケース | `CallToActionCTA.tsx` 未存在 → import error |
| `form.spec.ts` | `form.ts` 未存在 → import error |
| HomePage integration（存在する場合のみ） | mount 未配線 → `data-component="call-to-action-cta"` セレクタが見つからない |

## ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run \
  apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx \
  apps/web/src/lib/constants/__tests__/form.spec.ts
```

> 全件 `pnpm test` ではなく targeted run（FB-UI-02-2）。

## 完了条件

- [ ] テストファイル 2 件作成
- [ ] 全テスト RED（import error or selector not found）
- [ ] テスト命名規則 `<Name>.component.spec.tsx` / `<name>.spec.ts` に準拠
- [ ] `describe.skip` / `it.skip` / TODO を含めない

## 成果物

`outputs/phase-4/test-plan.md`
