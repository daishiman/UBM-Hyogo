# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 7 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 仕様要素カバレッジマトリクスを `outputs/phase-7/coverage.md` に作成する。
- 行：仕様要素（required_pull_request_reviews / required_status_checks / allow_squash_merge / required_linear_history / enforce_admins / delete_branch_on_merge / auto-rebase trigger / safety gate sha-pin 等）。
- 列：Phase 1（要件） / Phase 2（設計） / Phase 4（検証） / Phase 5（ランブック） / Phase 6（失敗ケース）の各対応有無。
- 各セルに ✓ / − / 該当 outputs ファイルへのアンカーリンクを記入。
- 未カバー要素があれば Phase 8 / Phase 9 で補完するための TODO に転記。
- dev / main 差分の各設定値が両環境で網羅されていることをチェック。
- 横断依存タスクとの責務分担行も追加（git-hooks / worktree / permissions）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] coverage.md に仕様要素 × Phase の対応表が記載されている。
- [ ] 未カバー要素が TODO として転記されている。
- [ ] artifacts.json の Phase 7 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
