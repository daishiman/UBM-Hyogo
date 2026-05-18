---
phase: 6
title: テスト方針 — error/not-found/loading の振る舞い検証
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テストの粒度方針

| 粒度 | 範囲 | このサブワークフロー |
|------|------|--------------------|
| component spec | primitive レベル | 既存テスト維持。新規追加なし |
| integration spec | layout / fallback 4 ファイル | **本サブワークフローの主戦場** |
| e2e (Playwright visual) | route 横断スクリーン | serial-07 担当（本サブワークフロー対象外） |

すべて `*.spec.{ts,tsx}` suffix を使用する（`*.test.*` 禁止 / CLAUDE.md 不変条件 #8）。

## 2. テスト対象

| ファイル | テストパス（新規） | 主要観点 |
|---------|------------------|---------|
| `app/layout.tsx` | `apps/web/app/__tests__/layout.spec.tsx` | metadata / viewport / `data-theme` / ToastProvider 配置 |
| `app/error.tsx` | `apps/web/app/__tests__/error.spec.tsx` | throw 発火時の Card 構造 / reset 呼び出し / logger 記録 |
| `app/not-found.tsx` | `apps/web/app/__tests__/not-found.spec.tsx` | a11y 属性 / Card + EmptyState 構造 / 2 つの Link |
| `app/loading.tsx` | `apps/web/app/__tests__/loading.spec.tsx` | `role="status"` / `aria-busy` / skeleton 矩形数 |

> 既存に `apps/web/app/__smoke__/` 配下のスモークが存在するが、本サブワークフローの spec は `__tests__/` 配下に配置する。

## 3. 各テストの具体方針

### 3.1 `layout.spec.tsx`

```ts
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import RootLayout, { metadata, viewport } from "../layout";
```

検証項目:

- `metadata.title.default === "UBM Hyogo"` / `template === "%s | UBM Hyogo"`
- `viewport.width === "device-width"` / `initialScale === 1`
- render 結果に `<html lang="ja" data-theme="warm">` が含まれる
- ToastProvider が 1 度だけ tree に出現する（`querySelectorAll('[data-toast-provider]')` 等 — 必要なら Toast.tsx 側に marker 追加）

> Next.js の `<html>` レンダリング制約で React Testing Library が直接 `<html>` を render できない場合は、children のみ render し metadata/viewport export の値検証だけに絞る。

### 3.2 `error.spec.tsx`

意図的に throw する Client Component を render し、error boundary の発火を観測する代わりに、error.tsx を **直接 render** して props 契約と DOM 構造を検証する（Next の boundary は jsdom では再現困難なため）。

```ts
import { render, screen, fireEvent } from "@testing-library/react";
import RouteError from "../error";

it("reset() が button onClick で呼ばれる", () => {
  const reset = vi.fn();
  render(<RouteError error={Object.assign(new Error("x"), { digest: "abc" })} reset={reset} />);
  fireEvent.click(screen.getByRole("button", { name: /再試行/ }));
  expect(reset).toHaveBeenCalledOnce();
});

it("digest が表示される", () => {
  render(<RouteError error={Object.assign(new Error("x"), { digest: "abc" })} reset={() => {}} />);
  expect(screen.getByText(/abc/)).toBeInTheDocument();
});

it("logger.error が呼ばれる", () => {
  const spy = vi.spyOn(logger, "error");
  render(<RouteError error={new Error("x")} reset={() => {}} />);
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ event: "error.boundary.caught" }));
});
```

### 3.3 `not-found.spec.tsx`

```ts
import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

it("a11y 属性が存在する", () => {
  const { container } = render(<NotFound />);
  expect(container.querySelector("[data-page='not-found']")).toBeTruthy();
  expect(container.querySelector("[data-testid='not-found']")).toBeTruthy();
});

it("2 つの遷移リンクが存在する", () => {
  render(<NotFound />);
  expect(screen.getByRole("link", { name: /トップ/ })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: /メンバー/ })).toHaveAttribute("href", "/members");
});
```

### 3.4 `loading.spec.tsx`

```ts
import { render } from "@testing-library/react";
import Loading from "../loading";

it("status role と aria-busy が設定される", () => {
  const { container } = render(<Loading />);
  const root = container.querySelector("[data-page='loading']");
  expect(root).toHaveAttribute("role", "status");
  expect(root).toHaveAttribute("aria-busy", "true");
});

it("skeleton 矩形が 4 段ある", () => {
  const { container } = render(<Loading />);
  expect(container.querySelectorAll(".motion-safe\\:animate-pulse").length).toBeGreaterThanOrEqual(4);
});
```

## 4. Suspense / NotFound 発火の実証（任意）

統合的に Suspense boundary を強制発火させたい場合は serial-07 の Playwright で扱う。本サブワークフローでは:

- `notFound()` 発火経路: `app/(public)/members/[id]/page.tsx` 等から `notFound()` 呼び出し → root `not-found.tsx` 描画。これは serial-05 で実装される page.tsx に依存するため本サブワークフローでは検証しない
- Suspense fallback: page 側で `await fetch(...)` を含む RSC が render を保留している間 `loading.tsx` が表示される。同上で serial-05 依存

## 5. 既存スモークとの関係

`apps/web/app/__smoke__/loading-state/loading.tsx` / `apps/web/app/smoke/loading-state/loading.tsx` は別目的の smoke route。本サブワークフローでは触らない。

## 6. テスト追加範囲のまとめ

| 種別 | 新規ファイル数 | 想定 case 数 |
|------|--------------|------------|
| Unit (component) | 4 | 約 10 |
| Integration | 0 | — |
| E2E | 0 | serial-07 |

## 7. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/app/__tests__/error.spec.tsx
```

## 8. 参照

- Phase 5 実装ガイド
- `apps/web/vitest.config.ts`
- `apps/web/src/components/ui/__tests__/` 既存テスト構成
- `apps/web/src/lib/logger.ts`
