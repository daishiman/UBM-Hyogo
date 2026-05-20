[実装区分: 実装仕様書]

# Phase 9 — 品質保証

| 項目 | 値 |
|------|------|
| phase | 9 |
| 名称 | 品質保証 |
| status | completed |
| 完了条件 | PUT payload JSON schema 妥当性 / required contexts drift 0 件 |

## 1. PUT payload schema 妥当性

GitHub branch protection PUT body 必須フィールドが全て揃っていること:

```bash
jq -e '
  has("required_status_checks") and
  (.required_status_checks | has("strict") and has("contexts")) and
  has("enforce_admins") and
  has("required_pull_request_reviews") and
  has("restrictions")
' /tmp/dev-put.json
# expect: true
```

## 2. drift 0 件確認

dev / main の after JSON を比較し、追加された 3 件以外の差分が無いこと:

```bash
for b in dev main; do
  before=/tmp/$b-before.json
  after=/tmp/$b-after.json
  added=$(diff <(jq -r '.required_status_checks.contexts[]' $before | sort) \
               <(jq -r '.required_status_checks.contexts[]' $after  | sort) \
          | grep -c '^>')
  removed=$(diff <(jq -r '.required_status_checks.contexts[]' $before | sort) \
                 <(jq -r '.required_status_checks.contexts[]' $after  | sort) \
          | grep -c '^<')
  echo "$b: added=$added removed=$removed"
done
# expect: added=3 removed=0
```

## 3. governance 不変条件（Phase 6 §4 再実行）

dev / main 双方で:
- `required_pull_request_reviews == null`
- `enforce_admins.enabled == true`
- `lock_branch.enabled == false`
- `required_linear_history.enabled == true`
- `required_conversation_resolution.enabled == true`
- `allow_force_pushes.enabled == false`
- `allow_deletions.enabled == false`

## 4. evidence 完全性

| evidence file | 存在 |
|--------------|------|
| dev-protection-before.json.md | |
| main-protection-before.json.md | |
| dev-protection-after.json.md | |
| main-protection-after.json.md | |
| pull-request-trigger-natural-firing.md | |
| user-approval-marker.md | |
| rollback-put-payload.md | |
| manual-test-result.md | |
| ui-sanity-visual-review.md | |

## 5. 失敗時

drift 検出 → Phase 5 §3 rollback を即時実行 → 原因解析後再実行。
