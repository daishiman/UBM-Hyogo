# Phase 13: PR 化

[実装区分: 実装仕様書]

## PR 作成手順

1. 作業ブランチ確認: `feat/issue-290-workflow-lint-gate` を作業ブランチとする
2. `git fetch origin dev` → ローカル `dev` を fast-forward
3. 作業ブランチに戻り `git merge dev`
4. 品質検証 3 コマンド:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
5. `git status --porcelain` で残差なし確認
6. `git diff dev...HEAD --name-only` で対象ファイル列挙確認
7. `gh pr create --base dev` で PR 化（Phase 12 の PR 本文素材を使用）

> Codex 実行制約: commit / push / PR 作成はユーザー明示指示があるまで実行しない。

## 対象ファイル一覧（期待）

| パス | 種別 |
| --- | --- |
| `.github/workflows/ci.yml` | 編集 |
| `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/index.md` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/phase-{01..13}.md` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-12/*.md` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/artifacts.json` | 新規 |
| `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/artifacts.json` | 新規 |
| `package.json` | 編集 |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 既存 shellcheck 指摘修正 |
| `.github/workflows/cf-audit-log-monitor.yml` | 既存 shellcheck 指摘修正 |
| `.github/workflows/cf-token-rotation-reminder.yml` | 既存 shellcheck 指摘修正 |
| `.github/workflows/lighthouse.yml` | 既存 shellcheck 指摘修正 |
| `.github/workflows/release-create.yml` | 既存 shellcheck 指摘修正 |
| `.github/workflows/validate-build.yml` | 既存 shellcheck 指摘修正 |

## PR メタ

| 項目 | 値 |
| --- | --- |
| base | dev |
| title | `feat(ci): expand actionlint to all workflows + yamllint decision (Refs #290)` |
| labels | `priority:medium`, `type:improvement`, `scale:small` |

## マージ後タスク

- UT-GOV-001 で required status check 候補に追加するか検討
- 親 unassigned task `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md` を `completed-tasks/` に移動

## 不実施事項

- branch protection の直接書き換え
- yamllint 採用
- shellcheck 範囲拡大
