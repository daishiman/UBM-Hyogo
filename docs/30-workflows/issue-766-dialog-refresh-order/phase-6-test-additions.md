# Phase 6: テスト追加

## 1. テスト変更ファイル

| Path | 操作 |
|------|------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | modify: `useRouter` モック追加 + 順序 assertion (TC-D1/D3/D5) |
| `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | modify: 同上 (TC-D2/D4/D5) |
| `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx` | modify: parent 由来 refresh 非発火 (TC-P1) |

## 2. 追加テスト雛形

### VisibilityRequestDialog.component.spec.tsx

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../src/lib/api/me-requests", () => ({
  requestVisibilityChange: vi.fn(),
  AuthRequiredError: class AuthRequiredError extends Error {},
}));

import { requestVisibilityChange } from "../../../src/lib/api/me-requests";
import { VisibilityRequestDialog } from "./VisibilityRequestDialog";

describe("VisibilityRequestDialog — refresh order (issue #766)", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.mocked(requestVisibilityChange).mockReset();
  });

  it("TC-D1: 成功時は refresh → onSubmitted → onClose の順で副作用が発生する", async () => {
    const callOrder: string[] = [];
    refresh.mockImplementation(() => callOrder.push("refresh"));
    const onSubmitted = vi.fn(() => callOrder.push("onSubmitted"));
    const onClose = vi.fn(() => callOrder.push("onClose"));
    vi.mocked(requestVisibilityChange).mockResolvedValue({
      ok: true,
      accepted: {
        queueId: "q-1",
        type: "visibility_request",
        status: "pending",
        createdAt: "2026-05-17T00:00:00Z",
      },
    });

    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("visibility-submit"));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(callOrder).toEqual(["refresh", "onSubmitted", "onClose"]);
  });

  it("TC-D3: エラー時は refresh が発火しない", async () => {
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    vi.mocked(requestVisibilityChange).mockResolvedValue({
      ok: false,
      code: "SERVER",
    });
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("visibility-submit"));
    await waitFor(() =>
      expect(vi.mocked(requestVisibilityChange)).toHaveBeenCalled(),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("TC-D5: DUPLICATE_PENDING_REQUEST 時も refresh は発火しない", async () => {
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    vi.mocked(requestVisibilityChange).mockResolvedValue({
      ok: false,
      code: "DUPLICATE_PENDING_REQUEST",
    });
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("visibility-submit"));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

### DeleteRequestDialog.component.spec.tsx

`VisibilityRequestDialog` のテストを `requestDelete` / `delete-submit` testid / 不可逆 checkbox の事前 check を加えて複製。順序 assertion は同じ `["refresh","onSubmitted","onClose"]`。

### RequestActionPanel.component.spec.tsx

```tsx
it("TC-P1: parent 由来の router.refresh() は呼ばれない (issue #766)", async () => {
  // useRouter mock: refresh = vi.fn()
  // RequestActionPanel を render し、dialog の onSubmitted を経由しない経路の callback を invoke
  // 期待: refresh.mock.calls.length === 0
});
```

`RequestActionPanel.component.spec.tsx` の既存テストで「parent で refresh が呼ばれる」前提のケースがあれば、その assertion を「**呼ばれない**」に反転して更新する。

## 3. 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/VisibilityRequestDialog.component.spec
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/DeleteRequestDialog.component.spec
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components/RequestActionPanel.component.spec
```

## 4. DoD

- [ ] 全テストファイルが上記雛形を反映している
- [ ] TC-D1/D2/D3/D4/D5/P1 が PASS
- [ ] 既存テストの green 維持
