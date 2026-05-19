# dev branch protection — before snapshot

| 項目 | 値 |
|------|------|
| 取得日時 | 2026-05-17T12:49:39Z |
| コマンド | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` |

## required_status_checks.contexts (sorted)

```json
[
  "ci",
  "Validate Build",
  "coverage-gate",
  "lighthouse-ci",
  "e2e-tests-coverage-gate"
]
```

## invariants check

```json
{
  "required_pull_request_reviews": null,
  "enforce_admins": true,
  "lock_branch": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "strict": false,
  "ctx_count": 5
}
```

## 全 JSON

```json
{
  "allow_deletions": {
    "enabled": false
  },
  "allow_force_pushes": {
    "enabled": false
  },
  "allow_fork_syncing": {
    "enabled": false
  },
  "block_creations": {
    "enabled": false
  },
  "enforce_admins": {
    "enabled": true,
    "url": "https://api.github.com/repos/daishiman/UBM-Hyogo/branches/dev/protection/enforce_admins"
  },
  "lock_branch": {
    "enabled": false
  },
  "required_conversation_resolution": {
    "enabled": true
  },
  "required_linear_history": {
    "enabled": true
  },
  "required_signatures": {
    "enabled": false,
    "url": "https://api.github.com/repos/daishiman/UBM-Hyogo/branches/dev/protection/required_signatures"
  },
  "required_status_checks": {
    "checks": [
      {
        "app_id": 15368,
        "context": "ci"
      },
      {
        "app_id": 15368,
        "context": "Validate Build"
      },
      {
        "app_id": 15368,
        "context": "coverage-gate"
      },
      {
        "app_id": 15368,
        "context": "lighthouse-ci"
      },
      {
        "app_id": 15368,
        "context": "e2e-tests-coverage-gate"
      }
    ],
    "contexts": [
      "ci",
      "Validate Build",
      "coverage-gate",
      "lighthouse-ci",
      "e2e-tests-coverage-gate"
    ],
    "contexts_url": "https://api.github.com/repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks/contexts",
    "strict": false,
    "url": "https://api.github.com/repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks"
  },
  "url": "https://api.github.com/repos/daishiman/UBM-Hyogo/branches/dev/protection"
}
```
