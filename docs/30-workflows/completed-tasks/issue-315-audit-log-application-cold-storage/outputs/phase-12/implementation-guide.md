# Implementation Guide: Issue #315 Application audit_log Cold Storage

## Part 1: 中学生レベル概念説明

この変更は「だれが、いつ、何をしたか」の記録を、毎日ひとまとめにして長く保管する仕組みです。

たとえば、学校の職員室にある出席簿を毎日コピーして、鍵つきの保管庫に入れるようなものです。ふだん使う出席簿は机の上に置いたままですが、古くなった分は保管庫にコピー済みか確認してから片づけます。

個人情報はそのまま外に出しません。メールアドレス、電話番号、住所などは、保管庫へ入れる前に「マスク済み」という印に置き換えます。コピーが途中で失敗しても、記録表に「準備中」「完了」「失敗」を残すので、保存していないものを消したり、同じ日を二重に保存したりしにくくなります。

| 専門用語 | 中学生レベルの意味 |
|----------|--------------------|
| application 監査ログ | アプリの中で起きた操作の記録 |
| Cloudflare R2 | ファイルを長く置いておく保管庫 |
| Object Lock | 決めた期間、保管したファイルを消せなくする鍵 |
| D1 | アプリが普段使うデータベース |
| manifest | 保存作業の結果を残す記録表 |
| pending | まだ作業中の状態 |
| completed | 作業が終わった状態 |
| failed | 作業が失敗した状態 |

## Part 2: 技術ドキュメント

### スコープ

| 種別 | 内容 |
|------|------|
| Issue | #315 Refs（CLOSED Issue・再 open 禁止） |
| target | application `audit_log` (D1) |
| 流用元 | Issue #514 cf_audit_log cold storage パターン |

### 変更ファイル

新規:
- `apps/api/migrations/0018_add_audit_log_export_manifest.sql`
- `apps/api/src/lib/audit/redact.ts`(+ spec)
- `scripts/audit-log/export-to-r2.ts`(+ 2 specs)
- `.github/workflows/audit-log-cold-storage.yml`
- `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`

編集:
- `apps/api/src/repository/auditLog.ts`(export 用 6 関数追加)
- `apps/api/src/routes/admin/audit.ts`(共通 redaction policy を admin 表示向け `[masked]` に射影)
- `apps/api/src/env.ts`(R2 binding 型同期)
- `apps/api/wrangler.toml`(R2 binding `UBM_AUDIT_APP_COLD_STORAGE` 追加 / staging + production)
- `apps/api/src/repository/__tests__/_setup.ts`(test fixture truncate list 拡張)

### API 概要

```ts
// PII redaction (apps/api/src/lib/audit/redact.ts)
export const REDACTION_POLICY_VERSION = "v1";
export function redactString(s: string): string;
export function redactAuditPayload(p: Record<string, unknown> | null): ...;
export function redactForExport(row): { beforeJson, afterJson, actorEmailMasked };

// repository (apps/api/src/repository/auditLog.ts)
export const listForExport;
export const insertExportManifest;
export const completeExportManifest;
export const failExportManifest;
export const findExportManifestByPartition;
export const purgeExportedOlderThan;

// exporter (scripts/audit-log/export-to-r2.ts)
export async function exportAuditLogToR2(deps, opts): Promise<ExportRunResult>;
```

### 不変条件

1. raw email / 電話 / 住所 / actor_email が R2 export 経路へ出ない（redaction guard で enforce）
2. `UNIQUE(yyyy,mm,dd)` で同日 export の冪等性確保
3. failed / pending retry は既存 `object_key` を維持し、row_count / bytes / sha256 / export_run_id を再計算して manifest を更新する
4. `purgeExportedOlderThan` は `status='completed'` 被覆日のみ DELETE（未 export / failed 行は残存）
5. R2 bucket は Object Lock COMPLIANCE 7 年（手動セットアップ・Phase 11 gate 後）
6. cron は `0 3 * * *` (cf 系 `0 2 * * *` と分離) で、schedule 実行は `--apply`、manual dispatch は既定 `--dry-run`

### 検証

- typecheck: PASS
- focused unit / integration tests: PASS（redaction / exporter / repository / admin audit contract）
- redaction grep gate (TC-GREP-01/02): PASS
- production D1 migration apply / R2 Object Lock bucket create / non-dry-run workflow execution: user approval gate 待ち

### スコープアウト

- 外部 SIEM (Datadog/Splunk/Elastic/Logpush): 有料 SaaS は solo dev 運用ポリシー外。
- hash chain: Object Lock で immutability 担保済のため redundancy 過大。
- 7 年超過保管: 会計・労務監査要件として 7 年で十分。

### Phase 11 user gate 待ち（mutation 系コマンド）

- `bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled`
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`

### 参照

- 仕様書: `docs/30-workflows/issue-315-audit-log-application-cold-storage/`
- 流用元: `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`
- 運用 runbook: `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`
