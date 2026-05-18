# Issue #315 audit_log Application Cold Storage - Workflow Index

> 本 workflow root は CLOSED Issue #315（"audit_log 外部 SIEM 連携運用設計"）に対し、
> `closed-issue-canonical-workflow-recovery.md` のパターンを適用して **後付け生成** された canonical workflow root。
> Issue は再 open せず、後続 PR は `Refs #315` のみで紐付ける（`Closes #315` 禁止）。

## メタ情報

```yaml
workflow_id: issue-315-audit-log-application-cold-storage
title: Application audit_log Cold Storage (R2 + Object Lock + Manifest)
github_issue: 315
github_issue_state: CLOSED
issue_reference_mode: refs_only
recovered_from_unassigned: docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md
issue_state_at_recovery: closed
recovery_pattern: closed-issue-canonical-workflow-recovery.md
category: operations / security / audit
target_feature: application audit_log table 長期保管・改ざん検知・PII redaction
priority: 中
scale: 中規模（1 サイクル完了スコープに収束させる）
status: implemented_local_evidence_captured
workflow_state: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
implementationCategory: standard
implementation_status: implementation_complete_pending_pr
runtime_boundary: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
implementation_kind: 実装仕様書
implementation_kind_rationale: |
  Issue #514 が実装した cf_audit_log 用 R2 cold storage パイプライン（migration 0014/0015/0016、
  scripts/cf-audit-log/export-to-r2.ts、wrangler.toml R2 binding、GitHub Actions cron）は
  Cloudflare API audit のみを対象としており、apps/api/src/repository/auditLog.ts が扱う
  application audit_log（attendance / admin / member_note / tag_queue / schema_diff / meeting / system
  操作監査）は D1 永続のみで R2 cold storage / Object Lock / PII redaction grep gate を持たない。
  本タスクは application 側に同一パターンを踏襲した cold storage 経路を新規構築するため
  実装仕様書として扱う。
created_date: 2026-05-18
governance_mutation_user_gate: true
read_only_evidence_allowed_pre_gate:
  - "bash scripts/cf.sh whoami"
  - "bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production"
  - "bash scripts/cf.sh d1 list"
  - "bash scripts/cf.sh r2 bucket list"
  - "rg -n 'audit_log|UBM_AUDIT' apps/api scripts wrangler.toml"
mutation_commands:
  - "bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production"
  - "bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production"
  - "bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled"
user_approval_marker: outputs/phase-13/user-approval-issue-315-<timestamp>.md
dependencies:
  - issue-514-cf-audit-logs-cold-storage-r2-export (pattern reuse / 既実装)
  - apps/api/src/repository/auditLog.ts (application audit append-only)
  - apps/api/wrangler.toml (R2 binding 追加先)
coverage_ac: 通常基準を適用（unit ≥ 80% / integration ≥ 70%）
```

## スコープ確定（事前調査済）

### 含むもの
1. **新規 D1 migration** `0018_add_audit_log_export_manifest.sql`  
   application audit_log の 2-phase commit manifest テーブル（cf_audit_log_export_manifest と同等構造）
2. **共通 PII redaction モジュール** `apps/api/src/lib/audit/redact.ts`  
   `/admin/audit` UI 表示時 masking と export 時 redaction を単一モジュール化
3. **export script** `scripts/audit-log/export-to-r2.ts` + `__tests__/export-to-r2.spec.ts`  
   D1 → R2 daily batch export（gzip + sha256 + 2-phase commit manifest）
4. **R2 binding** `UBM_AUDIT_APP_COLD_STORAGE` を `apps/api/wrangler.toml` に追加
5. **GitHub Actions cron** `.github/workflows/audit-log-cold-storage.yml`（日次 `0 3 * * *`）  
   cf-audit-log-cold-storage.yml と時間帯を分離（同時実行回避）
6. **retention runbook** `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md`  
   D1 内 90 日 / R2 Object Lock 7 年 / auto-delete 条件を明文化
7. **改ざん検知方式の決定**: R2 Object Lock (COMPLIANCE mode) を採用（hash chain は不採用、ADR 化）

### 含まないもの（スコープアウト・却下理由明記）
- **外部 SIEM 連携 (Datadog / Splunk / Elastic / Grafana Loki)**  
  → solo dev MVP / 無料運用ポリシーに反し有料 SaaS 課金は過剰。Cloudflare R2 + Object Lock + 手動運用で代替可能。
  本タスク内で「将来検討」記録のみ留め、`unassigned-task-detection` は 0 件で出力（明示的却下）。
- **Cloudflare Logpush 純正経路**  
  → Issue #514 で workers cron + 自作 export script 方式が確立済みであり、application audit_log も同方式を踏襲（実装一貫性優先）。

## 既存実装の inventory（Issue #514 由来・流用元）

| パス | 役割 | application 側流用方針 |
|------|------|------------------------|
| `apps/api/migrations/0014_create_cf_audit_log.sql` | cf_audit_log table | application audit_log は既存（流用不要） |
| `apps/api/migrations/0015_add_audit_export_manifest.sql` | cf_audit_log_export_manifest | スキーマ構造を踏襲して `0018_*` 新規作成 |
| `apps/api/wrangler.toml` (`[[r2_buckets]] UBM_AUDIT_COLD_STORAGE`) | cf_audit 用 R2 binding | 新規 binding `UBM_AUDIT_APP_COLD_STORAGE` を追加 |
| `scripts/cf-audit-log/export-to-r2.ts` | cf_audit cold storage export | `scripts/audit-log/export-to-r2.ts` として application 用にミラー実装 |
| `.github/workflows/cf-audit-log-cold-storage.yml` | cf_audit 日次 cron | `audit-log-cold-storage.yml` を新規作成（schedule 時刻分離） |
| `apps/api/src/repository/auditLog.ts` | application audit append-only | export script から read-only 利用 |

## Phase 構成

| Phase | ファイル | 概要 |
|-------|----------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・AC・既存実装 inventory・スコープアウト却下記録 |
| 2 | [phase-2-design.md](phase-2-design.md) | migration / redact module / export script / R2 binding / workflow topology |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー・GO/NO-GO・Object Lock vs hash chain 決定確定 |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | `*.spec.ts` テスト設計（redact unit / export integration / manifest 2-phase commit） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 変更ファイル列挙・実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充・実行 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ計測・閾値達成確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ・redaction grep gate 確認 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA・local PASS 5 点セット |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | staging D1→R2 export 動作確認・restore drill 手順（NON_VISUAL evidence） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | Part1 中学生レベル + Part2 技術ドキュメント・6 必須成果物 |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（base=dev、ユーザー明示承認後のみ） |

## 不変条件

1. D1 直接アクセスは `apps/api` と user-gated export script `scripts/audit-log/export-to-r2.ts` のみに限定する（`apps/web` から D1 binding 禁止）
2. Cloudflare CLI は必ず `bash scripts/cf.sh` 経由（`wrangler` 直接禁止）
3. Cloudflare Secrets は `op://Vault/Item/Field` 参照のみ（`.env` 実値禁止）
4. migration ファイル番号は連番（次は `0018_*`）
5. 新規テストは `*.spec.ts` のみ（`*.test.ts` 禁止）
6. export 経路には PII raw（email / 電話番号 / 住所）が出現しない（CI redaction grep gate で enforce）
7. Phase 13 commit / PR push はユーザー明示承認後にのみ実行
8. R2 bucket への Object Lock COMPLIANCE mode 設定後は retention 期間内に削除・上書き不可（要件として確定）
9. `audit_log` 本体（D1）には raw を残し、R2 export 先には masked のみ書き出す（raw never leaves D1）

## 正本順位（衝突時の優先度）

1. 本 `index.md` のスコープ確定セクション
2. `phase-1-requirements.md` AC
3. `apps/api/src/repository/auditLog.ts` の現行 schema
4. Issue #514 既存 cf-audit-log 実装パターン

## 関連参照

- 元仕様（後付け recovery 起点）: `docs/30-workflows/completed-tasks/task-07c-audit-log-external-siem.md`
- 流用元 workflow: `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`
- artifacts: [artifacts.json](artifacts.json)
- outputs artifacts: [outputs/artifacts.json](outputs/artifacts.json)
- skill 正本: `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
- skill 正本: `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
