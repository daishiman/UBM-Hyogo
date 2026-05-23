# System Spec Update Summary

## Step 1-A: 対象正本

Updated or registered system-spec ledgers:

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-25-deriv-02-sa-key-expiry-monitoring-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260522-ut-25-deriv-02-sa-key-expiry-monitoring.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

## Step 1-B: 実装仕様との同期

The workflow is registered as
`implemented_local_runtime_pending / implementation / NON_VISUAL`.
Implementation targets are classifier/logger/healthcheck/sync injection and
alert-relay payload extension under `apps/api`.

## Step 1-C: Runtime Boundary

No runtime operation is executed in this cycle. Staging invalidation, secret
mutation, production deploy, commit, push, and PR remain user-gated.

## Step 2: 正本仕様本文

`deployment-cloudflare.md`, `deployment-secrets-management.md`, and
`environment-variables.md` already contain the canonical
`GOOGLE_SERVICE_ACCOUNT_JSON` contract. This cycle adds workflow inventory and
does not change the secret name or placement contract.

### Step 2 詳細: inventory / cross-reference 追記のみ（contract 変更なし）

本 cycle で更新する以下ファイルはすべて **inventory 登録 / cross-reference 追記
のみ** であり、API contract / secret contract / schema contract には変更を加え
ない。phase-12 監査時はこの一覧と diff が一致することを確認すれば差異はない。

| ファイル | 変更種別 |
|---------|---------|
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | cross-reference 追記のみ |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | cross-reference 追記のみ |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | cross-reference 追記のみ |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | inventory 行追加のみ |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | changelog 行追加のみ |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | dedup 是正経緯の追記のみ |
| `.claude/skills/aiworkflow-requirements/changelog/20260522-ut-25-deriv-02-sa-key-expiry-monitoring.md` | 新規 changelog エントリ（inventory に紐づく） |

これらはいずれも `GOOGLE_SERVICE_ACCOUNT_JSON` の name / placement / value
shape を変更せず、本 workflow の artifact pointer を skill ledger に登録する
ためのもの。
