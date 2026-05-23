import { readRawEnv } from "../../../src/lib/env";

function readFixtureEnvValue(env: Record<string, unknown>, key: string) {
  return (typeof process === "undefined" ? undefined : process.env[key]) ?? env[key];
}

export function smokeFixtureEnabled() {
  const env = readRawEnv();
  return (
    readFixtureEnvValue(env, "ENABLE_STAGING_SMOKE_FIXTURE") === "1" &&
    readFixtureEnvValue(env, "ENVIRONMENT") !== "production"
  );
}
