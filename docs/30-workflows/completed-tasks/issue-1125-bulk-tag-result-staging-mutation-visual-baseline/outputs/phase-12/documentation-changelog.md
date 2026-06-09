# Documentation Changelog

本 wave のドキュメント同期結果を Step 単位で記録する。該当なしの Step も明示記録する。

## Step 別結果

| Step | 結果 | 詳細 |
| --- | --- | --- |
| Step 1-A（完了タスク記録） | 記録済み | 親機能 issue-1036（landed）/ 部分消化元 issue-1077 / seed・runner 基盤 issue-1081・#1144 を `system-spec-update-summary.md` に記録 |
| Step 1-B（実装状況） | 記録済み | workflow_state=`implemented_local_evidence_captured`・implementation_mode=`new`・追加実装 5 ファイル + smoke:test wiring・staging runtime は user-gated を記録 |
| Step 1-C（関連タスク） | 記録済み | 消費する unassigned-task `task-issue-1036-followup-001-...` の状態更新（result 2 状態の残スコープが本タスクで消化）を記録 |
| Step 2（新規 interface） | 該当なし（N/A） | テストコード + synthetic fixture + runner のみ。公開 interface / 型 / API / D1 schema / Google Form の追加ゼロ → system spec 更新不要 |

## workflow-local sync（本 workflow root 内）

| 対象 | 結果 | 詳細 |
| --- | --- | --- |
| index.md | 整合済み | status `implemented_local_evidence_captured` / implementation / VISUAL_ON_EXECUTION・AC-1..8・スコープ判断表（§0.1〜§0.3）が確定 |
| Phase 1-10 spec | 作成済み | 各 phase-N 仕様書が completed (spec) |
| outputs/phase-11/manual-test-result.md | 更新済み | VISUAL_ON_EXECUTION の local evidence + staging runtime pending 証跡 ledger |
| outputs/phase-12/main.md | 新規作成 | Phase 12 サマリ |
| outputs/phase-12/implementation-guide.md | 新規作成 | 2 部構成 + 視覚証跡（VISUAL_ON_EXECUTION） |
| outputs/phase-12/system-spec-update-summary.md | 新規作成 | Step 1-A/B/C + Step 2（N/A） |
| outputs/phase-12/unassigned-task-detection.md | 新規作成 | current / baseline 未タスク |
| outputs/phase-12/skill-feedback-report.md | 新規作成 | skill 改善フィードバック |
| outputs/phase-12/phase12-task-spec-compliance-check.md | 新規作成 | canonical 9 見出し compliance |
| outputs/phase-13/pr-creation-result.md | 新規作成 | pending_user_approval |
| artifacts.json（root / outputs） | 更新済み | `workflow_state=implemented_local_evidence_captured` / `canonical_screenshots`（all-success / partial-failure）/ `verify_commands` / gates を保持 |
| unassigned source trace | 更新対象 | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md` に result 2 状態の残スコープが本タスク（issue-1125）で消化される旨の consumed pointer を反映 |

## global skill sync（`.claude/skills/aiworkflow-requirements/` 等）

**本 wave では未実施（実装後に別途実施）**。本タスクは spec 作成タスクであり、aiworkflow-requirements / task-specification-creator skill の正本ファイル（`.claude/skills/` 配下）の同期は **実装着地後に別途行う**。以下を実装後の同期対象として明記しておく:

| 対象 | 予定 | 詳細 |
| --- | --- | --- |
| references/task-workflow-active.md | 実装後に更新 | 本 workflow を active ledger に登録 |
| indexes/quick-reference.md | 実装後に更新 | 1 行エントリ追加 |
| indexes/resource-map.md | 実装後に更新 | workflow root パス追加 |
| references/workflow-issue-1125-...-artifact-inventory.md | 実装後に作成 | artifact inventory（Lessons Learned inline） |
| changelog/20260606-issue-1125-...md | 実装後に作成 | dated changelog エントリ |
| indexes/{topic-map,keywords.json} | 実装後に `pnpm indexes:rebuild` | drift gate（`verify-indexes-up-to-date`）対象のため冪等再生成 |
| LOGS / SKILL-changelog | 実装後に更新 | union-merge 対象 |

> 本 SubAgent は workflow 配下の outputs のみ作成し、`.claude/skills/` 配下の正本ファイルは編集していない。

## system spec sync（`docs/00-getting-started-manual/specs/`）

**該当なし**。新規 interface / API / schema 追加がないため system spec 更新は不要（system-spec-update-summary.md Step 2 参照）。

## apps ソース / D1 / Form

**該当あり**。本 wave では apps/web Playwright spec / seed・cleanup SQL / runner shell / runner shell test / smoke:test wiring の実コードを追加した。apps 本番ソース / D1 schema（table 定義）/ Google Form の変更はゼロ（`migrations/seed/` の synthetic データ投入のみ）。runtime command は `--out-dir` を本 workflow の `outputs/phase-11/evidence` に固定し、既存 staging visual evidence path を汚さない。
