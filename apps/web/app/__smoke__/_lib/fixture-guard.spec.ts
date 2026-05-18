import { beforeEach, describe, expect, it, vi } from "vitest";

const readRawEnv = vi.fn();

vi.mock("../../../src/lib/env", () => ({
  readRawEnv: () => readRawEnv(),
}));

import { smokeFixtureEnabled } from "./fixture-guard";

describe("smokeFixtureEnabled", () => {
  beforeEach(() => {
    readRawEnv.mockReset();
    vi.unstubAllEnvs();
  });

  it("enables smoke fixtures only when the flag is set outside production", () => {
    readRawEnv.mockReturnValue({
      ENABLE_STAGING_SMOKE_FIXTURE: "1",
      ENVIRONMENT: "staging",
    });

    expect(smokeFixtureEnabled()).toBe(true);
  });

  it("returns false when the fixture flag is absent", () => {
    readRawEnv.mockReturnValue({
      ENVIRONMENT: "staging",
    });

    expect(smokeFixtureEnabled()).toBe(false);
  });

  it("returns false in production even when the fixture flag is set", () => {
    readRawEnv.mockReturnValue({
      ENABLE_STAGING_SMOKE_FIXTURE: "1",
      ENVIRONMENT: "production",
    });

    expect(smokeFixtureEnabled()).toBe(false);
  });

  it("uses process env fallback values during local Playwright runs", () => {
    readRawEnv.mockReturnValue({});
    vi.stubEnv("ENABLE_STAGING_SMOKE_FIXTURE", "1");
    vi.stubEnv("ENVIRONMENT", "staging");

    expect(smokeFixtureEnabled()).toBe(true);
  });
});
