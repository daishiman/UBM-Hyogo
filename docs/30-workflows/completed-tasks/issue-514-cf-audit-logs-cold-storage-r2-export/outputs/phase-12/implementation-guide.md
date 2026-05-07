# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か: Cloudflare の操作記録は近くの引き出し（D1）に 30 日だけ残る。半年後に「この時に何が起きたか」を確認したくても、引き出しの中身はもう消えている。そのため、消える前に大きな倉庫（R2）へ写し、どの箱へ入れたかを台帳（manifest）に書いておく。

学校の図書館で例えると、毎日、古くなりそうな貸出記録を倉庫の箱へ移す。箱には「2026 年 5 月 7 日分」のような棚番号を付ける。台帳には「何件入れたか」「中身が壊れていないかを確かめる合言葉」を書く。半年に 1 回、箱から本当に取り出せるかを試す。これが restore drill。

| 専門用語 | 日常語 |
| --- | --- |
| R2 bucket | クラウド上の大きなフォルダ |
| binding `UBM_AUDIT_COLD_STORAGE` | サーバーがフォルダへ入るための接続口 |
| D1 `cf_audit_log` | 近くにある 30 日分の引き出し |
| manifest | どの箱に何を入れたかの台帳 |
| restore drill | 倉庫から取り出して中身を確認する訓練 |
| redaction | 秘密や個人情報を黒塗りすること |
| object key | 倉庫の棚番号 |

## Part 2: 技術者レベル

### Canonical Flow

1. Daily workflow runs at `0 2 * * *`.
2. Export window is `[now - 29d, now - 26d)`.
3. Each UTC day becomes one object key: `audit/v1/yyyy=YYYY/mm=MM/dd=DD/cf-audit-log-YYYYMMDD.jsonl.gz`.
4. Completed manifest partition is skipped.
5. Convert rows to cold-storage redacted JSONL, run redaction guard, insert manifest `pending`, gzip JSONL, put to R2 with `If-None-Match: *`, then mark manifest `completed` with `r2_etag`.
6. G3-prod runs first export only after G2 applies the manifest migration.

### Types

```typescript
export type ExportWindow = { fromUtc: Date; toUtc: Date };
export type R2ObjectKey = `audit/v1/yyyy=${number}/mm=${number}/dd=${number}/cf-audit-log-${number}.jsonl.gz`;
export type ExportManifestStatus = "pending" | "completed" | "failed";

export type ExportManifestRow = {
  id: string;
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: R2ObjectKey;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number | null;
  sha256: string;
  redactionPolicyVersion: "v1";
  status: ExportManifestStatus;
};
```

### APIs

```typescript
export function exportToR2(input: {
  env: { DB: D1Database; UBM_AUDIT_COLD_STORAGE: R2Bucket };
  dateRange?: ExportWindow;
  redactionPolicyVersion: "v1";
  dryRun?: boolean;
}): Promise<ExportManifestRow[]>;

export function restoreDrill(input: {
  env: { DB: D1Database; UBM_AUDIT_COLD_STORAGE: R2Bucket };
  objectKey?: R2ObjectKey;
  targetTempTable: string;
}): Promise<{ rowCount: number; sha256: string; ok: boolean }>;
```

### Runtime Path x Evidence

| Path | Evidence | Gate |
| --- | --- | --- |
| Fixture dry-run | `outputs/phase-11/manual-smoke-log.md` | local |
| D1 migration apply | `outputs/phase-13/g2-d1-applied-fresh-production.log` | G2 |
| First daily export | `outputs/phase-13/g3-export-first-run.log` | G3-prod |
| Restore drill | `outputs/phase-13/g3-export-first-run.log` | G3-prod |

### Error Handling

- Redaction violation: fail-closed, no R2 PUT, manifest `failed`, security Issue.
- Duplicate partition: skip completed row; retry failed row.
- R2 PUT failure: manifest `failed`, next run may retry.
- Restore mismatch: high priority security/operations Issue, G4 blocked.
