# Phase 5: コア実装

## 目的
Phase 3 で確定したシグネチャを、実装可能な完全コードとして配置する。

## 実装ファイル

### `scripts/fetch-cloudflare-analytics.ts`（新規）

骨格コード（実装プロンプト側で完成させる）:

```typescript
import { mkdir, rename, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const SCHEMA_VERSION = "1.0.0" as const;
export const ALLOWED_METRIC_FIELDS = [
  "requests",
  "totalRequests",
  "errors5xx",
  "readQueries",
  "writeQueries",
  "invocations",
] as const;

export interface AnalyticsExport {
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  periodStart: string;
  periodEnd: string;
  zoneTag: string;
  accountTag: string;
  metrics: Record<(typeof ALLOWED_METRIC_FIELDS)[number], number>;
}

export function formatOutputFilename(now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  return `analytics-export-${yyyy}${mm}${dd}-${hh}${mi}-UTC.json`;
}

export function whitelistFields(raw: unknown): AnalyticsExport {
  // raw を厳密に type guard し、ALLOWED_METRIC_FIELDS のみ抽出
  // 不足 field は throw、余剰 field は drop
  // 詳細は実装者がガード関数として記述
  throw new Error("not implemented");
}

export interface FetchOptions {
  token: string;
  zoneTag: string;
  accountTag: string;
  period: { start: Date; end: Date };
  endpoint?: string;
  fetchImpl?: typeof fetch;
}

export async function fetchAnalytics(opts: FetchOptions): Promise<AnalyticsExport> {
  const endpoint = opts.endpoint ?? "https://api.cloudflare.com/client/v4/graphql";
  const fetchFn = opts.fetchImpl ?? fetch;
  const query = `
    query AggregateAnalytics($zoneTag: String!, $accountTag: String!, $start: Time!, $end: Time!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(limit: 10000, filter: { datetime_geq: $start, datetime_lt: $end }) {
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
  const res = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        zoneTag: opts.zoneTag,
        accountTag: opts.accountTag,
        start: opts.period.start.toISOString(),
        end: opts.period.end.toISOString(),
      },
    }),
  });
  if (!res.ok) throw new Error(`Cloudflare GraphQL HTTP ${res.status}`);
  const json = (await res.json()) as { data?: unknown; errors?: unknown[] };
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Cloudflare GraphQL errors: ${sanitizeGraphqlErrors(json.errors)}`);
  }
  // json.data の group 配列を全 bucket 合算 + whitelistFields
  return whitelistFields({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    periodStart: opts.period.start.toISOString(),
    periodEnd: opts.period.end.toISOString(),
    zoneTag: "[redacted]",
    accountTag: "[redacted]",
    metrics: /* extract */ {},
  });
}

export async function atomicWriteJson(opts: {
  outputPath: string;
  data: AnalyticsExport;
}): Promise<void> {
  await mkdir(dirname(opts.outputPath), { recursive: true });
  const tmp = `${opts.outputPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(tmp, JSON.stringify(opts.data, null, 2), "utf8");
    await rename(tmp, opts.outputPath);
  } catch (error) {
    await import("node:fs/promises").then((fs) => fs.unlink(tmp)).catch(() => undefined);
    throw error;
  }
}

export async function rotateArchive(opts: {
  outputDir: string;
  retentionCount: number;
  archiveSubdir?: string;
}): Promise<{ moved: string[]; kept: string[] }> {
  // outputDir 内の analytics-export-*.json を mtime 降順で取得
  // 上位 retentionCount 件を kept、それ以下を archive/YYYY-MM/ へ rename
  // 同期 API でなく fs/promises 利用 → 関数を async にしても可
  throw new Error("not implemented");
}

function sanitizeGraphqlErrors(errors: unknown[]): string {
  return JSON.stringify(errors.map((error) => {
    if (typeof error !== "object" || error === null) return { message: "unknown" };
    const maybe = error as { message?: unknown; code?: unknown };
    return {
      code: typeof maybe.code === "string" ? maybe.code : undefined,
      message: typeof maybe.message === "string" ? maybe.message : "GraphQL error",
    };
  }));
}

export async function main(): Promise<void> {
  const token = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN;
  const zoneTag = process.env.CLOUDFLARE_ZONE_TAG;
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_TAG;
  const outDir =
    process.env.ANALYTICS_OUTPUT_DIR ??
    "docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence";
  if (!token || !zoneTag || !accountTag) {
    console.error("Missing required env: CLOUDFLARE_ANALYTICS_API_TOKEN / CLOUDFLARE_ZONE_TAG / CLOUDFLARE_ACCOUNT_TAG");
    process.exit(1);
  }
  const now = new Date();
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const data = await fetchAnalytics({ token, zoneTag, accountTag, period: { start: periodStart, end: periodEnd } });
  const filename = formatOutputFilename(now);
  await atomicWriteJson({ outputPath: join(outDir, filename), data });
  await rotateArchive({ outputDir: outDir, retentionCount: 12 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
```

### `scripts/redaction-check-analytics.sh`（新規）

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <json-file> [<json-file>...]" >&2
  exit 2
fi

PATTERNS=(
  '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
  '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b'
  '(bearer |token[":= ]+)[A-Za-z0-9_-]{20,}'
  '\?[A-Za-z0-9_]+='
  '\b(member|memberId|member_id)[":= ][A-Za-z0-9_-]+\b'
  '(session|sid|cookie)[":= ]'
)

fail=0
for f in "$@"; do
  for p in "${PATTERNS[@]}"; do
    if grep -E -i "$p" "$f" >/dev/null; then
      echo "REDACTION VIOLATION in $f: pattern=$p" >&2
      fail=1
    fi
  done
done

exit "$fail"
```

### `package.json` 追記（編集）

```jsonc
{
  "scripts": {
    "analytics:fetch": "tsx scripts/fetch-cloudflare-analytics.ts",
    "analytics:redaction-check": "bash scripts/redaction-check-analytics.sh"
  }
}
```

## 実行検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 成果物
- 本ファイル（実装骨格）
- `outputs/phase-5/phase-5.md`（実装メモ）

## 完了条件
- 実装ファイルの完全な骨格コードが本仕様書に記述されている
- 実装プロンプトが本骨格をもとに完成させられる粒度

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` scheduled workflow / PR branch operation
