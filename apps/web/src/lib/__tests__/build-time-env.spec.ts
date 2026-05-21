import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { getEnv, getPublicEnv } from "../env";

const repoRoot = resolve(import.meta.dirname, "../../../../..");
const siteMetadataPath = resolve(repoRoot, "apps/web/src/lib/seo/site-metadata.ts");
const workflowPath = resolve(repoRoot, ".github/workflows/web-cd.yml");
const wranglerPath = resolve(repoRoot, "apps/web/wrangler.toml");

const requiredBuildEnvKeys = [
  "ENVIRONMENT",
  "NEXT_PUBLIC_API_BASE_URL",
  "PUBLIC_API_BASE_URL",
  "INTERNAL_API_BASE_URL",
  "AUTH_URL",
  "SENTRY_ENVIRONMENT",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "SENTRY_TRACES_SAMPLE_RATE",
  "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE",
] as const;

function readWranglerVars(envName: "staging" | "production"): Record<string, string> {
  const wrangler = readFileSync(wranglerPath, "utf8");
  const sectionHeader = `[env.${envName}.vars]`;
  const sectionStart = wrangler.indexOf(sectionHeader);
  expect(sectionStart, `${sectionHeader} exists in apps/web/wrangler.toml`).toBeGreaterThanOrEqual(0);

  const body = wrangler
    .slice(sectionStart + sectionHeader.length)
    .split(/\n(?=\[)/)[0];

  return Object.fromEntries(
    Array.from(body.matchAll(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"$/gm), ([, key, value]) => [key, value]),
  );
}

function readWorkflowBuildEnv(envName: "staging" | "production"): Record<string, string> {
  const workflow = readFileSync(workflowPath, "utf8");
  const jobStart = workflow.indexOf(`deploy-${envName}:`);
  expect(jobStart, `deploy-${envName} job exists in web-cd.yml`).toBeGreaterThanOrEqual(0);

  const buildStepStart = workflow.indexOf("- name: Build web app (OpenNext Workers bundle)", jobStart);
  expect(buildStepStart, `deploy-${envName} build step exists in web-cd.yml`).toBeGreaterThanOrEqual(0);

  const stepBody = workflow
    .slice(buildStepStart)
    .split(/\n\s{6}- name: Deploy to Cloudflare Workers/)[0];

  return Object.fromEntries(
    Array.from(stepBody.matchAll(/^\s{10}([A-Z0-9_]+):\s*"?([^"\n]+)"?\s*$/gm), ([, key, value]) => [
      key,
      value,
    ]),
  );
}

function readSiteUrl(envName: "staging" | "production"): string {
  const siteMetadata = readFileSync(siteMetadataPath, "utf8");
  const match = siteMetadata.match(new RegExp(`${envName}: "([^"]+)"`));
  expect(match?.[1], `${envName} SITE_URL_MAP exists in site-metadata.ts`).toBeDefined();
  return match?.[1] ?? "";
}

function readBuildEnv(envName: "staging" | "production"): Record<string, string> {
  const wranglerVars = readWranglerVars(envName);
  const workflowEnv = readWorkflowBuildEnv(envName);
  const requiredWranglerVars = Object.fromEntries(
    requiredBuildEnvKeys.map((key) => [key, wranglerVars[key]]),
  );

  expect(workflowEnv).toEqual(requiredWranglerVars);
  expect(workflowEnv.AUTH_URL).toBe(readSiteUrl(envName));
  return workflowEnv;
}

describe("build-time env injection contract", () => {
  it("getPublicEnv() succeeds with staging placeholder env", () => {
    expect(getPublicEnv(readBuildEnv("staging"))).toEqual({
      ENVIRONMENT: "staging",
      NEXT_PUBLIC_API_BASE_URL: "https://ubm-hyogo-api-staging.daishimanju.workers.dev",
    });
  });

  it("getPublicEnv() succeeds with production placeholder env", () => {
    expect(getPublicEnv(readBuildEnv("production"))).toEqual({
      ENVIRONMENT: "production",
      NEXT_PUBLIC_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
    });
  });

  it("getEnv() succeeds with full EnvSchema-required keys for staging build", () => {
    expect(getEnv(readBuildEnv("staging"))).toMatchObject({
      ENVIRONMENT: "staging",
      PUBLIC_API_BASE_URL: "https://ubm-hyogo-api-staging.daishimanju.workers.dev",
      INTERNAL_API_BASE_URL: "https://ubm-hyogo-api-staging.daishimanju.workers.dev",
      AUTH_URL: "https://ubm-hyogo-web-staging.daishimanju.workers.dev",
      SENTRY_ENVIRONMENT: "staging",
      SENTRY_TRACES_SAMPLE_RATE: 0.2,
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: "staging",
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: 0.2,
    });
  });

  it("getEnv() succeeds with full EnvSchema-required keys for production build", () => {
    expect(getEnv(readBuildEnv("production"))).toMatchObject({
      ENVIRONMENT: "production",
      PUBLIC_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
      INTERNAL_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
      AUTH_URL: "https://ubm-hyogo-web-production.daishimanju.workers.dev",
      SENTRY_ENVIRONMENT: "production",
      SENTRY_TRACES_SAMPLE_RATE: 0.1,
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: "production",
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: 0.1,
    });
  });
});
