import { describe, expect, it } from "vitest";
import { guardJsonlOrThrow } from "../redaction-guard.ts";
import { RedactionViolationError } from "../types.ts";

describe("redaction-guard", () => {
  it("returns void for empty input", () => {
    expect(() => guardJsonlOrThrow("")).not.toThrow();
  });

  it("passes redacted lines (truncated IPv4 /24)", () => {
    const jsonl = JSON.stringify({ ip: "203.0.113.0/24" });
    expect(() => guardJsonlOrThrow(jsonl)).not.toThrow();
  });

  it("passes redacted lines (truncated IPv6 /48)", () => {
    const jsonl = JSON.stringify({ ip: "2001:db8::/48" });
    expect(() => guardJsonlOrThrow(jsonl)).not.toThrow();
  });

  it("throws on full IPv4 address", () => {
    const jsonl = JSON.stringify({ ip: "203.0.113.42" });
    expect(() => guardJsonlOrThrow(jsonl)).toThrow(RedactionViolationError);
  });

  it("throws on full IPv6 address", () => {
    const jsonl = JSON.stringify({ ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" });
    expect(() => guardJsonlOrThrow(jsonl)).toThrow(RedactionViolationError);
  });

  it("throws on Cloudflare API token leak", () => {
    const jsonl = JSON.stringify({ token: "Bearer cf_pat_AbCdEfGhIjKlMnOpQrStUvWxYz1234" });
    expect(() => guardJsonlOrThrow(jsonl)).toThrow(RedactionViolationError);
  });

  it("throws on plain user-agent", () => {
    const jsonl = JSON.stringify({
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605.1.15",
    });
    expect(() => guardJsonlOrThrow(jsonl)).toThrow(RedactionViolationError);
  });

  it("throws on plain email", () => {
    const jsonl = JSON.stringify({ email: "alice@example.com" });
    expect(() => guardJsonlOrThrow(jsonl)).toThrow(RedactionViolationError);
  });

  it("collects multiple distinct violations", () => {
    const jsonl = [
      JSON.stringify({ ip: "203.0.113.42" }),
      JSON.stringify({ email: "x@y.co" }),
    ].join("\n");
    try {
      guardJsonlOrThrow(jsonl);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RedactionViolationError);
      const err = e as RedactionViolationError;
      const patterns = err.violations.map((v) => v.pattern);
      expect(patterns).toContain("ipv4-full");
      expect(patterns).toContain("email-plain");
    }
  });

  it("sample is truncated to <= 32+marker chars", () => {
    const jsonl = JSON.stringify({ email: "very.long.address.example@some-domain.example.com" });
    try {
      guardJsonlOrThrow(jsonl);
      throw new Error("expected throw");
    } catch (e) {
      const err = e as RedactionViolationError;
      const v = err.violations[0]!;
      expect(v.sample.endsWith("...redacted")).toBe(true);
    }
  });
});
