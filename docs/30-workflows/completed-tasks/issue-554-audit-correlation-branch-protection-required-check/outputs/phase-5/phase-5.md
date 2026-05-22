# Phase 5 — dev branch protection PUT 実装（contract-ready）

## 状態

**CONTRACT_READY / EXECUTION_DEFERRED_TO_PHASE_13**

実 `gh api -X PUT` は CLAUDE.md L81 および本 workflow Phase 12 仕様（`CONTRACT_READY_IMPLEMENTATION_PENDING`）により、ユーザー明示承認後の Phase 13 でのみ実行する。本 Phase では:

- before snapshot 取得（read-only GET、実施済）
- PUT body 生成 jq の確定（Phase 2 §2.2 補正版を採用）
- 実行スクリプトと rollback 手順の最終固定

## 実行スクリプト（Phase 13 で実行）

```bash
set -euo pipefail
cd docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check
mkdir -p outputs/phase-11

# 1. before（実施済 — 既に outputs/phase-11/before-dev-protection.json 取得済）
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/before-dev-protection.json

# 2. PUT body 生成（Phase 2 §2.2 補正版）
jq '
  def enabled_bool($fallback):
    if . == null then $fallback
    elif type == "object" then .enabled
    elif type == "boolean" then .
    else error("unsupported branch protection bool shape")
    end;

  {
    required_status_checks: {
      strict: .required_status_checks.strict,
      contexts: ((.required_status_checks.contexts // []) + ["audit-correlation-verify / verify"] | unique)
    },
    enforce_admins: (.enforce_admins | enabled_bool(false)),
    required_pull_request_reviews: (
      if .required_pull_request_reviews == null then null
      else {
        dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
        require_code_owner_reviews: .required_pull_request_reviews.require_code_owner_reviews,
        require_last_push_approval: .required_pull_request_reviews.require_last_push_approval,
        required_approving_review_count: .required_pull_request_reviews.required_approving_review_count
      }
      end
    ),
    restrictions: null,
    required_linear_history: (.required_linear_history | enabled_bool(false)),
    allow_force_pushes: (.allow_force_pushes | enabled_bool(false)),
    allow_deletions: (.allow_deletions | enabled_bool(false)),
    required_conversation_resolution: (.required_conversation_resolution | enabled_bool(false)),
    lock_branch: (.lock_branch | enabled_bool(false)),
    block_creations: (.block_creations | enabled_bool(false))
  }
' outputs/phase-11/before-dev-protection.json > /tmp/dev-put-body.json

# 3. PUT
gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input /tmp/dev-put-body.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection

# 4. after
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/after-dev-protection.json

# 5. 期待差分
jq -r '.required_status_checks.contexts[]' outputs/phase-11/after-dev-protection.json \
  | grep -F 'audit-correlation-verify / verify'
```

## ロールバック

```bash
jq '
  def enabled_bool($fallback):
    if . == null then $fallback
    elif type == "object" then .enabled
    elif type == "boolean" then .
    else error("unsupported branch protection bool shape")
    end;

  {
    required_status_checks: {strict: .required_status_checks.strict, contexts: (.required_status_checks.contexts // [])},
    enforce_admins: (.enforce_admins | enabled_bool(false)),
    required_pull_request_reviews: (
      if .required_pull_request_reviews == null then null
      else {
        dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
        require_code_owner_reviews: .required_pull_request_reviews.require_code_owner_reviews,
        require_last_push_approval: .required_pull_request_reviews.require_last_push_approval,
        required_approving_review_count: .required_pull_request_reviews.required_approving_review_count
      }
      end
    ),
    restrictions: null,
    required_linear_history: (.required_linear_history | enabled_bool(false)),
    allow_force_pushes: (.allow_force_pushes | enabled_bool(false)),
    allow_deletions: (.allow_deletions | enabled_bool(false)),
    required_conversation_resolution: (.required_conversation_resolution | enabled_bool(false)),
    lock_branch: (.lock_branch | enabled_bool(false)),
    block_creations: (.block_creations | enabled_bool(false))
  }
' outputs/phase-11/before-dev-protection.json > /tmp/dev-rollback.json

gh api -X PUT --input /tmp/dev-rollback.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection
```

## DoD（contract-ready 採点）

- [x] before snapshot 取得済（`outputs/phase-11/before-dev-protection.json`）
- [ ] PUT 実行 → Phase 13 user gate
- [ ] after snapshot → Phase 13
- [ ] 不変条件 grep PASS → Phase 13（drift findings 適用）
