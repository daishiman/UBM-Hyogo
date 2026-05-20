# Phase 06 — 実装手順

## Step 1: hook 実装

`apps/web/src/lib/a11y/useAutoFocusOnMount.ts` を新規作成。Phase 02 の参照実装どおり。

## Step 2: hook 単体 spec 実装

`apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useAutoFocusOnMount } from "../useAutoFocusOnMount";

function TestHarness({ withRef }: { withRef: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useAutoFocusOnMount(ref);
  return withRef ? <div ref={ref} tabIndex={-1} data-testid="t" /> : null;
}

describe("useAutoFocusOnMount", () => {
  it("calls focus({ preventScroll: true }) once on mount", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<TestHarness withRef />);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    focusSpy.mockRestore();
  });

  it("is noop when ref.current is null", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    expect(() => render(<TestHarness withRef={false} />)).not.toThrow();
    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it("does not refocus on re-render", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    const { rerender } = render(<TestHarness withRef />);
    rerender(<TestHarness withRef />);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    focusSpy.mockRestore();
  });
});
```

## Step 3: root `app/error.tsx` 置換

```tsx
"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { logger } from "../src/lib/logger";
import { useAutoFocusOnMount } from "../src/lib/a11y/useAutoFocusOnMount";

export default function RouteError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);
  useEffect(() => {
    logger.error({ event: "error.boundary.caught", digest: error.digest, err: error });
  }, [error]);
  // ... JSX 不変
}
```

## Step 4: login/profile/admin error.tsx に hook 適用

各ファイルで以下を実施:

1. `import { useRef } from "react";` 追加
2. `import { useAutoFocusOnMount } from "<相対パス>/src/lib/a11y/useAutoFocusOnMount";` 追加
3. 関数内で `const headingRef = useRef<HTMLHeadingElement>(null);` と `useAutoFocusOnMount(headingRef);`
4. `<h1>` に `ref={headingRef} tabIndex={-1}` 追加
5. 既存 `useEffect(console.error)` は維持

## Step 5: 各 boundary spec 新規/編集

各 `error.component.spec.tsx` で以下を assert:

```tsx
it("focuses h1 on mount with preventScroll", () => {
  const focusSpy = vi.spyOn(HTMLHeadingElement.prototype, "focus");
  render(<LoginError error={new Error("x")} reset={vi.fn()} />);
  expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  focusSpy.mockRestore();
});
```

## Step 6: 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web vitest run --reporter=verbose \
  src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx \
  app/__tests__/error.component.spec.tsx \
  app/login/__tests__/error.component.spec.tsx \
  app/profile/__tests__/error.component.spec.tsx \
  "app/(admin)/admin/__tests__/error.component.spec.tsx"
```
