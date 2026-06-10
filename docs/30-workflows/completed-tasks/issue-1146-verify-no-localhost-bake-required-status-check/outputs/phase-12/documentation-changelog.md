# ドキュメント更新履歴

| 項目 | 値 |
| --- | --- |
| タスク | issue-1146 `verify-no-localhost-bake` を dev/main の required status check に登録 |
| ステータス | `implemented_local_runtime_pending` |
| Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（CLOSED 維持・`Refs #1146`） |

本タスクのドキュメント同期は (A) workflow-local 同期と (B) global skill sync の 2 ブロックに分けて記録する。

---

## (A) workflow-local 同期

本 workflow root（`docs/30-workflows/completed-tasks/issue-1146-verify-no-localhost-bake-required-status-check/`）を新規生成した。

| ファイル | 区分 | 内容 |
| --- | --- | --- |
| `.github/workflows/verify-no-localhost-bake.yml` | 変更 | `on.pull_request.paths` 除去。required context が全 PR で status を返すよう常時実行化 |
| `index.md` | 更新 | workflow root ハブ・調査結論・根本最適化 2 点・local 実装済み境界 |
| `artifacts.json` / `outputs/artifacts.json` | 更新 | metadata / 生成パターン / recovered_from_unassigned / Gate-B passed / user-gated 境界 |
| `phase-1-requirements.md` 〜 `phase-9-qa.md` | 新規 | 要件〜QA のタスク仕様 |
| `phase-10-final-review.md` | 新規（本 prompt） | AC-1〜AC-8 最終判定 / blocker 判定 / baseline 候補 |
| `phase-11-manual-test.md` | 新規（本 prompt） | NON_VISUAL 手動テスト計画 |
| `phase-13-pr.md` | 新規（本 prompt） | governance mutation gate / PR 手順 |
| `outputs/phase-11/manual-test-result.md` | 更新 | read-only 調査再現 + local implementation verification |
| `outputs/phase-12/main.md` | 新規（本 prompt） | Phase 12 ハブ |
| `outputs/phase-12/implementation-guide.md` | 新規（本 prompt） | Part1/Part2 実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 更新 | Step 1-A/1-B/1-C/API Step 2(N/A) + workflow inventory sync |
| `outputs/phase-12/documentation-changelog.md` | 新規（本 prompt・本ファイル） | 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 新規（本 prompt） | 未タスク検出（current 0 / baseline 記録） |
| `outputs/phase-12/skill-feedback-report.md` | 更新 | スキルフィードバックを同 cycle で反映済み |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 更新 | compliance check / implemented_local_runtime_pending 実態同期 |

消費元 proto-spec（`docs/30-workflows/unassigned-task/staging-api-url-and-session-recovery-followup-002-...md`）は **削除禁止**で、末尾に consumed pointer を追記する（issue #1146 body の既存リンクを破壊しない）。

### automation-30 review 補正（2026-06-08）

| ファイル | 補正内容 |
| --- | --- |
| `phase-4-test-plan.md` / `phase-5-implementation.md` / `phase-6-test-additions.md` / `phase-7-coverage.md` / `phase-8-refactor.md` / `phase-9-qa.md` | 本文で充足済みの Phase 完了条件が未チェックのままだったため `[x]` に同期 |
| `phase-9-qa.md` / `phase-11-manual-test.md` / `outputs/phase-12/implementation-guide.md` | `on.pull_request.paths` 除去は local 実装済み、branch protection PUT / after evidence / PR のみ user-gated という境界へ表現を統一 |
| `phase-10-final-review.md` | AC-7 の実行区分を `.sh` / `.spec.ts` diff なしに明確化し、yml local edit 済みとの誤読を排除 |
| 消費元 proto-spec | 先頭 `status` とメタ表を `consumed` に同期し、canonical workflow root 側の状態を `implemented_local_runtime_pending` として明記 |

---

## (B) global skill sync

同 cycle で反映済み。

| ファイル | 区分 | 内容 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/references/governance-branch-protection-pattern.md` | 更新 | required check 対象 workflow の no-paths 常時起動 gate を追加 |
| `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md` | 更新 | proto-spec stale 再測定 gate を追加 |
| `.claude/skills/task-specification-creator/SKILL-changelog.md` | 更新 | issue-1146 skill feedback 反映履歴 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1146-verify-no-localhost-bake-required-status-check-artifact-inventory.md` | 新規 | workflow inventory |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 更新 | active workflow 登録 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `indexes/quick-reference.md` | 更新 | 検索導線 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / `changelog/20260608-issue1146-verify-no-localhost-bake-required-status-check.md` | 更新/新規 | 正本同期履歴 |

---

## Step 別結果

| Step | 内容 | 結果 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | 記録済（`system-spec-update-summary.md`・implemented_local_runtime_pending） |
| Step 1-B | 実装状況テーブル | 記録済（implemented_local_runtime_pending・yml local edit 済み・PUT は user-gated） |
| Step 1-C | 関連タスクテーブル | 記録済（親 workflow / proto-spec / Issue #1146） |
| Step 2 | システム仕様正本更新 | API/interface は **N/A**。workflow inventory / indexes は同 cycle sync 済み |
