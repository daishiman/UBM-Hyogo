// issue-958 Track A: PublicConsentCallout の表示分岐と CTA href 解決を検証する。

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PublicConsentCallout } from "../PublicConsentCallout";

afterEach(cleanup);

const RESPONDER = "https://docs.google.com/forms/d/e/FORM/viewform";
const EDIT = "https://docs.google.com/forms/d/e/FORM/viewform?edit2=abc";

describe("PublicConsentCallout", () => {
  it("consented: success tone + 確認 CTA + editResponseUrl 優先", () => {
    render(
      <PublicConsentCallout
        publicConsent="consented"
        editResponseUrl={EDIT}
        responderUrl={RESPONDER}
      />,
    );
    expect(screen.getByText("公開メンバー一覧に掲載されています")).toBeTruthy();
    const cta = screen.getByTestId("public-consent-cta") as HTMLAnchorElement;
    expect(cta.href).toBe(EDIT);
    expect(cta.target).toBe("_blank");
    expect(cta.rel).toContain("noreferrer");
    expect(cta.textContent).toContain("Google Form で確認");
  });

  it("declined: warning tone + 再回答 CTA + responderUrl フォールバック", () => {
    render(
      <PublicConsentCallout
        publicConsent="declined"
        editResponseUrl={null}
        responderUrl={RESPONDER}
      />,
    );
    expect(
      screen.getByText("公開メンバー一覧に表示されていません"),
    ).toBeTruthy();
    const cta = screen.getByTestId("public-consent-cta") as HTMLAnchorElement;
    expect(cta.href).toBe(RESPONDER);
    expect(cta.textContent).toContain("Google Form で再回答する");
  });

  it("unknown: warning tone + 未確認文言", () => {
    render(
      <PublicConsentCallout
        publicConsent="unknown"
        editResponseUrl={null}
        responderUrl={RESPONDER}
      />,
    );
    expect(screen.getByText("公開設定が未確認です")).toBeTruthy();
  });
});
