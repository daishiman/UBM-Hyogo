import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  detectContractViolations,
  extractMintStepsFromWorkflow,
  extractProvisionedSecrets,
} from "../verify-mint-env-contract.mts";

const allProvisioned = [
  "STAGING_AUTH_SECRET",
  "STAGING_ADMIN_MEMBER_ID",
  "STAGING_ADMIN_EMAIL",
  "STAGING_ME_MEMBER_ID",
  "STAGING_ME_EMAIL",
] as const;

describe("verify mint env contract", () => {
  it("accepts admin-only mint steps without ME env", () => {
    const violations = detectContractViolations({
      steps: [{
        name: "mint staging admin bearer",
        roles: ["admin"],
        envNames: [
          "STAGING_AUTH_SECRET",
          "STAGING_ADMIN_MEMBER_ID",
          "STAGING_ADMIN_EMAIL",
        ],
        degrade: false,
      }],
      provisionedSecrets: allProvisioned,
    });
    expect(violations).toEqual([]);
  });

  it("fails when a non-degraded step omits required role env", () => {
    const violations = detectContractViolations({
      steps: [{
        name: "mint staging admin bearer",
        roles: ["admin"],
        envNames: ["STAGING_AUTH_SECRET"],
        degrade: false,
      }],
      provisionedSecrets: allProvisioned,
    });
    expect(violations).toEqual([{
      kind: "missing_env",
      subject: "mint staging admin bearer",
      names: ["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"],
      severity: "error",
    }]);
  });

  it("still reports missing env for degraded steps because degrade is runtime fallback, not contract proof", () => {
    const violations = detectContractViolations({
      steps: [{
        name: "mint staging admin bearer",
        roles: ["admin"],
        envNames: ["STAGING_AUTH_SECRET"],
        degrade: true,
      }],
      provisionedSecrets: allProvisioned,
    });
    expect(violations).toEqual([{
      kind: "missing_env",
      subject: "mint staging admin bearer",
      names: ["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"],
      severity: "error",
    }]);
  });

  it("warns when a role-scoped step passes env for roles it does not mint", () => {
    const violations = detectContractViolations({
      steps: [{
        name: "mint staging admin bearer",
        roles: ["admin"],
        envNames: [
          "STAGING_AUTH_SECRET",
          "STAGING_ADMIN_MEMBER_ID",
          "STAGING_ADMIN_EMAIL",
          "STAGING_ME_MEMBER_ID",
        ],
        degrade: false,
      }],
      provisionedSecrets: allProvisioned,
    });
    expect(violations).toEqual([{
      kind: "excess_env",
      subject: "mint staging admin bearer",
      names: ["STAGING_ME_MEMBER_ID"],
      severity: "warn",
    }]);
  });

  it("fails when provision script omits mint-required secrets", () => {
    const violations = detectContractViolations({
      steps: [],
      provisionedSecrets: ["STAGING_AUTH_SECRET", "STAGING_ADMIN_MEMBER_ID"],
    });
    expect(violations).toEqual([{
      kind: "provision_gap",
      subject: "scripts/smoke/provision-staging-secrets.sh",
      names: [
        "STAGING_ADMIN_EMAIL",
        "STAGING_ME_MEMBER_ID",
        "STAGING_ME_EMAIL",
      ],
      severity: "error",
    }]);
  });

  it("extracts --roles=<value> syntax from workflow snippets", () => {
    const steps = extractMintStepsFromWorkflow(`
      - name: mint staging admin bearer
        env:
          STAGING_AUTH_SECRET: \${{ secrets.STAGING_AUTH_SECRET }}
          STAGING_ADMIN_MEMBER_ID: \${{ secrets.STAGING_ADMIN_MEMBER_ID }}
          STAGING_ADMIN_EMAIL: \${{ secrets.STAGING_ADMIN_EMAIL }}
        run: pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles=admin
    `);
    expect(steps.map((step) => [step.name, step.roles])).toEqual([
      ["mint staging admin bearer", ["admin"]],
    ]);
  });

  it("extracts --roles <value> without consuming following shell lines", () => {
    const steps = extractMintStepsFromWorkflow(`
      - name: mint staging admin bearer
        env:
          STAGING_AUTH_SECRET: \${{ secrets.STAGING_AUTH_SECRET }}
          STAGING_ADMIN_MEMBER_ID: \${{ secrets.STAGING_ADMIN_MEMBER_ID }}
          STAGING_ADMIN_EMAIL: \${{ secrets.STAGING_ADMIN_EMAIL }}
        run: |
          pnpm exec tsx scripts/smoke/mint-staging-bearers.mts --roles admin
          if grep -q '^mint_degraded=1$' "$mint_out"; then
            exit 0
          fi
    `);
    expect(steps.map((step) => [step.name, step.roles])).toEqual([
      ["mint staging admin bearer", ["admin"]],
    ]);
  });

  it("extracts current workflow mint steps and provision inventory", () => {
    const workflow = readFileSync(".github/workflows/runtime-smoke-staging.yml", "utf8");
    const provision = readFileSync("scripts/smoke/provision-staging-secrets.sh", "utf8");
    const steps = extractMintStepsFromWorkflow(workflow);
    const provisionedSecrets = extractProvisionedSecrets(provision);
    expect(steps.map((step) => [step.name, step.roles])).toEqual([
      ["mint staging bearers", ["admin", "me"]],
      ["mint staging admin bearer", ["admin"]],
    ]);
    expect(provisionedSecrets).toEqual([
      "STAGING_API_BASE",
      "STAGING_AUTH_SECRET",
      "STAGING_ADMIN_MEMBER_ID",
      "STAGING_ADMIN_EMAIL",
      "STAGING_ME_MEMBER_ID",
      "STAGING_ME_EMAIL",
      "SLACK_WEBHOOK_INCIDENT",
    ]);
    expect(detectContractViolations({ steps, provisionedSecrets })).toEqual([]);
  });
});
