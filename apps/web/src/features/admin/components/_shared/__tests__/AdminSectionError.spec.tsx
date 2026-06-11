import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminSectionError } from "../AdminSectionError";

afterEach(() => cleanup());

describe("AdminSectionError", () => {
  it("TC-SE-01: sectionLabel を見出しに含める", () => {
    render(<AdminSectionError sectionLabel="KPI" />);
    expect(screen.getByText(/KPI/).textContent).toContain("KPI");
  });

  it("TC-SE-02: code と correlationId を表示する", () => {
    render(
      <AdminSectionError
        sectionLabel="Members"
        code="ADMIN_FETCH_500"
        correlationId="cf-ray-abc-123"
      />,
    );
    expect(screen.getByText("ADMIN_FETCH_500")).toBeDefined();
    expect(screen.getByText("cf-ray-abc-123")).toBeDefined();
  });

  it("TC-SE-03: role=alert / aria-live=polite が付く", () => {
    render(<AdminSectionError sectionLabel="Tags" />);
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("polite");
  });

  it("TC-SE-04: message 指定時はカスタム文言を表示", () => {
    render(
      <AdminSectionError sectionLabel="Schema" message="API がダウンしています" />,
    );
    expect(screen.getByText("API がダウンしています")).toBeDefined();
  });

  it("TC-SE-05: code/correlationId が未指定なら meta 行が省略される", () => {
    const { container } = render(<AdminSectionError sectionLabel="Audit" />);
    expect(container.querySelector("code")).toBeNull();
  });

  it("AS-1: onRetry 未指定で retry button が描画されない", () => {
    render(<AdminSectionError sectionLabel="KPI" />);
    expect(screen.queryByTestId("admin-section-error-retry")).toBeNull();
  });

  it("AS-2: onRetry 指定で retry button が描画される", () => {
    render(<AdminSectionError sectionLabel="KPI" onRetry={() => {}} />);
    expect(screen.getByTestId("admin-section-error-retry")).toBeDefined();
  });

  it("AS-3: isRetrying=true で disabled かつ aria-busy=true", () => {
    render(
      <AdminSectionError sectionLabel="KPI" onRetry={() => {}} isRetrying />,
    );
    const btn = screen.getByTestId(
      "admin-section-error-retry",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  it("AS-4: isRetrying=false で enabled かつ aria-busy=false", () => {
    render(
      <AdminSectionError
        sectionLabel="KPI"
        onRetry={() => {}}
        isRetrying={false}
      />,
    );
    const btn = screen.getByTestId(
      "admin-section-error-retry",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBe("false");
  });

  it("AS-5: retryLabel が button text に反映される", () => {
    render(
      <AdminSectionError
        sectionLabel="KPI"
        onRetry={() => {}}
        retryLabel="再試行"
      />,
    );
    expect(screen.getByTestId("admin-section-error-retry").textContent).toBe(
      "再試行",
    );
  });

  it("AS-6: isRetrying=true で retryLabel に '中…' が付く", () => {
    render(
      <AdminSectionError
        sectionLabel="KPI"
        onRetry={() => {}}
        retryLabel="再試行"
        isRetrying
      />,
    );
    expect(screen.getByTestId("admin-section-error-retry").textContent).toBe(
      "再試行中…",
    );
  });

  it("AS-7: aria-label が '{sectionLabel} を再読み込み' 形式", () => {
    render(<AdminSectionError sectionLabel="会員からの申請" onRetry={() => {}} />);
    expect(
      screen
        .getByTestId("admin-section-error-retry")
        .getAttribute("aria-label"),
    ).toBe("会員からの申請 を再読み込み");
  });
});
