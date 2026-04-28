# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 12 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 7 ファイル（canonical 6 成果物 + root evidence 1 件）を `outputs/phase-12/` 配下に作成する。
- `implementation-guide.md`：後続実装タスクが本草案に基づき branch protection を本適用する手順書（中学生レベルの概念説明を含む）。
- `system-spec-update-summary.md`：本タスクが `CLAUDE.md` のブランチ戦略表に与える影響と更新提案。
- `documentation-changelog.md`：13 Phase で生成された全 Markdown の変更履歴を時系列で列挙。
- `unassigned-task-detection.md`：本タスクから派生した「未割当タスク」を検出（CODEOWNERS 整備、GitHub App 評価、外部 CI 検討等）。
- `skill-feedback-report.md`：task-specification-creator / aiworkflow-requirements skill 利用時の改善提案。
- `phase12-task-spec-compliance-check.md`：Phase 1-11 が task-specification-creator skill の Phase テンプレ仕様に準拠しているかのチェック結果。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 7 ファイル（canonical 6 成果物 + root evidence 1 件）すべてが outputs/phase-12/ 配下に作成されている。
- [ ] implementation-guide.md に中学生レベルの概念説明が含まれる。
- [ ] artifacts.json の Phase 12 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
