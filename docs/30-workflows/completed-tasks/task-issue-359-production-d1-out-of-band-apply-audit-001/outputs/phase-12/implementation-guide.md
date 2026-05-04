# Implementation guide

## Part 1: 初学者向け

大事な帳簿に、誰かが先に記入していたことが分かったとします。内容は正しそうでも、「誰が、いつ、どんな許可で書いたのか」が分からないままだと、次に同じことが起きたときに困ります。

このタスクは、その帳簿を新しく書き換える作業ではありません。すでにある記録を読み、ほかの記録と見比べて、「許可をもらって行われた作業だったのか」「出所が分からない作業だったのか」をはっきりさせます。

| 用語 | 日常語での言い換え |
| --- | --- |
| production D1 | 本番で使っている大事な台帳 |
| migration | 台帳の形を変える手順書 |
| ledger | いつ手順が行われたかの記録表 |
| read-only | 読むだけで、書き換えないこと |
| redaction | 秘密の文字を見えない形にすること |

## Part 2: 技術者向け

This workflow is a docs-only / NON_VISUAL audit specification for prior production D1 migration application:

```ts
type AttributionDecision =
  | { kind: "confirmed"; workflow: string; approvalEvidencePath: string }
  | { kind: "unattributed"; reason: "no evidence found" };

interface AuditRecord {
  targetDatabase: "ubm-hyogo-db-prod";
  migrations: Array<{ name: string; appliedAtUtc: string }>;
  commandEvidencePath: string | null;
  approvalEvidencePath: string | null;
  targetEvidencePath: string | null;
  decision: AttributionDecision;
}
```

The Phase 11 runtime audit collected command evidence, approval evidence, and target database evidence before classifying the candidate as confirmed. Missing evidence would have stayed `unattributed`; indirect evidence must not be promoted into confirmed evidence in future reuse of this workflow.

Confirmed evidence fixed in this wave:

| migration | confirmed source |
| --- | --- |
| `0008_schema_alias_hardening.sql` | `backend-ci` run `25207878876` after PR #364 merge / commit `9841e06a` |
| `0008_create_schema_aliases.sql` | `backend-ci` run `25211958572` after PR #365 merge / commit `2ced613d` |

Configurable constants:

| parameter | value |
| --- | --- |
| target database | `ubm-hyogo-db-prod` |
| migration names | `0008_schema_alias_hardening.sql`, `0008_create_schema_aliases.sql` |
| operation window | 2026-04-29 through 2026-05-03 |
| allowed Cloudflare wrapper | `bash scripts/cf.sh` |
| prohibited actions | production write, additional apply, rollback, deploy, direct `wrangler`, commit, push, PR |
