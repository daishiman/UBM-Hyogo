# ドキュメント更新履歴 — UT-GOV-001

> Step 1-A / 1-B / 1-C / Step 2 を **個別記録**。

## 変更履歴

| 日付 | 変更種別 | 対象ファイル | 変更概要 | 該当 Step |
| --- | --- | --- | --- | --- |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/index.md | ワークフロー root index 作成（メタ / スコープ / AC-1〜14 / Phase 一覧 / 苦戦箇所） | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/artifacts.json | Phase 1〜13 機械可読サマリー（Phase 1〜3 = completed / Phase 4〜13 = pending） | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-{01,02,03}.md | Phase 1〜3 仕様書 | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-{01,02,03}/main.md | Phase 1〜3 成果物本体 | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-{11,12,13}.md | Phase 11〜13 仕様書 | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-11/{main,manual-smoke-log,link-checklist}.md | Phase 11 必須 3 outputs（NON_VISUAL 代替 evidence） | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md | Phase 12 必須 5 + 1 outputs | — |
| 2026-04-28 | 新規 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/outputs/phase-13/main.md | Phase 13 PR 作成手順（NOT EXECUTED — user 承認待ち） | — |
| 2026-04-28 | 同期 | docs/30-workflows/LOGS.md | UT-GOV-001 spec_created 行追加（governance テーブル） | Step 1-A / Step 1-B |
| 2026-04-28 | 同期 | .claude/skills/task-specification-creator/LOGS.md | NON_VISUAL 代替 evidence 適用例（github_governance）ログ追加 | Step 1-A |
| 2026-04-28 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | `deployment-branch-strategy.md` の UT-GOV-001 反映見出しを index 再生成で同期 | Step 1-A |
| 2026-04-28 | 追記 | CLAUDE.md（ブランチ戦略章） | `gh api` GET + grep による drift 検証注記追加（既存記述は変更しない） | Step 1-A |
| 2026-04-28 | 確認 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/ 派生タスク記録 | 親 Phase 12 の U-1 と本 workflow index の相互追跡で充足。親タスク実体は変更なし | Step 1-B |
| 2026-04-28 | 確認 | docs/30-workflows/completed-tasks/UT-GOV-002〜007 | 既存ファイル内に UT-GOV-001 関連記述あり。本レビューでは変更なし | Step 1-C |
| 2026-04-28 | 確認 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | UT-GOV-001 上流前提の既存記述を確認。追加変更なし | Step 1-C |
| 2026-04-28 | 同期 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | UT-GOV-001 の実適用予定値（`required_pull_request_reviews=null` / UT-GOV-004 contexts / `lock_branch=false` / `enforce_admins=true`）を追記 | **Step 2 = REQUIRED** |
| 2026-04-28 | 同期 | .claude/skills/aiworkflow-requirements/indexes/* | `generate-index.js` で deployment branch strategy の新見出しを index に反映 | **Step 2 = REQUIRED** |

## 個別 Step 集計

| Step | 件数 | 状態 |
| --- | --- | --- |
| Step 1-A | 4 件（LOGS.md×2 + topic-map + CLAUDE.md 追記）+ 双方向リンク | REQUIRED 全件処理済 |
| Step 1-B | 2 件（LOGS.md governance テーブル + 親タスク派生タスク追跡） | REQUIRED 処理済 |
| Step 1-C | UT-GOV-002〜007 関連リンク + UT-GOV-004 上流前提再掲 | REQUIRED 処理済（未作成ファイルは index 追跡） |
| Step 2 | 2 件（deployment-branch-strategy + indexes 再生成） | REQUIRED 処理済 |

## 同期実行のタイミング

- 本ファイルに列挙した「同期 / 追記」は本レビュー改善で実ファイルへ反映済み。commit / push / PR 作成はユーザー明示承認後に限る。
- Step 2 は REQUIRED。アプリ API / DB / UI / IPC / auth 仕様は変更しないが、branch protection 運用値の正本は更新対象。

## 関連

- Phase 12 index: [./main.md](./main.md)
- 仕様更新サマリー: [./system-spec-update-summary.md](./system-spec-update-summary.md)
- Phase 13 PR 作成手順: [../phase-13/main.md](../phase-13/main.md)（Phase 13 で生成）
