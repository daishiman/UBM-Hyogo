// step-07: RequestQueueDetail presentational tests
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestQueueDetail } from "../RequestQueueDetail";
import type { RequestQueueItem } from "../RequestQueuePanel";

afterEach(() => cleanup());

const baseItem: RequestQueueItem = {
  noteId: "note_v_1",
  memberId: "m_alice",
  noteType: "visibility_request",
  requestStatus: "pending",
  requestedAt: "2026-04-30T00:00:00Z",
  requestedReason: "一時停止したい",
  requestedPayload: { desiredState: "hidden" },
  memberSummary: {
    memberId: "m_alice",
    publicHandle: null,
    publishState: "public",
    isDeleted: false,
  },
};

describe("RequestQueueDetail", () => {
  let onApprove: ReturnType<typeof vi.fn>;
  let onReject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onApprove = vi.fn();
    onReject = vi.fn();
  });

  it("TC-D-01: item=null で placeholder を表示", () => {
    render(
      <RequestQueueDetail
        item={null}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(
      screen.getByText("左の一覧から依頼を選択してください。"),
    ).toBeDefined();
  });

  it("TC-D-02: item を渡すと詳細を描画する", () => {
    render(
      <RequestQueueDetail
        item={baseItem}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(screen.getByText(/note_v_1/)).toBeDefined();
    expect(screen.getByText(/一時停止したい/)).toBeDefined();
    expect(screen.getByText(/desiredState: hidden/)).toBeDefined();
  });

  it("TC-D-03: 承認 callback が呼ばれる", () => {
    render(
      <RequestQueueDetail
        item={baseItem}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByText("承認する"));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("TC-D-04: 却下 callback が呼ばれる", () => {
    render(
      <RequestQueueDetail
        item={baseItem}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByText("却下する"));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("TC-D-05: busy=true で button が disabled", () => {
    render(
      <RequestQueueDetail
        item={baseItem}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={true}
      />,
    );
    expect(
      (screen.getByText("承認する") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByText("却下する") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("TC-D-06: requestStatus !== pending で button が disabled", () => {
    render(
      <RequestQueueDetail
        item={{ ...baseItem, requestStatus: "resolved" }}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(
      (screen.getByText("承認する") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("TC-D-07: delete_request の label を描画", () => {
    render(
      <RequestQueueDetail
        item={{ ...baseItem, noteType: "delete_request" }}
        type="delete_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(screen.getByText("退会")).toBeDefined();
  });
});
