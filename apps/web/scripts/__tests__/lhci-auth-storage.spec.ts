import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifySessionJwt } from "@ubm-hyogo/shared";
import { main } from "../lhci-auth-storage";

describe("lhci-auth-storage", () => {
  let tmpDir: string;
  const prevSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "lhci-auth-"));
    process.env.AUTH_SECRET = "test-secret-32-bytes-padding-xxx";
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    if (prevSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = prevSecret;
  });

  it("writes a storage state with authjs.session-token cookie", async () => {
    const out = join(tmpDir, "storage.json");
    await main(out);
    const state = JSON.parse(readFileSync(out, "utf8"));
    expect(state.cookies).toHaveLength(1);
    expect(state.cookies[0].name).toBe("authjs.session-token");
    expect(state.cookies[0].domain).toBe("localhost");
    expect(typeof state.cookies[0].value).toBe("string");
    expect(state.cookies[0].value.length).toBeGreaterThan(20);
    const claims = await verifySessionJwt(
      state.cookies[0].value,
      "test-secret-32-bytes-padding-xxx",
    );
    expect(claims).toMatchObject({
      memberId: "e2e-lhci-member-0001",
      email: "lhci-test@example.invalid",
      isAdmin: false,
    });
    expect(claims?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("throws when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    await expect(main(join(tmpDir, "storage.json"))).rejects.toThrow(
      /AUTH_SECRET/,
    );
  });
});
