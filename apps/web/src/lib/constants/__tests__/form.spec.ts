import { describe, expect, it } from "vitest";

import { FORM_RESPONDER_URL } from "../form";

describe("FORM_RESPONDER_URL", () => {
  it("matches the canonical value in CLAUDE.md (AC-4)", () => {
    expect(FORM_RESPONDER_URL).toBe(
      "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
    );
  });
});
