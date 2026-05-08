# Implementation Guide

## Part 1: 中学生レベル

大事な見張り当番が、2 つの記録ノートを見比べる作業を想像する。1 冊は GitHub の出来事、もう 1 冊は Cloudflare の出来事を書くノート。どちらか片方だけを見ると普通に見える出来事でも、同じ時間に近い出来事を並べると「これは急いで確認した方がよい」と分かることがある。

この仕様書は、その見比べを人の手だけに頼らず、15 分おきに自動で確認するための準備である。危ない出来事が見つかったら、必要な人へ Slack で知らせ、後から見返せるように安全な形で記録する。

ただし、秘密の合言葉、メールの細かい部分、完全な IP アドレス、ブラウザの細かい名前は保存しない。住所録を安全に扱う時に、家の番地まで書かず「だいたいの地域」だけ残すのと同じで、調査に必要な形まで小さくしてから扱う。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| audit log | 出来事を順番に書いた記録ノート |
| correlation | 2 冊の記録を見比べて関係を探すこと |
| cron trigger | 時間になったら自動で鳴る目覚まし |
| Slack webhook | 決まった部屋へ知らせを届ける投函口 |
| D1 | 後で見返すための小さな表 |
| salt | 同じ答えを外から推測しにくくする秘密の材料 |

## Part 2: 技術者レベル

### Scope

後続 implementation wave は次を 1 サイクルで実装する。

- `POST /internal/audit-correlation/run`
- Worker scheduled handler from `*/15 * * * *`
- D1 table `audit_correlation_findings`
- HIGH severity Slack incoming webhook notification
- redact-safe grep gate in local evidence and CI
- runbook / aiworkflow-requirements same-wave sync

### Interfaces

```ts
export interface AuditCorrelationEnv {
  readonly DB: D1Database;
  readonly ENVIRONMENT: "development" | "staging" | "production";
  readonly GITHUB_AUDIT_PAT: string;
  readonly AUDIT_CORRELATION_SALT: string;
  readonly AUDIT_CORRELATION_INTERNAL_TOKEN: string;
  readonly SLACK_AUDIT_INCIDENT_WEBHOOK_URL: string;
  readonly AUDIT_CORRELATION_RUNBOOK_BASE_URL: string;
  readonly AUDIT_CORRELATION_GITHUB_ORG: string;
}

export interface RunCorrelationResult {
  readonly fetched: number;
  readonly cloudflareLoaded: number;
  readonly correlated: number;
  readonly persisted: number;
  readonly notifiedHigh: number;
}

export function runCorrelation(deps: {
  readonly env: AuditCorrelationEnv;
  readonly now?: () => Date;
}): Promise<RunCorrelationResult>;
```

### API

`POST /internal/audit-correlation/run`

- Auth: `Authorization: Bearer <AUDIT_CORRELATION_INTERNAL_TOKEN>`
- Success: `200 { fetched, cloudflareLoaded, correlated, persisted, notifiedHigh }`
- Unauthorized: `401 { "error": "unauthorized" }`
- Dependency error: `503 { "error": "audit_correlation_unavailable" }`

The route uses timing-safe comparison. Scheduled invocations bypass HTTP auth and call `runCorrelation()` directly from Worker internals.

### Persisted Fields

Allowed D1 columns:

- `fingerprint_hash_prefix`
- `fingerprint_version`
- `actor_domain`
- `ip_prefix`
- `ua_bucket`
- `severity`
- `event_type`
- `reason`
- `observed_at`
- `created_at`

Forbidden in docs, logs, evidence, source, D1 rows:

- full email
- full IP
- raw user agent
- PAT / webhook URL / salt literal / internal token

### Runtime Path x Evidence

| Runtime path | Evidence |
| --- | --- |
| local route / scheduled contract | `outputs/phase-11/evidence/{typecheck,lint,test,build}.log` |
| staging cron | `outputs/phase-11/evidence/staging-cron-1run.log` |
| D1 migration / row safety | `outputs/phase-11/evidence/{d1-migration-apply-staging,d1-grep-gate}.log` |
| Slack dry-run | `outputs/phase-11/evidence/slack-dryrun-payload.json` + `grep-gate.log` |
| CI hygiene | `.github/workflows/audit-correlation-verify.yml` actionlint / shellcheck / bats |

### Edge Cases

- GitHub `429`: max 3 short retries, then fail current cron cycle and let next 15 minute cycle retry.
- Slack failure: best-effort log only; it must not roll back D1 persistence.
- Duplicate finding: D1 unique key on `fingerprint_hash_prefix + observed_at` ignores duplicates.
- Salt rotation: no dual-salt runtime; preserve old rows by `fingerprint_version`.
