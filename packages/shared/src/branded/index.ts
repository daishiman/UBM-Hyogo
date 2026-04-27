declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;
export type SessionId = Brand<string, "SessionId">;
export type TagId = Brand<string, "TagId">;
export type AdminId = Brand<string, "AdminId">;

const createBrand =
  <B extends string>() =>
  (value: string): Brand<string, B> =>
    value as Brand<string, B>;

export const asMemberId = createBrand<"MemberId">();
export const asResponseId = createBrand<"ResponseId">();
export const asResponseEmail = createBrand<"ResponseEmail">();
export const asStableKey = createBrand<"StableKey">();
export const asSessionId = createBrand<"SessionId">();
export const asTagId = createBrand<"TagId">();
export const asAdminId = createBrand<"AdminId">();

export const BRANDED_KIND_LIST = [
  "MemberId",
  "ResponseId",
  "ResponseEmail",
  "StableKey",
  "SessionId",
  "TagId",
  "AdminId",
] as const;

export type BrandedKind = (typeof BRANDED_KIND_LIST)[number];
