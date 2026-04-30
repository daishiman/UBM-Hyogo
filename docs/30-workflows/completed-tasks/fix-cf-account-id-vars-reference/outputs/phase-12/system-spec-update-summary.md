# System Spec Update Summary

## Step 1

- Task workflow ledger に `FIX-CF-ACCT-ID-VARS-001` を `spec_created` として記録する。
- 関連タスク UT-27 / UT-CICD-DRIFT との依存を current facts として記録する。

## Step 2

実施対象:

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-details.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

内容: `CLOUDFLARE_ACCOUNT_ID` を Repository Secret ではなく Repository Variable として同期する。
