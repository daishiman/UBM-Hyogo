# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 8 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- ドキュメント重複統合の Before / After を `outputs/phase-8/before-after.md` に記載する。
- Before：`docs/01-infrastructure-setup/` 配下と `CLAUDE.md` の「ブランチ戦略」記述に重複・齟齬がないか棚卸し。
- After：本タスク成果物（branch protection 草案）が単一の source of truth となるよう参照リンクを集約。
- 参照されなくなる旧記述があれば「ここに統合した」リンクを残す（destructive 削除はしない）。
- 表記ゆれ（dev / develop, main / master）を canonical（dev / main）に統一する変更案を一覧化。
- horizontal な重複（worktree / hooks タスクとの記述被り）の責務分担を before-after で明示。
- 統合後の総ドキュメント行数を記録（Phase 9 の品質ゲートで参照）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/before-after.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] before-after.md に重複統合の差分が記載されている。
- [ ] 表記ゆれが canonical へ統一されている。
- [ ] artifacts.json の Phase 8 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
