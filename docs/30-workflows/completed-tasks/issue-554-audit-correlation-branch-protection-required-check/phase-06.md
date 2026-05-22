# Phase 6: main branch protection PUT 実装

## 目的

`main` branch に対して Phase 5 と同じ手順で `audit-correlation-verify / verify` を required 登録する。

## 前提

- Phase 5 完了（dev で PUT 成功 + 不変条件 OK）
- `outputs/phase-11/before-dev-protection.json` / `after-dev-protection.json` が記録済み

## 実装手順

Phase 5 のスクリプトの `dev` を `main` に置換して実行する:

```bash
set -euo pipefail

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

## ロールバック手順

Phase 5 のロールバック手順を `main` に置換して実行。rollback payload も GET response をそのまま PUT せず、Phase 2 の normalized payload adapter で PUT 用形状に変換する。

## 注意

- main を先に PUT しない。dev で 1 回 PR 待機を確認した後で main に伝播する（Phase 11 §11.3）。
- main PUT 直後、未マージの dev → main PR があれば再評価が走り `audit-correlation-verify / verify` 待機状態になる。それは想定挙動。

## DoD（Phase 6）

- [ ] `outputs/phase-11/before-main-protection.json` / `after-main-protection.json` が存在
- [ ] after の contexts に `audit-correlation-verify / verify` が含まれる
- [ ] before の contexts ⊂ after の contexts
- [ ] Phase 4 §4.2 の不変条件 grep が `OK: main invariants` を返す
