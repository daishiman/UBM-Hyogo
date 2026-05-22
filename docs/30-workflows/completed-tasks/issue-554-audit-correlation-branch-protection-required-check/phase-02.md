# Phase 2: branch protection JSON schema 設計 / merge 戦略

## 目的

`gh api -X PUT branches/<b>/protection` の入力スキーマを確定し、`required_status_checks.contexts` の merge 方針を決定する。

## 入力

- `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection`（現行設定）
- 同 main
- GitHub REST API: `PUT /repos/{owner}/{repo}/branches/{branch}/protection`

## 設計

### 2.1 スキーマ canonical 表現

`gh api -X PUT` には次の形を渡す（既存値を保持し、新 context 1 件のみ追加）:

```json
{
  "required_status_checks": {
    "strict": <既存値>,
    "contexts": [...<既存 contexts>, "audit-correlation-verify / verify"]
  },
  "enforce_admins": <既存値>,
  "required_pull_request_reviews": <既存値を PUT 用に正規化>,
  "restrictions": null,
  "required_linear_history": <既存値>,
  "allow_force_pushes": <既存値>,
  "allow_deletions": <既存値>,
  "required_conversation_resolution": <既存値>,
  "lock_branch": <既存値>,
  "block_creations": <既存値>
}
```

> `restrictions` は GitHub Free / 個人リポジトリでは `null` のみ許容。既存値をそのまま継承する。
> `enforce_admins` は GET 時 `{ "enabled": true }` 形式で返るが PUT では `true`/`false` を渡す。
> `// true` は jq で `false` を右辺に倒すため使用禁止。本タスクの既定は contexts-only であり、drift 修正は Phase 13 user gate で別途明示承認された場合だけ行う。

### 2.2 merge 戦略

```bash
# before スナップショット取得
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-before.json

# contexts に新値を追加して PUT body を生成
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
' /tmp/dev-before.json > /tmp/dev-put-body.json
```

`unique` を噛ませることで再実行時の冪等性を担保（既に登録済みなら no-op）。

## 設計検証

- before スナップショットで `required_pull_request_reviews` が `null` ではない場合でも、この Phase の payload では既存値を保持する。CLAUDE.md 不変条件との drift は Phase 13 user gate で「受容 / 同時修正 / 別タスク化」を明示判断する。
- dev / main 双方で同形 body を生成し、branch 名のみ差し替える。payload 差分は `required_status_checks.contexts` への `audit-correlation-verify / verify` 追加だけでなければならない。

## DoD（Phase 2）

- [ ] `outputs/phase-2/phase-2.md` に上記 jq スニペットと PUT body 例（dev / main 各 1 件）が記載されている
- [ ] 既存 `contexts` 配列の確認結果が記録されている
