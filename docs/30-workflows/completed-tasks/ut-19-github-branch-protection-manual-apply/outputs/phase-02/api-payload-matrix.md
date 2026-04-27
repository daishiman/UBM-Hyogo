# Phase 2: gh api payload と期待 response のマトリクス

## main protection

### Request

```http
PUT /repos/daishiman/UBM-Hyogo/branches/main/protection
```

```json
{
  "required_status_checks": {"strict": true, "contexts": ["ci", "Validate Build"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### 期待 Response（要点）

| Path | 期待値 |
| --- | --- |
| `required_status_checks.strict` | `true` |
| `required_status_checks.contexts` | `["ci", "Validate Build"]` |
| `enforce_admins.enabled` | `false` |
| `required_pull_request_reviews.required_approving_review_count` | `0` |
| `required_pull_request_reviews.dismiss_stale_reviews` | `false` |
| `allow_force_pushes.enabled` | `false` |
| `allow_deletions.enabled` | `false` |

## dev protection

### Request

```http
PUT /repos/daishiman/UBM-Hyogo/branches/dev/protection
```

```json
{
  "required_status_checks": {"strict": false, "contexts": ["ci", "Validate Build"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### 期待 Response（要点）

| Path | 期待値 |
| --- | --- |
| `required_status_checks.strict` | `false` |
| `required_status_checks.contexts` | `["ci", "Validate Build"]` |
| `enforce_admins.enabled` | `false` |
| `required_pull_request_reviews.required_approving_review_count` | `0` |
| `allow_force_pushes.enabled` | `false` |
| `allow_deletions.enabled` | `false` |

## Environments

### production

```http
GET /repos/daishiman/UBM-Hyogo/environments/production/deployment-branch-policies
```

期待 Response: `branch_policies: [{name: "main", type: "branch"}]`、`total_count: 1`

### staging

```http
GET /repos/daishiman/UBM-Hyogo/environments/staging/deployment-branch-policies
```

期待 Response: `branch_policies: [{name: "dev", type: "branch"}]`、`total_count: 1`

## エラーレスポンス想定

| HTTP | 原因 | 対処 |
| --- | --- | --- |
| 422 | status check context 名が GitHub 内部 DB に未登録 | UT-05 の CI を 1 度実行してから再実行 |
| 403 | token に `repo` / `admin:repo_hook` 権限なし | `gh auth refresh -s admin:repo_hook` |
| 404 | branch 自体が存在しない | branch 名タイポ確認（`develop` ではなく `dev`） |
