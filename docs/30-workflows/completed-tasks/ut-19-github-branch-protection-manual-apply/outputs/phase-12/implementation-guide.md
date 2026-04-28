# UT-19 実装ガイド: GitHub ブランチ保護・Environments 手動適用

## Part 1: 概要

### なぜ必要か

大事な本番用の置き場を、うっかり壊さないようにするためです。たとえば学校の本棚で、みんなが自由に本を入れ替えると、必要な本がなくなったり、違う場所に置かれたりします。そこで先生が「この棚に入れる前に確認テストを通す」というルールを貼ります。

このタスクでは、`main` と `dev` という大事な棚に同じようなルールを貼りました。ひとり開発なので、ほかの先生のサインは不要です。ただし、自動チェックに合格していない変更は入れないようにします。

### 何をするか

GitHub の `main` / `dev` に branch protection を設定し、production / staging の Environments に使えるブランチを固定します。これにより、CI（`ci` / `Validate Build`）通過のみを必須ゲートとする個人開発向けのマージ制御を確立します。

### 今回作ったもの

- `main` / `dev` の branch protection 設定
- production は `main` のみ、staging は `dev` のみを許可する Environment policy
- `outputs/phase-05/` の before / after API 証跡
- `outputs/phase-11/manual-smoke-log.md` の再検証ログ
- `scripts/verify-branch-protection.sh` の一括再検証スクリプト

### 結果サマリ

- **main protection**: `enforce_admins=true → false`、`dismiss_stale_reviews=true → false` を更新
- **dev protection**: `required_approving_review_count=1 → 0`、`dismiss_stale_reviews=true → false` を更新
- **environments**: production=`[main]` / staging=`[dev]` は既存設定が runbook と適合
- **AC-1 〜 AC-7**: 全 PASS（Phase 7 coverage matrix / Phase 8 dry-diff / Phase 9 quality report で検証）

## Part 2: 実装内容

### TypeScript 型定義

```ts
type RequiredStatusCheck = "ci" | "Validate Build";

interface BranchProtectionExpectation {
  branch: "main" | "dev";
  requiredStatusChecks: RequiredStatusCheck[];
  requiredApprovingReviewCount: 0;
  allowForcePushes: false;
  allowDeletions: false;
  enforceAdmins: false;
  dismissStaleReviews: false;
}

interface EnvironmentPolicyExpectation {
  environment: "production" | "staging";
  allowedBranches: ["main"] | ["dev"];
  requiredReviewers: [];
}
```

### CLIシグネチャ

```bash
scripts/verify-branch-protection.sh
REPO=daishiman/UBM-Hyogo scripts/verify-branch-protection.sh
```

`REPO` を省略した場合は `daishiman/UBM-Hyogo` を検証します。

### 適用コマンド（Phase 5 実行）

main:
```bash
gh api --method PUT repos/daishiman/UBM-Hyogo/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": {"strict": true, "contexts": ["ci", "Validate Build"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 0, "dismiss_stale_reviews": false, "require_code_owner_reviews": false},
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

dev:
```bash
gh api --method PUT repos/daishiman/UBM-Hyogo/branches/dev/protection --input - <<'EOF'
{
  "required_status_checks": {"strict": false, "contexts": ["ci", "Validate Build"]},
  "enforce_admins": false,
  "required_pull_request_reviews": {"required_approving_review_count": 0, "dismiss_stale_reviews": false, "require_code_owner_reviews": false},
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### 証跡

- before: `outputs/phase-05/gh-api-before-{main,dev,environments}.json`
- after: `outputs/phase-05/gh-api-after-{main,dev,environments}.json`、`gh-api-after-{production,staging}-policies.json`
- 実行ログ: `outputs/phase-05/apply-execution-log.md`

### 使用例

```bash
# 現在の GitHub 設定が UT-19 の期待値と一致するか確認
scripts/verify-branch-protection.sh

# fork や別 repo で同じ確認をする場合
REPO=owner/repo scripts/verify-branch-protection.sh
```

### 検証結果（Phase 11 sanity check）

```json
// main
{"deletions":false,"dismiss_stale":false,"enforce_admins":false,"force_push":false,"reviews":0,"status_checks":["ci","Validate Build"]}

// dev
{"force_push":false,"reviews":0,"status_checks":["ci","Validate Build"],"deletions":false}

// production env
{"branch_policies": [{"name":"main","type":"branch"}]}

// staging env
{"branch_policies": [{"name":"dev","type":"branch"}]}
```

### エラーハンドリング

| エラー | 原因 | 対応 |
| --- | --- | --- |
| `gh: Not Found` | repo / branch / environment 名が違う | `REPO` と branch 名を確認する |
| `gh: Resource not accessible` | GitHub token の権限不足 | `repo` 管理権限を持つ認証に切り替える |
| `422 Unprocessable Entity` | status check context が未登録 | `ci.yml` / `validate-build.yml` を一度実行してから再適用する |
| `FAIL *.contexts` | branch protection と workflow 名がずれている | `.github/workflows/*` と protection contexts を同期する |

### エッジケース

- `enforce_admins=false` のため、管理者の緊急対応余地は残る。通常作業では PR 経由と CI 通過を前提にする。
- `required_reviewers` は production / staging とも 0 名。個人開発からチーム開発へ移行する場合はこの値を再設計する。
- required status check 名を変更した場合、GitHub 内部に新しい context が登録されるまで protection 更新が失敗する。
- GitHub UI と API は同じ backend を見るが、UI スクリーンショットは本タスクでは非視覚タスクとして省略した。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| repo | `daishiman/UBM-Hyogo` |
| protected branches | `main`, `dev` |
| required status checks | `ci`, `Validate Build` |
| required approving review count | `0` |
| allow force pushes | `false` |
| allow deletions | `false` |
| enforce admins | `false` |
| production allowed branch | `main` |
| staging allowed branch | `dev` |

### テスト構成

| レイヤー | コマンド | 目的 |
| --- | --- | --- |
| GitHub API smoke | `scripts/verify-branch-protection.sh` | branch protection / Environment policy の実値確認 |
| Workflow context | `gh run list --workflow ci.yml --limit 5` | `ci` context 登録確認 |
| Workflow context | `gh run list --workflow validate-build.yml --limit 5` | `Validate Build` context 登録確認 |
| Skill index | `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | topic-map / keywords 更新 |
| Guide contract | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/ut-19-github-branch-protection-manual-apply` | Phase 12 guide 要件確認 |

## 影響と次タスク

- UT-05（CI/CD パイプライン実装）: branch protection 必須化により PR マージ時の CI ゲートが機能
- UT-06（本番デプロイ実行）: production env policy `[main]` のみによりデプロイ branch が固定
- 03/04/05 系タスク: CI ゲートがアンブロック

## Rollback 手順

緊急時のみ:
```bash
gh api --method DELETE repos/daishiman/UBM-Hyogo/branches/main/protection
```

実行後は runbook §1 / §2 の PUT を再実行して復旧する。

## 参照

- runbook: `docs/30-workflows/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md`
- branch strategy: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
- task spec: `docs/30-workflows/01-infrastructure-setup/ut-19-github-branch-protection-manual-apply/index.md`
