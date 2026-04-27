# Phase 5: 適用実行ログ

## 実行日時

2026-04-27（JST）

## 実行アカウント

`daishiman`（repo admin）

## 実行コマンドと結果

### Step 1: before snapshot

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-05/gh-api-before-main.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-05/gh-api-before-dev.json
gh api repos/daishiman/UBM-Hyogo/environments > outputs/phase-05/gh-api-before-environments.json
```

結果: 3 ファイルとも 200 OK で取得。

### Step 2: main protection 適用

```bash
gh api --method PUT repos/daishiman/UBM-Hyogo/branches/main/protection --input - <<'EOF'
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
EOF
```

結果: 200 OK。`enforce_admins.enabled: false`、`dismiss_stale_reviews: false` への遷移を確認。

### Step 3: dev protection 適用

```bash
gh api --method PUT repos/daishiman/UBM-Hyogo/branches/dev/protection --input - <<'EOF'
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
EOF
```

結果: 200 OK。`required_approving_review_count: 1 → 0`、`dismiss_stale_reviews: true → false` への遷移を確認。

### Step 4: after snapshot

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-05/gh-api-after-main.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-05/gh-api-after-dev.json
gh api repos/daishiman/UBM-Hyogo/environments > outputs/phase-05/gh-api-after-environments.json
gh api repos/daishiman/UBM-Hyogo/environments/production/deployment-branch-policies > outputs/phase-05/gh-api-after-production-policies.json
gh api repos/daishiman/UBM-Hyogo/environments/staging/deployment-branch-policies > outputs/phase-05/gh-api-after-staging-policies.json
```

### Step 5: sanity check

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '{reviews: .required_pull_request_reviews.required_approving_review_count,
         status_checks: .required_status_checks.contexts,
         force_push: .allow_force_pushes.enabled,
         deletions: .allow_deletions.enabled,
         enforce_admins: .enforce_admins.enabled,
         dismiss_stale: .required_pull_request_reviews.dismiss_stale_reviews}'
```

結果:
```json
{"deletions":false,"dismiss_stale":false,"enforce_admins":false,"force_push":false,"reviews":0,"status_checks":["ci","Validate Build"]}
```

dev も同様に AC-2 を満たすことを確認。

## before / after 主要差分

### main

| Path | before | after |
| --- | --- | --- |
| `enforce_admins.enabled` | `true` | `false` |
| `required_pull_request_reviews.dismiss_stale_reviews` | `true` | `false` |
| 他項目（status_checks, force_push, deletions, review_count） | 一致 | 一致 |

### dev

| Path | before | after |
| --- | --- | --- |
| `required_pull_request_reviews.required_approving_review_count` | `1` | `0` |
| `required_pull_request_reviews.dismiss_stale_reviews` | `true` | `false` |
| 他項目 | 一致 | 一致 |

### environments

差分なし。production の policy は既に `[main]`、staging は `[dev]` に設定済。

## エラー発生

なし。422 / 403 / 404 はいずれも発生せず。

## 適用結果サマリ

- AC-1（main）: PASS
- AC-2（dev）: PASS
- AC-3 / AC-4（environments policy）: 既存設定が既に適合、API 上 PASS（UI 確認は Phase 11）
- AC-5（before / after JSON）: PASS（`outputs/phase-05/` に保存済）
