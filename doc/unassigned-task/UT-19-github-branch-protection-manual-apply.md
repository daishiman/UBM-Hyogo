# UT-19: GitHub ブランチ保護・Environments 手動適用

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-19 |
| タスク名 | GitHub ブランチ保護・Environments 手動適用 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

`01a-parallel-github-and-branch-governance` タスクで作成されたランブック（`repository-settings-runbook.md`）を実際に適用し、GitHub リポジトリの branch protection rules および Environments（production / staging）のブランチポリシーを確定させる。**個人開発のため PR 承認は不要**。CI チェック（`ci` / `Validate Build`）通過のみを必須とし、CI ゲートが実際に機能する状態を作る。

## スコープ

### 含む
- `main` ブランチ保護設定の適用（承認不要・status check 必須・force push 禁止）
- `dev` ブランチ保護設定の適用（承認不要・status check 必須・force push 禁止）
- GitHub Environments（production）のブランチポリシー設定（`main` のみ許可）
- GitHub Environments（staging）のブランチポリシー設定（`dev` のみ許可）
- `gh api` コマンドによる設定値の検証・確認

### 含まない
- ランブックそのものの作成（`01a-parallel-github-and-branch-governance` Phase 5 で作成済み）
- GitHub Actions ワークフローの実装（→ UT-05 のスコープ）
- Cloudflare 側のデプロイ設定（→ UT-06 のスコープ）
- 組織レベルのポリシー設定（リポジトリ単位のみが対象）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01a-parallel-github-and-branch-governance | ランブック（`repository-settings-runbook.md`）が作成済みであることが前提 |
| 上流 | UT-05（CI/CD パイプライン実装） | status check context（"ci" / "Validate Build"）が GitHub に登録されるには CI ワークフローを1回以上実行している必要がある |
| 下流 | UT-05（CI/CD パイプライン実装） | branch protection が有効でないと PR マージ時の CI ゲートが機能しない |
| 下流 | UT-06（本番デプロイ実行） | branch protection が確定しないと本番デプロイの CI ゲートが機能しない |

## 着手タイミング

> **着手前提**: `01a-parallel-github-and-branch-governance` が完了しランブックが存在すること、かつ UT-05 で CI ワークフローが1回以上実行済みであること（status check context 登録のため）。

| 条件 | 理由 |
| --- | --- |
| 01a-parallel-github-and-branch-governance 完了 | ランブックが存在しないと適用手順の根拠がない |
| UT-05 の CI ワークフロー 1回以上実行済み | `required_status_checks.contexts` に "ci" / "Validate Build" が GitHub 内部に登録されていないと branch protection 適用時に 422 エラーになる |

UT-05 の CI ワークフロー作成完了後、かつ CI が最低1回実行された後に本タスクへ着手すること。branch protection の status check 設定だけを後から追加する手順も可能だが、ランブックに従って一括適用する方が設定漏れが起きにくい。

## 苦戦箇所・知見

**1. production environment Required Reviewers は設定しない（個人開発方針）**: 個人開発のため PR 承認および production Required Reviewers は不要。設定すると自分自身がデプロイをブロックすることになるため設定しない（0名）。CI チェック通過のみで自動デプロイする。

**2. status check context 名が CI 実行前に未登録**: branch protection の `required_status_checks.contexts` に "ci" や "Validate Build" といったジョブ名を指定するが、これらの context 名は GitHub Actions ワークフローが1度も実行されていない状態だと GitHub の内部 DB に登録されていない。この状態で `gh api PUT .../branches/main/protection` を実行すると `422 Unprocessable Entity` エラーになる。先に CI ワークフローを1回ダミー実行（または feature ブランチへのプッシュ）してから branch protection を適用すること。

**3. ブランチ名の揺れ（develop → dev）**: 正本仕様（`deployment-branch-strategy.md`）では `dev` が正式ブランチ名だが、`deployment-cloudflare.md` および `deployment-core.md` で `develop` が使われていた。01a タスク作業中にこれらのファイルを修正しているが、既存の外部ドキュメントやワークフローファイルで `develop` が残っていないかを branch protection 適用前に確認すること。ブランチ名の不一致があると protection 設定が意図しないブランチに適用されるリスクがある。

## 実行概要

- ランブック（`doc/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md`）を参照し、記載されているコマンドを順番に実行する
- `gh api PUT repos/daishiman/UBM-Hyogo/branches/main/protection` で main ブランチの保護を適用する（承認不要・status check 必須・force push 禁止）
- `gh api PUT repos/daishiman/UBM-Hyogo/branches/dev/protection` で dev ブランチの保護を適用する（承認不要・status check 必須・force push 禁止）
- GitHub UI（Settings > Environments > production）でブランチポリシーを `main` に限定する（Required Reviewers は設定しない）
- GitHub UI（Settings > Environments > staging）でブランチポリシーを `dev` に限定する
- `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` および `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` で設定値を取得し、期待値と一致することを確認する

## 完了条件

- [ ] main branch protection が適用され、承認不要・status check 必須（`ci`, `Validate Build`）・force push 禁止が確認されている
- [ ] dev branch protection が適用され、承認不要・status check 必須・force push 禁止が確認されている
- [ ] production environment のブランチポリシー（main のみ）が設定されている
- [ ] staging environment のブランチポリシー（dev のみ）が設定されている
- [ ] `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で `reviews=0` が確認されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md | 実際の適用コマンド・手順の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | ブランチ戦略正本（dev / main の役割・命名確認） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Environments 設定方針・Cloudflare Pages との連携 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 全体方針・ブランチ保護設計の背景 |
| 参考 | doc/completed-tasks/01a-parallel-github-and-branch-governance/outputs/phase-12/unassigned-task-detection.md | UT-19 の検出コンテキスト |
