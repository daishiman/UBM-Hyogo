# Implementation guide

後続実行者 / user が本タスクを実行する際に参照する単一のフロー手引き。Phase 06 T-01〜T-09 を時系列で要約。

## Part 1: 中学生レベルの説明

### なぜ必要か

毎時間動く見回り係が、必要な鍵を持っていないため仕事に失敗している状態です。学校で考えると、先生から「見回りをしてきて」と言われた生徒が、職員室の鍵も連絡先の紙も持たずに廊下へ出てしまい、何も確認できずに戻ってくるようなものです。

このタスクでは、見回り係が使ってよい鍵と連絡先を正しい置き場所にそろえます。ただし鍵そのものは大事な秘密なので、ここには書きません。鍵を置く操作は人間が明示的に許可した後だけ行います。

### 何をするか

1. いま鍵がどこにあるか、名前だけを確認する。
2. 足りない鍵と設定名を一覧にする。
3. 人間の承認後、足りない鍵と設定を GitHub に入れる。
4. 見回り係を試しに1回動かす。
5. その後、毎時間の見回りが6回続けて成功したか確認する。
6. もともとの「古い置き場所から鍵を消す」作業は、そこに鍵がなければ何もしないと記録する。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| repository-level secret | GitHub 全体で使える秘密の鍵 |
| production environment secret | 本番用の部屋だけで使える秘密の鍵 |
| variable | 秘密ではない設定メモ |
| workflow | 自動で動く作業手順 |
| dry run | 本番に影響を出さない試し運転 |
| runtime evidence | 実際に動いたことを示す記録 |

## Part 2: 技術者向け契約

### Interface / data shape

```ts
type WorkflowState = "runtime_pending";

interface Issue772RuntimeRestorationPlan {
  taskType: "implementation";
  visualEvidence: "NON_VISUAL";
  requiredSecrets: [
    "CF_AUDIT_D1_TOKEN_PROD",
    "CF_AUDIT_TOKEN_PROD",
    "CF_AUDIT_WORKERS_AI_TOKEN",
    "EMAIL_WEBHOOK_URL"
  ];
  requiredVariables: [
    "CF_AUDIT_CLASSIFIER",
    "ML_MODEL_PATH",
    "CF_AUDIT_IF_MODEL",
    "CF_AUDIT_XGB_MODEL",
    "CF_AUDIT_WORKERS_AI_URL",
    "CF_AUDIT_CLASSIFIER_VERSION",
    "EMAIL_FROM",
    "EMAIL_TO"
  ];
  existingVariable: "CLOUDFLARE_ACCOUNT_ID";
  mutationGate: "user_approval_required";
  issueReferenceMode: "Refs #772";
}
```

### API / command signatures

| Operation | Signature | Gate |
| --- | --- | --- |
| secret set | `gh secret set <NAME> --repo daishiman/UBM-Hyogo --body "$(op read 'op://...')"` | user approval required |
| variable create | `gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=<NAME> -f value=<VALUE>` | user approval required |
| workflow dry run | `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` | user approval required |
| secret rollback delete | `gh secret delete <NAME> --repo daishiman/UBM-Hyogo` | separate user approval required |
| variable rollback delete | `gh api -X DELETE /repos/daishiman/UBM-Hyogo/actions/variables/<NAME>` | separate user approval required |

### Error handling and edge cases

| Case | Handling |
| --- | --- |
| 401 / 403 during dry run | stop rollout, verify exact secret names and vault source, do not delete without separate approval |
| missing production env variable source | ask user to choose value before repo-level create |
| production env monitor secret appears after inventory | cleanup is no longer no-op; require separate deletion approval |
| transient hourly failure | extend observation and record run URL; do not mark six-hour success |
| secret value in logs | rotate affected secret and remove leaked artifact from commit scope |

### Constants and parameters

| Name | Value |
| --- | --- |
| workflow | `cf-audit-log-monitor.yml` |
| branch for dry run | `dev` |
| required hourly success count | `6` |
| issue reference | `Refs #772` |
| deploy credential boundary | `CLOUDFLARE_API_TOKEN` remains production environment scoped |

## 前提

- 作業ブランチ: `feat/issue-772-cf-audit-monitor-runtime-restoration`
- PR base: `dev`（CLAUDE.md 既定）
- 1Password 経由で `op read op://...` が動作する状態
- `gh` CLI 認証済（`gh auth status`）

## 実行フロー

### STEP 1: inventory before snapshot（local, read-only）

```bash
WORKFLOW_ROOT=docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh secret list --repo daishiman/UBM-Hyogo > "$WORKFLOW_ROOT/outputs/phase-02/before-repo-secrets.md"
gh secret list --repo daishiman/UBM-Hyogo --env production > "$WORKFLOW_ROOT/outputs/phase-02/before-prod-secrets.md"
gh api repos/daishiman/UBM-Hyogo/actions/variables | jq '.variables[] | {name, created_at, updated_at}' > "$WORKFLOW_ROOT/outputs/phase-02/before-repo-vars.json"
gh api repos/daishiman/UBM-Hyogo/environments/production/variables | jq '.variables[] | {name, created_at, updated_at}' > "$WORKFLOW_ROOT/outputs/phase-02/before-prod-vars.json"
```

### STEP 2: repo-level secrets 投入（user-gated）

> ⚠️ user 明示承認必要

```bash
set +o history
gh secret set CF_AUDIT_D1_TOKEN_PROD     --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_D1_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_TOKEN_PROD        --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_WORKERS_AI_TOKEN  --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_WORKERS_AI_TOKEN/credential')"
gh secret set EMAIL_WEBHOOK_URL          --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/EMAIL_WEBHOOK_URL/credential')"
set -o history
gh secret list --repo daishiman/UBM-Hyogo | grep -E "CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|EMAIL_WEBHOOK_URL" | wc -l  # → 4
```

### STEP 3: repo-level variables 投入（user-gated）

```bash
gh api repos/daishiman/UBM-Hyogo/environments/production/variables | jq '.variables[]'   # 参考
# 値決定後（VALUE は user 確認）:
gh api -X POST /repos/daishiman/UBM-Hyogo/actions/variables -f name=CF_AUDIT_CLASSIFIER -f value=ml
# ... 上表の残り 7 variable も同じ形で投入（投入対象 variable は合計 8 件）
```

### STEP 4: workflow_dispatch dry_run（user-gated）

```bash
WORKFLOW_ROOT=docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
sleep 60
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --event workflow_dispatch --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --json conclusion,htmlUrl
# 結果を "$WORKFLOW_ROOT/outputs/phase-11/workflow-dispatch-dryrun.md" に追記
```

### STEP 5: hourly 6 連続 success 観測（wallclock 6h）

```bash
WORKFLOW_ROOT=docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup
# 6h 後
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  > "$WORKFLOW_ROOT/outputs/phase-11/runtime-evidence/hourly-runs.json"
jq '[.[] | select(.event=="schedule")] | .[:6] | all(.conclusion=="success")' "$WORKFLOW_ROOT/outputs/phase-11/runtime-evidence/hourly-runs.json"   # → true
# 6 件の run URL を "$WORKFLOW_ROOT/outputs/phase-11/runtime-evidence/6h-success.md" に追記
```

### STEP 6: inventory after + cleanup no-op evidence（local）

```bash
WORKFLOW_ROOT=docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh secret list --repo daishiman/UBM-Hyogo --env production \
  | awk -v ts="$TS" 'BEGIN{print "# AFTER ("ts")"} {print "- "$0}' \
  > "$WORKFLOW_ROOT/outputs/phase-13/post-cleanup-secret-inventory.md"
diff "$WORKFLOW_ROOT/outputs/phase-02/before-prod-secrets.md" "$WORKFLOW_ROOT/outputs/phase-13/post-cleanup-secret-inventory.md"
```

### STEP 7: runbook ADR 追記（local docs）

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の `## Issue #720 read-only monitor environment separation` セクション末尾に Phase 06 T-07 / Phase 08 D-1 記述のサブセクションを追加。

### STEP 8: unassigned-task fold-state sync（local docs）

`docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md` のメタ情報セクションに status / consumed_at / consuming_workflow を追加。

### STEP 9: PR 作成（user-gated）

```bash
git add docs/
git commit -m "docs(issue-772): cf-audit-monitor runtime restoration spec + cleanup no-op confirmation"
git push -u origin feat/issue-772-cf-audit-monitor-runtime-restoration
gh pr create --base dev --title "..." --body "..."
```

## 不変条件再掲

- secret 実値・1Password URI 以外のトークン断片を **どこにも記録しない**
- yaml コード差分を作らない（`.github/workflows/cf-audit-log-monitor.yml` 不変）
- CLOSED Issue #772 を reopen しない
- production env 側 deploy 系 secret には触れない
