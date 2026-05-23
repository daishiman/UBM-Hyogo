import { describe, expect, it } from "vitest";

import * as pkg from "./index";

describe("@ubm-hyogo/integrations-google package barrel", () => {
  it("re-exports forms client factory and NotImplementedFormsClient", () => {
    expect(typeof pkg.createGoogleFormsClient).toBe("function");
    expect(typeof pkg.NotImplementedFormsClient).toBe("function");
    expect(pkg.FORMS_BASE_URL).toBe("https://forms.googleapis.com/v1");
  });

  it("re-exports mapper and backoff symbols", () => {
    expect(typeof pkg.mapFormSchema).toBe("function");
    expect(typeof pkg.mapFormResponse).toBe("function");
    expect(typeof pkg.withBackoff).toBe("function");
    expect(typeof pkg.RetryableError).toBe("function");
  });
});
