# Phase 6: 実装手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | completed |

## 目的

後続実行者がそのまま `bash` / `gh` / `git` コマンドを順次実行できる粒度の手順を確定する。各ステップは user-gate / Claude 自律の境界を明示する。commit / push / PR / workflow dispatch はすべて user 明示承認後のみ実行する。

---

## Step 0: 事前確認 (Claude 自律 / read-only)

```bash
# repo / production env の secrets / variables 一覧取得
gh secret list --repo daishiman/UBM-Hyogo > /tmp/repo-secrets-before.txt
gh secret list --repo daishiman/UBM-Hyogo --env production > /tmp/prod-secrets-before.txt
gh variable list --repo daishiman/UBM-Hyogo > /tmp/repo-vars-before.txt
gh variable list --repo daishiman/UBM-Hyogo --env production > /tmp/prod-vars-before.txt

# workflow yaml の現状確認 (L39 が environment: production であること)
sed -n '36,42p' .github/workflows/cf-audit-log-monitor.yml

# 直近 10 run が failure であることを確認
gh run list --workflow=cf-audit-log-monitor.yml --limit 10
```

これらの出力を `outputs/phase-11/inventory-before.md` に保存。

---

## Step 1: secrets 投入 (user-gated)

> **user による明示承認後に実行。Claude 自律禁止。**
> 1Password で 5 件の正本パスを確認した後、user が以下を実行する。

```bash
# 1Password CLI でログイン済を前提
op signin

# 各 secret を repo-level に投入 (op read で動的注入。shell history に実値は残らない)
gh secret set CF_AUDIT_D1_TOKEN_PROD \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://UBM-Hyogo-Prod/CloudflareD1AuditToken/credential')"

gh secret set CF_AUDIT_TOKEN_PROD \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://UBM-Hyogo-Prod/CloudflareAuditToken/credential')"

gh secret set CF_AUDIT_WORKERS_AI_TOKEN \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://UBM-Hyogo-Prod/CloudflareWorkersAIToken/credential')"

gh secret set SLACK_WEBHOOK_INCIDENT \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://UBM-Hyogo-Prod/SlackIncidentWebhook/url')"

gh secret set EMAIL_WEBHOOK_URL \
  --repo daishiman/UBM-Hyogo \
  --body "$(op read 'op://UBM-Hyogo-Prod/EmailWebhookUrl/url')"
```

> 1Password の vault / item / field 名は Phase 02 で「仮定」として記載した。Phase 06 実行時に user が実際の正本パスを確認し、本手順書を更新する。

---

## Step 2: variables 投入 (user-gated)

```bash
# variables は非機密。値は production env と同じものを設定する
gh variable set CF_AUDIT_CLASSIFIER --repo daishiman/UBM-Hyogo --body "ml"
gh variable set ML_MODEL_PATH --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set CF_AUDIT_IF_MODEL --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set CF_AUDIT_XGB_MODEL --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set CF_AUDIT_WORKERS_AI_URL --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set CLOUDFLARE_ACCOUNT_ID --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set CF_AUDIT_CLASSIFIER_VERSION --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set EMAIL_FROM --repo daishiman/UBM-Hyogo --body "<production env と同値>"
gh variable set EMAIL_TO --repo daishiman/UBM-Hyogo --body "<production env と同値>"
```

production env 側の値は Step 0 の `prod-vars-before.txt` から取る。

---

## Step 3: 投入完了確認 (Claude 自律)

```bash
gh secret list --repo daishiman/UBM-Hyogo > /tmp/repo-secrets-after.txt
gh variable list --repo daishiman/UBM-Hyogo > /tmp/repo-vars-after.txt

diff /tmp/repo-secrets-before.txt /tmp/repo-secrets-after.txt
diff /tmp/repo-vars-before.txt /tmp/repo-vars-after.txt
```

diff 出力に Step 1 / Step 2 で投入した 5 + 9 件すべてが現れていることを確認。

---

## Step 4: workflow yaml 修正 (Claude 自律 / local file edit only)

### 4.1 feature ブランチ作成

```bash
cd .worktrees/task-20260516-*  # 本ワークツリーで実行
git fetch origin dev
git checkout -b fix/issue-720-cf-audit-monitor-env-protection origin/dev
```

### 4.2 L39 を削除

`.github/workflows/cf-audit-log-monitor.yml` を開き、

```
    environment: production
```

の 1 行を削除する。削除前後の周辺コンテキスト:

```yaml
# Before (L36-L41)
jobs:
  fetch-and-analyze:
    runs-on: ubuntu-latest
    environment: production
    timeout-minutes: 10
    env:

# After (L36-L40)
jobs:
  fetch-and-analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
```

### 4.3 構文検証

```bash
# actionlint があれば
actionlint .github/workflows/cf-audit-log-monitor.yml

# 無ければ yaml 構文だけでも
mise exec -- pnpm exec js-yaml .github/workflows/cf-audit-log-monitor.yml > /dev/null
```

### 4.4 commit (user-gated)

> 本セッションの制約では commit は実行しない。以下は user 明示承認後の実行手順。

```bash
git add .github/workflows/cf-audit-log-monitor.yml
git status --short  # 変更が 1 ファイルのみであることを確認
git diff --cached -- .github/workflows/cf-audit-log-monitor.yml

git commit -m "$(cat <<'EOF'
fix(cf-audit-log-monitor): remove environment: production to unblock dev-branch hourly run

The `environment: production` directive caused branch policy enforcement
on every hourly schedule from `dev`, resulting in 30+ days of consecutive
`failure` runs. The monitor only reads production resources (no deploy
mutation), so the environment gate was unnecessary.

Required production secrets (`CF_AUDIT_D1_TOKEN_PROD`, `CF_AUDIT_TOKEN_PROD`,
`CF_AUDIT_WORKERS_AI_TOKEN`, `SLACK_WEBHOOK_INCIDENT`, `EMAIL_WEBHOOK_URL`)
have been mirrored to repository-level secrets so the workflow continues
to authenticate against production Cloudflare APIs while running from
any branch.

Refs: #720, #655
EOF
)"
```

---

## Step 5: PR 作成 (user-gated)

> push と PR 作成は user 明示承認後のみ実行する。

```bash
git push -u origin fix/issue-720-cf-audit-monitor-env-protection

gh pr create --base dev --title "fix(cf-audit-log-monitor): remove environment: production (issue #720)" --body "$(cat <<'EOF'
## Summary

- `.github/workflows/cf-audit-log-monitor.yml` から `environment: production` 指定を削除し、`dev` ブランチからの hourly 実行を可能にする。
- 必要 secrets / variables は repository-level に複製済み（同名複製・参照名不変）。
- production environment 自体の branch policy は変更しない。deploy 系経路の保護は維持される。

## Refs

- Issue: #720
- Parent workflow: docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/
- Spec: docs/30-workflows/issue-720-cf-audit-monitor-env-protection-fix/

## Test plan

- [ ] `gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev` が success
- [ ] hourly schedule の最初 6 連続 run が success（wallclock 6h+）
- [ ] runbook / ADR が `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に追記済

EOF
)"
```

---

## Step 6: PR merge (user-gated)

solo 運用ポリシーに従い、CI gate 緑なら user が self-merge。本 PR の事前条件:

- Step 1〜3 の secret / variable 投入が完了している
- CI `required_status_checks` が全て pass

---

## Step 7: workflow_dispatch dry_run (user-gated runtime)

merge 完了後、user 明示承認を得てから実行:

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev

# 起動した run を取得
sleep 5
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --limit 1 --json databaseId --jq '.[0].databaseId')
echo "Triggered run: $RUN_ID"

# 完了まで待機
gh run watch "$RUN_ID"

# 結果を evidence 化
gh run view "$RUN_ID" --json conclusion,htmlUrl,createdAt > outputs/phase-11/workflow-dispatch-dryrun.json
```

`conclusion == "success"` であることを確認。

---

## Step 8: hourly 6 連続 success 観察 (post-merge runtime evidence, wallclock 6h+)

```bash
# 6 時間以上待ち、その後実行
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl \
  > outputs/phase-11/runtime-evidence/hourly-runs.json
```

直近 6 run（dry_run を除く schedule trigger のもの）が全て `success` であることを確認。

---

## Step 9: runbook / ADR 追記 (Claude 自律)

`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` の末尾に operation note を追加（具体的差分は Phase 08 で確定）。

`outputs/phase-02/environment-separation-adr.md` の status を `accepted` に更新する。commit は user 明示承認後のみ実行する。

---

## Step 10: Phase 12 正本同期 (Claude 自律)

Phase 12 で 7 必須 output を作成（詳細は phase-12.md）。

---

## 不変条件チェック

- [ ] Step 4 の git diff が `.github/workflows/cf-audit-log-monitor.yml` 1 ファイル 1 行削除のみ
- [ ] Step 1 / 2 の `gh secret set` / `gh variable set` 実行は user 承認後
- [ ] `op read` 以外の方法（コマンドラインに実値直書き等）で secret を投入しない
- [ ] Step 6 merge は Step 1〜3 secret 投入完了後、かつ user 明示承認後
- [ ] Step 7 dry_run は Step 6 merge 完了後、かつ user 明示承認後
- [ ] Step 8 の 6 連続 success が確定するまで Phase 13 振り返りに進まない

## 次 Phase

- 次: 7 (テスト計画)
- 引き継ぎ事項: Step 7 dry_run / Step 8 hourly 6 連続 success の確認手順をテスト計画として展開
