# Lessons Learned — UT-19 GitHub Branch Protection Manual Apply (Phase 12 close-out)

> 2026-04-27 分離: `lessons-learned-current-2026-04.md` が 500 行制限を超えているため、UT-19 close-out 教訓は本ファイルに分離する。
> 関連: `references/deployment-branch-strategy.md` / `docs/30-workflows/ut-19-github-branch-protection-manual-apply/`

---

## L-UT19-001: GitHub branch protection の required status check は CI 1 回先行実行が前提

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | infra / GitHub / branch protection |
| 症状       | `gh api -X PUT repos/:owner/:repo/branches/main/protection` 実行時に context 未登録の status check 名（`ci` / `Validate Build`）を指定すると HTTP 422 で fail する |
| 原因       | GitHub は status check context を「過去に少なくとも 1 回そのリポジトリで報告されたチェック」のみ受け付ける。下流で workflow を作成しただけでは context は登録されず、初回 CI run が走るまで API 経由で参照不能 |
| 解決策     | branch protection apply の前段に「対象 workflow を一度 main で実行する」または「PR 経由で CI を一度回す」前提条件を Phase 4 事前検証に組み込む。フォローアップ用に `scripts/verify-branch-protection.sh` を追加して再検証をコード化 |
| 再発防止   | docs-only / operations evidence 系タスクの Phase 4 事前検証チェックリストに「対象 status check context の事前登録確認」を必須項目として追加。task-specification-creator skill のテンプレに Tip として記録 |
| 関連タスク | UT-19 / Phase 4-5 |

## L-UT19-002: 操作系（docs-only operations evidence）タスクの Phase 11 は視覚スモークが成立しない

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | process / Phase 11 / non-visual evidence |
| 症状       | UT-19 はアプリコード追加を伴わず GitHub UI / `gh api` 操作のみで完結するため、従来の Phase 11 想定（manual smoke test = 視覚的検証）が適合しない |
| 原因       | Phase 11 evidence 仕様が UI 動作確認前提で組まれており、API 適用結果の検証や運用証跡（apply-execution-log / verify script 出力）を一級の evidence として扱う設計になっていなかった |
| 解決策     | Phase 11 では `manual-smoke-log.md` に `gh api` の応答と `gh run list` での context 登録確認を記録し、`scripts/verify-branch-protection.sh` の出力を再検証証跡として固定。L-05A-NON_VISUAL-001 と同じ NON_VISUAL evidence パターンに揃える |
| 再発防止   | 操作系タスク用 Phase 11 サブテンプレを task-specification-creator に追加し、`manual-smoke-log.md` / `verify-*.sh` 出力 / `apply-execution-log.md` の 3 点を必須 evidence として固定する |
| 関連タスク | UT-19 / Phase 11 / task-specification-creator skill-feedback |

## L-UT19-003: runbook と実適用値の正本ドリフト防止には deployment-branch-strategy 固定化が必要

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | governance / runbook canonical / drift |
| 症状       | Phase 8 DRY 化で runbook（`repository-settings-runbook.md`）と実適用値の差分は検出できるが、適用後に「どちらが正本か」が不明瞭で、後続タスクで再びドリフトが発生し得る |
| 解決策     | UT-19 では実適用値（required_status_checks contexts、required_approving_review_count、deployment branch policy 等）を `deployment-branch-strategy.md` に「UT-19 適用済み運用値（2026-04-27）」セクションとして固定化。runbook は手順書、deployment-branch-strategy.md は運用値正本という責務分離を明文化した |
| 再発防止   | governance 系タスクの Phase 12 close-out では「runbook = 手順」「正本仕様 = 確定運用値」の二層を必ず分離する。実適用値は同一 wave で正本ファイル（deployment-branch-strategy.md 等）にも反映し、再検証スクリプトを `scripts/` 配下に常駐させる |
| 関連タスク | UT-19 / deployment-branch-strategy.md |

---

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` — UT-19 適用済み運用値
- `docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-05/` — apply-execution-log
- `docs/30-workflows/ut-19-github-branch-protection-manual-apply/outputs/phase-11/manual-smoke-log.md` — NON_VISUAL evidence
- `scripts/verify-branch-protection.sh` — 再検証スクリプト
