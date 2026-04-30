import { describe, expect, it } from "vitest";

import * as zodBarrel from "./index";

describe("zod barrel re-exports", () => {
  it("re-exports schemas from primitives/field/schema/response/identity/viewmodel", () => {
    // primitives
    expect(zodBarrel.EmailZ).toBeDefined();
    expect(zodBarrel.Iso8601Z).toBeDefined();
    // field / schema
    expect(zodBarrel.FormFieldDefinitionZ).toBeDefined();
    expect(zodBarrel.FormSchemaZ).toBeDefined();
    // response
    expect(zodBarrel.MemberResponseZ).toBeDefined();
    // identity
    expect(zodBarrel.MemberIdentityZ).toBeDefined();
    expect(zodBarrel.TagDefinitionZ).toBeDefined();
    // viewmodel
    expect(zodBarrel.MemberProfileZ).toBeDefined();
  });
});
