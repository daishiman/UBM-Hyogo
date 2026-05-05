# ブランチ戦略・環境構成

> 本ドキュメントは ubm-hyogo のデプロイメント仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

---

## ブランチ戦略

ubm-hyogo は **3層ブランチ構成** で開発・ステージング・本番環境を分離する。

```
feature/xxx  →  dev  →  main
（機能開発）    （開発環境）  （本番環境）
```

| ブランチ | 目的 | デプロイ先 | 保護ルール |
| -------- | ---- | ---------- | ---------- |
| `feature/*` | 機能単位の開発 | なし（ローカルのみ） | 直接 push 禁止 |
| `dev` | 統合・開発環境 | Cloudflare (staging) | 現行: PR 経由必須・承認不要・CI チェック必須 / 草案: 承認 1 名 |
| `main` | 本番環境 | Cloudflare (production) | 現行: PR 経由必須・承認不要・CI チェック必須・force push 禁止 / 草案: 承認 2 名 |

---

## フロー

```
1. feature/* ブランチで機能開発
2. feature/* → dev へ PR & マージ（現行: 承認不要・CI チェック通過で merge 可 / 草案: 承認 1 名）
   → staging 環境へ自動デプロイ
   → 動作確認
3. dev → main へ PR & マージ（現行: 承認不要・CI チェック通過で merge 可 / 草案: 承認 2 名）
   → production 環境へ自動デプロイ
```

---

## 環境マッピング

| 環境 | GitHub ブランチ | Cloudflare 環境名 | 用途 |
| ---- | --------------- | ----------------- | ---- |
| ローカル | `feature/*` | N/A | 機能開発・ユニットテスト |
| ステージング | `dev` | `staging` | 統合確認・QA・デモ |
| 本番 | `main` | `production` | エンドユーザー向け |

---

## CI/CD トリガー対応表

| ワークフロー | ブランチ | 動作 |
| ------------ | -------- | ---- |
| `ci.yml` | `main`, `dev`, PR to `main`/`dev` | Lint・Typecheck・Test・Build |
| `web-cd.yml` | `main` push | Cloudflare Pages production デプロイ |
| `web-cd.yml` | `dev` push | Cloudflare Pages staging デプロイ |
| `backend-ci.yml` | `main` push | Cloudflare Workers production デプロイ |
| `backend-ci.yml` | `dev` push | Cloudflare Workers staging デプロイ |

---

## GitHub 環境保護ルール（推奨設定）

### `production` 環境

```
Settings > Environments > production:
- Required reviewers: 0名（不要・個人開発のため自動デプロイ）
- Wait timer: 0 分
- Deployment branches: main のみ
- Environment secrets: （本番用シークレット）
```

### `staging` 環境

```
Settings > Environments > staging:
- Required reviewers: 0名（自動デプロイ）
- Deployment branches: dev のみ
- Environment secrets: （staging 用シークレット）
```

---

## ブランチ保護ルール（推奨設定）

本節は **current applied** と **draft proposal** を分離する。current applied は GitHub REST API `GET /repos/{owner}/{repo}/branches/{branch}/protection` の取得結果を正本とし、expected contexts / PUT payload / rollback payload から推測しない。2026-05-01 の `task-utgov001-references-reflect-001` で取得した fresh GET evidence により、UT-GOV-001 second-stage reapply 後の branch protection 実値を反映済み（Refs #303）。

### current applied（GitHub GET evidence / 2026-05-01 / Refs #303）

Evidence:

- `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-dev.json`
- `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-main.json`

| 項目 | `dev` | `main` |
| --- | --- | --- |
| Required pull request reviews | enabled / required approvals `0` / code owner reviews `false` / last push approval `false` | enabled / required approvals `0` / code owner reviews `false` / last push approval `false` |
| Required status checks contexts | `ci`, `Validate Build` | `ci`, `Validate Build` |
| Strict status checks | `false` | `true` |
| Enforce admins | `false` | `false` |
| Required linear history | `false` | `false` |
| Required conversation resolution | `true` | `true` |
| Allow force pushes / deletions | `false` / `false` | `false` / `false` |
| Lock branch | `false` | `false` |
| Restrictions | `null` | `null` |

Notes:

- Fresh GET の実値には `verify-indexes-up-to-date` は含まれない。UT-GOV-004 / second-stage reapply の expected contexts との差分として扱い、current applied へ期待値を混入しない。
- 上流 `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/outputs/phase-13/branch-protection-applied-{dev,main}.json` が `blocked_until_user_approval` placeholder の場合は current applied の入力にしない。
- `coverage-gate` は 2026-05-04 Task E で hard gate 化済みだが、この 2026-05-01 current applied evidence には required context として含まれていない。GitHub branch protection の実 PUT はユーザー承認が必要な外部設定変更であり、承認後に fresh GET evidence を取り直して本表を更新する。

### historical current applied（承認不要 + CODEOWNERS ownership 文書化 / 2026-04-29）

### `main` ブランチ

```
Settings > Branches > main:
- Require pull request before merging: ON
- Required number of approvals: 0（承認不要・個人開発のため）
- Require status checks to pass: ci / Validate Build
- Require branches to be up to date before merging: ON
- Allow force pushes: OFF
- Allow deletions: OFF
```

### `dev` ブランチ

```
Settings > Branches > dev:
- Require pull request before merging: ON
- Required number of approvals: 0（承認不要・個人開発のため）
- Require status checks to pass: ci / Validate Build
- Allow force pushes: OFF
```

### CODEOWNERS（ownership 文書化のみ）

`.github/CODEOWNERS` は `require_code_owner_reviews=false` の solo 運用を維持したまま、責任範囲の文書化と GitHub UI の suggested reviewer 表示に限定して運用する。

```codeowners
* @daishiman
apps/api/** @daishiman
apps/web/** @daishiman
.github/workflows/** @daishiman
docs/30-workflows/** @daishiman
.claude/skills/**/references/** @daishiman
```

適用タスク: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/`

### draft proposal: GitHub governance branch protection 草案（spec_created / 2026-04-28）

`docs/30-workflows/task-github-governance-branch-protection/` で、上記ブランチ保護ルールをより厳格な GitHub governance 草案として仕様化した。

| 項目 | `dev` | `main` |
| --- | --- | --- |
| Required approvals | 1 | 2 |
| Required status checks | `ci / typecheck (web)`, `ci / typecheck (api)`, `ci / lint`, `ci / test (web)`, `ci / test (api)`, `ci / build (web)`, `ci / build (api)`, `ci / docs-link-check` | `dev` と同一 |
| CODEOWNERS review | 任意 | 必須 |
| Last push approval | 任意 | 必須 |
| Linear history | 必須 | 必須 |
| Squash-only repository setting | `allow_squash_merge=true`, `allow_merge_commit=false`, `allow_rebase_merge=false` | `dev` と同一 |

適用境界:

- 本差分は `spec_created` であり、GitHub repository settings / branch protection / `.github/workflows/*.yml` への実適用はまだ行わない。
- 実適用時は `task-github-governance-branch-protection` Phase 5 runbook と Phase 13 ユーザー承認ゲートに従う。
- `required_status_checks.contexts` は後続 CI 実装タスクで実ジョブ名と再照合してから本適用する。

### pending apply: UT-GOV-001 branch protection 実適用値（spec_created / 2026-04-28）

`docs/30-workflows/ut-gov-001-github-branch-protection-apply/` は、上記草案を GitHub REST API `PUT /repos/{owner}/{repo}/branches/{branch}/protection` 用 payload へ正規化して dev / main に適用するための実行仕様である。実 `PUT` は Phase 13 のユーザー明示承認後に限る。

UT-GOV-001 の適用予定値は solo 運用と衝突しないよう、草案のレビュー人数強制を採用せず `required_pull_request_reviews=null` に正規化する。

| 項目 | `dev` | `main` |
| --- | --- | --- |
| Required pull request reviews | `null`（solo 運用 / 必須レビュアーなし） | `null`（solo 運用 / 必須レビュアーなし） |
| Required status checks | UT-GOV-004 で実在 job 名同期済みの contexts のみ。未完了時は `contexts=[]` で 2 段階適用 | `dev` と同一 |
| Strict status checks | `true` | `true` |
| Enforce admins | `true`（rollback payload と enforce_admins DELETE 経路を事前準備） | `true`（同左） |
| Required linear history | `true` | `true` |
| Required conversation resolution | `true` | `true` |
| Allow force pushes / deletions | `false` / `false` | `false` / `false` |
| Lock branch | `false`（freeze runbook 未整備のため固定） | `false`（同左） |
| Restrictions | `null` | `null` |

運用境界:

- snapshot / payload / rollback / applied JSON は `{branch}` サフィックスで分離し、bulk PUT は行わない。
- GET 応答はそのまま PUT せず、`enforce_admins.enabled` → bool、`restrictions.users[].login` → 配列、`required_pull_request_reviews=null` などを adapter で正規化する。
- GitHub 側の branch protection 実値を正本、CLAUDE.md を参照文書とし、適用後は `gh api` GET と `grep` で drift を確認する。

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-28 | 1.2.1 | UT-GOV-001 branch protection apply spec_created sync。solo 運用の実適用予定値として `required_pull_request_reviews=null`、UT-GOV-004 contexts 積集合、`lock_branch=false`、`enforce_admins=true`、dev/main 別 payload と rollback 境界を追記。 |
| 2026-05-01 | 1.4.0 | task-utgov001-references-reflect-001 sync。fresh GitHub GET evidence 由来で dev/main branch protection current applied を反映。実 contexts は `ci`, `Validate Build` の2件で、`verify-indexes-up-to-date` は current applied に含めない。Refs #303。 |
| 2026-04-09 | 1.0.0 | 初版作成（feature/dev/main 3層ブランチ戦略） |
| 2026-04-26 | 1.1.0 | 個人開発方針反映: PR 承認を 2名/1名 → 0名（承認不要）に変更。CI チェック必須は維持。production Required reviewers を 0名に変更。Issue #23 対応。 |
| 2026-04-28 | 1.2.0 | task-github-governance-branch-protection spec_created sync。dev=1名 / main=2名レビュー、squash-only、linear history、CODEOWNERS / last-push approval、8 required status checks 草案を追記。実適用は後続タスク・ユーザー承認後に限定。 |
| 2026-04-29 | 1.3.0 | UT-GOV-003 CODEOWNERS governance paths sync。`.github/CODEOWNERS` を ownership 文書化として current applied に追加。solo 運用のため `require_code_owner_reviews=false` は維持。 |
