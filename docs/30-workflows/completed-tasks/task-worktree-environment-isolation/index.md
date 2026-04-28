# task-worktree-environment-isolation — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| ディレクトリ | docs/30-workflows/task-worktree-environment-isolation |
| 実行種別 | spec_created |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 状態 | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## Phase一覧

| Phase | 名称 | 仕様書 | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-1/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-2/main.md, outputs/phase-2/design.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-3/main.md, outputs/phase-3/review.md |
| 4 | テスト設計 | phase-04.md | pending | outputs/phase-4/main.md, outputs/phase-4/test-matrix.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-5/main.md, outputs/phase-5/runbook.md |
| 6 | テスト拡充 | phase-06.md | pending | outputs/phase-6/main.md, outputs/phase-6/failure-cases.md |
| 7 | カバレッジ確認 | phase-07.md | pending | outputs/phase-7/main.md, outputs/phase-7/coverage.md |
| 8 | リファクタリング | phase-08.md | pending | outputs/phase-8/main.md, outputs/phase-8/before-after.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-9/main.md, outputs/phase-9/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動テスト | phase-11.md | pending | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | 完了確認 | phase-13.md | pending | outputs/phase-13/main.md, outputs/phase-13/change-summary.md, outputs/phase-13/pr-template.md |

## 横断依存

1. task-conflict-prevention-skill-state-redesign
2. task-git-hooks-lefthook-and-post-merge
3. task-worktree-environment-isolation
4. task-github-governance-branch-protection
5. task-claude-code-permissions-decisive-mode

## 完了条件

- [ ] 13 Phase が揃っている。
- [ ] Phase 13 はユーザー承認待ち。
