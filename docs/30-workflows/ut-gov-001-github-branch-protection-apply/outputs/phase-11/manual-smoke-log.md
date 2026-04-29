# 手動 smoke log — 4 ステップ手動 smoke コマンド系列（NOT EXECUTED）

> **本ログは仕様レベルの NOT EXECUTED 記録**。実走は Phase 13 ユーザー明示承認後に別オペレーションで行う。
> ここでは「実走時に辿るべきコマンドと期待結果」を固定する。実 PUT 応答 / 実 GET 値 / 実 grep 結果は本ファイルには記録しない。

## メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | spec walkthrough（手動）+ Phase 2 §7 の正本コマンド |
| screenshot を作らない理由 | NON_VISUAL（UI 無し）+ docs-only walkthrough（実 PUT は Phase 13 後） |
| 実行日時 | 2026-04-28（spec 固定日） |
| 実行者 | worktree branch: `task-20260428-223418-wt-1`（solo 開発） |
| 実走予定 | Phase 13 ユーザー明示承認後の別オペレーション |
| 担当者 | solo 運用のため実行者本人 |

## STEP 0 — 前提確認（NOT EXECUTED）

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 0.1 | UT-GOV-004 (`required_status_checks.contexts` 同期) completed 確認 | UT-GOV-004 のステータスが completed | NOT EXECUTED | NOT EXECUTED |
| 0.2 | task-github-governance-branch-protection Phase 13 承認確認 | 承認済 | NOT EXECUTED | NOT EXECUTED |
| 0.3 | `gh auth status` | `administration:write` を含むスコープが付与されている | NOT EXECUTED | NOT EXECUTED |
| 0.4 | `gh api repos/{owner}/{repo}` で repo 到達確認 | 200 / repo metadata 取得 | NOT EXECUTED | NOT EXECUTED |

> NO-GO ゲート（Phase 1 / 2 / 3 で 3 重明記された UT-GOV-004 完了前提）の **再掲（4 重目）**: STEP 0.1 が PASS しない場合、`required_status_checks.contexts=[]` で 2 段階適用に切替えるか、UT-GOV-004 完了まで待機する。

## STEP 1 — dry-run プレビュー（NOT EXECUTED）

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 1.1 | `gh api repos/{owner}/{repo}/branches/dev/protection > outputs/phase-13/branch-protection-snapshot-dev.json` | 200 / snapshot 保存（GET 形・PUT 不可） | NOT EXECUTED | NOT EXECUTED |
| 1.2 | `gh api repos/{owner}/{repo}/branches/main/protection > outputs/phase-13/branch-protection-snapshot-main.json` | 200 / snapshot 保存 | NOT EXECUTED | NOT EXECUTED |
| 1.3 | adapter（Phase 5 で実装）で `payload-{dev,main}.json` / `rollback-{dev,main}.json` 生成 | Phase 2 §4.1 マッピング表通りに正規化 | NOT EXECUTED | NOT EXECUTED |
| 1.4 | `diff <(jq -S . snapshot-dev.json) <(jq -S . payload-dev.json)` | intended diff のみ（design.md §2 と一致） | NOT EXECUTED | NOT EXECUTED |
| 1.5 | `diff <(jq -S . snapshot-main.json) <(jq -S . payload-main.json)` | intended diff のみ | NOT EXECUTED | NOT EXECUTED |
| 1.6 | intended diff を `outputs/phase-13/apply-runbook.md` §dry-run-diff に記録しレビュー承認 | 承認サイン記録 | NOT EXECUTED | NOT EXECUTED |

## STEP 2 — 実適用（NOT EXECUTED — Phase 13 ユーザー承認後）

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 2.1 | `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input outputs/phase-13/branch-protection-payload-dev.json > outputs/phase-13/branch-protection-applied-dev.json` | HTTP 200 / applied JSON 保存 | NOT EXECUTED | NOT EXECUTED |
| 2.2 | `gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input outputs/phase-13/branch-protection-payload-main.json > outputs/phase-13/branch-protection-applied-main.json` | HTTP 200 / applied JSON 保存 | NOT EXECUTED | NOT EXECUTED |

> **bulk 化禁止**: dev / main は独立 PUT × 2。片方失敗時もう片方は影響を受けない。
> **rollback リハーサル + 再適用** は Phase 13 `rollback-rehearsal-log.md` で別途記録（本 STEP では実 PUT のみ）。

## STEP 3 — `gh api` GET で実値確認（NOT EXECUTED）

| # | コマンド | 期待値 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 3.1 | `gh api repos/{owner}/{repo}/branches/dev/protection \| jq '.required_pull_request_reviews'` | `null`（solo 運用） | NOT EXECUTED | NOT EXECUTED |
| 3.2 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_pull_request_reviews'` | `null`（solo 運用） | NOT EXECUTED | NOT EXECUTED |
| 3.3 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_status_checks.contexts'` | UT-GOV-004 同期済 contexts のみの配列 | NOT EXECUTED | NOT EXECUTED |
| 3.4 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.enforce_admins.enabled'` | `true` | NOT EXECUTED | NOT EXECUTED |
| 3.5 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.lock_branch.enabled'` | `false`（§8.3） | NOT EXECUTED | NOT EXECUTED |
| 3.6 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_linear_history.enabled'` | `true` | NOT EXECUTED | NOT EXECUTED |
| 3.7 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.allow_force_pushes.enabled'` | `false` | NOT EXECUTED | NOT EXECUTED |
| 3.8 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.allow_deletions.enabled'` | `false` | NOT EXECUTED | NOT EXECUTED |
| 3.9 | `gh api repos/{owner}/{repo}/branches/main/protection \| jq '.required_conversation_resolution.enabled'` | `true` | NOT EXECUTED | NOT EXECUTED |

## STEP 4 — CLAUDE.md と grep 一致確認（NOT EXECUTED / 二重正本 drift 検証）

| # | コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| 4.1 | `grep -nE "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md` | 1 件以上ヒット（solo 運用ポリシー記述） | NOT EXECUTED | NOT EXECUTED |
| 4.2 | `grep -nE "required_linear_history\|allow_force_pushes\|allow_deletions\|required_conversation_resolution" CLAUDE.md` | 各条項に対応する記述が存在 | NOT EXECUTED | NOT EXECUTED |
| 4.3 | STEP 3 の GET 値と CLAUDE.md 記述の **意味的一致** を目視確認 | drift 0 件 | NOT EXECUTED | NOT EXECUTED |

> **二重正本ポリシー（§8.6）**: 正本は **GitHub 実値**、CLAUDE.md は **その参照**。drift があれば `outputs/phase-13/apply-runbook.md` の「drift remediation」節へ記録し、CLAUDE.md 側を実値に合わせて更新する（GitHub 実値を変えるのではない）。

## 実走時の必須条件（Phase 13 へ申し送り）

- STEP 0 全 PASS が STEP 1 の前提
- STEP 1 の intended diff レビュー承認が STEP 2 の前提
- STEP 2 が dev / main 独立で 2 回実行されたことが STEP 3 の前提
- STEP 3 の全 field 一致が STEP 4 の前提
- STEP 4 で drift 検出時は **GitHub 実値ではなく CLAUDE.md** を訂正する

## 関連

- 4 ステップ正本: [../phase-02/main.md §7](../phase-02/main.md)
- 緊急 rollback 2 経路: [../phase-02/main.md §9.2](../phase-02/main.md)
- 親仕様 §8.1〜8.6: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)
