# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 1 / 13 |
| 目的 | application audit_log cold storage 機能の AC・スコープ・既存資産 inventory を確定する |
| taskType | implementation |
| visualEvidence | NON_VISUAL（バックエンドのみ。UI 変更なし） |
| implementation_mode | new |
| implementationCategory | standard |
| 想定工数 | 0.5 day（仕様確定のみ） |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 受入条件 (Acceptance Criteria)

- **AC-1**: application `audit_log` テーブル（`apps/api/src/repository/auditLog.ts` 配下）の日次差分が、redacted JSONL.gz として Cloudflare R2 (`UBM_AUDIT_APP_COLD_STORAGE`) に export される。
- **AC-2**: D1 内 `audit_log_export_manifest` テーブルで 2-phase commit（`pending` → `completed` / `failed`）が記録される。1 日分につき 1 行（`UNIQUE(yyyy, mm, dd)`）。
- **AC-3**: export 対象 row の `before_json` / `after_json` から PII（email / 電話番号 / 住所 / actor_email）が `[REDACTED:<kind>]` 形式に置換される。raw は D1 にのみ残る。
- **AC-4**: R2 bucket は Object Lock COMPLIANCE mode + retention 7 年 で作成され、retention 期間内の削除・上書きが API レベルで不可能。
- **AC-5**: D1 内 retention は直近 90 日。export 完了済み行のみ TTL purge 対象とし、未 export 行は purge しない。
- **AC-6**: GitHub Actions cron (`audit-log-cold-storage.yml`) が日次 `0 3 * * *` (UTC) で起動し、`cf-audit-log-cold-storage.yml` (`0 2 * * *`) と時間帯が分離される。
- **AC-7**: redaction grep gate が CI で実行され、`apps/api/src/lib/audit/redact.ts` 経由を通らない raw email/phone 出力経路を 0 件で検証する。
- **AC-8**: restore drill コマンド (`bash scripts/cf.sh r2 restore --env production --random-pick 1 --verify` の application 版相当) が semi-annual に実行され、Object Lock 配下からのサンプル復元と sha256 一致を確認する。
- **AC-9**: 外部 SIEM 連携（Datadog / Splunk / Elastic / Logpush）は本タスクで未実装。`unassigned-task-detection` 0 件で出力（却下記録）。

## 既存実装 inventory（流用元）

| 既存資産 | パス | 用途 |
|----------|------|------|
| cf_audit_log table | `apps/api/migrations/0014_create_cf_audit_log.sql` | スキーマ参考のみ |
| cf_audit_log_export_manifest table | `apps/api/migrations/0015_add_audit_export_manifest.sql` | **構造踏襲対象** |
| cf_audit_log classification | `apps/api/migrations/0016_cf_audit_log_classification.sql` | 参考のみ |
| application audit_log table | 既存 D1 schema (`audit_log`) | export 対象 |
| auditLog repository | `apps/api/src/repository/auditLog.ts` | export script が read-only 利用 |
| cf cold-storage export script | `scripts/cf-audit-log/export-to-r2.ts` | **コードパターン流用対象** |
| cf cold-storage workflow | `.github/workflows/cf-audit-log-cold-storage.yml` | **構造踏襲対象** |
| cf R2 binding | `apps/api/wrangler.toml` `UBM_AUDIT_COLD_STORAGE` | 新規 binding pattern 参考 |

## スコープ確定

### IN（本タスクで完了）
1. migration `0018_add_audit_log_export_manifest.sql`（application 用 manifest table）
2. `apps/api/src/lib/audit/redact.ts`（共通 PII redaction、UI 表示 / export 双方で使用）
3. `apps/api/src/repository/auditLog.ts` への `listForExport` / `markExported` 追加 + manifest insert/update API
4. `scripts/audit-log/export-to-r2.ts` + `scripts/audit-log/__tests__/export-to-r2.spec.ts`
5. `apps/api/wrangler.toml` に `UBM_AUDIT_APP_COLD_STORAGE` binding 追加（staging + production）
6. `.github/workflows/audit-log-cold-storage.yml`（schedule `0 3 * * *`、`workflow_dispatch` 対応、dry_run input）
7. `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`（retention / restore drill / Object Lock 解除条件 documented）
8. R2 bucket 作成（`ubm-audit-cold-storage-app-prod` + `-staging`、Object Lock COMPLIANCE 7 年）

### OUT（明示却下）
| 項目 | 却下理由 |
|------|---------|
| 外部 SIEM (Datadog/Splunk/Elastic/Grafana Loki) | 有料 SaaS 課金は solo dev 無料運用ポリシー違反。R2 Object Lock + 手動運用で長期保管・改ざん検知要件を満たす |
| Cloudflare Logpush 純正経路 | Issue #514 で workers cron + 自作 script 方式が確立済み。実装一貫性優先 |
| hash chain による改ざん検知 | R2 Object Lock COMPLIANCE mode で immutability 要件を満たす。hash chain は実装複雑度に対して redundancy 過大 |
| 7 年超過保管 | 会計・労務監査要件として 7 年で十分（要件確認済） |

## 変更対象ファイル（前置き宣言、Phase 2 で詳細化）

| パス | 種別 |
|------|------|
| `apps/api/migrations/0018_add_audit_log_export_manifest.sql` | 新規 |
| `apps/api/src/lib/audit/redact.ts` | 新規 |
| `apps/api/src/lib/audit/__tests__/redact.spec.ts` | 新規 |
| `apps/api/src/repository/auditLog.ts` | 編集（export 用 API 追加） |
| `apps/api/src/repository/__tests__/auditLog-export.spec.ts` | 新規 |
| `apps/api/wrangler.toml` | 編集（R2 binding 追加） |
| `scripts/audit-log/export-to-r2.ts` | 新規 |
| `scripts/audit-log/__tests__/export-to-r2.spec.ts` | 新規 |
| `.github/workflows/audit-log-cold-storage.yml` | 新規 |
| `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md` | 新規 |

## 検証コマンド

```bash
# 既存実装読み取り（read-only evidence）
rg -n 'audit_log|UBM_AUDIT' /Users/dm/dev/dev/個人開発/UBM-Hyogo/apps/api /Users/dm/dev/dev/個人開発/UBM-Hyogo/scripts
mise exec -- pnpm typecheck
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh r2 bucket list
```

## 成果物

- `outputs/phase-1/existing-cf-audit-log-inventory.md`: cf 系 6 ファイル + application audit_log 既存 schema の inventory
- `outputs/phase-1/acceptance-criteria.md`: AC-1..AC-9 を verifiable な form で列挙
- `outputs/phase-1/scope-out-rationale.md`: 外部 SIEM 却下根拠（コスト・運用・代替手段）

## 完了条件

- [ ] AC-1..AC-9 が verifiable な記述である（数値・コマンド・ファイルパス具体）
- [ ] inventory に既存 6 path + application audit_log table が列挙されている
- [ ] スコープアウト 4 項目それぞれに却下理由が記録されている
- [ ] artifacts.json `metadata.visualEvidence: NON_VISUAL` 確定

## 参照資料

- `docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md`（元仕様）
- `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`（流用元）
- `.claude/skills/task-specification-creator/references/phase-template-phase1.md`
- `.claude/skills/aiworkflow-requirements/references/` audit 関連 spec（Phase 2 で具体参照）
