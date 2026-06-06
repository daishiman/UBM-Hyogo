# Phase 12: ドキュメント更新（implemented local close-out）

`[実装区分: 実装完了]` / `workflow_state: implemented_local_evidence_captured` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ファイルは Phase 12 の phase エントリ（成果物索引 + 実行サマリ）。local code 実装、focused component test、local screenshot は完了し、staging visual / commit / PR / Issue mutation は user-gated として残す。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1080-bulk-tag-result-member-labels` |
| issue | #1080（= `task-issue-1036-followup-004`）。GitHub 実状態 **OPEN**（ユーザー認識「クローズド」と乖離・本 WF は状態変更しない / user-gated） |
| workflow_state | `implemented_local_evidence_captured`（apps/web 実装 + focused component evidence 完了） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| implementation_mode | `new` |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 兄弟 followup | `#1077`（staging 認証付き visual baseline・別タスク）/ `#1078`（large catalog UX・別タスク）/ `#1079`（audit batch filter・別タスク） |

## 目的

`/admin/members` の `BulkActionBar` tag 一括付与/解除の **部分失敗結果 summary** を、生 ID（`memberId` / `tagId`）表示から表示名（member `fullName` / tag `label`）表示へ改善した実装と close-out ドキュメント群（canonical 6 成果物 + compliance）を固定する。`membersById` optional prop 注入・`tagLabelById` 解決ロジック・fallback（memberId / `{tagId}（未登録）`）を実コードと仕様書で一致させる。Phase 11 screenshot は local fixture として保存済み。

## 成果物（6 成果物 + compliance・本タスクでの扱い）

| # | 成果物 | ファイル | 本タスクでの扱い |
| --- | --- | --- | --- |
| 1 | 実装ガイド（2パート構成） | [`implementation-guide.md`](implementation-guide.md) | Part 1（中学生レベル）+ Part 2（技術者レベル）+ 視覚証跡。screenshot は **present** |
| 2 | システム仕様書更新サマリ | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1-A/1-B/1-C を implemented local close-out として記録。Step 2 = 新規 system interface 追加なし → **N/A** |
| 3 | ドキュメント更新履歴 | [`documentation-changelog.md`](documentation-changelog.md) | 全 Step（1-A/1-B/1-C/Step 2）を「該当なし」含め個別記録。workflow-local / global skill sync を別ブロック |
| 4 | 未タスク検出 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | 0 件でも必須。current / baseline 分離。#1078/#1079 と重複しないことを記録。新規未タスク 0 件 |
| 5 | スキルフィードバックレポート | [`skill-feedback-report.md`](skill-feedback-report.md) | 改善点なしでも必須。テンプレート / ワークフロー / ドキュメント 3 観点 |
| 6 | コンプライアンスチェック | `phase12-task-spec-compliance-check.md` | **別担当が作成**（本ファイル群では作成しない） |

## implemented local close-out ルール（Step 1-A〜1-C・Step 2）

### Step 1-A〜1-C（implemented local の close-out として same-wave 記録）

| Step | 実施内容 | 状況 |
| --- | --- | --- |
| 1-A | 仕様書（Phase 1-13）・`index.md`・`artifacts.json` / `outputs/artifacts.json` を同一 wave で `implemented_local_evidence_captured` に整合 | 同期済み |
| 1-B | local implementation + focused component evidence の判断結果を記録 | 記録済み |
| 1-C | 参照 grep と関連台帳（aiworkflow-requirements LOGS / ledger）への spec 登録結果を記録 | 記録済み |

> Step 1-D（index 再生成）/ 1-E（unassigned links / audit）/ 1-F（DevOps）/ 1-G（validator）の判定は `documentation-changelog.md` に詳細を記載する。

### Step 2（新規 system interface 追加判定）= N/A

- 本タスクは `BulkActionBar` に optional prop `membersById?` を追加するが、これは **component-local の props 契約**であり、aiworkflow-requirements / api-ipc 系の公開 system interface ではない。
- API response shape `{ memberId, tagId, status }` は不変（AC-3）。新規 endpoint / 型 / 定数の公開 IF 追加なし。
- **optional prop の追加は破壊的でない型拡張**（既存呼び出し側は `membersById` 未注入でも従来どおり動作）。
- → **Step 2 は N/A**。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。

## 参照資料

| 種別 | パス |
| --- | --- |
| 本 WF 確定設計 | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` / `outputs/phase-3/phase-3.md` |
| 索引 | `index.md` / `artifacts.json` |
| 親テンプレート | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 既存実装 | `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` / `MembersClientShell.tsx` |
| compliance テンプレート | `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`（別担当が使用） |

## 状態

- `workflow_state: implemented_local_evidence_captured`（apps/web 実装 + focused component evidence 完了）。
- Step 1-A〜1-C は same-wave で `implemented_local_evidence_captured` に整合済み。Step 2 は新規公開 IF なしで N/A。
- Phase 13（commit / push / PR / Issue mutation）は `blocked`（user-gated）。

## 完了条件（Phase 12）

- 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）+ 別担当の compliance-check を全件 present で扱う。
- implementation-guide に Part 1（中学生レベル）/ Part 2（技術者レベル）/ 視覚証跡（screenshot canonical 名・present）を含め、識別子（`membersById` / `tagLabelById` / fallback）を実コードと一致させた。
- unassigned-task-detection に新規未タスク 0 件（#1078/#1079 重複なし・email 補助 / staging visual baseline は将来候補だが #1077 で別管理）を記録した。
- Step 2 = N/A（optional prop は component-local 契約・破壊的でない型拡張）を記録した。
