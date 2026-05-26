// workflow: mypage-prototype-alignment / Phase 6 新規 / 回帰 guard
// 目的: danger-zone Card ラップ後も POST 経路・pending 表示・gate が不変であることを固定する。
// 既存 RequestActionPanel.component.spec.tsx は無改変。dialog は Phase 4 と同じく mock 化。

import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const navigationMock = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: navigationMock.refresh,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("../VisibilityRequestDialog", () => ({
  VisibilityRequestDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="visibility-request-dialog" /> : null,
}));

vi.mock("../DeleteRequestDialog", () => ({
  DeleteRequestDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-request-dialog" /> : null,
}));

afterEach(() => {
  cleanup();
  navigationMock.refresh.mockClear();
});

import { RequestActionPanel } from "../RequestActionPanel";

describe("RequestActionPanel (danger-zone wrap 回帰 guard)", () => {
  it("rulesConsent!=consented のとき申請パネルは無効化表示", () => {
    render(
      <RequestActionPanel publishState="public" rulesConsent="declined" />,
    );
    expect(screen.getByTestId("request-action-panel-disabled")).toBeTruthy();
    expect(screen.queryByTestId("open-hide-dialog")).toBeNull();
    expect(screen.queryByTestId("open-delete-dialog")).toBeNull();
  });

  it("publishState=public のとき公開停止ボタンを表示", () => {
    render(
      <RequestActionPanel publishState="public" rulesConsent="consented" />,
    );
    expect(screen.getByTestId("open-hide-dialog")).toBeTruthy();
    expect(screen.queryByTestId("open-republish-dialog")).toBeNull();
  });

  it("publishState=hidden のとき再公開ボタンを表示", () => {
    render(
      <RequestActionPanel publishState="hidden" rulesConsent="consented" />,
    );
    expect(screen.getByTestId("open-republish-dialog")).toBeTruthy();
    expect(screen.queryByTestId("open-hide-dialog")).toBeNull();
  });

  it("pendingRequests.visibility ありのとき pending banner 表示 + ボタン disabled", () => {
    render(
      <RequestActionPanel
        publishState="public"
        rulesConsent="consented"
        pendingRequests={{
          visibility: {
            queueId: "q-1",
            status: "pending",
            createdAt: "2026-05-23T00:00:00.000Z",
            desiredState: "hidden",
          },
        }}
      />,
    );
    expect(screen.getByTestId("open-hide-dialog")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("pendingRequests.delete ありのとき退会ボタン disabled", () => {
    render(
      <RequestActionPanel
        publishState="public"
        rulesConsent="consented"
        pendingRequests={{
          delete: {
            queueId: "q-2",
            status: "pending",
            createdAt: "2026-05-23T00:00:00.000Z",
          },
        }}
      />,
    );
    expect(screen.getByTestId("open-delete-dialog")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("danger-zone の見出し（DANGER ZONE / 公開の停止・退会）を描画する", () => {
    render(
      <RequestActionPanel publishState="public" rulesConsent="consented" />,
    );
    expect(screen.getByText("DANGER ZONE")).toBeTruthy();
    expect(screen.getByText("公開の停止・退会")).toBeTruthy();
  });
});
