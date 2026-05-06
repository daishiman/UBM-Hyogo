# Phase 3: 詳細設計（API契約・データモデル）

## 目的
GraphQL query / 出力 JSON schema / 関数シグネチャを実装可能粒度まで詳細化する。

## Cloudflare GraphQL Analytics クエリ

```graphql
query AggregateAnalytics($zoneTag: String!, $accountTag: String!, $start: Time!, $end: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: 10000
        filter: { datetime_geq: $start, datetime_lt: $end }
      ) {
        sum {
          requests
          edgeResponseStatus
        }
      }
      # errors5xx は httpRequests1dGroups の response status 集計から算出し、
      # firewall event count と混同しない。
      # D1 / Workers metrics は accounts スコープ。zone と並列に取得（別 query 推奨）
    }
    accounts(filter: { accountTag: $accountTag }) {
      d1AnalyticsAdaptiveGroups(
        limit: 10000
        filter: { datetime_geq: $start, datetime_lt: $end }
      ) {
        sum {
          readQueries
          writeQueries
        }
      }
      workersInvocationsAdaptive(
        limit: 10000
        filter: { datetime_geq: $start, datetime_lt: $end }
      ) {
        sum {
          requests
        }
      }
    }
  }
}
```

> 注: 実装時は Cloudflare GraphQL の最新 schema introspection で field 名を確認し、`outputs/phase-11/graphql-introspection.log` に保存すること。`d1AnalyticsAdaptiveGroups` / `workersInvocationsAdaptive` は project の D1 binding / Workers script 名前空間に応じて adapt する。GraphQL group 配列は先頭 1 件だけを読まず、返却 bucket 全体を合算する。`zoneTag` / `accountTag` は GraphQL input のみに使い、永続 JSON では `[redacted]` とする。

## 出力 JSON schema

```typescript
{
  "schemaVersion": "1.0.0",
  "exportedAt": "2026-05-01T02:00:00Z",
  "periodStart": "2026-04-01T00:00:00Z",
  "periodEnd": "2026-05-01T00:00:00Z",
  "zoneTag": "[redacted]",
  "accountTag": "[redacted]",
  "metrics": {
    "requests": 12345,
    "totalRequests": 12345,
    "errors5xx": 12,
    "readQueries": 678,
    "writeQueries": 90,
    "invocations": 1234
  }
}
```

## 関数シグネチャ詳細

```typescript
// scripts/fetch-cloudflare-analytics.ts

const ALLOWED_FIELDS = [
  "schemaVersion",
  "exportedAt",
  "periodStart",
  "periodEnd",
  "zoneTag",
  "accountTag",
  "metrics",
] as const;

const ALLOWED_METRIC_FIELDS = [
  "requests",
  "totalRequests",
  "errors5xx",
  "readQueries",
  "writeQueries",
  "invocations",
] as const;

export interface AnalyticsExport {
  schemaVersion: "1.0.0";
  exportedAt: string;
  periodStart: string;
  periodEnd: string;
  zoneTag: string;
  accountTag: string;
  metrics: Record<(typeof ALLOWED_METRIC_FIELDS)[number], number>;
}

export interface FetchOptions {
  token: string;
  zoneTag: string;
  accountTag: string;
  period: { start: Date; end: Date };
  endpoint?: string; // デフォルト: https://api.cloudflare.com/client/v4/graphql
  fetchImpl?: typeof fetch; // test 用 injection
}

export async function fetchAnalytics(opts: FetchOptions): Promise<AnalyticsExport>;

export function whitelistFields(raw: unknown): AnalyticsExport;
// ALLOWED_FIELDS / ALLOWED_METRIC_FIELDS 以外を drop

export function formatOutputFilename(now: Date): string;
// `analytics-export-${YYYYMMDD}-${HHmm}-UTC.json`

export interface RotateOptions {
  outputDir: string;
  retentionCount: number;
  archiveSubdir?: string; // デフォルト: archive
}

export async function rotateArchive(opts: RotateOptions): Promise<{
  moved: string[];
  kept: string[];
}>;

export interface AtomicWriteOptions {
  outputPath: string;
  data: AnalyticsExport;
  fsImpl?: { writeFile: typeof import("fs/promises").writeFile; rename: typeof import("fs/promises").rename; mkdir: typeof import("fs/promises").mkdir };
}
export async function atomicWriteJson(opts: AtomicWriteOptions): Promise<void>;

export async function main(): Promise<void>;
// env 読み込み → fetch → whitelist → atomic write → rotate
// エラー時は process.exit(1)
```

## エラーハンドリング契約

| エラー | 挙動 |
| --- | --- |
| `CLOUDFLARE_ANALYTICS_API_TOKEN` 未設定 | exit 1、stderr に key 名のみ出力（値は出力しない） |
| GraphQL 4xx/5xx | exit 1、tmp file 削除、本体ファイル更新なし |
| GraphQL response に `errors` 配列がある | exit 1（rate limit を含む）。stderr は code / message のみ出力し、raw JSON 全体は出力しない |
| schema validation 失敗（必須 field 欠落） | exit 1、tmp file 削除 |
| disk write 失敗 | exit 1 |

## redaction-check 仕様

```bash
# scripts/redaction-check-analytics.sh
# 引数: 1個以上の JSON file path
# 検出パターン (case-insensitive):
#   - email: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
#   - IPv4: \b([0-9]{1,3}\.){3}[0-9]{1,3}\b
#   - bearer/token: (bearer |token[":= ]+)[A-Za-z0-9_-]{20,}
#   - URL query: \?[A-Za-z0-9_]+=
#   - member ID: \b(member|memberId|member_id)[":= ][A-Za-z0-9_-]+\b
#   - session: (session|sid|cookie)[":= ]
# どれか1つでも検出 → exit 1
```

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` 1Password 正本 / GitHub Secrets 派生コピー

## 成果物
- 本ファイル
- `outputs/phase-3/phase-3.md`

## 完了条件
- GraphQL query / JSON schema / 全関数シグネチャ / エラー契約 / redaction パターンが確定
