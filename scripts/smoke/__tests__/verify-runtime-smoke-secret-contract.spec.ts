import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  detectSecretContractViolations,
  extractProvisionedSecrets,
  extractWorkflowSecrets,
} from "../verify-runtime-smoke-secret-contract.mts";

describe("verify runtime smoke secret contract", () => {
  it("extracts unique workflow secret references", () => {
    const secrets = extractWorkflowSecrets(`
      env:
        STAGING_API_BASE: \${{ secrets.STAGING_API_BASE }}
        TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        AGAIN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
        INTERNAL: \${{ secrets.GITHUB_TOKEN }}
    `);
    expect(secrets).toEqual(["CLOUDFLARE_API_TOKEN", "STAGING_API_BASE"]);
  });

  it("fails when a consumed secret is neither provisioned nor exempt", () => {
    const violations = detectSecretContractViolations({
      workflowSecrets: ["STAGING_API_BASE", "CLOUDFLARE_API_TOKEN"],
      provisionedSecrets: ["STAGING_API_BASE"],
      exemptSecretRationales: {},
    });
    expect(violations).toEqual([{
      kind: "missing_provision",
      names: ["CLOUDFLARE_API_TOKEN"],
      severity: "error",
    }]);
  });

  it("accepts explicit legacy exemptions with rationale", () => {
    const violations = detectSecretContractViolations({
      workflowSecrets: ["STAGING_ADMIN_BEARER"],
      provisionedSecrets: [],
      exemptSecretRationales: { STAGING_ADMIN_BEARER: "legacy fallback" },
    });
    expect(violations).toEqual([]);
  });

  it("requires rationales for exemptions", () => {
    const violations = detectSecretContractViolations({
      workflowSecrets: ["STAGING_ADMIN_BEARER"],
      provisionedSecrets: [],
      exemptSecretRationales: { STAGING_ADMIN_BEARER: "" },
    });
    expect(violations).toEqual([{
      kind: "missing_exemption_rationale",
      names: ["STAGING_ADMIN_BEARER"],
      severity: "error",
    }]);
  });

  it("warns for provisioned secrets no longer consumed by workflow", () => {
    const violations = detectSecretContractViolations({
      workflowSecrets: ["STAGING_API_BASE"],
      provisionedSecrets: ["STAGING_API_BASE", "OLD_SECRET"],
    });
    expect(violations).toEqual([{
      kind: "stale_provision",
      names: ["OLD_SECRET"],
      severity: "warn",
    }]);
  });

  it("accepts the current workflow and provisioning script", () => {
    const workflowSecrets = extractWorkflowSecrets(readFileSync(".github/workflows/runtime-smoke-staging.yml", "utf8"));
    const provisionedSecrets = extractProvisionedSecrets(readFileSync("scripts/smoke/provision-staging-secrets.sh", "utf8"));
    expect(workflowSecrets).toEqual([
      "CLOUDFLARE_API_TOKEN",
      "SLACK_WEBHOOK_INCIDENT",
      "STAGING_ADMIN_BEARER",
      "STAGING_ADMIN_EMAIL",
      "STAGING_ADMIN_MEMBER_ID",
      "STAGING_API_BASE",
      "STAGING_AUTH_SECRET",
      "STAGING_MEMBER_ID",
      "STAGING_ME_BEARER",
      "STAGING_ME_EMAIL",
      "STAGING_ME_MEMBER_ID",
    ]);
    expect(provisionedSecrets).toEqual([
      "CLOUDFLARE_API_TOKEN",
      "SLACK_WEBHOOK_INCIDENT",
      "STAGING_ADMIN_EMAIL",
      "STAGING_ADMIN_MEMBER_ID",
      "STAGING_API_BASE",
      "STAGING_AUTH_SECRET",
      "STAGING_ME_EMAIL",
      "STAGING_ME_MEMBER_ID",
    ]);
    expect(detectSecretContractViolations({ workflowSecrets, provisionedSecrets })).toEqual([]);
  });
});
