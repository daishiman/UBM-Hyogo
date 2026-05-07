# Documentation Changelog — Issue #408 Cloudflare Audit Logs 監視

本タスクで作成 / 編集する全ドキュメントと実装ファイルを列挙する。本サイクルは **仕様書策定 + workflow / script / migration local 実装 + SSOT の implemented_local/runtime pending 同期 + source unassigned-task の consumed trace 更新** を含む。production Token 発行、GitHub environment secret 登録、D1 migration apply、7 日 baseline、Phase 11 runtime evidence は外部 credential を伴うため runtime gate として残す。

## 仕様書本体（新規作成）

| パス | 変更種別 | 1 行要約 |
| --- | --- | --- |
| `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md` | 新規 | タスク仕様書 root。メタ情報・スコープ・DoD・Phase 一覧 |
| `docs/30-workflows/issue-408-cf-audit-logs-monitoring/artifacts.json` | 新規 | Phase 1-13 成果物 schema |
| `docs/30-workflows/issue-408-cf-audit-logs-monitoring/phase-01.md` 〜 `phase-13.md` | 新規 (×13) | 各 phase エントリ仕様書 |
| `docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-1/**` 〜 `phase-13/**` | 新規 | 各 phase 詳細 outputs（Phase 12 は strict 7 ファイル + workflow-local `phase-12.md`） |

## SSOT 同期（編集）

| パス | 変更種別 | 1 行要約 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | 監視 Token 分離セクション追加（正本名 `CF_AUDIT_TOKEN_PROD` / scope `Audit Logs:Read` 単一 / deploy Token と rotation 独立） |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | Issue #408 audit-log monitoring の runtime pending 契約、severity label、evidence 境界を追記 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | audit-log HIGH alert 対応手順追加（Token 即失効 → 影響調査 → 再発行 → baseline 除外） |
| `.claude/skills/aiworkflow-requirements/indexes/**` | 更新 | quick-reference / resource-map へ Issue #408 導線を追加 |

## 実装ファイル（追加 / 編集）

| パス | 変更種別 | 1 行要約 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 新規 | hourly fetch/analyze workflow。`environment: production` と `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` を使用し、deploy token は注入しない |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 新規 | heartbeat 2h 超過を `priority:high` / `type:reliability` / `bot:cf-audit-log-watchdog` Issue として起票 |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | 新規 | `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` schema |
| `scripts/cf-audit-log/**` | 新規 | Audit Logs fetch、D1 adapter、severity classifier、Issue reporter、baseline CLI、focused unit tests |
| `scripts/cf.sh` | 編集 | `audit-log fetch|analyze|baseline|whoami` サブコマンドを追加 |

## Source unassigned-task の status link 更新

| パス | 変更種別 | 1 行要約 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` | 編集 | meta `status` を `consumed_by_issue_408_runtime_pending` に更新。`task_link` と Canonical Status に実装済み / runtime pending 境界を記録 |

## 関連 wave への参照追加（編集）

| パス | 変更種別 | 1 行要約 |
| --- | --- | --- |
| `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/index.md` | 編集（任意） | DERIV-04 の派生先として本タスクの index.md パスを追記 |

## 検証

```bash
# 本 PR が含むパス
git diff --name-only main...HEAD | sort

# SSOT runtime pending 同期が含まれていることを確認
git diff --name-only main...HEAD | grep -E "deployment-secrets-management\.md|observability-monitoring\.md|15-infrastructure-runbook\.md"
# 期待: 3 ファイル以上
```
