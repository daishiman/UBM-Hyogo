// TagsQueueResolveDrawer: a11y / validation / mutation 配線
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const triggerMock = vi.fn();
const useAdminMutationMock = vi.fn();

vi.mock("../../../features/admin/hooks/useAdminMutation", () => ({
  useAdminMutation: (...args: unknown[]) => useAdminMutationMock(...args),
}));

import { TagsQueueResolveDrawer } from "../TagsQueueResolveDrawer";

let capturedOptions: Record<string, unknown> | undefined;

beforeEach(() => {
  triggerMock.mockReset();
  triggerMock.mockResolvedValue({ ok: true, result: { idempotent: false } });
  useAdminMutationMock.mockReset();
  useAdminMutationMock.mockImplementation(
    (_endpoint: string, _method: string, options: Record<string, unknown>) => {
      capturedOptions = options;
      return { trigger: triggerMock, isLoading: false, error: null };
    },
  );
});

afterEach(() => cleanup());

const baseProps = {
  queueId: "q_1",
  memberId: "m_1",
  suggestedTags: ["tag-a", "tag-b"] as const,
  status: "queued" as const,
  open: true,
  onClose: vi.fn(),
  onResolved: vi.fn(),
};

describe("TagsQueueResolveDrawer", () => {
  it("TC-D-01: open=true で role=dialog + aria-modal=true", () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    const dlg = screen.getByRole("dialog");
    expect(dlg.getAttribute("aria-modal")).toBe("true");
  });

  it("TC-D-02: initial focus が最初の focusable に当たる", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    await waitFor(() => {
      expect(document.activeElement?.tagName).toBe("INPUT");
    });
  });

  it("TC-D-03: ESC で onClose が呼ばれる", () => {
    const onClose = vi.fn();
    render(<TagsQueueResolveDrawer {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("TC-D-04: confirmed: suggestedTags が全選択初期化される", () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    const cbs = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(cbs.length).toBe(2);
    expect(cbs.every((c) => c.checked)).toBe(true);
  });

  it("TC-D-05: confirmed で全 checkbox を外して submit すると inline error + trigger 未呼出", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    const cbs = screen.getAllByRole("checkbox") as HTMLInputElement[];
    cbs.forEach((c) => fireEvent.click(c));
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() =>
      expect(screen.getByTestId("admin-tag-resolve-error")).toBeTruthy(),
    );
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("TC-D-06: confirmed: 通常 submit で { action, tagCodes } が trigger に渡る", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(triggerMock).toHaveBeenCalledTimes(1));
    expect(triggerMock).toHaveBeenCalledWith({
      action: "confirmed",
      tagCodes: ["tag-a", "tag-b"],
    });
  });

  it("TC-D-07: rejected: reason が空だと inline error + trigger 未呼出", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByLabelText("却下"));
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() =>
      expect(screen.getByTestId("admin-tag-resolve-error")).toBeTruthy(),
    );
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("TC-D-08: rejected: trim 済 reason で { action, reason } が trigger に渡る", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByLabelText("却下"));
    const ta = screen.getByLabelText(/却下理由/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "  不一致  " } });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(triggerMock).toHaveBeenCalledTimes(1));
    expect(triggerMock).toHaveBeenCalledWith({ action: "rejected", reason: "不一致" });
  });

  it("TC-D-09: terminal status (resolved) で送信が aria-disabled=true", () => {
    render(<TagsQueueResolveDrawer {...baseProps} status="resolved" />);
    const btn = screen.getByRole("button", { name: "送信" });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("TC-D-09b: status=dlq でも送信が aria-disabled=true", () => {
    render(<TagsQueueResolveDrawer {...baseProps} status="dlq" />);
    expect(screen.getByRole("button", { name: "送信" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("TC-D-10: mutation 成功 → onResolved + onClose が順に呼ばれる（hook の onSuccess 経由）", async () => {
    const onResolved = vi.fn();
    const onClose = vi.fn();
    render(
      <TagsQueueResolveDrawer
        {...baseProps}
        onResolved={onResolved}
        onClose={onClose}
      />,
    );
    // hook の onSuccess を直接呼ぶ
    (capturedOptions?.onSuccess as (d: unknown) => void)?.({});
    expect(onResolved).toHaveBeenCalledWith("q_1");
    expect(onClose).toHaveBeenCalled();
  });

  it("TC-D-11 (RISK-2): idempotent=true で successMessage が「既に処理済です」", () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    const fn = capturedOptions?.successMessage as (d: unknown) => string;
    expect(fn({ ok: true, result: { idempotent: true } })).toBe("既に処理済です");
  });

  it("successMessage は confirmed action で「承認しました」", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(triggerMock).toHaveBeenCalled());
    const fn = capturedOptions?.successMessage as (d: unknown) => string;
    expect(fn({ ok: true, result: { idempotent: false } })).toBe("承認しました");
  });

  it("successMessage は rejected action で「却下しました」", async () => {
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByLabelText("却下"));
    const ta = screen.getByLabelText(/却下理由/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(triggerMock).toHaveBeenCalled());
    const fn = capturedOptions?.successMessage as (d: unknown) => string;
    expect(fn({ ok: true, result: { idempotent: false } })).toBe("却下しました");
  });

  it("RISK-3: rejected submit と同一 tick で successMessage を評価しても却下 toast になる", async () => {
    let messageDuringTrigger = "";
    useAdminMutationMock.mockImplementation(
      (_endpoint: string, _method: string, options: Record<string, unknown>) => {
        capturedOptions = options;
        return {
          isLoading: false,
          error: null,
          trigger: vi.fn(async () => {
            messageDuringTrigger = (options.successMessage as (d: unknown) => string)({
              ok: true,
              result: { idempotent: false },
            });
            return { ok: true, result: { idempotent: false } };
          }),
        };
      },
    );
    render(<TagsQueueResolveDrawer {...baseProps} />);
    fireEvent.click(screen.getByLabelText("却下"));
    fireEvent.change(screen.getByLabelText(/却下理由/), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(messageDuringTrigger).toBe("却下しました"));
  });

  it("RISK-1: suggestedTags=[] では confirmed radio が disabled、初期 action は rejected", () => {
    render(<TagsQueueResolveDrawer {...baseProps} suggestedTags={[]} />);
    const confirmedRadio = screen.getByLabelText("承認") as HTMLInputElement;
    expect(confirmedRadio.disabled).toBe(true);
    const rejectedRadio = screen.getByLabelText("却下") as HTMLInputElement;
    expect(rejectedRadio.checked).toBe(true);
  });

  it("open=false なら何も render しない", () => {
    render(<TagsQueueResolveDrawer {...baseProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("endpoint が encodeURIComponent された queueId を使う", () => {
    render(<TagsQueueResolveDrawer {...baseProps} queueId="q/1" />);
    const endpoint = useAdminMutationMock.mock.calls.at(-1)?.[0];
    expect(endpoint).toBe("/api/admin/tags/queue/q%2F1/resolve");
  });
});
