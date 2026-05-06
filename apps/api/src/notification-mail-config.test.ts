// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hasNotificationMailConfig } from "./index";

describe("hasNotificationMailConfig", () => {
  it("MAIL_PROVIDER_KEY missing or placeholder from address blocks notification dispatch before claim", () => {
    expect(
      hasNotificationMailConfig({
        MAIL_FROM_ADDRESS: "noreply@ubm-hyogo.example",
      }),
    ).toBe(false);
    expect(
      hasNotificationMailConfig({
        MAIL_PROVIDER_KEY: "secret",
        MAIL_FROM_ADDRESS: "noreply@ubm-hyogo.example",
      }),
    ).toBe(false);
    expect(
      hasNotificationMailConfig({
        MAIL_PROVIDER_KEY: "secret",
        MAIL_FROM_ADDRESS: "not-an-email",
      }),
    ).toBe(false);
  });

  it("valid provider key plus non-placeholder from address enables notification dispatch", () => {
    expect(
      hasNotificationMailConfig({
        MAIL_PROVIDER_KEY: "secret",
        MAIL_FROM_ADDRESS: "noreply@mail.ubm-hyogo.org",
      }),
    ).toBe(true);
  });
});
