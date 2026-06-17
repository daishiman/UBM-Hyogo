// step-07: RequestQueueDetail presentational tests
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPublishStateDiff,
  formatPublishStateLabel,
  RequestQueueDetail,
} from "../RequestQueueDetail";
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
      screen.getByText("左の一覧から申請を選択してください。"),
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
    expect(screen.getByText("公開状態の変更")).toBeDefined();
    expect(screen.getByText("公開").getAttribute("data-diff-side")).toBe("before");
    expect(screen.getByText("非公開").getAttribute("data-diff-side")).toBe("after");
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
    expect(screen.getByText("レコード状態の変更")).toBeDefined();
    expect(screen.getByText("在籍").getAttribute("data-diff-side")).toBe("before");
    expect(screen.getByText("退会（論理削除）").getAttribute("data-diff-side")).toBe("after");
    expect(screen.queryByText("公開状態の変更")).toBeNull();
  });

  it("TC-D-08: hidden から public への diff を日本語で描画し矢印は読み上げない", () => {
    const { container } = render(
      <RequestQueueDetail
        item={{
          ...baseItem,
          requestedPayload: { desiredState: "public" },
          memberSummary: { ...baseItem.memberSummary, publishState: "hidden" },
        }}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(screen.getByText("非公開").getAttribute("data-diff-side")).toBe("before");
    expect(screen.getByText("公開").getAttribute("data-diff-side")).toBe("after");
    expect(container.querySelector("[data-diff-arrow]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("TC-D-09: publishState label と diff helper は未知値を fail-soft する", () => {
    expect(formatPublishStateLabel("public")).toBe("公開");
    expect(formatPublishStateLabel("member_only")).toBe("会員限定");
    expect(formatPublishStateLabel("hidden")).toBe("非公開");
    expect(formatPublishStateLabel("unknown")).toBe("不明");
    expect(
      buildPublishStateDiff({
        ...baseItem,
        requestedPayload: { desiredState: "draft" },
        memberSummary: { ...baseItem.memberSummary, publishState: "legacy" },
      }),
    ).toEqual({ kind: "visibility", before: "不明", after: "不明" });
  });

  it("TC-D-10: desiredState 欠落時は visibility diff を描画しない", () => {
    render(
      <RequestQueueDetail
        item={{ ...baseItem, requestedPayload: {} }}
        type="visibility_request"
        onApprove={onApprove}
        onReject={onReject}
        busy={false}
      />,
    );
    expect(screen.queryByText("公開状態の変更")).toBeNull();
  });
});
