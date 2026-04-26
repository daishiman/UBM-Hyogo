declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;
