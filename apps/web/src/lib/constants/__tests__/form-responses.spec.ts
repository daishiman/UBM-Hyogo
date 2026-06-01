import { describe, expect, it } from "vitest";

import { FORM_RESPONSES_EDIT_URL } from "../form";

describe("FORM_RESPONSES_EDIT_URL", () => {
  it("points to the canonical Google Form edit URL", () => {
    expect(FORM_RESPONSES_EDIT_URL).toBe(
      "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit",
    );
  });
});
