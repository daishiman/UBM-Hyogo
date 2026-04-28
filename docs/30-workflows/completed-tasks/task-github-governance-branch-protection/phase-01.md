# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 1 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow / pull_request_target safety gate 草案の **真の論点とスコープ**を Phase 1 で固定し、後続 Phase の前提を確定させる。

## 実行タスク

- 真の論点を固定する：「dev/main の保護差分」「squash-only 強制」「auto-rebase の自動化境界」「pull_request_target の権限事故防止」の 4 つを正本として採択する。
- スコープ境界を確定する：本タスクは **docs-only** の草案作成のみ。実コードの本番適用（`gh api` 実行・Workflow push）は後続実装タスクへ分離する。
- 命名 canonical を確定する：`branch protection JSON` / `auto-rebase workflow` / `pull_request_target safety gate` の表記を全 Phase で統一する。
- 横断依存タスクを洗い出す：task-conflict-prevention-skill-state-redesign / task-git-hooks-lefthook-and-post-merge / task-worktree-environment-isolation / task-claude-code-permissions-decisive-mode の 4 件を依存対象として登録。
- 非スコープを明示する：CODEOWNERS の網羅整備、GitHub App 導入、外部 CI（CircleCI 等）の検討は本タスク対象外と宣言する。
- 成果物の置き場所を `outputs/phase-1/main.md` に固定し、artifacts.json の Phase 1 セクションと整合させる。
- 用語集の初版（branch protection / squash-only / fast-forward / pull_request_target 等）を main.md に列挙する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`（ブランチ戦略 feature → dev → main）
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-1/main.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 真の論点 4 つが main.md に明記されている。
- [ ] 横断依存 4 タスクが列挙されている。
- [ ] 命名 canonical が確定している。
- [ ] artifacts.json の Phase 1 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
