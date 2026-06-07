// Static drift gate for runtime-smoke-staging mint bearer env contracts.
// It checks each workflow step calling mint-staging-bearers.mts against the
// role-scoped env names exported by the mint helper.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  COMMON_REQUIRED_ENV,
  ROLE_REQUIRED_ENV,
  parseRoles,
  requiredEnvForRoles,
  type MintRole,
} from "./mint-staging-bearers.mts";

export interface MintStepDescriptor {
  readonly name: string;
  readonly roles: readonly MintRole[];
  readonly envNames: readonly string[];
  readonly degrade: boolean;
}

export interface ContractViolation {
  readonly kind: "missing_env" | "excess_env" | "provision_gap";
  readonly subject: string;
  readonly names: readonly string[];
  readonly severity: "error" | "warn";
}

export function detectContractViolations(input: {
  readonly steps: readonly MintStepDescriptor[];
  readonly provisionedSecrets: readonly string[];
}): ContractViolation[] {
  const violations: ContractViolation[] = [];
  const provisioned = new Set(input.provisionedSecrets);

  for (const step of input.steps) {
    const envNames = new Set(step.envNames);
    const required = requiredEnvForRoles(step.roles);
    const missing = required.filter((name) => !envNames.has(name));
    if (missing.length > 0) {
      violations.push({
        kind: "missing_env",
        subject: step.name,
        names: missing,
        severity: "error",
      });
    }

    const allowed = new Set(required);
    const roleScopedEnv = new Set([...ROLE_REQUIRED_ENV.admin, ...ROLE_REQUIRED_ENV.me]);
    const excess = step.envNames.filter((name) => roleScopedEnv.has(name) && !allowed.has(name));
    if (excess.length > 0) {
      violations.push({
        kind: "excess_env",
        subject: step.name,
        names: excess,
        severity: "warn",
      });
    }
  }

  const allMintEnv = [...COMMON_REQUIRED_ENV, ...ROLE_REQUIRED_ENV.admin, ...ROLE_REQUIRED_ENV.me];
  const provisionGap = allMintEnv.filter((name) => !provisioned.has(name));
  if (provisionGap.length > 0) {
    violations.push({
      kind: "provision_gap",
      subject: "scripts/smoke/provision-staging-secrets.sh",
      names: provisionGap,
      severity: "error",
    });
  }

  return violations;
}

export function extractMintStepsFromWorkflow(content: string): MintStepDescriptor[] {
  const blocks = content.split(/\n(?=\s*-\s+name:\s+)/);
  return blocks
    .filter((block) => block.includes("mint-staging-bearers.mts"))
    .map((block, index) => {
      const nameMatch = block.match(/^\s*-\s+name:\s*(.+)$/m);
      const name = nameMatch?.[1]?.trim() || `mint step ${index + 1}`;
      const rolesMatch = block.match(/(?:--roles(?:[ \t]+|=)|MINT_ROLES:\s*['"]?)([A-Za-z, ]+)/);
      const roles = parseRoles(rolesMatch?.[1]?.trim());
      const envNames = [...block.matchAll(/^\s{10,}([A-Z0-9_]+):\s*/gm)]
        .map((match) => match[1]!)
        .filter((name) => name !== "MINT_TTL_SECONDS" && name !== "MINT_ROLES");
      const degrade = /RUNTIME_SMOKE_MINT_DEGRADE:\s*['"]?1['"]?/.test(block);
      return { name, roles, envNames, degrade };
    });
}

export function extractProvisionedSecrets(content: string): string[] {
  return [...content.matchAll(/^\s*"([A-Z0-9_]+):op:\/\//gm)].map((match) => match[1]!);
}

function formatViolation(violation: ContractViolation): string {
  return `${violation.kind}: ${violation.subject}: ${violation.names.join(", ")}`;
}

async function main(): Promise<void> {
  const workflowPath = ".github/workflows/runtime-smoke-staging.yml";
  const provisionPath = "scripts/smoke/provision-staging-secrets.sh";
  const workflow = readFileSync(workflowPath, "utf8");
  const provision = readFileSync(provisionPath, "utf8");
  const steps = extractMintStepsFromWorkflow(workflow);
  const provisionedSecrets = extractProvisionedSecrets(provision);
  const violations = detectContractViolations({ steps, provisionedSecrets });

  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(`verify-mint-env-contract: ${formatViolation(violation)}\n`);
    }
  }

  if (violations.some((violation) => violation.severity === "error")) {
    process.exit(1);
  }

  process.stdout.write(
    `verify-mint-env-contract: PASS (${steps.length} mint steps, ${provisionedSecrets.length} provisioned secrets)\n`,
  );
}

const entry = process.argv[1] ?? "";
if (entry !== "" && import.meta.url === pathToFileURL(entry).href) {
  await main();
}
