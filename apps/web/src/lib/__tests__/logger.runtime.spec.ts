// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../sentry/capture", () => ({
  captureException: vi.fn(() => "evt_xxx"),
  captureMessage: vi.fn(() => "evt_yyy"),
}));

import { logger } from "../logger";

describe("logger runtime tag (node env)", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("tags runtime=nodejs when NEXT_RUNTIME=nodejs", () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    logger.info({ event: "n" });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload.runtime).toBe("nodejs");
  });

  it("tags runtime=workers when NEXT_RUNTIME is unset under node env", () => {
    vi.stubEnv("NEXT_RUNTIME", "");
    logger.info({ event: "w" });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload.runtime).toBe("workers");
  });
});
