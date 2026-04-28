# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 5 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 後続実装タスク向けの **実装ランブック**を `outputs/phase-5/runbook.md` に作成する。
- 手順 1：staging リポ（個人 fork）で branch protection JSON を `gh api -X PUT` で適用 → `gh api GET` で diff 確認。
- 手順 2：auto-rebase workflow ファイルを `.github/workflows/auto-rebase.yml` に追加し、`act` でローカル実行確認。
- 手順 3：pull_request_target safety gate を `.github/workflows/safety-gate.yml` に追加し、fork PR シナリオでの権限が最小になることを確認。
- 手順 4：dev で 1 週間試験運用 → 問題なければ main へ昇格。
- ロールバック手順：`gh api -X DELETE /repos/{owner}/{repo}/branches/{branch}/protection`、Workflow は revert PR で除去。
- 各手順に対応する所要時間・担当者・前提コマンド（`scripts/cf.sh` や `mise exec --` 等）を併記。
- ランブック実行時の証跡（ログ・スクショ不要、コマンド出力テキスト）の保管先を明示。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] runbook.md に staging → main までの実装手順が連続的に記述されている。
- [ ] ロールバック手順が明示されている。
- [ ] artifacts.json の Phase 5 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
