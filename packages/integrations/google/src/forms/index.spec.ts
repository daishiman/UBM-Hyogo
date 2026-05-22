import { describe, expect, it } from "vitest";

import * as forms from "./index";

describe("forms barrel", () => {
  it("re-exports auth, backoff, client, mapper", () => {
    expect(typeof forms.createTokenSource).toBe("function");
    expect(typeof forms.withBackoff).toBe("function");
    expect(typeof forms.createGoogleFormsClient).toBe("function");
    expect(typeof forms.mapFormSchema).toBe("function");
    expect(typeof forms.mapFormResponse).toBe("function");
  });
});
