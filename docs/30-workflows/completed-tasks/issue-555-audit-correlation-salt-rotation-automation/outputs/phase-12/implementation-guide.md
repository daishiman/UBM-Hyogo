# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要か。大事な記録を安全に見比べるには、名前やメールアドレスをそのまま使わず、同じ人だと分かる印を使う必要がある。その印を作るための「ひみつの材料」が古くなったとき、急に取り替えると、昨日までの印と今日からの印が別人のものに見えてしまう。

たとえば、学校の出席カードで、古いスタンプ台から新しいスタンプ台へ変える場面に似ている。切り替えの日だけは、古いスタンプと新しいスタンプの両方を見比べられるようにしておくと、同じ生徒の出席記録をつなげて読める。

このタスクでは、古い印と新しい印を短い期間だけ一緒に作り、切り替えが終わったら古い印を作らないようにする。秘密の材料そのものは、画面や記録ファイルには残さない。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| salt | 印を作るためのひみつの材料 |
| fingerprint | 人を直接書かずに見分ける印 |
| rotation | 古い材料を新しい材料に取り替えること |
| dual-hash | 古い印と新しい印を一時的に両方作ること |
| staging | 本番前の試し場 |

## Part 2: 技術者向け詳細

### Current contract

既存実装は `apps/api/src/audit-correlation/types.ts` の `NormalizedAuditEvent extends CorrelationKey` と `correlate(github, cloudflare)` が正本である。Issue #555 は並行 `NormalizedAuditEvent bridge shape` モデルを作らず、既存 contract を拡張する。

```ts
export interface CorrelationKey {
  readonly fingerprintHash: FingerprintHash;
  readonly fingerprintVersion: 1 | 2;
  readonly fingerprintHashes?: {
    readonly v1?: FingerprintHash;
    readonly v2?: FingerprintHash;
  };
}
```

Legacy v1 は `{ fingerprintHash, fingerprintVersion: 1 }` を許容し、相関前 adapter で `{ fingerprintHashes: { v1: fingerprintHash } }` へ正規化する。v2 は `fingerprintHashes.v2` を canonical とし、`fingerprintHash` は後方互換 alias として維持する。

### API signatures

```ts
export function correlate(
  github: ReadonlyArray<NormalizedAuditEvent>,
  cloudflare: ReadonlyArray<NormalizedAuditEvent>,
): ReadonlyArray<CorrelatedFinding>;
```

`correlate()` の public signature は維持する。v1/v2 bridge は内部 helper で実装する。

### Edge cases

| Case | Expected behavior |
| --- | --- |
| legacy v1 only | v1-only group として扱う |
| v1/v2 bridge record present | v1 group と v2 group を union する |
| actor absent during bridge window | 自動 backfill しない。旧 incident は連結されない |
| `AUDIT_CORRELATION_SALT_PREVIOUS` missing | v2 single-hash path |
| end-rotation forgotten | Phase 11 grep gate で v1 新規生成を検出し FAIL |

### Configuration

| Name | Owner | Notes |
| --- | --- | --- |
| `AUDIT_CORRELATION_SALT` | 1Password + Cloudflare Secrets | current salt |
| `AUDIT_CORRELATION_SALT_PREVIOUS` | 1Password + Cloudflare Secrets | rotation window only |
| `fingerprintVersion` | code contract | v1 legacy / v2 current |
| bridge window | runbook | default 7 days |

### Commands

Use the actual package name from `apps/api/package.json`: `@ubm-hyogo/api`.

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/audit-correlation/__tests__/redact.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test -- src/audit-correlation/__tests__/correlate.test.ts
shellcheck scripts/audit-correlation/rotate-salt.sh
```
