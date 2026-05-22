# Phase 11: 手動テスト（NON_VISUAL alternative evidence）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 11 / 13 |
| 目的 | staging で D1→R2 export 動作確認、restore drill、grep gate を実施し、不可逆 mutation の user gate を通過する |
| 依存 | Phase 10 GO |
| visualEvidence | NON_VISUAL |
| user_approval_required | true（mutation 実行は明示承認後のみ） |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 1. NON_VISUAL alternative evidence 戦略

UI 画面なしのバックエンドタスクのため、screenshot ではなく以下を evidence とする:
- D1 / R2 操作 CLI 実行 log（`bash scripts/cf.sh` 経由）
- export script dry-run / 本番実行 stdout
- redaction grep gate 実行結果
- restore drill による sha256 一致確認

## 2. 実施手順（順序固定）

### 2.1 user gate 前（read-only evidence、AI 実行可）

```bash
# 既存状態 inventory
bash scripts/cf.sh whoami 2>&1 | tee outputs/phase-11/cf-whoami-before.log
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging 2>&1 | tee outputs/phase-11/d1-migrations-list-staging-before.log
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production 2>&1 | tee outputs/phase-11/d1-migrations-list-prod-before.log
bash scripts/cf.sh r2 bucket list 2>&1 | tee outputs/phase-11/r2-bucket-list-before.log

# 表 inventory（staging で local D1 経由）
mise exec -- pnpm tsx scripts/audit-log/export-to-r2.ts --env staging --dry-run --target-date 2026-05-17 2>&1 | tee outputs/phase-11/d1-export-dry-run.log
```

### 2.2 user gate 前（grep gate / redact 確認）

```bash
# Phase 8 §redaction grep gate 2 連
rg -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
   outputs/phase-11/d1-export-dry-run.log 2>&1 | tee outputs/phase-11/redact-grep-gate.log
# 期待: 0 件（raw email が dry-run 出力に出現しない）
```

### 2.3 user gate（明示承認待ち）

承認文言: 「Approve Gate C — Issue #315 cold storage mutation」
保存先: `outputs/phase-13/user-approval-issue-315-<YYYYMMDD-HHMM>.md`（Phase 13 と共通）

mutation_commands:
1. `bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-staging --object-lock-enabled`
2. `bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled --retention-days 2555`（7 年 = 2555 日）
3. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`
4. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
5. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
6. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`

### 2.4 user gate 後（mutation 実行）

各コマンド実行ログを `outputs/phase-11/` 配下に保存:

```bash
bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-staging --object-lock-enabled 2>&1 | tee outputs/phase-11/r2-bucket-create-staging.log
bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled --retention-days 2555 2>&1 | tee outputs/phase-11/r2-bucket-create-prod.log
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging 2>&1 | tee outputs/phase-11/d1-migrations-apply-staging.log
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production 2>&1 | tee outputs/phase-11/d1-migrations-apply-prod.log
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging 2>&1 | tee outputs/phase-11/deploy-api-staging.log
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production 2>&1 | tee outputs/phase-11/deploy-api-prod.log
```

### 2.5 本番 export 動作確認（workflow_dispatch）

```bash
gh workflow run audit-log-cold-storage.yml -f dry_run=false -f target_date=2026-05-17
# 完了待ち → run log を保存
gh run list --workflow audit-log-cold-storage.yml --limit 1 --json databaseId,status,conclusion > outputs/phase-11/gh-run-export.json
gh run view <run-id> --log > outputs/phase-11/gh-run-export.log
```

### 2.6 restore drill

```bash
# R2 から random 1 object を GET → gunzip → sha256 を manifest と比較
bash scripts/cf.sh r2 object get UBM_AUDIT_APP_COLD_STORAGE <object-key> --output /tmp/restore.jsonl.gz
gunzip -k /tmp/restore.jsonl.gz
shasum -a 256 /tmp/restore.jsonl | tee outputs/phase-11/restore-drill.log
# D1 manifest と一致確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT sha256 FROM audit_log_export_manifest WHERE object_key='<object-key>'" >> outputs/phase-11/restore-drill.log
```

## 3. evidence inventory（必須）

## 4. Phase 11 evidence file inventory

| Path | Status | Description |
|------|--------|-------------|
| outputs/phase-11/main.md | present | Phase 11 メイン報告 |
| outputs/phase-11/evidence-ledger.md | present | evidence 全件台帳 |
| outputs/phase-11/cf-whoami-before.log | present | read-only inventory |
| outputs/phase-11/d1-migrations-list-staging-before.log | present | read-only inventory |
| outputs/phase-11/d1-migrations-list-prod-before.log | present | read-only inventory |
| outputs/phase-11/r2-bucket-list-before.log | present | read-only inventory |
| outputs/phase-11/d1-export-dry-run.log | present | dry-run 結果 |
| outputs/phase-11/redact-grep-gate.log | present | grep gate 結果 |
| outputs/phase-11/r2-bucket-create-staging.log | pending | user gate 後 mutation |
| outputs/phase-11/r2-bucket-create-prod.log | pending | user gate 後 mutation |
| outputs/phase-11/d1-migrations-apply-staging.log | pending | user gate 後 mutation |
| outputs/phase-11/d1-migrations-apply-prod.log | pending | user gate 後 mutation |
| outputs/phase-11/deploy-api-staging.log | pending | user gate 後 mutation |
| outputs/phase-11/deploy-api-prod.log | pending | user gate 後 mutation |
| outputs/phase-11/gh-run-export.json | pending | 本番 export run |
| outputs/phase-11/gh-run-export.log | pending | 本番 export log |
| outputs/phase-11/restore-drill.log | pending | restore drill sha256 比較 |
| outputs/phase-11/r2-put-dry-run.log | pending | R2 PUT dry-run（実装側で生成） |

> `status: present` は user gate 前に取得可能な read-only evidence。
> `status: pending` は user gate 後の mutation evidence で、Phase 13 user approval 取得後に `present` へ昇格させる。

## 5. 検証コマンド

```bash
ls -la outputs/phase-11/ | wc -l   # 期待: ≥ 18 行
rg -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' outputs/phase-11/ --glob '!**/*.spec.ts'
# 期待: 0 件
```

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence-ledger.md`
- §4 inventory に列挙した 16 evidence ファイル

## 完了条件

Current status: `local_evidence_captured_runtime_pending`.

- [x] 2.1 / 2.2 の local deterministic evidence 全件取得
- [ ] user gate marker `outputs/phase-13/user-approval-issue-315-<timestamp>.md` 物理存在
- [ ] 2.4〜2.6 mutation evidence 全件取得（user gate 後）
- [ ] restore drill sha256 一致確認
- [x] inventory 表の path がすべて workflow root 配下である（path traversal なし）

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
