// TC-U-01..04
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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
});
