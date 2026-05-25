// issue-857: keep the sheets-auth healthcheck alert relay base URL wired in both Worker envs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wranglerToml = readFileSync(resolve(__dirname, "../../wrangler.toml"), "utf8");

function envVarsSection(env: "production" | "staging"): string {
  const pattern = new RegExp(`(?:^|\\n)\\[env\\.${env}\\.vars\\]\\n([\\s\\S]*?)(?=\\n\\[|$)`);
  const match = wranglerToml.match(pattern);
  expect(match, `[env.${env}.vars] exists`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("wrangler.toml internal alert relay binding", () => {
  it.each([
    ["production", "https://api.ubm-hyogo.workers.dev"],
    ["staging", "https://api-staging.ubm-hyogo.workers.dev"],
  ] as const)("%s vars define API_INTERNAL_BASE_URL", (env, expectedUrl) => {
    expect(envVarsSection(env)).toContain(`API_INTERNAL_BASE_URL = "${expectedUrl}"`);
  });

  it("API_INTERNAL_BASE_URL mirrors AUTH_URL per environment", () => {
    for (const env of ["production", "staging"] as const) {
      const section = envVarsSection(env);
      const authUrl = section.match(/^AUTH_URL = "([^"]+)"$/m)?.[1];
      const internalBaseUrl = section.match(/^API_INTERNAL_BASE_URL = "([^"]+)"$/m)?.[1];

      expect(internalBaseUrl, `${env} API_INTERNAL_BASE_URL`).toBe(authUrl);
    }
  });
});
