import { notFound } from "next/navigation";
import { readRawEnv } from "../../../src/lib/env";

function smokeFixtureEnabled() {
  const env = readRawEnv();
  return env["ENABLE_STAGING_SMOKE_FIXTURE"] === "1" && env["ENVIRONMENT"] !== "production";
}

export default function SmokeErrorBoundaryFixture() {
  if (!smokeFixtureEnabled()) {
    notFound();
  }

  const error = new Error("staging-smoke error boundary fixture") as Error & { digest?: string };
  error.digest = "staging-smoke-fixture";
  throw error;
}
