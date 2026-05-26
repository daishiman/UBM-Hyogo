// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: StatusBanner（StatusSummary.tsx export）
// 操作対象: 全 external prop。Banner primitive の data-tone / role を利用して検証。

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { MeProfileStatusSummary } from "@/lib/api/me-types";

import { StatusBanner } from "../StatusSummary";

afterEach(() => cleanup());

const baseSummary = (
  publishState: MeProfileStatusSummary["publishState"],
): MeProfileStatusSummary => ({
  publicConsent: "consented",
  rulesConsent: "consented",
  publishState,
  isDeleted: false,
});

describe("StatusBanner", () => {
  it("public のとき success tone の Banner を描画する", () => {
    const { container } = render(
      <StatusBanner
        statusSummary={baseSummary("public")}
        authGateState="active"
      />,
    );
    const banner = container.querySelector('[data-tone="success"]');
    expect(banner).not.toBeNull();
  });

  it("member_only のとき info tone の Banner を描画する", () => {
    const { container } = render(
      <StatusBanner
        statusSummary={baseSummary("member_only")}
        authGateState="active"
      />,
    );
    const banner = container.querySelector('[data-tone="info"]');
    expect(banner).not.toBeNull();
  });

  it("hidden のとき warning tone の Banner を描画する", () => {
    const { container } = render(
      <StatusBanner
        statusSummary={baseSummary("hidden")}
        authGateState="active"
      />,
    );
    const banner = container.querySelector('[data-tone="warning"]');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("role")).toBe("alert");
  });

  // Phase 6: 同意/認証要約の補足表示
  it("同意・認証要約を補足表示する", () => {
    const { container } = render(
      <StatusBanner
        statusSummary={baseSummary("public")}
        authGateState="active"
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toMatch(/公開許可/);
    expect(text).toMatch(/規約同意/);
    expect(text).toMatch(/認証/);
  });
});
