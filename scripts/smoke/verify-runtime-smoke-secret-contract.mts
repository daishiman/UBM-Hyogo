import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export interface SecretContractViolation {
  readonly kind: "missing_provision" | "stale_provision" | "missing_exemption_rationale";
  readonly names: readonly string[];
  readonly severity: "error" | "warn";
}

export const DEFAULT_EXEMPT_SECRET_RATIONALES: Readonly<Record<string, string>> = {
  STAGING_ADMIN_BEARER: "legacy static bearer fallback; runtime accepts it only when JWT minting is unavailable",
  STAGING_ME_BEARER: "legacy static bearer fallback; runtime accepts it only when JWT minting is unavailable",
  STAGING_MEMBER_ID: "legacy static bearer fallback companion id; minted path derives member id dynamically",
};

const GITHUB_INTERNAL_SECRETS = new Set(["GITHUB_TOKEN"]);

export function extractWorkflowSecrets(content: string): string[] {
  const names = [...content.matchAll(/\bsecrets\.([A-Z0-9_]+)\b/g)]
    .map((match) => match[1]!)
    .filter((name) => !GITHUB_INTERNAL_SECRETS.has(name));
  return [...new Set(names)].sort();
}

export function extractProvisionedSecrets(content: string): string[] {
  const names = [...content.matchAll(/^\s*"([A-Z0-9_]+):op:\/\//gm)].map((match) => match[1]!);
  return [...new Set(names)].sort();
}

export function detectSecretContractViolations(input: {
  readonly workflowSecrets: readonly string[];
  readonly provisionedSecrets: readonly string[];
  readonly exemptSecretRationales?: Readonly<Record<string, string>>;
}): SecretContractViolation[] {
  const exemptSecretRationales = input.exemptSecretRationales ?? DEFAULT_EXEMPT_SECRET_RATIONALES;
  const provisioned = new Set(input.provisionedSecrets);
  const exemptNames = new Set(Object.keys(exemptSecretRationales));
  const workflowSecrets = new Set(input.workflowSecrets);
  const violations: SecretContractViolation[] = [];

  const missingProvision = [...workflowSecrets]
    .filter((name) => !provisioned.has(name) && !exemptNames.has(name))
    .sort();
  if (missingProvision.length > 0) {
    violations.push({ kind: "missing_provision", names: missingProvision, severity: "error" });
  }

  const missingExemptionRationale = [...workflowSecrets]
    .filter((name) => !provisioned.has(name) && exemptNames.has(name))
    .filter((name) => exemptSecretRationales[name]!.trim() === "")
    .sort();
  if (missingExemptionRationale.length > 0) {
    violations.push({
      kind: "missing_exemption_rationale",
      names: missingExemptionRationale,
      severity: "error",
    });
  }

  const staleProvision = [...provisioned].filter((name) => !workflowSecrets.has(name)).sort();
  if (staleProvision.length > 0) {
    violations.push({ kind: "stale_provision", names: staleProvision, severity: "warn" });
  }

  return violations;
}

function formatViolation(violation: SecretContractViolation): string {
  return `${violation.kind}: ${violation.names.join(", ")}`;
}

async function main(): Promise<void> {
  const workflowPath = ".github/workflows/runtime-smoke-staging.yml";
  const provisionPath = "scripts/smoke/provision-staging-secrets.sh";
  const workflowSecrets = extractWorkflowSecrets(readFileSync(workflowPath, "utf8"));
  const provisionedSecrets = extractProvisionedSecrets(readFileSync(provisionPath, "utf8"));
  const violations = detectSecretContractViolations({ workflowSecrets, provisionedSecrets });

  for (const violation of violations) {
    const write = violation.severity === "error" ? process.stderr.write.bind(process.stderr) : process.stdout.write.bind(process.stdout);
    write(`verify-runtime-smoke-secret-contract: ${formatViolation(violation)}\n`);
  }

  if (violations.some((violation) => violation.severity === "error")) {
    process.exit(1);
  }

  process.stdout.write(
    `verify-runtime-smoke-secret-contract: PASS (${workflowSecrets.length} workflow secrets, ${provisionedSecrets.length} provisioned secrets)\n`,
  );
}

const entry = process.argv[1] ?? "";
if (entry !== "" && import.meta.url === pathToFileURL(entry).href) {
  await main();
}
