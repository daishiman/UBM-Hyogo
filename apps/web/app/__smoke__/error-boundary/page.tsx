import { notFound } from "next/navigation";
import { smokeFixtureEnabled } from "../_lib/fixture-guard";

export default function SmokeErrorBoundaryFixture() {
  if (!smokeFixtureEnabled()) {
    notFound();
  }

  const error = new Error("staging-smoke error boundary fixture") as Error & { digest?: string };
  error.digest = "staging-smoke-fixture";
  throw error;
}
