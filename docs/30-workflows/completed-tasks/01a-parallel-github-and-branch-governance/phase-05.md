# Phase 5: セットアップ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-23 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 4 の差分リストを基に、GitHub リポジトリの設定を設計値（TO-BE）に合致させる。branch protection / environments / PR template / CODEOWNERS のすべてを適用し、全 AC（AC-1〜5）を満たした状態にする。

## 実行タスク

### ステップ 1: input と前提の確認

- `outputs/phase-04/main.md` の差分リストと変更対象リストを読む
- `outputs/phase-02/github-governance-map.md` の設計値を再確認する
- 変更対象リストを確認し、本 Phase の作業スコープを確定する

### ステップ 2: `outputs/phase-05/repository-settings-runbook.md` の作成

GitHub Settings 適用手順を記載した runbook を作成する。

#### 2-A: Branch Protection（main）の適用手順

**ブラウザ操作手順:**

1. `https://github.com/{owner}/{repo}/settings/branches` にアクセス
2. `main` ブランチのルールが存在しない場合は "Add branch protection rule" をクリック
   - 存在する場合は鉛筆アイコンをクリックして編集
3. "Branch name pattern" に `main` を入力
4. 以下を設定する:
   - "Require a pull request before merging" を ON
   - "Required number of approvals" を **2** に設定
   - "Require status checks to pass before merging" を ON
   - ステータスチェックに `ci` と `Validate Build` を追加
   - "Require branches to be up to date before merging" を ON
   - "Allow force pushes" を OFF（チェックを外す）
   - "Allow deletions" を OFF（チェックを外す）
5. "Save changes" をクリック

**gh CLI 代替コマンド:**

```bash
# main ブランチの branch protection を設定
gh api \
  --method PUT \
  repos/{owner}/{repo}/branches/main/protection \
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

#### 2-B: Branch Protection（dev）の適用手順

**ブラウザ操作手順:**

1. `https://github.com/{owner}/{repo}/settings/branches` にアクセス
2. `dev` ブランチのルールが存在しない場合は "Add branch protection rule" をクリック
   - 存在する場合は鉛筆アイコンをクリックして編集
3. "Branch name pattern" に `dev` を入力
4. 以下を設定する:
   - "Require a pull request before merging" を ON
   - "Required number of approvals" を **1** に設定
   - "Require status checks to pass before merging" を ON
   - ステータスチェックに `ci` と `Validate Build` を追加
   - "Allow force pushes" を OFF（チェックを外す）
5. "Save changes" をクリック

**gh CLI 代替コマンド:**

```bash
# dev ブランチの branch protection を設定
gh api \
  --method PUT \
  repos/{owner}/{repo}/branches/dev/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["ci", "Validate Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

#### 2-C: GitHub Environments（production）の適用手順

**ブラウザ操作手順:**

1. `https://github.com/{owner}/{repo}/settings/environments` にアクセス
2. "New environment" をクリックし、名前に `production` を入力
   - 既存の場合は `production` をクリックして編集
3. 以下を設定する:
   - "Required reviewers" を ON にし、レビュアーを **2 名** 追加
   - "Deployment branches" を "Selected branches" に変更
   - "Add deployment branch rule" で `main` のみを追加
4. "Save protection rules" をクリック

**gh CLI 代替コマンド:**

```bash
# production environment の作成 / 更新
gh api \
  --method PUT \
  repos/{owner}/{repo}/environments/production \
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
  repos/{owner}/{repo}/environments/production/deployment-branch-policies \
  --field name="main"
```

> **注意**: 環境の Required reviewers は GitHub REST API 経由では設定できないため、ブラウザでの設定が必要。

#### 2-D: GitHub Environments（staging）の適用手順

**ブラウザ操作手順:**

1. `https://github.com/{owner}/{repo}/settings/environments` にアクセス
2. "New environment" をクリックし、名前に `staging` を入力
   - 既存の場合は `staging` をクリックして編集
3. 以下を設定する:
   - "Required reviewers" は設定しない（自動デプロイのため 0 名）
   - "Deployment branches" を "Selected branches" に変更
   - "Add deployment branch rule" で `dev` のみを追加
4. "Save protection rules" をクリック

**gh CLI 代替コマンド:**

```bash
# staging environment の作成 / 更新
gh api \
  --method PUT \
  repos/{owner}/{repo}/environments/staging \
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
  repos/{owner}/{repo}/environments/staging/deployment-branch-policies \
  --field name="dev"
```

#### 2-E: .github/CODEOWNERS の配置手順

1. リポジトリのルートで `.github/` ディレクトリが存在するか確認する
2. `.github/CODEOWNERS` ファイルを作成（または更新）する

ファイルの内容は `outputs/phase-05/pull-request-template.md` と合わせて `outputs/phase-05/` に格納する。内容は以下の設計値に従う:

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

3. `main` ブランチに直接コミットするか、PR を通じて適用する
   - branch protection が有効な場合は PR が必要

#### 2-F: .github/pull_request_template.md の配置手順

1. `.github/pull_request_template.md` を作成（または更新）する
2. 内容は `outputs/phase-05/pull-request-template.md` の内容をそのままコピーする
3. `main` ブランチに直接コミットするか、PR を通じて適用する
   - branch protection が有効な場合は PR が必要

### ステップ 3: `outputs/phase-05/pull-request-template.md` の作成

以下の内容で PR テンプレートを作成する（AC-3 の要件を満たす内容）。

```markdown
## 概要

<!-- この PR で行った変更を簡潔に記述してください -->

## 関連 Issue

- True Issue: #<!-- このPRが解決する本質的な課題のIssue番号 -->
- Dependency: #<!-- 依存する先行タスクがあれば記載（なければ「なし」） -->

## 変更種別

- [ ] 機能追加
- [ ] バグ修正
- [ ] ドキュメント更新
- [ ] インフラ変更
- [ ] リファクタリング
- [ ] その他（説明: ）

## 4条件チェック

- [ ] **価値性**: 誰のどのコストを下げるか・どの課題を解決するかが定義されている
- [ ] **実現性**: 初回スコープ（無料枠・既存技術スタック）で成立する
- [ ] **整合性**: branch / env / runtime / data / secret の設定が正本仕様と矛盾しない
- [ ] **運用性**: rollback・handoff・same-wave sync が破綻しない

## テスト確認

- [ ] ローカルで動作確認済み
- [ ] CI が GREEN
- [ ] 影響範囲を確認済み（スコープ外サービスへの変更なし）
- [ ] secret 実値がコードに含まれていないことを確認済み
```

### ステップ 4: 適用後の sanity check

全設定の適用後、以下のコマンドで設定が正しく反映されていることを確認する。

```bash
# main branch protection の確認
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '{
    reviews: .required_pull_request_reviews.required_approving_review_count,
    status_checks: .required_status_checks.contexts,
    force_push: .allow_force_pushes.enabled,
    deletions: .allow_deletions.enabled
  }'
# 期待: reviews=2, status_checks=["ci","Validate Build"], force_push=false, deletions=false

# dev branch protection の確認
gh api repos/{owner}/{repo}/branches/dev/protection \
  --jq '{
    reviews: .required_pull_request_reviews.required_approving_review_count,
    status_checks: .required_status_checks.contexts,
    force_push: .allow_force_pushes.enabled
  }'
# 期待: reviews=1, status_checks=["ci","Validate Build"], force_push=false

# environments の確認
gh api repos/{owner}/{repo}/environments \
  --jq '.environments[] | {name: .name, branch_policy: .deployment_branch_policy}'
# 期待: production と staging が存在し、それぞれ custom_branch_policies=true

# PR template の存在確認
gh api repos/{owner}/{repo}/contents/.github/pull_request_template.md \
  --jq '.name'
# 期待: "pull_request_template.md"

# CODEOWNERS の存在確認
gh api repos/{owner}/{repo}/contents/.github/CODEOWNERS \
  --jq '.name'
# 期待: "CODEOWNERS"
```

### ステップ 5: rollback 手順の確認

緊急時に branch protection を一時解除する手順を runbook に記録する。

**rollback 手順（branch protection の一時解除）:**

```bash
# main branch protection の一時削除（緊急時のみ。管理者権限が必要）
gh api \
  --method DELETE \
  repos/{owner}/{repo}/branches/main/protection

# 作業完了後に再適用（ステップ 2-A の gh CLI コマンドを再実行）
```

> **注意**: rollback は本番障害対応など極めて限定的な状況でのみ使用すること。実行前に必ずチームへの通知を行う。

### ステップ 6: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を本 Phase の作業について確認する
- Phase 6 に渡す blocker と open question を `outputs/phase-05/main.md` に記録する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-04/main.md` | AS-IS 差分リスト・変更対象リスト |
| 必須 | `outputs/phase-02/github-governance-map.md` | 設計値（TO-BE） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping の正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート |
| 参考 | `doc/01a-parallel-github-and-branch-governance/index.md` | タスク全体の受入条件（AC-1〜5） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | `outputs/phase-05/` の成果物を異常系検証の入力として使用 |
| Phase 7 | runbook と template が全 AC をカバーしているか AC トレースに使用 |
| Phase 10 | 最終 gate で設定値が正本仕様と一致しているか確認 |
| Phase 12 | close-out の際に runbook と template の最終版を参照 |

## 多角的チェック観点

- **価値性**: runbook に従い全設定を適用することで AC-1〜4 が満たされるか
- **実現性**: GitHub UI とブラウザ操作のみで完結するか（追加費用・ツール不要か）
- **整合性**: 適用後の設定値が正本仕様（deployment-branch-strategy.md）と完全一致するか
- **運用性**: rollback 手順が runbook に明記されており、緊急時に即時対応できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認（Phase 4 outputs を読む） | 5 | pending | outputs/phase-04/main.md の差分リスト |
| 2 | repository-settings-runbook.md の作成 | 5 | pending | outputs/phase-05/ |
| 3 | Branch Protection（main）の設定適用 | 5 | pending | reviewer 2名・status checks・force push OFF |
| 4 | Branch Protection（dev）の設定適用 | 5 | pending | reviewer 1名・status checks・force push OFF |
| 5 | Environments（production）の設定適用 | 5 | pending | reviewer 2名・main のみ |
| 6 | Environments（staging）の設定適用 | 5 | pending | 自動・dev のみ |
| 7 | .github/CODEOWNERS の配置 | 5 | pending | outputs/phase-05/ に内容を格納 |
| 8 | pull-request-template.md の作成と配置 | 5 | pending | outputs/phase-05/pull-request-template.md |
| 9 | 適用後 sanity check の実施 | 5 | pending | gh CLI で全設定値を確認 |
| 10 | rollback 手順の確認と記録 | 5 | pending | runbook に追記 |
| 11 | 4条件評価と Phase 6 への handoff 記録 | 5 | pending | blockers と open questions を明記 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-05/repository-settings-runbook.md` | GitHub Settings 適用手順・sanity check・rollback |
| ドキュメント | `outputs/phase-05/pull-request-template.md` | PR テンプレート本文（.github/ に配置する内容） |
| ドキュメント | `outputs/phase-05/codeowners.md` | CODEOWNERS 本文（.github/ に配置する内容） |
| ドキュメント | `outputs/phase-05/main.md` | 適用結果サマリー・Phase 6 handoff |
| メタ | `artifacts.json` | Phase 5 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-05/repository-settings-runbook.md` が作成済み
- [ ] `outputs/phase-05/pull-request-template.md` が作成済み（AC-3 の true issue / dependency / 4条件欄を含む）
- [ ] `outputs/phase-05/codeowners.md` が作成済み（AC-4 のパターンを含む）
- [ ] Branch Protection（main: reviewer 2名 / dev: reviewer 1名）が設定済み（AC-1）
- [ ] Environments（production → main / staging → dev）が設定済み（AC-2）
- [ ] 適用後 sanity check が PASS（全設定値が正本仕様と一致）
- [ ] rollback 手順が runbook に記載済み
- [ ] Phase 6 への handoff items が記録済み

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック済み
- [ ] 適用後の sanity check が PASS
- [ ] scope 外サービスを追加していない（Cloudflare deploy・secret 実値なし）
- [ ] 次 Phase への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase 5 を completed に更新済み

## 次Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: `outputs/phase-05/` の全成果物と、適用後の設定状態（sanity check 結果）を Phase 6 に渡す
- ブロック条件: sanity check に FAIL がある、または主要成果物（runbook / PR template）が未作成の場合は Phase 6 に進まない

## 設定ファイル全文（outputs/ に格納する内容）

docs-first task のため、実際に `.github/` に配置するファイル内容を `outputs/phase-05/` に格納する。`.github/` への実際の配置は runbook の手順に従う。

### CODEOWNERS 全文

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

## 各ステップ後の sanity check

- scope 外サービス（Cloudflare deploy・secret 実値）を追加していない
- branch protection が main / dev 両方に適用されている
- environments が production / staging 両方に作成されており、それぞれ正しい branch に制限されている
- PR template に AC-3 の全必須欄（true issue / dependency / 4条件）が含まれている
- CODEOWNERS が AC-4 のパターンを全て含んでいる
- downstream task（02, 04）が参照できる path（`outputs/phase-05/`）がある

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | runbook の適用により reviewer 不在・force push によるリリース事故リスクを排除できるか | PASS（branch protection と environment 保護を機械的に強制） |
| 実現性 | GitHub UI 手動操作 + gh CLI のみで全設定が完結するか | PASS（追加費用・ツール不要。GitHub Free/Pro で全機能利用可） |
| 整合性 | 適用後の設定値が正本仕様（deployment-branch-strategy.md）と完全一致するか | sanity check で確認（適用後に PASS を確認する） |
| 運用性 | rollback 手順（branch protection の一時解除）が runbook に明記されているか | PASS（管理者権限で即時対応可。手順を runbook に記載） |
