// TC-U-01..04 / TC-U-08..11 (06b-followup-001 #428)
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => cleanup());
import { RequestActionPanel } from "./RequestActionPanel";

describe("RequestActionPanel", () => {
  it("TC-U-01: publishState=public → 公開停止ボタン表示 / 再公開非表示", () => {
    render(<RequestActionPanel publishState="public" rulesConsent="consented" />);
    expect(screen.getByTestId("open-hide-dialog")).toBeTruthy();
    expect(screen.queryByTestId("open-republish-dialog")).toBeNull();
    expect(screen.getByTestId("open-delete-dialog")).toBeTruthy();
  });

  it("TC-U-02: publishState=hidden → 再公開ボタン表示 / 公開停止非表示", () => {
    render(<RequestActionPanel publishState="hidden" rulesConsent="consented" />);
    expect(screen.queryByTestId("open-hide-dialog")).toBeNull();
    expect(screen.getByTestId("open-republish-dialog")).toBeTruthy();
  });

  it("TC-U-03: publishState=member_only → 再公開ボタンと退会ボタンを表示", () => {
    render(
      <RequestActionPanel publishState="member_only" rulesConsent="consented" />,
    );
    expect(screen.queryByTestId("open-hide-dialog")).toBeNull();
    expect(screen.getByTestId("open-republish-dialog")).toBeTruthy();
    expect(screen.getByTestId("open-delete-dialog")).toBeTruthy();
  });

  it("TC-U-04: rulesConsent !== consented で panel disabled / 案内表示", () => {
    render(<RequestActionPanel publishState="public" rulesConsent="declined" />);
    expect(screen.queryByTestId("request-action-panel")).toBeNull();
    expect(screen.getByTestId("request-action-panel-disabled")).toBeTruthy();
  });

  it("公開停止ボタン押下で dialog open", () => {
    render(<RequestActionPanel publishState="public" rulesConsent="consented" />);
    fireEvent.click(screen.getByTestId("open-hide-dialog"));
    expect(screen.getByTestId("visibility-request-dialog")).toBeTruthy();
  });

  it("退会ボタン押下で dialog open", () => {
    render(<RequestActionPanel publishState="public" rulesConsent="consented" />);
    fireEvent.click(screen.getByTestId("open-delete-dialog"));
    expect(screen.getByTestId("delete-request-dialog")).toBeTruthy();
  });

  // 06b-followup-001 (#428): server-side pending state による reload 永続性
  describe("server-side pending sticky", () => {
    it("TC-U-08: pendingRequests.visibility がある場合 banner 表示 + 公開停止ボタン disabled", () => {
      render(
        <RequestActionPanel
          publishState="public"
          rulesConsent="consented"
          pendingRequests={{
            visibility: {
              queueId: "q_v",
              status: "pending",
              createdAt: "2026-05-04T00:00:00Z",
              desiredState: "hidden",
            },
          }}
        />,
      );
      const banner = document.querySelector(
        "[data-pending-type='visibility_request']",
      );
      expect(banner).toBeTruthy();
      const hideBtn = screen.getByTestId("open-hide-dialog") as HTMLButtonElement;
      expect(hideBtn.disabled).toBe(true);
      const deleteBtn = screen.getByTestId(
        "open-delete-dialog",
      ) as HTMLButtonElement;
      // delete は pending ではないので操作可能
      expect(deleteBtn.disabled).toBe(false);
    });

    it("TC-U-09: pendingRequests.delete がある場合 banner + 退会ボタン disabled", () => {
      render(
        <RequestActionPanel
          publishState="public"
          rulesConsent="consented"
          pendingRequests={{
            delete: {
              queueId: "q_d",
              status: "pending",
              createdAt: "2026-05-04T00:00:00Z",
            },
          }}
        />,
      );
      const banner = document.querySelector(
        "[data-pending-type='delete_request']",
      );
      expect(banner).toBeTruthy();
      const deleteBtn = screen.getByTestId(
        "open-delete-dialog",
      ) as HTMLButtonElement;
      expect(deleteBtn.disabled).toBe(true);
    });

    it("TC-U-10: visibility と delete の両方 pending の場合、双方 disabled", () => {
      render(
        <RequestActionPanel
          publishState="public"
          rulesConsent="consented"
          pendingRequests={{
            visibility: {
              queueId: "q_v",
              status: "pending",
              createdAt: "2026-05-04T00:00:00Z",
              desiredState: "hidden",
            },
            delete: {
              queueId: "q_d",
              status: "pending",
              createdAt: "2026-05-04T00:00:00Z",
            },
          }}
        />,
      );
      const hideBtn = screen.getByTestId("open-hide-dialog") as HTMLButtonElement;
      const deleteBtn = screen.getByTestId(
        "open-delete-dialog",
      ) as HTMLButtonElement;
      expect(hideBtn.disabled).toBe(true);
      expect(deleteBtn.disabled).toBe(true);
    });

    it("TC-U-11: pendingRequests 未指定なら banner 非表示 / ボタン enabled", () => {
      render(
        <RequestActionPanel publishState="public" rulesConsent="consented" />,
      );
      expect(
        document.querySelector("[data-pending-type='visibility_request']"),
      ).toBeNull();
      expect(
        document.querySelector("[data-pending-type='delete_request']"),
      ).toBeNull();
      const hideBtn = screen.getByTestId("open-hide-dialog") as HTMLButtonElement;
      expect(hideBtn.disabled).toBe(false);
    });
  });
});
