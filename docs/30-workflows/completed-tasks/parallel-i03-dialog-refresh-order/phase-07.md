# Phase 07: テスト計画

## テスト方針

`vi.mock("next/navigation")` で `useRouter` をモックし、`callOrder` 配列に push する方式で順序を assert する。

## VisibilityRequestDialog.component.spec.tsx

```ts
import { vi, describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const callOrder: string[] = [];
const refresh = vi.fn(() => { callOrder.push("refresh"); });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

// mutation endpoint mock
vi.mock("@/lib/api/requests", () => ({
  requestVisibilityChange: vi.fn(async () => ({ ok: true, accepted: { /* ... */ } })),
}));

describe("VisibilityRequestDialog", () => {
  it("submit 成功時に refresh → onSubmitted → onClose の順で発火する", async () => {
    callOrder.length = 0;
    const onSubmitted = vi.fn(() => { callOrder.push("onSubmitted"); });
    const onClose = vi.fn(() => { callOrder.push("onClose"); });

    render(<VisibilityRequestDialog onSubmitted={onSubmitted} onClose={onClose} /* ... */ />);
    fireEvent.click(screen.getByRole("button", { name: /送信|submit/i }));

    await waitFor(() => {
      expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
    });
  });
});
```

## DeleteRequestDialog.component.spec.tsx

`VisibilityRequestDialog` と同一パターン。mutation mock 対象を `requestDeletion` に差し替える。

```ts
const callOrder: string[] = [];
const refresh = vi.fn(() => { callOrder.push("refresh"); });

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api/requests", () => ({
  requestDeletion: vi.fn(async () => ({ ok: true, accepted: { /* ... */ } })),
}));

it("submit 成功時に refresh → onSubmitted → onClose の順で発火する", async () => {
  // 同上
  expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
});
```

## RequestActionPanel.component.spec.tsx

parent 側で `router.refresh()` が**呼ばれないこと**を assert する。

```ts
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

it("dialog 提出後、parent 側から router.refresh は呼ばれない", async () => {
  render(<RequestActionPanel /* ... */ />);
  // dialog 提出を simulate (onSubmitted callback を直接呼ぶ)
  // ...
  expect(refresh).not.toHaveBeenCalled();
});
```

## 検証コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/VisibilityRequestDialog.component.spec
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/DeleteRequestDialog.component.spec
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/RequestActionPanel.component.spec
```

## Duplicate Pending Regression

success path に加え、`DUPLICATE_PENDING_REQUEST` でも旧 parent refresh の再取得を失わないことを assert する。

```ts
expect(callOrder).toEqual(["refresh", "onSubmitted"]);
expect(onClose).not.toHaveBeenCalled();
```

## カバレッジ目標

- 既存ケース: 不変（破壊しないこと）
- 追加ケース: success 順序 assertion 2 件、duplicate pending 順序 assertion 2 件、parent 非発火 1 件

## DoD

- [x] 3 spec の test が PASS
- [x] `expect(callOrder).toEqual(["refresh","onSubmitted","onClose"])` が 2 spec で通る
- [x] duplicate pending の `expect(callOrder).toEqual(["refresh","onSubmitted"])` が 2 spec で通る
- [x] `expect(refresh).not.toHaveBeenCalled()` が parent spec で通る
- [x] `outputs/phase-07/test-plan.md` に上記コード断片と検証コマンドを記載
