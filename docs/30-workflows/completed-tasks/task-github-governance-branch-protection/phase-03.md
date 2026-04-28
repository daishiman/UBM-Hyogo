# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 3 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- Phase 2 の設計草案に対し **4 条件レビュー**を実施する：(1) 単一責務原則 (2) docs-only 境界遵守 (3) 横断依存タスクとの非衝突 (4) rollback 可能性。
- 横断衝突確認：task-conflict-prevention-skill-state-redesign / task-git-hooks-lefthook-and-post-merge / task-worktree-environment-isolation / task-claude-code-permissions-decisive-mode の 4 件と本草案が衝突しないかチェックリストで検証。
- squash-only ポリシーが既存の post-merge hook（lefthook）と矛盾しないか確認。
- auto-rebase workflow が worktree 隔離と整合する（rebase 中の他 worktree 影響なし）か確認。
- 草案の各設定項目が「ユーザー lockout」を引き起こさないか机上検証する（`enforce_admins: true` 適用時の admin override 経路確保）。
- レビュー所見を `outputs/phase-3/review.md` に記録し、未解決事項を Phase 4 へ申し送る。
- GO-NO-GO 判定の暫定結果を main.md に記録する（最終判定は Phase 10）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 4 条件レビューが完了し review.md に記録されている。
- [ ] 横断依存 4 タスクとの非衝突が確認されている。
- [ ] artifacts.json の Phase 3 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
