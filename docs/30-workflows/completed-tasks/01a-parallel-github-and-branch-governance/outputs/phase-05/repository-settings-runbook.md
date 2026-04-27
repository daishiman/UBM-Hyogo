# GitHub Repository Settings Runbook

## 概要

Phase 4 の差分リストを基に、GitHub リポジトリの設定を設計値（TO-BE）に合致させるための手順書。
全設定が未設定状態のため、全て新規作成として実施する。

リポジトリ: `daishiman/UBM-Hyogo`

---

## 1. Branch Protection（main）の設定

### ブラウザ操作手順

1. `https://github.com/daishiman/UBM-Hyogo/settings/branches` にアクセス
2. "Add branch protection rule" をクリック
3. "Branch name pattern" に `main` を入力
4. 以下を設定する:
   - "Require a pull request before merging" を **ON**
   - "Required number of approvals" を **0**（承認不要・個人開発のため）
   - "Require status checks to pass before merging" を **ON**
   - ステータスチェックに `ci` と `Validate Build` を追加
   - "Require branches to be up to date before merging" を **ON**
   - "Allow force pushes" を **OFF**（チェックを外す）
   - "Allow deletions" を **OFF**（チェックを外す）
5. "Save changes" をクリック

### gh CLI 代替コマンド

```bash
gh api \
  --method PUT \
  repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci", "Validate Build"]
  },
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

---

## 2. Branch Protection（dev）の設定

### ブラウザ操作手順

1. `https://github.com/daishiman/UBM-Hyogo/settings/branches` にアクセス
2. "Add branch protection rule" をクリック
3. "Branch name pattern" に `dev` を入力
4. 以下を設定する:
   - "Require a pull request before merging" を **ON**
   - "Required number of approvals" を **0**（承認不要・個人開発のため）
   - "Require status checks to pass before merging" を **ON**
   - ステータスチェックに `ci` と `Validate Build` を追加
   - "Allow force pushes" を **OFF**（チェックを外す）
5. "Save changes" をクリック

### gh CLI 代替コマンド

```bash
gh api \
  --method PUT \
  repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["ci", "Validate Build"]
  },
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

---

## 3. GitHub Environments（production）の設定

> **個人開発のため Required reviewers は設定しない**。デプロイは CI チェック通過後に自動実行する。

### ブラウザ操作手順

1. `https://github.com/daishiman/UBM-Hyogo/settings/environments` にアクセス
2. "New environment" をクリックし、名前に `production` を入力
3. 以下を設定する:
   - "Required reviewers" は **設定しない**（0名・自動デプロイ）
   - "Deployment branches" を "Selected branches" に変更
   - "Add deployment branch rule" で `main` のみを追加
4. "Save protection rules" をクリック

### gh CLI 補助コマンド（deployment branch ポリシーのみ）

```bash
# production environment の作成
gh api \
  --method PUT \
  repos/daishiman/UBM-Hyogo/environments/production \
  --input - <<'EOF'
{
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
EOF

# production の deployment branch rule に main を追加
gh api \
  --method POST \
  repos/daishiman/UBM-Hyogo/environments/production/deployment-branch-policies \
  --field name="main"
```

---

## 4. GitHub Environments（staging）の設定

### ブラウザ操作手順

1. `https://github.com/daishiman/UBM-Hyogo/settings/environments` にアクセス
2. "New environment" をクリックし、名前に `staging` を入力
3. 以下を設定する:
   - "Required reviewers" は設定しない（自動デプロイのため 0 名）
   - "Deployment branches" を "Selected branches" に変更
   - "Add deployment branch rule" で `dev` のみを追加
4. "Save protection rules" をクリック

### gh CLI 補助コマンド

```bash
# staging environment の作成
gh api \
  --method PUT \
  repos/daishiman/UBM-Hyogo/environments/staging \
  --input - <<'EOF'
{
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
EOF

# staging の deployment branch rule に dev を追加
gh api \
  --method POST \
  repos/daishiman/UBM-Hyogo/environments/staging/deployment-branch-policies \
  --field name="dev"
```

---

## 5. .github/CODEOWNERS の配置

1. `.github/` ディレクトリを作成（リポジトリルートで）
2. `.github/CODEOWNERS` を作成し、`outputs/phase-05/codeowners.md` の「本文」内容を貼り付ける:

```
# Global fallback
*                   @daishiman

# Infrastructure docs (Wave 1 parallel tasks)
doc/01a-*/          @daishiman
doc/01b-*/          @daishiman
doc/01c-*/          @daishiman

# GitHub governance files
.github/            @daishiman
```

---

## 6. .github/pull_request_template.md の配置

1. `.github/pull_request_template.md` を作成し、`outputs/phase-05/pull-request-template.md` の「本文」内容を貼り付ける
2. 内容は当該ファイルを参照

---

## 7. 適用後 Sanity Check コマンド

```bash
# main branch protection の確認
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '{
    reviews: .required_pull_request_reviews.required_approving_review_count,
    status_checks: .required_status_checks.contexts,
    force_push: .allow_force_pushes.enabled,
    deletions: .allow_deletions.enabled
  }'
# 期待: reviews=0, status_checks=["ci","Validate Build"], force_push=false, deletions=false

# dev branch protection の確認
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '{
    reviews: .required_pull_request_reviews.required_approving_review_count,
    status_checks: .required_status_checks.contexts,
    force_push: .allow_force_pushes.enabled
  }'
# 期待: reviews=0, status_checks=["ci","Validate Build"], force_push=false

# environments の確認
gh api repos/daishiman/UBM-Hyogo/environments \
  --jq '.environments[] | {name: .name, branch_policy: .deployment_branch_policy}'
# 期待: production と staging が存在し、それぞれ custom_branch_policies=true

# PR template の存在確認
gh api repos/daishiman/UBM-Hyogo/contents/.github/pull_request_template.md \
  --jq '.name'
# 期待: "pull_request_template.md"

# CODEOWNERS の存在確認
gh api repos/daishiman/UBM-Hyogo/contents/.github/CODEOWNERS \
  --jq '.name'
# 期待: "CODEOWNERS"
```

---

## 8. Rollback 手順（緊急時のみ）

```bash
# main branch protection の一時削除（管理者権限が必要）
gh api \
  --method DELETE \
  repos/daishiman/UBM-Hyogo/branches/main/protection

# 作業完了後に再適用（手順 1 の gh CLI コマンドを再実行）
```

> **注意**: rollback は本番障害対応など極めて限定的な状況でのみ使用。実行前に必ずチームへ通知する。

---

## 設定値 Quick Reference

| 項目 | 設定値 | 根拠 |
| --- | --- | --- |
| main reviewer | 0 名（承認不要・個人開発） | 個人開発方針 |
| dev reviewer | 0 名（承認不要・個人開発） | 個人開発方針 |
| main force push | OFF | deployment-branch-strategy.md |
| dev force push | OFF | deployment-branch-strategy.md |
| production env branch | main のみ | deployment-branch-strategy.md |
| staging env branch | dev のみ | deployment-branch-strategy.md |
| CI status checks | `ci`, `Validate Build` | deployment-core.md |
