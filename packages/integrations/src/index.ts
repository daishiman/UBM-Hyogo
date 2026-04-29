import { runtimeFoundation } from "@ubm-hyogo/shared";

// 03b: forms client を再 export（apps/api/src/jobs/sync-forms-responses が利用）
export type { JwtSigner } from "../google/src/forms/auth";
export type { GoogleFormsClient, FormsClientDeps } from "../google/src/forms/client";
export { createGoogleFormsClient, FORMS_BASE_URL } from "../google/src/forms/client";

export interface IntegrationRuntimeTarget {
  readonly runtime: "cloudflare-workers";
  readonly usesSharedContracts: boolean;
}

export const integrationRuntimeTarget: IntegrationRuntimeTarget = {
  runtime: "cloudflare-workers",
  usesSharedContracts: runtimeFoundation.apiRuntime === "hono-workers",
};
