import { notFound } from "next/navigation";
import { readRawEnv } from "../../../src/lib/env";

function smokeFixtureEnabled() {
  const env = readRawEnv();
  return env["ENABLE_STAGING_SMOKE_FIXTURE"] === "1" && env["ENVIRONMENT"] !== "production";
}

export default function SmokeMembersListFixture() {
  if (!smokeFixtureEnabled()) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12" data-page="smoke-members-list-fixture">
      <h1 className="text-xl font-semibold">Members list smoke fixture</h1>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
        <li>fixture-member-1</li>
        <li>fixture-member-2</li>
      </ul>
    </main>
  );
}
