import { runtimeFoundation } from "@ubm-hyogo/shared";

export interface IntegrationRuntimeTarget {
  readonly runtime: "cloudflare-workers";
  readonly usesSharedContracts: boolean;
}

export const integrationRuntimeTarget: IntegrationRuntimeTarget = {
  runtime: "cloudflare-workers",
  usesSharedContracts: runtimeFoundation.apiRuntime === "hono-workers",
};

export {
  getAccessToken,
  importPrivateKey,
  createSignedJWT,
  SheetsAuthError,
  type AccessTokenResult,
  type ServiceAccountKey,
  type SheetsAuthEnv,
  type SheetsTokenCache,
} from "./sheets-auth.js";
