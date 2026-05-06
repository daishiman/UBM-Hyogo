# Implementation Guide

## Part 1: 中学生レベル

毎月、学校の出席人数を先生が紙にまとめるとします。名前を全部書くと個人情報が多すぎますが、「何人来たか」「困ったことが何回あったか」だけなら、安全にふり返れます。

このタスクも同じです。サイトの細かい利用者情報は保存せず、合計の数字だけを毎月 1 回保存します。そうすると、あとで「先月よりエラーが増えたか」「サイトがちゃんと動いていたか」を比べられます。

保存してよいのは合計値だけです。メールアドレス、IP アドレス、秘密の文字、会員 ID、ログイン情報は保存しません。保存前に機械で検査し、危ない文字が入っていたら保存を止めます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| Cloudflare Analytics | サイトの利用回数を数える仕組み |
| GraphQL | 欲しい数字だけを聞くための質問文 |
| GitHub Actions | 決まった時間に動く作業ロボット |
| Secret | 外に見せない秘密メモ |
| JSON | 機械が読みやすい数字のメモ |

## Part 2: 技術者レベル

`scripts/fetch-cloudflare-analytics.ts` は `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ZONE_TAG`, `CLOUDFLARE_ACCOUNT_TAG` を入力にし、Cloudflare GraphQL Analytics API から aggregate-only metrics を取得する。

```typescript
export interface AnalyticsExport {
  schemaVersion: "1.0.0";
  exportedAt: string;
  periodStart: string;
  periodEnd: string;
  zoneTag: string;
  accountTag: string;
  metrics: {
    requests: number;
    totalRequests: number;
    errors5xx: number;
    readQueries: number;
    writeQueries: number;
    invocations: number;
  };
}

export async function fetchAnalytics(opts: FetchOptions): Promise<AnalyticsExport>;
export async function rotateArchive(opts: RotateOptions): Promise<{ moved: string[]; kept: string[] }>;
export async function atomicWriteJson(opts: AtomicWriteOptions): Promise<void>;
```

`DEFAULT_ANALYTICS_OUTPUT_DIR` は `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` とする。Cloudflare zone/account identifiers are used for API input only and are persisted as `[redacted]`. write は tmp file -> final rename の atomic write とし、GraphQL error / rate limit では final path を更新しない。workflow は redaction violation 時に commit / PR 作成へ進まない。

Redaction patterns must cover email, IPv4, bearer/token, URL query, member ID, session/cookie. Metric arrays returned by GraphQL groups are summed across all returned buckets, not read from only the first element. GraphQL errors are sanitized to code/message only.
