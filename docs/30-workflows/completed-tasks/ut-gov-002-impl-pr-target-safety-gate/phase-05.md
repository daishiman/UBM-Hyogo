# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 5 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

UT-GOV-002 で確定した dry-run 仕様を **承認後の実装実行時に実 workflow へ落とし込み、T-1〜T-5 の dry-run を実走する**。Phase 5 は手順を Step 1〜7 で固定し、Phase 11 の VISUAL evidence 取得まで一筆書きで辿れる runbook を `outputs/phase-5/runbook.md` に書き下す。`spec_created` 時点では実 workflow 編集・dry-run・commit は未実施であり、commit / push / PR 作成は Phase 13 のユーザー承認後に限る。

## 実行タスク

- `outputs/phase-5/runbook.md` に Step 1〜7 を記述する：
  - **Step 1（事前確認）**: ① UT-GOV-002 dry-run 仕様完成（`completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/`）、② UT-GOV-001 適用済み（`gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で `required_pull_request_reviews=null`）、③ UT-GOV-007 SHA pin 完了（全 `uses:` が 40 桁 SHA）の 3 件をチェックする。
  - **Step 2（棚卸し）**: `grep -RnE 'pull_request_target' .github/workflows/` で対象 workflow を列挙し、責務分離前後の差分を runbook に表化する（before/after の trigger / permissions / checkout ref）。
  - **Step 3（実 workflow 編集）**: 親タスク Phase 2 の `pr-target-safety-gate.workflow.yml.draft` を `.github/workflows/pr-target-safety-gate.yml` として承認後の実装差分に含め、untrusted build / test を `.github/workflows/pr-build-test.yml` に分離する。デフォルト `permissions: {}` / job 単位最小昇格 / 全 `actions/checkout` に `persist-credentials: false` を設定。`pull_request_target.types` は `[labeled, opened, synchronize]` の中から triage に必要な範囲のみに絞る。
  - **Step 4（静的検査）**: Phase 4 の 5 コマンドを実走し、結果を `outputs/phase-5/static-check-log.md` に保存。actionlint エラー 0 件、`yq` の permissions 期待値一致、`persist-credentials: false` が全 checkout に存在すること、`head.*` が trusted job で hit しないことを確認。
  - **Step 5（dry-run 実走）**: same-repo PR / fork PR / labeled trigger / workflow_dispatch audit / manual re-run の T-1〜T-5 を Phase 4 マトリクスに従って実走し、`gh run view <run-id> --log | grep -iE '(secret|token|ghp_|ghs_)'` でヒット 0 件を確認。
  - **Step 6（VISUAL evidence 取得）**: 各 run について GitHub Actions UI のスクリーンショット（run summary + job permissions 表示）と branch protection 画面（required status checks 一覧）を `outputs/phase-11/screenshots/` に Phase 11 正本の `<scenario>-<view>-<YYYY-MM-DD>.png` 形式で保存。
  - **Step 7（required status checks 名同期）**: `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` および `.../branches/dev/protection` で `required_status_checks.contexts` を取得し、新 job 名（例 `pr-build-test / build`）と drift がないことを確認。drift があれば UT-GOV-004 の追従タスクを Phase 12 unassigned-task-detection に起票。
- ロールバック手順を記述する：safety gate 適用前の状態へ単一 `git revert <merge-commit>` で戻すこと、revert 後に required status checks の旧 job 名が再び required になることを `gh api` で確認する手順。
- 危険操作の禁止リスト（red lines）を列挙：
  - `force push to main / dev`
  - branch protection の admin override（`enforce_admins=false` 化）
  - secrets 値を runbook / ログに転記する行為
  - `pull_request_target` workflow への `actions/checkout` 追加
  - `workflow_run` 経由で fork PR build に secrets を橋渡しする変更
- 連携タスクへの参照を末尾に置く：UT-GOV-001（branch protection apply）/ UT-GOV-004（required status checks 同期）/ UT-GOV-007（action pin）/ Phase 12 unassigned-task-detection（残課題の差し戻し先）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-5/runbook.md`（上流正本）
- `outputs/phase-2/design.md`
- `outputs/phase-4/test-matrix.md`
- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`

## 成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`
- `outputs/phase-5/static-check-log.md`
- `.github/workflows/pr-target-safety-gate.yml`（承認後の実装差分）
- `.github/workflows/pr-build-test.yml`（承認後の実装差分）

## 統合テスト連携

Step 5 dry-run 実走の証跡は Phase 11 manual-smoke-log.md と screenshots/ に集約される。Step 7 の required status checks 同期結果は Phase 9 quality-gate.md のセキュリティ節に反映する。

## 完了条件

- [ ] runbook.md に Step 1〜7 が記述されている。
- [ ] Step 3 で実 workflow 2 ファイルを承認後の実装差分として作成することが明記されている。
- [ ] ロールバック手順（単一 revert + 旧 required status checks 復元確認）が記述されている。
- [ ] red lines（5 項目）が列挙されている。
- [ ] 連携タスク（UT-GOV-001 / 004 / 007 + Phase 12）への参照が末尾に配置されている。
- [ ] artifacts.json の Phase 5 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
