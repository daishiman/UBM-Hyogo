# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | spec_created |

## 目的

T-01 〜 T-09 を後続実行者（および user）がそのまま実行できる粒度のコマンドガイドとして記述する。

## T-01: inventory before snapshot（local）

```bash
mkdir -p docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/outputs/phase-02
cd docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/outputs/phase-02

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

gh secret list --repo daishiman/UBM-Hyogo \
  | awk -v ts="$TS" 'BEGIN{print "# repo-level secrets snapshot ("ts")"} {print "- "$0}' \
  > before-repo-secrets.md

gh secret list --repo daishiman/UBM-Hyogo --env production \
  | awk -v ts="$TS" 'BEGIN{print "# production env secrets snapshot ("ts")"} {print "- "$0}' \
  > before-prod-secrets.md

gh api repos/daishiman/UBM-Hyogo/actions/variables \
  | jq '.variables[] | {name, created_at, updated_at}' \
  > before-repo-vars.json

gh api repos/daishiman/UBM-Hyogo/environments/production/variables \
  | jq '.variables[] | {name, created_at, updated_at}' \
  > before-prod-vars.json
```

**完了確認**: 4 ファイルが配置され、いずれにも secret value が含まれない（grep で token-like pattern が一致しないこと）。

## T-02: repo-level secrets 投入（user-gated）

> ⚠️ 本ステップは Claude / Codex の自律実行禁止。user 明示承認後のみ実行。

```bash
# 履歴汚染回避（必要時）
set +o history

gh secret set CF_AUDIT_D1_TOKEN_PROD     --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_D1_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_TOKEN_PROD        --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_WORKERS_AI_TOKEN  --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_WORKERS_AI_TOKEN/credential')"
gh secret set EMAIL_WEBHOOK_URL          --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/EMAIL_WEBHOOK_URL/credential')"

set -o history
```

**完了確認**:
```bash
gh secret list --repo daishiman/UBM-Hyogo \
  | grep -E "CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|EMAIL_WEBHOOK_URL" \
  | wc -l
# 期待値: 4
```

## T-03: repo-level variables 投入（user-gated）

> ⚠️ user 明示承認後のみ。値は production env 既設値を踏襲、未設定分は user 判断。

```bash
# production env 既設値の参照（読み取り）
gh api repos/daishiman/UBM-Hyogo/environments/production/variables \
  | jq '.variables[] | {name, value}'

# 投入（VALUE は user 確認後）
for KV in \
  "CF_AUDIT_CLASSIFIER=ml" \
  "ML_MODEL_PATH=<VALUE>" \
  "CF_AUDIT_IF_MODEL=<VALUE>" \
  "CF_AUDIT_XGB_MODEL=<VALUE>" \
  "CF_AUDIT_WORKERS_AI_URL=<VALUE>" \
  "CF_AUDIT_CLASSIFIER_VERSION=<VALUE>" \
  "EMAIL_FROM=<VALUE>" \
  "EMAIL_TO=<VALUE>"; do
  NAME="${KV%%=*}"
  VAL="${KV#*=}"
  gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name="$NAME" -f value="$VAL"
done
```

**完了確認**:
```bash
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables | length'
# 期待値: before の count + 必要差分（8 件追加なら +8）
```

## T-04: workflow_dispatch dry_run（user-gated）

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev

# 完了まで poll
sleep 60
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --event workflow_dispatch --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"

# 結論確認
gh run view "$RUN_ID" --json conclusion,htmlUrl
```

**完了確認**: `conclusion == "success"`。 evidence は `outputs/phase-11/workflow-dispatch-dryrun.md` に追記（run URL + timestamp）。

## T-05: hourly 6 連続 success 観測（runtime / wallclock 6h）

```bash
# 観測コマンド（6 時間後または以降に実行）
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  > outputs/phase-11/runtime-evidence/hourly-runs.json

# 6 連続 success 検証
jq '[.[] | select(.event=="schedule")] | .[:6] | all(.conclusion=="success")' \
  outputs/phase-11/runtime-evidence/hourly-runs.json
# 期待値: true
```

**完了確認**: `all(.conclusion=="success")` が true。evidence は `outputs/phase-11/runtime-evidence/6h-success.md` に run URL × 6 を記録。

## T-06: inventory after snapshot + cleanup no-op evidence（local）

```bash
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

gh secret list --repo daishiman/UBM-Hyogo --env production \
  | awk -v ts="$TS" 'BEGIN{print "# production env secrets snapshot AFTER ("ts")"} {print "- "$0}' \
  > docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/outputs/phase-13/post-cleanup-secret-inventory.md

# before との diff = 0 を確認
diff \
  docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/outputs/phase-02/before-prod-secrets.md \
  docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/outputs/phase-13/post-cleanup-secret-inventory.md
# 期待値: timestamp 行以外の差分なし → cleanup no-op 確定
```

## T-07: runbook ADR ステータス追記（local docs）

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の `## Issue #720 read-only monitor environment separation` セクション末尾に以下を追記:

```markdown
### Issue #772 cleanup no-op boundary (2026-05-17)

production environment 側の monitor 専用 secret (`CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `EMAIL_WEBHOOK_URL`) は inventory snapshot 時点で既に不在であるため、Issue #772 が想定していた production env 側削除は no-op と判定する。`cf-audit-log-monitor.yml` の runtime restoration は repo-level secret / variable 投入後の workflow_dispatch dry_run success と hourly 6 連続 success evidence が揃うまで完了扱いにしない。

将来 production env 側に monitor 用 secret を再投入する場合は、本 ADR の「監視系は repo-level / deploy 系のみ env-level」原則に従い、re-investment 理由を別 ADR で記録すること。
```

## T-08: unassigned-task fold-state sync（local docs）

`docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` の冒頭メタ情報セクションに status 行を追加:

```markdown
## メタ情報

```yaml
issue_number: 772
status: consumed_via_issue_772_runtime_restoration_spec
consumed_at: 2026-05-17
consuming_workflow: docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/
```
```

## T-09: PR 作成（user-gated）

```bash
git add docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/ \
        docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md \
        docs/00-getting-started-manual/specs/15-infrastructure-runbook.md

git commit -m "$(cat <<'EOF'
docs(issue-772): cf-audit-monitor runtime restoration spec + cleanup no-op confirmation

- repo-level secret 投入計画と inventory before/after を spec 化
- hourly 10 連続 failure root cause（repo-level secrets 未投入）を確定
- production env 側 cleanup は実体不在につき no-op 宣言
- runbook ADR にステータス追記

Refs #772 (CLOSED, optimized to current codebase)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin feat/issue-772-cf-audit-monitor-runtime-restoration

gh pr create --base dev --title "docs(issue-772): cf-audit-monitor runtime restoration + cleanup no-op" --body "$(cat <<'EOF'
## Summary

- Issue #772（CLOSED）を最新コードに最適化して再起動。原典 cleanup スコープは実体不在で no-op、runtime restoration を主スコープに据えた仕様書を作成
- hourly 10 連続 failure の root cause（repo-level に必要 secrets が未投入）を確定
- `outputs/phase-02/` に secret-investment-plan / variable-mirror-plan / inventory-before を配置
- 親 Issue #720 で `PENDING_USER_GATE` のまま残っていた runtime evidence を本タスクで取得し直す設計

## Test plan

- [ ] T-01 inventory before snapshot を取得
- [ ] T-02 user gate 後に repo-level secrets 4 件投入
- [ ] T-03 user gate 後に repo-level variables 8 件投入
- [ ] T-04 workflow_dispatch dry_run が success
- [ ] T-05 hourly 6 連続 success を `outputs/phase-11/runtime-evidence/6h-success.md` に記録
- [ ] T-06 inventory after で cleanup no-op evidence を確定
- [ ] T-07 / T-08 runbook ADR / unassigned-task fold-state sync

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 完了条件 (DoD)

- [x] 9 task 全てに実行可能なコマンド・確認手順を記述
- [x] local vs user-gated を明示
- [x] secret 実値非記録ルールを各コマンドで遵守
- [x] CONST_005 必須項目（変更対象ファイル・入出力・テスト・実行コマンド・DoD）を網羅

## 次 Phase

- 次: 7 (テスト計画)
- 引き継ぎ事項: 各 task の確認コマンドを Phase 07 テスト計画に転記
