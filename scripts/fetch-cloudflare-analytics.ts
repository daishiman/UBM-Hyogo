import { mkdir, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

export const SCHEMA_VERSION = "1.0.0" as const;

export const ALLOWED_METRIC_FIELDS = [
  "requests",
  "totalRequests",
  "errors5xx",
  "readQueries",
  "writeQueries",
  "invocations",
] as const;

export type MetricField = (typeof ALLOWED_METRIC_FIELDS)[number];

export interface AnalyticsExport {
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  periodStart: string;
  periodEnd: string;
  zoneTag: string;
  accountTag: string;
  metrics: Record<MetricField, number>;
}

export const DEFAULT_OUTPUT_DIR =
  "docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence";

export const DEFAULT_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export const RETENTION_ACTIVE_COUNT = 12;
export const REDACTED_CLOUDFLARE_IDENTIFIER = "[redacted]" as const;

export function formatOutputFilename(now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  return `analytics-export-${yyyy}${mm}${dd}-${hh}${mi}-UTC.json`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`whitelistFields: missing or invalid field "${name}"`);
  }
}

export function whitelistFields(raw: unknown): AnalyticsExport {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("whitelistFields: input is not an object");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`whitelistFields: schemaVersion must be "${SCHEMA_VERSION}"`);
  }
  assertString(obj.exportedAt, "exportedAt");
  assertString(obj.periodStart, "periodStart");
  assertString(obj.periodEnd, "periodEnd");
  assertString(obj.zoneTag, "zoneTag");
  assertString(obj.accountTag, "accountTag");

  if (typeof obj.metrics !== "object" || obj.metrics === null) {
    throw new Error("whitelistFields: missing metrics object");
  }
  const rawMetrics = obj.metrics as Record<string, unknown>;
  const metrics = {} as Record<MetricField, number>;
  for (const field of ALLOWED_METRIC_FIELDS) {
    const value = rawMetrics[field];
    if (!isFiniteNumber(value)) {
      throw new Error(`whitelistFields: metrics.${field} must be a finite number`);
    }
    metrics[field] = value;
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: obj.exportedAt,
    periodStart: obj.periodStart,
    periodEnd: obj.periodEnd,
    zoneTag: obj.zoneTag,
    accountTag: obj.accountTag,
    metrics,
  };
}

export interface FetchOptions {
  token: string;
  zoneTag: string;
  accountTag: string;
  period: { start: Date; end: Date };
  endpoint?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}

const GRAPHQL_QUERY = `
  query AggregateAnalytics($zoneTag: String!, $accountTag: String!, $start: Time!, $end: Time!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end }) {
          sum { requests }
        }
        totalRequestsGroups: httpRequests1dGroups(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end }) {
          sum { requests }
        }
        errorsGroups: httpRequests1dGroups(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end, edgeResponseStatus_geq: 500, edgeResponseStatus_lt: 600 }) {
          count
        }
      }
      accounts(filter: { accountTag: $accountTag }) {
        d1AnalyticsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end }) {
          sum { readQueries writeQueries }
        }
        workersInvocationsAdaptive(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end }) {
          sum { requests }
        }
      }
    }
  }
`;

interface GraphqlResponse {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1dGroups?: Array<{ sum?: { requests?: number } }>;
        totalRequestsGroups?: Array<{ sum?: { requests?: number } }>;
        errorsGroups?: Array<{ count?: number }>;
      }>;
      accounts?: Array<{
        d1AnalyticsAdaptiveGroups?: Array<{ sum?: { readQueries?: number; writeQueries?: number } }>;
        workersInvocationsAdaptive?: Array<{ sum?: { requests?: number } }>;
      }>;
    };
  };
  errors?: unknown[];
}

function num(value: unknown): number {
  return isFiniteNumber(value) ? value : 0;
}

function sumBy<T>(items: T[] | undefined, pick: (item: T) => unknown): number {
  return (items ?? []).reduce((total, item) => total + num(pick(item)), 0);
}

function sanitizeGraphqlErrors(errors: unknown[]): string {
  return JSON.stringify(
    errors.map((error) => {
      if (typeof error !== "object" || error === null) return { message: "unknown" };
      const maybe = error as { message?: unknown; code?: unknown };
      return {
        code: typeof maybe.code === "string" ? maybe.code : undefined,
        message: typeof maybe.message === "string" ? maybe.message : "GraphQL error",
      };
    }),
  );
}

export async function fetchAnalytics(opts: FetchOptions): Promise<AnalyticsExport> {
  const endpoint = opts.endpoint ?? DEFAULT_GRAPHQL_ENDPOINT;
  const fetchFn = opts.fetchImpl ?? fetch;
  const res = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: GRAPHQL_QUERY,
      variables: {
        zoneTag: opts.zoneTag,
        accountTag: opts.accountTag,
        start: opts.period.start.toISOString(),
        end: opts.period.end.toISOString(),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Cloudflare GraphQL HTTP ${res.status}`);
  }
  const json = (await res.json()) as GraphqlResponse;
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Cloudflare GraphQL errors: ${sanitizeGraphqlErrors(json.errors)}`);
  }

  const zone = json.data?.viewer?.zones?.[0];
  const account = json.data?.viewer?.accounts?.[0];
  const requests = sumBy(zone?.httpRequests1dGroups, (group) => group.sum?.requests);
  const totalRequests = sumBy(zone?.totalRequestsGroups, (group) => group.sum?.requests);
  const errors5xx = sumBy(zone?.errorsGroups, (group) => group.count);
  const readQueries = sumBy(account?.d1AnalyticsAdaptiveGroups, (group) => group.sum?.readQueries);
  const writeQueries = sumBy(account?.d1AnalyticsAdaptiveGroups, (group) => group.sum?.writeQueries);
  const invocations = sumBy(account?.workersInvocationsAdaptive, (group) => group.sum?.requests);

  return whitelistFields({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: (opts.now ?? new Date()).toISOString(),
    periodStart: opts.period.start.toISOString(),
    periodEnd: opts.period.end.toISOString(),
    zoneTag: REDACTED_CLOUDFLARE_IDENTIFIER,
    accountTag: REDACTED_CLOUDFLARE_IDENTIFIER,
    metrics: {
      requests,
      totalRequests,
      errors5xx,
      readQueries,
      writeQueries,
      invocations,
    },
  });
}

export async function atomicWriteJson(opts: {
  outputPath: string;
  data: AnalyticsExport;
}): Promise<void> {
  await mkdir(dirname(opts.outputPath), { recursive: true });
  const tmp = `${opts.outputPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(tmp, `${JSON.stringify(opts.data, null, 2)}\n`, "utf8");
    await rename(tmp, opts.outputPath);
  } catch (error) {
    await unlink(tmp).catch(() => undefined);
    throw error;
  }
}

const FILENAME_DATE_RE = /^analytics-export-(\d{4})(\d{2})\d{2}-\d{4}-UTC\.json$/;

export interface RotateArchiveResult {
  moved: string[];
  kept: string[];
}

export async function rotateArchive(opts: {
  outputDir: string;
  retentionCount: number;
  archiveSubdir?: string;
}): Promise<RotateArchiveResult> {
  const archiveSubdir = opts.archiveSubdir ?? "archive";
  let entries: string[];
  try {
    entries = await readdir(opts.outputDir);
  } catch {
    return { moved: [], kept: [] };
  }
  const targets: Array<{ name: string; mtimeMs: number; yearMonth: string }> = [];
  for (const name of entries) {
    if (extname(name) !== ".json") continue;
    const match = FILENAME_DATE_RE.exec(name);
    if (!match) continue;
    const full = join(opts.outputDir, name);
    let st;
    try {
      st = await stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    targets.push({ name, mtimeMs: st.mtimeMs, yearMonth: `${match[1]}-${match[2]}` });
  }
  targets.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const kept = targets.slice(0, opts.retentionCount).map((t) => t.name);
  const toMove = targets.slice(opts.retentionCount);
  const moved: string[] = [];
  for (const item of toMove) {
    const dest = join(opts.outputDir, archiveSubdir, item.yearMonth);
    await mkdir(dest, { recursive: true });
    await rename(join(opts.outputDir, item.name), join(dest, item.name));
    moved.push(item.name);
  }
  return { moved, kept };
}

function previousMonthBoundaries(now: Date): { start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return { start, end };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export async function main(): Promise<void> {
  const token = requireEnv("CLOUDFLARE_ANALYTICS_API_TOKEN");
  const zoneTag = requireEnv("CLOUDFLARE_ZONE_TAG");
  const accountTag = requireEnv("CLOUDFLARE_ACCOUNT_TAG");
  const outDir = process.env.ANALYTICS_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;
  const dryRun = process.env.DRY_RUN === "1";

  const now = new Date();
  const period = previousMonthBoundaries(now);
  const data = await fetchAnalytics({ token, zoneTag, accountTag, period, now });

  if (dryRun) {
    process.stdout.write(`[dry-run] would write ${formatOutputFilename(now)} to ${outDir}\n`);
    return;
  }

  const filename = formatOutputFilename(now);
  await atomicWriteJson({ outputPath: join(outDir, filename), data });
  await rotateArchive({ outputDir: outDir, retentionCount: RETENTION_ACTIVE_COUNT });
}

const isDirectInvocation = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === new URL(`file://${entry}`).href;
  } catch {
    return false;
  }
})();

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
