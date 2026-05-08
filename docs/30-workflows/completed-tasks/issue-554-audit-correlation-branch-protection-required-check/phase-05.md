# Phase 5: dev branch protection PUT 実装

## 目的

`dev` branch の `required_status_checks.contexts` に `audit-correlation-verify / verify` を追加する。

## 前提

- Phase 1 GO 済み
- Phase 2 で生成した PUT body 形式が確定済み

## 実装手順

```bash
set -euo pipefail
mkdir -p outputs/phase-11

# 1. before 取得
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/before-dev-protection.json

# 2. PUT body 生成（Phase 2 jq snippet）
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

# 3. PUT 実行
gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input /tmp/dev-put-body.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection

# 4. after 取得
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-11/after-dev-protection.json

# 5. 期待差分チェック（Phase 4 §4.1）
jq -r '.required_status_checks.contexts[]' outputs/phase-11/after-dev-protection.json \
  | grep -F 'audit-correlation-verify / verify'
```

## ロールバック手順

PUT 後に想定外の差分（contexts 欠落 / 不変条件 drift）が発生した場合:

```bash
# before スナップショットから contexts のみ復元
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
      contexts: (.required_status_checks.contexts // [])
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
' outputs/phase-11/before-dev-protection.json > /tmp/dev-rollback.json

gh api -X PUT --input /tmp/dev-rollback.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection
```

## DoD（Phase 5）

- [ ] `outputs/phase-11/before-dev-protection.json` / `after-dev-protection.json` が存在
- [ ] after の contexts に `audit-correlation-verify / verify` が含まれる
- [ ] before の contexts ⊂ after の contexts（欠落ゼロ）
- [ ] Phase 4 §4.2 の不変条件 grep が `OK: dev invariants` を返す
