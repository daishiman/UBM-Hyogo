# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 2 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- branch protection JSON 草案を `outputs/phase-2/design.md` または `main.md` に記述する。`required_pull_request_reviews` / `required_status_checks` / `allow_squash_merge: true` / `allow_merge_commit: false` / `allow_rebase_merge: false` / `required_linear_history: true` を含める。
- dev と main の差分設計を表で明示する：dev = レビュー 1 名・status checks 軽量、main = レビュー 2 名 + `enforce_admins: true` + status checks 完全。
- auto-rebase workflow 草案を擬似 YAML で記述する。トリガ条件（`pull_request.synchronize` / `labeled`）、対象ラベル `auto-rebase`、`git rebase origin/<base>` の実行方針、競合時のフォールバックを明記。
- pull_request_target safety gate 草案を記述する：fork PR からの権限事故防止のため、`pull_request_target` では PR code を checkout / 実行せず、untrusted build は通常の `pull_request` workflow に分離する。
- squash-only 強制下での `delete_branch_on_merge: true` 設定とマージ後の cleanup ポリシーを記述。
- rollback 手順草案：admin override で branch protection を一時解除する条件・記録方法を記載。
- CODEOWNERS との連動（main マージ時の必須レビュアー）を草案レベルで記載。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] branch protection JSON 草案が dev / main 差分込みで記載されている。
- [ ] auto-rebase workflow 草案が擬似 YAML で記述されている。
- [ ] pull_request_target safety gate の防御設計が記述されている。
- [ ] artifacts.json の Phase 2 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
