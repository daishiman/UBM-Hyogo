---
phase: 6
title: テスト追加
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 6 — テスト追加 / 更新の詳細

[実装区分: 実装仕様書]

## 1. 共通方針

- `@testing-library/react` の `getByRole` / `findByText` / `queryByText` を優先し、`getByTestId` は属性検証ハッチに限定。
- `userEvent` v14 系を使用。`fireEvent` は使わない。
- a11y は `jest-axe` 互換 helper（プロジェクト既存）で `await axe(container)` → `expect(results).toHaveNoViolations()`。
- React 19 / Next 16 server-component 配下のため、Client component でない component は `render` で同期描画可能。

## 2. RegisterHeroCallout spec 追加ケース

```tsx
describe("RegisterHeroCallout (Hero)", () => {
  it("renders CTA with responderUrl and target/rel", () => {
    render(<RegisterHeroCallout responderUrl="https://example.com/form" />);
    const link = screen.getByRole("link", { name: /Google フォームを開く/ });
    expect(link).toHaveAttribute("href", "https://example.com/form");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("retains publicConsent / rulesConsent strings", () => {
    render(<RegisterHeroCallout responderUrl="https://e/" />);
    expect(screen.getByText(/publicConsent/)).toBeInTheDocument();
    expect(screen.getByText(/rulesConsent/)).toBeInTheDocument();
  });

  it("exposes data-component / data-role attributes", () => {
    const { container } = render(<RegisterHeroCallout responderUrl="https://e/" />);
    expect(container.querySelector('[data-component="register-callout"]')).toBeTruthy();
    expect(container.querySelector('[data-role="register-cta"]')).toBeTruthy();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<RegisterHeroCallout responderUrl="https://e/" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

## 3. FormPreviewSections spec 更新

既存テスト（section 数・stableKey 経由 field 描画）は維持しつつ以下を追加:

```tsx
it("opens only the first section by default", () => {
  const { container } = render(<FormPreviewSections preview={fixture} />);
  const details = container.querySelectorAll("details");
  expect(details[0]).toHaveAttribute("open");
  for (let i = 1; i < details.length; i++) expect(details[i]).not.toHaveAttribute("open");
});

it("toggles open on summary click", async () => {
  const user = userEvent.setup();
  const { container } = render(<FormPreviewSections preview={fixture} />);
  const summary = container.querySelectorAll("summary")[1];
  await user.click(summary!);
  expect(container.querySelectorAll("details")[1]).toHaveAttribute("open");
});

it("renders aggregate chips", () => {
  render(<FormPreviewSections preview={fixture} />);
  expect(screen.getByText(/公開 \d+項目/)).toBeInTheDocument();
  expect(screen.getByText(/会員限定 \d+項目/)).toBeInTheDocument();
  expect(screen.getByText(/全 \d+項目/)).toBeInTheDocument();
});
```

fixture は既存 spec の `FormPreviewView` mock を流用。新規 fixture は作らない。

## 4. RegisterStepGrid spec 新規

```tsx
it("renders 3 default steps", () => {
  render(<RegisterStepGrid />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText("STEP 01")).toBeInTheDocument();
  expect(screen.getByText("STEP 02")).toBeInTheDocument();
  expect(screen.getByText("STEP 03")).toBeInTheDocument();
});

it("accepts custom steps", () => {
  render(<RegisterStepGrid steps={[{ n: "AA", title: "T", description: "D" }]} />);
  expect(screen.getByText("STEP AA")).toBeInTheDocument();
});
```

## 5. RegisterFaq spec 新規

```tsx
it("renders items.length details", () => {
  render(<RegisterFaq items={[{q: "Q1", a: "A1"}, {q: "Q2", a: "A2"}]} />);
  expect(screen.getAllByRole("group")).toHaveLength(2); // details = group role
});

it("starts with all items closed", () => {
  const { container } = render(<RegisterFaq />);
  container.querySelectorAll("details").forEach((d) => expect(d).not.toHaveAttribute("open"));
});

it("toggles on summary click", async () => {
  const user = userEvent.setup();
  const { container } = render(<RegisterFaq items={[{q:"Q",a:"A"}]} />);
  const summary = container.querySelector("summary")!;
  await user.click(summary);
  expect(container.querySelector("details")).toHaveAttribute("open");
});
```

## 6. RegisterBottomCTA spec 新規

```tsx
it("renders CTA link with target/rel", () => {
  render(<RegisterBottomCTA responderUrl="https://e/" />);
  const link = screen.getByRole("link", { name: /Google フォームを開く/ });
  expect(link).toHaveAttribute("href", "https://e/");
  expect(link).toHaveAttribute("target", "_blank");
});

it("has inverted variant attribute", () => {
  const { container } = render(<RegisterBottomCTA responderUrl="https://e/" />);
  expect(container.querySelector('[data-variant="inverted"]')).toBeTruthy();
});
```

## 7. 既存 spec への影響

- `RegisterHeroCallout.component.spec.tsx` の既存ケース（基本描画・consent 文字列）は新ヘッダー構造でも維持可能。snapshot がある場合は意図的更新。
- `FormPreviewSections.component.spec.tsx` の section 数 / stableKey 経由検証ケースは `<details>` 構造下でも `data-stable-key` 属性で同じセレクタが通る想定。`<ul>` 直下から `<details><ul>` 入れ子に変わる点だけ、DOM tree 探索を `container.querySelectorAll` ベースに揃える。
