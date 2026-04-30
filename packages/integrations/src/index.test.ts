import { describe, expect, it } from "vitest";

import { createGoogleFormsClient, FORMS_BASE_URL, integrationRuntimeTarget } from "./index";

describe("integrations barrel", () => {
  it("exposes Cloudflare Workers runtime target wired to shared", () => {
    expect(integrationRuntimeTarget.runtime).toBe("cloudflare-workers");
    expect(integrationRuntimeTarget.usesSharedContracts).toBe(true);
  });

  it("re-exports Google Forms client API", () => {
    expect(typeof createGoogleFormsClient).toBe("function");
    expect(FORMS_BASE_URL).toMatch(/forms\.googleapis\.com/);
  });
});
