# Implementation Guide

## Part 1: 初学者向け

学校で緊急連絡を受ける係を決めるように、このタスクではシステムからの大事な知らせを受ける場所を先に用意する。場所がないまま知らせを送ろうとすると、誰にも届かない。

やることは、Slack に連絡部屋を作り、その部屋にだけ届く投函口を作り、その投函口の合言葉を安全な金庫に入れること。金庫から必要な場所へ合言葉を渡すが、紙やノートには合言葉そのものを書かない。

| 用語 | 日常語 |
| --- | --- |
| Slack channel | 連絡部屋 |
| incoming webhook | その部屋への投函口 |
| secret | 外に見せない合言葉 |
| 1Password | 合言葉を入れる金庫 |
| redaction | 見せてはいけない部分を隠すこと |

## Part 2: 技術者向け

Canonical values:

```ts
type SlackIncidentWebhookSecret = {
  name: "SLACK_WEBHOOK_INCIDENT";
  opRef: "op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>";
  channel: "ubm-hyogo-incidents";
};
```

Runtime placement:

- `op read ... | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env staging`
- `op read ... | bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env production`
- `op read ... | gh secret set SLACK_WEBHOOK_INCIDENT --repo daishiman/UBM-Hyogo`

Redaction:

- Common gate: `bash scripts/redaction-grep.sh .`
- Route contract test: `apps/api/src/routes/admin/smoke-observability.test.ts`
- Fixture construction avoids a contiguous webhook host/path literal while preserving route validation behavior.

Edge cases: missing secret, upstream 4xx/5xx, production confirm missing, auth mismatch, Slack 429, and accidental fragment exposure are covered by Phase 6 recovery.
