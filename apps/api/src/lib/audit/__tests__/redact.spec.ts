// Issue #315: PII redaction unit tests
import { describe, it, expect } from "vitest";
import {
  REDACTION_POLICY_VERSION,
  redactString,
  redactAuditPayload,
  redactForExport,
} from "../redact";

describe("redact (PII)", () => {
  it("TC-RED-01: redactString は email を [REDACTED:email] に置換", () => {
    expect(redactString("contact me at manju@example.com")).toBe(
      "contact me at [REDACTED:email]",
    );
  });

  it("TC-RED-02: redactString は 7 桁以上の電話番号を [REDACTED:phone] に置換", () => {
    const out = redactString("call 090-1234-5678 anytime");
    expect(out).toBe("call [REDACTED:phone] anytime");
  });

  it("TC-RED-03: redactAuditPayload は PII key の値を RedactedValue に置換", () => {
    const got = redactAuditPayload({ email: "x@y.z", name: "山田" });
    expect(got).toEqual({
      email: { redacted: true, kind: "email" },
      name: "山田",
    });
  });

  it("TC-RED-04: redactForExport は beforeJson から raw email を消し、actorEmailMasked を返す", () => {
    const out = redactForExport({
      beforeJson: '{"email":"a@b.co","note":"hi a@b.co"}',
      afterJson: null,
      actorEmail: "a@b.co",
    });
    expect(out.beforeJson).not.toMatch(/a@b\.co/);
    expect(out.beforeJson).toContain('"redacted":true');
    expect(out.afterJson).toBeNull();
    expect(out.actorEmailMasked).toBe("[REDACTED:actor_email]");
  });

  it("TC-RED-05: null / 空入力は throw せず graceful", () => {
    expect(redactString("")).toBe("");
    expect(redactAuditPayload(null)).toBeNull();
    expect(redactForExport({ beforeJson: null, afterJson: null, actorEmail: null })).toEqual({
      beforeJson: null,
      afterJson: null,
      actorEmailMasked: null,
    });
  });

  it("TC-RED-06: REDACTION_POLICY_VERSION === 'v1'", () => {
    expect(REDACTION_POLICY_VERSION).toBe("v1");
  });

  it("TC-RED-07: redactString は idempotent", () => {
    const once = redactString("ping a@b.co at 090-1234-5678");
    const twice = redactString(once);
    expect(twice).toBe(once);
  });

  it("TC-RED-08: address key は構造化 redaction する", () => {
    expect(redactAuditPayload({ address: "〒650-0001 神戸市中央区", note: "ok" })).toEqual({
      address: { redacted: true, kind: "address" },
      note: "ok",
    });
  });

  it("TC-RED-09: address aliases and Japanese address strings are redacted", () => {
    expect(
      redactAuditPayload({
        streetAddress: "兵庫県神戸市中央区1-1",
        postalCode: "6500001",
        note: "送付先は〒650-0001 神戸市中央区です",
      }),
    ).toEqual({
      streetAddress: { redacted: true, kind: "address" },
      postalCode: { redacted: true, kind: "address" },
      note: "送付先は[REDACTED:address]",
    });
  });
});
