// UT-17 T4: cf-webhook-auth pure function unit tests
import { describe, it, expect } from "vitest";
import { verifyCfWebhookAuth } from "../cf-webhook-auth";

describe("verifyCfWebhookAuth", () => {
  it("AUTH-01: header と secret が一致すれば ok=true", () => {
    expect(verifyCfWebhookAuth("s3cret", "s3cret")).toEqual({ ok: true });
  });

  it("AUTH-02: header 欠落で missing-header", () => {
    expect(verifyCfWebhookAuth(null, "s3cret")).toEqual({
      ok: false,
      reason: "missing-header",
    });
    expect(verifyCfWebhookAuth("", "s3cret")).toEqual({
      ok: false,
      reason: "missing-header",
    });
  });

  it("AUTH-03: secret 欠落で missing-secret", () => {
    expect(verifyCfWebhookAuth("s3cret", null)).toEqual({
      ok: false,
      reason: "missing-secret",
    });
    expect(verifyCfWebhookAuth("s3cret", "")).toEqual({
      ok: false,
      reason: "missing-secret",
    });
  });

  it("AUTH-04: 不一致で mismatch", () => {
    expect(verifyCfWebhookAuth("wrong", "s3cret")).toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("AUTH-05: 長さが異なる値も mismatch として扱う", () => {
    expect(verifyCfWebhookAuth("s3cret-extra", "s3cret")).toEqual({
      ok: false,
      reason: "mismatch",
    });
  });
});
