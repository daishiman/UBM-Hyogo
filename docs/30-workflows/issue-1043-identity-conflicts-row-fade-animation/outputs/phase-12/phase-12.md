# Phase 12: ドキュメント更新（close-out）

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

本 Phase の正本サマリは [`main.md`](main.md) を参照。本ファイルは Phase 12 の phase エントリ（成果物索引 + 実行サマリ）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007）。GitHub 実状態 `OPEN`（ユーザー認識「クローズド」と乖離・本 WF は状態変更しない） |
| workflow_state | `implemented_local_evidence_captured`（Phase 1-13 の実装仕様書を作成。実装・focused Vitest 完了） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` |
| 兄弟 followup | `#1042`（dismiss optimistic update・別タスク・本タスク対象外） |

## 目的

merge optimistic hide（`IdentityConflictRow.tsx`）の row 消失を「即時 `return null`」から「短い fade / collapse による退場（exiting 相）→ DOM 除去（removed 相）」へ置き換える実装仕様の close-out ドキュメント群（canonical 7 成果物）を固定する。`prefers-reduced-motion: reduce` 抑制・server error 時 rollback・dismiss 不変を spec 粒度で確定する。本 Phase 時点で実装コード、focused Vitest、local Playwright、Phase 11 screenshot 3 PNG は完了済み。commit・PR・Issue mutation は user-gated。

## 実行タスク（Phase 12 Task 12-1〜12-6 + Step 1-A〜1-C）

| Task | 名称 | 本サイクルでの扱い（implemented_local_evidence_captured） | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2パート構成） | Part 1（中学生レベル）+ Part 2（技術者レベル）+ 視覚証跡を記述。screenshot 3 PNG captured | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を implemented_local_evidence_captured の close-out として記録。Step 2 は新規 IF なしで N/A 判定 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local 同期と global skill sync の結果を別ブロックで記録 | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも必須） | Phase 3 MINOR-1/MINOR-2 を個別評価し、新規未タスク 0 件として理由付き記録 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | 本 spec で得た知見 3 観点を記録 | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 見出し + strict 7） | canonical 9 見出しを逐語使用し strict 7 全 present・implemented_local_evidence_captured 一致を確認 | `phase12-task-spec-compliance-check.md` |

### Step 1-A〜1-C（implemented_local_evidence_captured の close-out として記録）

| Step | 実施内容 | 状況 |
| --- | --- | --- |
| 1-A | 仕様書（Phase 1-12）・`index.md`・`artifacts.json` / `outputs/artifacts.json` を同一 wave で `implemented_local_evidence_captured` に整合 | implemented_local_evidence_captured（実装済み） |
| 1-B | `completed` ではなく `implemented_local_evidence_captured` の判断結果を記録（実コード差分は本 WF で発生している） | 記録済み |
| 1-C | 参照 grep と関連台帳（aiworkflow-requirements LOGS / ledger）への spec 登録結果を記録 | 記録済み |

> Step 1-D（index 再生成）/ 1-E（unassigned links / audit）/ 1-F（DevOps）/ 1-G（validator）/ Step 2 の判定は `documentation-changelog.md` と `system-spec-update-summary.md` に詳細を記載する。

## 参照資料

| 種別 | パス |
| --- | --- |
| 本 WF 確定設計 | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md` |
| 索引 | `index.md` / `artifacts.json` |
| 兄弟テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/` |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| compliance テンプレート | `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md` |

## 成果物（canonical 7・全件 present）

| # | 成果物 | ファイル | 役割 |
| --- | --- | --- | --- |
| 1 | Phase 12 サマリ | [`main.md`](main.md) | Task 12-1〜12-6 実施サマリ + strict 7 索引 |
| 2 | 実装ガイド | [`implementation-guide.md`](implementation-guide.md) | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | システム仕様更新サマリ | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1-A/1-B/1-C + Step 2（N/A 判定） |
| 4 | ドキュメント更新履歴 | [`documentation-changelog.md`](documentation-changelog.md) | workflow-local / global skill sync 別ブロック |
| 5 | 未タスク検出 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | MINOR-1/MINOR-2 評価（新規 formalize 0 件） |
| 6 | スキルフィードバック | [`skill-feedback-report.md`](skill-feedback-report.md) | テンプレート/ワークフロー/ドキュメント改善 |
| 7 | コンプライアンスチェック | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) | canonical 9 見出し + strict 7 present 確認 |

## 統合テスト連携

- 本 WF は implemented_local_evidence_captured のため、focused Vitest は実行済み（13/13 PASS）。Playwright e2e は desktop 8/8 PASS。Phase 11 screenshot canonical 3 名は `implementation-guide.md` §視覚証跡に明記し、local fixture で captured。
- 本サイクルで追加・更新したテスト: `IdentityConflictRow.spec.tsx`（exiting 開始 / removed 遷移 / rollback で exiting キャンセル / reduced-motion 即時 / success-stays-removed）、`admin-identity-conflicts.spec.ts`（fade 後安定状態の row 消失 / rollback 復元）。

## 状態

- `workflow_state: implemented_local_evidence_captured`（Phase 1-13 の実装仕様書を作成。実コード差分は本 WF で発生している）。
- Step 1-A〜1-C は same-wave で `implemented_local_evidence_captured` に整合済み。Step 2 は新規 IF なしで N/A。
- Phase 13（commit / push / PR / Issue mutation）は `pending_user_approval`。

## 完了条件（Phase 12）

- canonical 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を全件 present で作成した。
- implementation-guide に Part 1（中学生レベル）/ Part 2（技術者レベル）/ 視覚証跡を含め、識別子（`isExiting` / `exitTimerRef` / `finalizeRemoval` / `onMerge`）を Phase 1-3 設計と一致させた。
- unassigned-task-detection に新規未タスク 0 件（MINOR-1/MINOR-2 の理由付き）を記録した。
- compliance-check で canonical 9 見出しを逐語使用し、implemented_local_evidence_captured 状態の Gate-A=passed / Gate-B=passed / Gate-C=pending を記録した。
