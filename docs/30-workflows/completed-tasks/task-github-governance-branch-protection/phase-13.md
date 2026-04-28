# Phase 13: 完了確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 13 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

ユーザー承認ゲートとして、Phase 1-12 の成果物総和を提示し、PR 草案テンプレ・change-summary を整え、承認を待つ。承認前は commit / push / PR 作成を一切行わない（user_approval_required: true）。

## 実行タスク

- `outputs/phase-13/main.md` にユーザー承認ゲートであることを冒頭に明記する。
- `outputs/phase-13/change-summary.md` に 13 Phase 成果物の索引と変更ファイル統計（実コード変更ゼロ）を記録する。
- `outputs/phase-13/pr-template.md` に Title / Summary（3-5 bullet）/ Test plan（docs-only 文書整合チェック）/ レビュアー指定方針（dev=1名・main=2名）/ dev → main 昇格手順を記述する。
- Phase 1-12 の成果物が done 相当で揃い、Phase 13 は `user_approval_required: true` の pending として残ることを artifacts.json で最終確認する。
- ユーザー承認後の遷移経路（feature/* → dev → main）を明示する。
- 承認時の口頭/チャット記録の保管方針を明記する。
- 承認なしでの destructive オペレーション（force push / branch protection 直接適用）の禁止を再宣言する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] main.md にユーザー承認ゲート（user_approval_required: true）が明記されている。
- [ ] change-summary.md と pr-template.md が作成されている。
- [ ] artifacts.json の Phase 13 status が pending（承認待ち）に設定されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
