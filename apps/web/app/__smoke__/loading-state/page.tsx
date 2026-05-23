import { notFound } from "next/navigation";
import Loading from "../../loading";
import { smokeFixtureEnabled } from "../_lib/fixture-guard";

export const dynamic = "force-dynamic";

const DEFAULT_DELAY_MS = 1500;
const MAX_DELAY_MS = 3000;

function clampDelay(raw: string | string[] | undefined) {
  if (typeof raw !== "string") {
    return DEFAULT_DELAY_MS;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_DELAY_MS;
  }

  return Math.min(value, MAX_DELAY_MS);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default async function SmokeLoadingStateFixture({
  searchParams,
}: {
  searchParams: Promise<{ delay?: string | string[]; preview?: string | string[] }>;
}) {
  if (!smokeFixtureEnabled()) {
    notFound();
  }

  const { delay, preview } = await searchParams;
  if (preview === "loading") {
    return <Loading />;
  }

  const delayMs = clampDelay(delay);
  await sleep(delayMs);

  return (
    <main className="mx-auto max-w-xl px-6 py-12" data-page="smoke-loading-state-fixture">
      <h1 className="text-xl font-semibold">Loading state smoke fixture</h1>
      <p className="mt-2 text-sm">delay-ms: {delayMs}</p>
    </main>
  );
}
