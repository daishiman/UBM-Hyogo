# Phase 10: UT-GOV-001 系 drift check 再実行

## 目的

PUT 後の dev / main protection に対して、CLAUDE.md「Governance / CODEOWNERS」章 / UT-GOV-001 で要求される不変条件 grep を再実行し drift ゼロを保証する。

## 実装手順

```bash
set -euo pipefail

for branch in dev main; do
  snap="outputs/phase-11/after-${branch}-protection.json"
  echo "=== ${branch} ==="

  # 1. required_pull_request_reviews=null
  jq -e '.required_pull_request_reviews == null' "$snap" > /dev/null \
    && echo "OK: required_pull_request_reviews=null" \
    || { echo "DRIFT: required_pull_request_reviews"; exit 1; }

  # 2. lock_branch=false
  jq -e '(.lock_branch.enabled // .lock_branch) == false' "$snap" > /dev/null \
    && echo "OK: lock_branch=false" \
    || { echo "DRIFT: lock_branch"; exit 1; }

  # 3. enforce_admins=true
  jq -e '(.enforce_admins.enabled // .enforce_admins) == true' "$snap" > /dev/null \
    && echo "OK: enforce_admins=true" \
    || { echo "DRIFT: enforce_admins"; exit 1; }

  # 4. required_linear_history=true
  jq -e '(.required_linear_history.enabled // .required_linear_history) == true' "$snap" > /dev/null \
    && echo "OK: required_linear_history=true" \
    || { echo "DRIFT: required_linear_history"; exit 1; }

  # 5. required_conversation_resolution=true
  jq -e '(.required_conversation_resolution.enabled // .required_conversation_resolution) == true' "$snap" > /dev/null \
    && echo "OK: required_conversation_resolution=true" \
    || { echo "DRIFT: required_conversation_resolution"; exit 1; }

  # 6. required_status_checks.contexts に audit-correlation-verify / verify が含まれる
  jq -e '.required_status_checks.contexts | index("audit-correlation-verify / verify")' "$snap" > /dev/null \
    && echo "OK: audit-correlation-verify / verify present" \
    || { echo "MISSING: audit-correlation-verify / verify"; exit 1; }
done
```

## drift 発生時の対応

- 不変条件 drift（1〜5 で fail）: 直ちに Phase 5 / Phase 6 のロールバック手順を実行し、ユーザーにエスカレーション
- 6 で MISSING: PUT body 生成 jq の `unique` フィルタ動作を再検査し、必要に応じて手動で contexts を追加して再 PUT

## DoD（Phase 10）

- [ ] dev / main 双方で 6 項目すべて `OK` 判定
- [ ] 出力ログを `outputs/phase-10/phase-10.md` に保存
