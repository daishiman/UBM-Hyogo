# Branch Governance 実装ガイド

---

## Part 1: 中学生レベルの説明

### なぜ GitHub に「鍵」をかけるのか？

チームでソフトウェアを作るとき、みんなが自由にコードを変えてしまうと、誰かが間違えたコードを本番環境（実際に使うサービス）に反映させてしまうリスクがあります。

このプロジェクトでは、その「間違い防止の鍵」として **branch protection** と **environment 保護** を使います。

---

### ブランチ（branch）とは？

**例え話**: ブランチは「下書きノート」です。

- 正式なノート（main ブランチ）に直接書くのは危険
- まず下書きノート（feature/* ブランチ）に書く
- 先生に確認（レビュー）してもらい、合格したら正式なノートに転記（マージ）する

### ブランチの種類

| ブランチ | 役割 |
| --- | --- |
| `feature/*` | 新機能の下書き（直接変更OK） |
| `dev` | 開発・検証用（1名の先生チェックが必要） |
| `main` | 本番用（2名の先生チェックが必要） |

### 環境（environment）とは？

**例え話**: 環境は「本番の棚と練習の棚」です。

- `production`（本番の棚）: お客様に見せるもの。`main` ブランチからのみ入れられる
- `staging`（練習の棚）: 新機能を試す場所。`dev` ブランチからのみ入れられる

### 日常的な操作フロー

```
1. feature/xxx ブランチを作って開発
2. feature/xxx → dev へ PR（プルリクエスト）を出す
   → 1名がレビューして承認
   → staging 環境に自動デプロイ
3. dev → main へ PR を出す
   → 2名がレビューして承認
   → production 環境に自動デプロイ
```

---

## Part 2: 技術者向けの詳細説明

### ブランチ戦略

正本仕様: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`

```
feature/* → dev → main
```

| ブランチ | デプロイ先 | Required reviewers | Force push |
| --- | --- | --- | --- |
| `feature/*` | なし | 不要 | 許可 |
| `dev` | Cloudflare staging | 1 名 | 禁止 |
| `main` | Cloudflare production | 2 名 | 禁止 |

### Branch Protection 設定値

```
main:
  required_pull_request_reviews:
    required_approving_review_count: 2
  required_status_checks:
    strict: true
    contexts: ["ci", "Validate Build"]
  allow_force_pushes: false
  allow_deletions: false

dev:
  required_pull_request_reviews:
    required_approving_review_count: 1
  required_status_checks:
    strict: false
    contexts: ["ci", "Validate Build"]
  allow_force_pushes: false
```

### GitHub Environments 設定値

```
production:
  deployment_branch_policy:
    custom_branch_policies: true  # main のみ
  required_reviewers: 2

staging:
  deployment_branch_policy:
    custom_branch_policies: true  # dev のみ
  required_reviewers: 0  # 自動デプロイ
```

### CODEOWNERS

ファイルパス: `.github/CODEOWNERS`

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

### PR Template 必須欄

ファイルパス: `.github/pull_request_template.md`

必須チェック項目:
- True Issue: #（issue 番号）
- Dependency: #（依存タスク）
- 4条件チェック（価値性 / 実現性 / 整合性 / 運用性）

### Secrets 管理

| 変数名 | 配置先 | 投入 Phase |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | 04 Phase 5 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | 04 Phase 5 |
| `GOOGLE_*` / `AUTH_*` / `RESEND_*` | Cloudflare Secrets | 02-auth / 08-database / 10-notification |

### Emergency Hotfix 手順（admin bypass）

緊急時のみ使用。実行前に必ずチームへ通知すること。

```bash
# 1. main の branch protection を一時解除
gh api \
  --method DELETE \
  repos/daishiman/UBM-Hyogo/branches/main/protection

# 2. 緊急修正コードを直接 main にプッシュ
git push origin main

# 3. 修正確認後、branch protection を再適用
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
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### Reviewer 不在時の Escalation パス

1. `@daishiman` に Slack / メールで連絡
2. 24 時間以内に応答がない場合: admin bypass を検討
3. admin bypass 実施時: GitHub の audit log に記録される

### Environments デプロイ確認手順

```bash
# deployment 状態確認
gh api repos/daishiman/UBM-Hyogo/deployments \
  --jq '.[] | {id: .id, environment: .environment, ref: .ref, created_at: .created_at}'

# environment の branch ポリシー確認
gh api repos/daishiman/UBM-Hyogo/environments \
  --jq '.environments[] | {name: .name, deployment_branch_policy: .deployment_branch_policy}'
```

### CODEOWNERS 変更時の手順

1. `outputs/phase-02/github-governance-map.md`（正本）を更新する
2. `.github/CODEOWNERS` を更新する
3. `outputs/phase-05/codeowners.md` を更新する
4. PR を作成して dev → main へマージする

### Rollback 手順

`outputs/phase-05/repository-settings-runbook.md` の「Rollback 手順」セクションを参照。

### 技術付録: 型・API・エラー処理

#### TypeScript の型定義

```ts
export type BranchName = "main" | "dev" | `feature/${string}`;
export type EnvironmentName = "production" | "staging";
export type StatusCheckName = "ci" | "Validate Build";

export interface BranchProtectionConfig {
  branch: Exclude<BranchName, `feature/${string}`>;
  requiredApprovals: 1 | 2;
  requiredStatusChecks: readonly StatusCheckName[];
  requireBranchesUpToDate: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
}

export interface EnvironmentPolicy {
  environment: EnvironmentName;
  allowedBranches: readonly ["main"] | readonly ["dev"];
  requiredReviewers: number;
  reviewerSetup: "ui-only" | "api";
}

export interface GovernanceExecutionResult {
  ok: boolean;
  status: "applied" | "pending_ui" | "blocked";
  reason?: string;
}
```

#### API / CLI シグネチャ

```ts
function buildBranchProtectionPayload(config: BranchProtectionConfig): string;
function buildEnvironmentPolicyPayload(policy: EnvironmentPolicy): string;
function summarizeGovernanceStatus(result: GovernanceExecutionResult): string;
```

```bash
# branch protection を適用する例
gh api --method PUT \
  repos/{owner}/{repo}/branches/main/protection \
  --input ./main-branch-protection.json

# environment の branch policy を適用する例
gh api --method PUT \
  repos/{owner}/{repo}/environments/production \
  --input ./production-environment.json

# PR を作成する例
gh pr create --base main --head <branch> --reviewer <reviewer>
```

#### 使用例

```ts
const mainProtection: BranchProtectionConfig = {
  branch: "main",
  requiredApprovals: 2,
  requiredStatusChecks: ["ci", "Validate Build"],
  requireBranchesUpToDate: true,
  allowForcePushes: false,
  allowDeletions: false,
};

const productionPolicy: EnvironmentPolicy = {
  environment: "production",
  allowedBranches: ["main"],
  requiredReviewers: 2,
  reviewerSetup: "ui-only",
};
```

#### エラーハンドリング

| エラー | 典型的な原因 | 対応 |
| --- | --- | --- |
| `401 / 403` | token 権限不足、repo admin 権限なし | GitHub token / 権限を確認する |
| `404` | branch / environment が存在しない | 先に branch または environment を作成する |
| `422` | reviewer 数や status check 名が不正 | `main` / `dev` と `ci` / `Validate Build` を正確に使う |
| `409` | 既存の protection rule と衝突 | 既存設定を確認してから再適用する |
| `pending_ui` | reviewer 設定が UI のみで完結しない | ブラウザで手動設定して runbook に記録する |

#### エッジケース

- `main` の 2 名承認は同じ人を 2 回数えられない。
- `production` の Required reviewers は REST API で完結しないため、UI 手順を残す。
- `Validate Build` がまだ存在しない場合、branch protection は merge を止める。
- `dev` が存在しない状態で environment policy を設定すると 404 になる。
- `feature/*` は保護対象に入れず、作業ブランチとして自由に使う。

#### 設定可能なパラメータと定数

| パラメータ / 定数 | 既定値 | 用途 |
| --- | --- | --- |
| `MAIN_BRANCH` | `main` | production 向けの保護対象 |
| `DEV_BRANCH` | `dev` | staging 向けの保護対象 |
| `PRODUCTION_ENVIRONMENT` | `production` | 本番 environment 名 |
| `STAGING_ENVIRONMENT` | `staging` | 検証 environment 名 |
| `MAIN_REQUIRED_APPROVALS` | `2` | main の承認数 |
| `DEV_REQUIRED_APPROVALS` | `1` | dev の承認数 |
| `REQUIRED_STATUS_CHECKS` | `["ci", "Validate Build"]` | merge 前チェック |
| `ALLOW_FORCE_PUSHES` | `false` | 事故防止 |
| `ALLOW_DELETIONS` | `false` | 事故防止 |
