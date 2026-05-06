# Phase 1: 要件定義・GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |
| 親仕様 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md` |
| unassigned-task | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` |

## 目的

Cloudflare Audit Logs 監視 workflow を新規構築する前提条件 (deploy Token 動作確認 / D1 binding / GitHub Actions `permissions: issues: write` 利用可否 / 1Password vault アクセス可否) を実測値で確認し、現状 baseline (D1 既存テーブル一覧 / GitHub Secrets 名一覧) を凍結したうえで本タスクの GO / NO-GO を判定する。

## スコープ

- 監視用 Token (`CF_AUDIT_TOKEN_PROD`) はまだ未発行で良い (Phase 5 で発行する)
- 既存 deploy Token (`CLOUDFLARE_API_TOKEN`) の動作確認のみ Phase 1 の責務
- baseline の取得は実測のみ (write 操作禁止)

## Step 0: P50 チェック（必須）

すべてのコマンドはリポジトリルートから実行する。出力は `outputs/phase-1/` 配下に保存する。

```bash
# 0-1) 既存 deploy Token が production で稼働しているか（Audit 監視は同 account 内で動作）
bash scripts/cf.sh whoami \
  | tee outputs/phase-1/cf-whoami.log

# 0-2) apps/api の D1 binding が正常に解決できるか
bash scripts/cf.sh d1 list \
  | tee outputs/phase-1/cf-d1-list.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" \
  | tee outputs/phase-1/d1-tables-baseline.txt

# 0-3) GitHub Actions の permissions: issues: write が利用可能であることを workflow 静的検査
grep -RIn "permissions:" .github/workflows/ \
  | tee outputs/phase-1/gha-permissions-baseline.log

gh api repos/daishiman/UBM-Hyogo \
  --jq '{has_issues: .has_issues, default_branch: .default_branch}' \
  | tee outputs/phase-1/repo-issues-capability.json

# 0-4) 1Password vault アクセス可否（実値の cat は禁止。vault 一覧のみ）
op vault list --format=json \
  | jq '[.[] | {id: .id, name: .name}]' \
  | tee outputs/phase-1/op-vault-list.json

# 0-5) 既存 GitHub Secrets の key 名のみ (値は redact)
gh secret list --json name,updatedAt \
  | tee outputs/phase-1/secrets-baseline.txt

# 0-6) Cloudflare Audit Logs API の到達性確認 (read-only 1 件のみ取得)
bash scripts/cf.sh api "/accounts/${CLOUDFLARE_ACCOUNT_ID}/audit_logs?per_page=1" \
  | jq '{success: .success, errors: .errors, page: .result_info.page, total: .result_info.total_count}' \
  | tee outputs/phase-1/cf-audit-api-probe.json
```

### 期待値

- `cf-whoami.log`: `success: true` / Token 名が deploy 用 Token であること
- `d1-tables-baseline.txt`: `cf_audit_log` / `cf_audit_baseline` が **未登録** であること (Phase 5 で migration 適用するため)
- `gha-permissions-baseline.log`: 既存 workflow に `issues: write` 利用例があるか、ない場合も新規 workflow で追加可能
- `repo-issues-capability.json`: `has_issues: true`
- `op-vault-list.json`: `Environments` vault が存在
- `secrets-baseline.txt`: `CLOUDFLARE_API_TOKEN` 等の deploy 系のみで `CF_AUDIT_TOKEN_PROD` は未登録
- `cf-audit-api-probe.json`: `success: true` (deploy Token は監視 scope を持たないため失敗する場合は Phase 5 で監視 Token を発行することで解決する想定)

## Acceptance Criteria

| ID | 内容 | 計測方法 | Phase |
| --- | --- | --- | --- |
| AC-1 | 監視 Token は `Account > Audit Logs:Read` のみの最小 scope で発行される | Cloudflare dashboard scope screenshot + `bash scripts/cf.sh whoami` 出力で deploy 系 scope を持たない確認 | Phase 5 / 11 |
| AC-2 | `.github/workflows/cf-audit-log-monitor.yml` が `schedule: '0 * * * *'` で連続稼働 | `gh run list --workflow cf-audit-log-monitor.yml --limit 24` で過去 24 時間 24 件 success | Phase 9 / 11 |
| AC-3 | D1 `cf_audit_log` / `cf_audit_baseline` テーブルが production に migration 適用済み | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | Phase 5 / 8 |
| AC-4 | 合成 HIGH イベント (想定外 IP からの success) に対し GitHub Issue が `priority:high` / `type:security` label 付きで起票される | Phase 11 dry-run + `gh issue list --label type:security --limit 5` | Phase 8 / 11 |
| AC-5 | 7 日学習で `cf_audit_baseline` 行が生成され `hourly_call_count_p99` / `allowed_ip_set_json` が non-null | `SELECT * FROM cf_audit_baseline ORDER BY window_end DESC LIMIT 1` | Phase 9 |
| AC-6 | watchdog workflow (`cf-audit-log-monitor-watchdog.yml`) が `cf-audit-log-monitor` の停止 (last success > 2h) を検知し Issue 起票 | 合成停止シナリオで Issue 起票確認 | Phase 8 / 11 |
| AC-7 | SSOT (`deployment-secrets-management.md` / `observability-monitoring.md` / `15-infrastructure-runbook.md`) に監視 Token 取扱い・alerting フロー追記済み | `grep -n "CF_AUDIT_TOKEN_PROD" .claude/skills/aiworkflow-requirements/references/*.md docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Phase 12 |
| AC-8 | 監視 Token が deploy Token と独立に rotation 可能 (Token ID 別 / Secret 別 / 1Password Item 別) | runbook の rotation 手順記載 + Token ID 一覧の独立性検証 | Phase 12 |

## GO / NO-GO 判定マトリクス

| 条件 | 判定 | 次アクション |
| --- | --- | --- |
| Step 0 すべて期待通り | **GO** | Phase 2 へ進む |
| `cf-whoami.log` が `success: false` | NO-GO | U-FIX-CF-ACCT-01 (Token scope) を先に修復 |
| `d1-tables-baseline.txt` に `cf_audit_log` が既存 | NO-GO | 既存 table の出自調査 (orphan migration の有無確認) |
| `op-vault-list.json` で `Environments` vault 不在 | NO-GO | 1Password 環境セットアップを先行 |
| `repo-issues-capability.json` で `has_issues: false` | NO-GO | repo 設定で Issues 有効化 |
| `cf-audit-api-probe.json` が deploy Token で success | 注意 GO | deploy Token 過剰 scope の可能性。U-FIX-CF-ACCT-01 で再確認 |
| `secrets-baseline.txt` に `CF_AUDIT_TOKEN_PROD` 既存 | 注意 GO | 既存値の出自調査 (rotation 計画と整合) |

## DoD（完了条件）

- [ ] Step 0 の 6 コマンドすべて実行・log 保存済み
- [ ] AC-1..AC-8 表が確定し下流 Phase で参照可能
- [ ] `outputs/phase-1/d1-tables-baseline.txt` が生成され `cf_audit_log` 未登録を確認
- [ ] `outputs/phase-1/secrets-baseline.txt` に値ではなく key 名のみが含まれている (redact 検証)
- [ ] `outputs/phase-1/go-no-go-decision.md` が GO / NO-GO 判定根拠と共に作成済み
- [ ] 親 `index.md` の Phase 1 状態が `spec_created` から `phase_1_completed` へ更新可能な状態

## 成果物

- `outputs/phase-1/phase-1.md` (本書)
- `outputs/phase-1/cf-whoami.log`
- `outputs/phase-1/cf-d1-list.log`
- `outputs/phase-1/d1-tables-baseline.txt`
- `outputs/phase-1/gha-permissions-baseline.log`
- `outputs/phase-1/repo-issues-capability.json`
- `outputs/phase-1/op-vault-list.json`
- `outputs/phase-1/secrets-baseline.txt` (redacted: key 名のみ)
- `outputs/phase-1/cf-audit-api-probe.json`
- `outputs/phase-1/go-no-go-decision.md`

## 参照

- 親仕様: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md`
- Cloudflare Audit Logs API: https://developers.cloudflare.com/fundamentals/setup/account/account-security/review-audit-logs/
- GitHub Actions IP range: https://api.github.com/meta
- SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
