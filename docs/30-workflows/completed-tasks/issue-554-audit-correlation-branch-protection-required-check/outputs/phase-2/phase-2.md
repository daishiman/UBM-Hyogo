# Phase 2 — branch protection JSON schema 設計 / merge 戦略

## 2.1 現状（before snapshot 由来）

| branch | strict | contexts | enforce_admins | required_linear_history | required_pull_request_reviews |
| --- | --- | --- | --- | --- | --- |
| dev | false | `["ci","Validate Build","coverage-gate"]` | false | false | null |
| main | true | `["ci","Validate Build","coverage-gate"]` | false | false | object（≠ null） |

## 2.2 PUT body 生成方針（Phase 1 drift findings を反映）

仕様書 phase-02.md の jq は default 値を CLAUDE.md 不変条件側に寄せていたが、Phase 1 drift により**現実値そのまま継承**へ補正する。これにより本タスク（contexts 追加のみ）の副作用を最小化する。

```bash
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
' "$BEFORE" > "$BODY"
```

## 2.3 dev / main PUT body プレビュー

### dev（contexts のみ差分）

```json
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["Validate Build", "audit-correlation-verify / verify", "ci", "coverage-gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "block_creations": false
}
```

### main

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Validate Build", "audit-correlation-verify / verify", "ci", "coverage-gate"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false,
    "required_approving_review_count": 0
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "block_creations": false
}
```

## 2.4 冪等性

`unique` フィルタにより再 PUT 時に context が重複しない（既登録なら no-op）。

## DoD

- [x] PUT body jq snippet を Phase 1 drift findings に合わせて補正（default 値を現実値継承へ）
- [x] dev / main 各 1 件の body プレビューを記録
- [x] before contexts 確認済
