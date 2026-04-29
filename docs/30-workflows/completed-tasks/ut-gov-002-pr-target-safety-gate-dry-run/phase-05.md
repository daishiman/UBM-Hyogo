# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 5 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

dry-run specification と security review を後続実装タスクが実行できるよう、**手順書 (runbook) を仕様レベルで固定する**。本ワークフローでは workflow ファイルの実編集は行わず、Phase 5 ランブックは「別 PR で誰が何をどの順で行うか」の仕様化に閉じる。

## 実行タスク

- `outputs/phase-5/runbook.md` に Step 1〜6 を記述する：
  - **Step 1（事前確認）**：親タスク完了 / UT-GOV-001 適用済み / UT-GOV-007 SHA pin 完了の 3 件をチェックする。
  - **Step 2（棚卸し）**：`grep -RnE 'pull_request_target' .github/workflows/` で対象 workflow を列挙し、責務分離前後の差分を表化する。
  - **Step 3（草案反映）**：親タスク Phase 2 の `pr-target-safety-gate.workflow.yml.draft` を `.github/workflows/pr-target-safety-gate.yml` に移植し、`pr-build-test.yml` を新規作成する。**workflow 編集は別 PR**。
  - **Step 4（静的検査）**：`actionlint .github/workflows/*.yml` / `yq '.permissions' .github/workflows/pr-target-safety-gate.yml`（=> `{}` 期待）/ `grep -c 'persist-credentials: false' .github/workflows/*.yml` の 3 コマンドを実行。
  - **Step 5（dry-run 実走）**：fork PR / same-repo PR / labeled trigger の 3 系統を実走し、`gh run view --log` で secrets / token 露出ゼロを目視確認。
  - **Step 6（security review 記録）**：Phase 3 の "pwn request" 非該当 5 箇条を再検証し、`outputs/phase-9/quality-gate.md` の security 節へ集約。
- ロールバック手順を記述する：`git revert <commit>` 単一コミットで safety gate 適用前へ戻せること、required status checks の job 名 drift がないことを `gh api repos/:owner/:repo/branches/main/protection` で確認する手順。
- 役割分担を明記する：本仕様は **docs-only**。実 workflow 編集 / dry-run 実走 / secrets review は **後続実装タスク（別 PR）** が担当することを runbook 冒頭に重複記述する。
- 危険操作の禁止リスト：`force push to main / dev`、`branch protection の admin override`、`secrets の意図しない露出` を「実装タスクが守るべき red lines」として列挙。
- 連携タスク：UT-GOV-001（branch protection apply）/ UT-GOV-007（action pin）/ Phase 12 unassigned-task-detection（残課題の差し戻し先）への参照を runbook 末尾に置く。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-2/design.md`
- `outputs/phase-4/test-matrix.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-5/runbook.md`
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`

## 成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`

## 統合テスト連携

dry-run 実走は後続実装タスクで実行する。runbook.md に Step 5 として手順を仕様化するに留め、本タスクでは `gh` / `actionlint` を実行しない。

## 完了条件

- [ ] runbook.md に Step 1〜6 が記述されている。
- [ ] ロールバック手順（単一 revert コミット）が記述されている。
- [ ] 役割分担（docs-only vs 実装タスク）が冒頭に明記されている。
- [ ] red lines（force push / admin override / secrets 露出）が列挙されている。
- [ ] 連携タスクへの参照が末尾に配置されている。
- [ ] artifacts.json の Phase 5 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
