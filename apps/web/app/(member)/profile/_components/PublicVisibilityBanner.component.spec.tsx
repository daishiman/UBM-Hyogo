// task-14 phase-9 #1 unit: deriveBannerView の publishState / authGateState 分岐網羅。
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import {
  PublicVisibilityBanner,
  deriveBannerView,
} from "./PublicVisibilityBanner";

afterEach(() => cleanup());

describe("deriveBannerView", () => {
  it("authGateState=deleted は danger を最優先する", () => {
    const v = deriveBannerView({
      publishState: "public",
      authGateState: "deleted",
    });
    expect(v.tone).toBe("danger");
    expect(v.title).toContain("削除待ち");
  });

  it("authGateState=rules_declined は warning に切替", () => {
    const v = deriveBannerView({
      publishState: "public",
      authGateState: "rules_declined",
    });
    expect(v.tone).toBe("warning");
    expect(v.title).toContain("規約");
  });

  it("active + public は success", () => {
    const v = deriveBannerView({
      publishState: "public",
      authGateState: "active",
    });
    expect(v.tone).toBe("success");
    expect(v.title).toContain("公開中");
  });

  it("active + member_only は info", () => {
    const v = deriveBannerView({
      publishState: "member_only",
      authGateState: "active",
    });
    expect(v.tone).toBe("info");
    expect(v.title).toContain("会員限定");
  });

  it("active + hidden は warning", () => {
    const v = deriveBannerView({
      publishState: "hidden",
      authGateState: "active",
    });
    expect(v.tone).toBe("warning");
    expect(v.title).toContain("非公開");
  });
});

describe("PublicVisibilityBanner DOM", () => {
  it("data-region と aria-label を持つ section を描画する", () => {
    const { container } = render(
      <PublicVisibilityBanner publishState="public" authGateState="active" />,
    );
    const section = container.querySelector(
      'section[data-region="public-visibility-banner"]',
    );
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe("公開状態の概要");
    expect(screen.getByText(/公開中/)).not.toBeNull();
  });
});
