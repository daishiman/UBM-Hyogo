# Phase 6 — main branch protection PUT 実装（contract-ready）

## 状態

**CONTRACT_READY / EXECUTION_DEFERRED_TO_PHASE_13**

Phase 5 と同形のスクリプトを `dev` → `main` に置換。実 PUT は Phase 13 user gate。

## 前提

- Phase 5 完了（dev で PUT 成功 + 不変条件採点 OK）
- Phase 11 PR pending check（任意）で dev required 反映を確認

## 実行スクリプト（Phase 13）

```bash
set -euo pipefail
cd docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check

gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/before-main-protection.json

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
' outputs/phase-11/before-main-protection.json > /tmp/main-put-body.json

gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input /tmp/main-put-body.json \
  repos/daishiman/UBM-Hyogo/branches/main/protection

gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-11/after-main-protection.json

jq -r '.required_status_checks.contexts[]' outputs/phase-11/after-main-protection.json \
  | grep -F 'audit-correlation-verify / verify'
```

## 注意

- main を先に PUT しない。dev で PR 待機を確認後に main へ伝播。
- main PUT 直後の未マージ dev → main PR は再評価で `audit-correlation-verify / verify` 待機状態になる（想定挙動）。

## DoD

- [x] before snapshot 取得済（`outputs/phase-11/before-main-protection.json`）
- [ ] PUT 実行 → Phase 13
- [ ] after snapshot → Phase 13
- [ ] 不変条件 grep PASS → Phase 13（drift findings 適用）
