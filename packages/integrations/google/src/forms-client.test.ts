import { describe, expect, it } from "vitest";

import { NotImplementedFormsClient, type FormsClient } from "./forms-client";

describe("NotImplementedFormsClient", () => {
  const client: FormsClient = new NotImplementedFormsClient();

  it("getForm throws not-implemented error", () => {
    expect(() => client.getForm("form_1")).toThrow(/not implemented/);
  });

  it("listResponses throws not-implemented error", () => {
    expect(() => client.listResponses("form_1")).toThrow(/not implemented/);
  });
});
