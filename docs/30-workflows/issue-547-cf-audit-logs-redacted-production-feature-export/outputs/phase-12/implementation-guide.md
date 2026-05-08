# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か: Cloudflare の操作記録には、だれが、いつ、どんな操作をしたかが残ります。そのまま外に出すと、メールアドレスや細かい住所のような手がかりが混ざることがあります。学習用の材料にする前に、個人が分からない形へ変える必要があります。

たとえば学校のテスト結果を分析するとき、名前や住所を消して「何年生」「どの教科」「点数の幅」だけを見るようなものです。今回の export は、操作記録から危ない情報を消し、学習に使える形だけをファイルにします。

何をするか: `scripts/cf.sh audit-log feature-export` で D1 の `cf_audit_log` を読むだけにし、結果を JSONL と manifest に保存します。秘密の値、メール、完全な IP、ブラウザ名の長い文字列が残っていないかを最後に検査します。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| D1 | 記録を入れておく表 |
| JSONL | 1 行に 1 件ずつ並んだメモ帳 |
| manifest | 作ったファイルの控え伝票 |
| redaction | 見せてはいけない部分を消すこと |
| leakage scan | 消し忘れチェック |

## Part 2: 技術者レベル

Public signatures:

```ts
export async function readEventsForFeatureExport(
  db: D1Like,
  window: FeatureExportWindow,
): Promise<AuditLogEvent[]>;

export async function exportRedactedFeatureDataset(input: {
  db: D1Like;
  window: FeatureExportWindow;
  redactSecret: string;
  outPath: string;
  manifestPath: string;
  now?: () => Date;
}): Promise<FeatureExportManifest>;
```

CLI:

```bash
CF_AUDIT_REDACT_SECRET=... bash scripts/cf.sh audit-log feature-export \
  --days 90 \
  --out /tmp/cf-audit-features.jsonl \
  --manifest-out /tmp/cf-audit-features.manifest.json \
  --confirm-production-export
```

Local fixture verification:

```bash
CF_SH_SKIP_WITH_ENV=1 CF_AUDIT_REDACT_SECRET=local-redaction-secret bash scripts/cf.sh audit-log feature-export \
  --fixture tests/fixtures/cf-audit/feature-export-raw.json \
  --days 90 \
  --out /tmp/cf-audit-features.jsonl \
  --manifest-out /tmp/cf-audit-features.manifest.json \
  --dry-run
```

Error handling:

| Case | Behavior |
| --- | --- |
| missing redaction secret | throw before writing success manifest |
| invalid window | throw before D1 read |
| schema validation failure | throw before final output publication |
| redaction guard / leakage hit | throw before final output publication; `.tmp` files are cleaned |
| production export | user-gated; no automatic mutation |

`--dry-run` is for local or fixture pipeline validation. It does not bypass the production approval check; production D1 export requires `--confirm-production-export` after explicit user approval.

Constants:

| Name | Value |
| --- | --- |
| `redactionPolicyVersion` | `feature-v1` |
| `schemaVersion` | `redacted-features-v1` |
| default days | `90` |
| default secret env | `CF_AUDIT_REDACT_SECRET` |
