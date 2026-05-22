# Phase 5: 実装

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 5 / 13 |
| 目的 | Phase 2 設計 + Phase 4 テストに従い、変更ファイルを実装する |
| 依存 | Phase 3 GO, Phase 4 テスト |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 変更対象ファイル一覧

| # | パス | 種別 | 主要 export / 構造 |
|---|------|------|--------------------|
| 1 | `apps/api/migrations/0018_add_audit_log_export_manifest.sql` | 新規 | `audit_log_export_manifest` table + 2 indexes（Phase 2 §2.1 SQL 逐語） |
| 2 | `apps/api/src/lib/audit/redact.ts` | 新規 | `redactString` / `redactJsonValue` / `redactAuditPayload` / `redactForExport` / `REDACTION_POLICY_VERSION` |
| 3 | `apps/api/src/lib/audit/__tests__/redact.spec.ts` | 新規 | TC-RED-01..07 |
| 4 | `apps/api/src/repository/auditLog.ts` | 編集 | `listForExport` / `insertExportManifest` / `completeExportManifest` / `failExportManifest` / `purgeExportedOlderThan` 追加 |
| 5 | `apps/api/src/repository/__tests__/auditLog-export.spec.ts` | 新規 | TC-REP-01..07 |
| 6 | `apps/api/wrangler.toml` | 編集 | `UBM_AUDIT_APP_COLD_STORAGE` binding 3 環境追加（Phase 2 §2.5 逐語） |
| 7 | `scripts/audit-log/export-to-r2.ts` | 新規 | CLI script (Phase 2 §2.4 フロー) |
| 8 | `scripts/audit-log/__tests__/export-to-r2.spec.ts` | 新規 | TC-EXP-01..08 |
| 9 | `scripts/audit-log/__tests__/redact-grep-gate.spec.ts` | 新規 | TC-GREP-01..02 |
| 10 | `.github/workflows/audit-log-cold-storage.yml` | 新規 | Phase 2 §2.6 YAML 逐語 |
| 11 | `docs/30-workflows/issue-315-audit-log-application-cold-storage/operations/audit-log-retention-runbook.md` | 新規 | Phase 2 §2.8 目次 |

## 実装手順（推奨順）

1. **migration**: `0018_add_audit_log_export_manifest.sql` を新規作成。`bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で「pending」として認識されることを確認（apply はしない）。
2. **redact.ts** 実装 → `redact.spec.ts` 実装 → `mise exec -- pnpm test redact.spec.ts` GREEN
3. **auditLog.ts** 拡張 → `auditLog-export.spec.ts` → GREEN
4. **wrangler.toml** binding 追加 → `mise exec -- pnpm typecheck` で wrangler 型反映確認
5. **export-to-r2.ts** 実装 → `export-to-r2.spec.ts` / `redact-grep-gate.spec.ts` → GREEN
6. **GitHub Actions workflow** 追加（schedule は merge 直後から有効。dry_run default=true により実 PUT は workflow_dispatch 明示時のみ）
7. **runbook** 作成

## 副作用と前提

- migration apply は本 Phase では実施しない（Phase 11 user gate 後）
- R2 bucket 作成も Phase 11 user gate 後（`bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled`）
- deploy も Phase 11 user gate 後

## 検証コマンド（Phase 5 完了時）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm test scripts/audit-log
rg -n 'audit_log_export_manifest|UBM_AUDIT_APP_COLD_STORAGE' apps/api scripts .github
```

## 成果物

- `outputs/phase-5/implementation-diff.md`（git diff サマリ + 11 ファイル一覧）
- `outputs/phase-5/deploy-checkpoint.md`（apply / bucket create / deploy が Phase 11 user gate 後である旨を明記）

## 完了条件

- [ ] 11 ファイルすべて存在
- [ ] typecheck / lint GREEN
- [ ] 既存 cf-audit-log 関連ファイルへの変更が 0（read-only）
- [ ] migration apply / R2 bucket create / deploy を実施していない（Phase 11 gate 待ち）
- [ ] `*.test.ts` 拡張子のファイルを作成していない

## 参照資料

- Phase 2 §2.1〜2.8
- Phase 4 全 TC
- `scripts/cf-audit-log/export-to-r2.ts`（コードパターン）
