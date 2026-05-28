import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

const refreshMock = vi.fn();
let useTransitionMock: () => [boolean, (cb: () => void) => void] = () => [
  false,
  (cb: () => void) => cb(),
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useTransition: () => useTransitionMock(),
  };
});

import { AdminSectionErrorClient } from "../AdminSectionErrorClient";

afterEach(() => {
  cleanup();
  refreshMock.mockReset();
  useTransitionMock = () => [false, (cb: () => void) => cb()];
});

describe("AdminSectionErrorClient", () => {
  it("AC-1: render で retry button が描画される", () => {
    render(<AdminSectionErrorClient sectionLabel="KPI" />);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("AC-2: click で router.refresh が呼ばれる", () => {
    render(<AdminSectionErrorClient sectionLabel="KPI" />);
    act(() => {
      fireEvent.click(screen.getByTestId("admin-section-error-retry"));
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("AC-5: aria-label に sectionLabel が含まれる", () => {
    render(<AdminSectionErrorClient sectionLabel="依頼キュー" />);
    const btn = screen.getByTestId("admin-section-error-retry");
    expect(btn.getAttribute("aria-label")).toContain("依頼キュー");
  });

  it("AC-6: retryLabel が button text に反映される", () => {
    render(
      <AdminSectionErrorClient sectionLabel="KPI" retryLabel="再試行" />,
    );
    expect(screen.getByTestId("admin-section-error-retry").textContent).toBe(
      "再試行",
    );
  });

  it("AC-7: button class に HEX 直書きが含まれない", () => {
    render(<AdminSectionErrorClient sectionLabel="KPI" />);
    const btn = screen.getByTestId("admin-section-error-retry");
    expect(btn.className).not.toMatch(/(bg|text)-\[#/);
    expect(btn.className).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("AC-8: code / correlationId / message が DOM に出る", () => {
    render(
      <AdminSectionErrorClient
        sectionLabel="Members"
        code="ADMIN_FETCH_500"
        correlationId="cf-ray-abc-123"
        message="API がダウンしています"
      />,
    );
    expect(screen.getByText("ADMIN_FETCH_500")).toBeDefined();
    expect(screen.getByText("cf-ray-abc-123")).toBeDefined();
    expect(screen.getByText("API がダウンしています")).toBeDefined();
  });

  it.each([
    ["ADMIN_FETCH_401", "セッションが切れています"],
    ["ADMIN_FETCH_403", "管理者権限がありません"],
    ["ADMIN_FETCH_404", "API に到達できません"],
    ["ADMIN_FETCH_500", "サーバー設定エラーです"],
    ["ADMIN_FETCH_503", "サーバー設定エラーです"],
  ])("code=%s の復旧ヒントを表示する", (code, title) => {
    render(<AdminSectionErrorClient sectionLabel="KPI" code={code} />);
    expect(screen.getByText(title)).toBeDefined();
  });

  it("未知 code では復旧ヒントを出さない", () => {
    render(<AdminSectionErrorClient sectionLabel="KPI" code="ADMIN_FETCH_FAILED" />);
    expect(screen.queryByText("API に到達できません")).toBeNull();
    expect(screen.queryByText("サーバー設定エラーです")).toBeNull();
  });

  it("AC-3: useTransition pending 中は aria-busy=true / disabled=true", () => {
    useTransitionMock = () => [true, (cb: () => void) => cb()];
    render(<AdminSectionErrorClient sectionLabel="KPI" />);
    const btn = screen.getByTestId(
      "admin-section-error-retry",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("AC-4: transition 完了後（pending=false）は enabled / aria-busy=false", () => {
    useTransitionMock = () => [false, (cb: () => void) => cb()];
    render(<AdminSectionErrorClient sectionLabel="KPI" />);
    const btn = screen.getByTestId(
      "admin-section-error-retry",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBe("false");
  });

  it("AC-9: jest-axe violation 0", async () => {
    const { container } = render(<AdminSectionErrorClient sectionLabel="KPI" />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
