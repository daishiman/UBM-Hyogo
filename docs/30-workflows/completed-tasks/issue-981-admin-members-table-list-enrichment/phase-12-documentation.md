# Phase 12: ドキュメント更新

> workflow: `issue-981-admin-members-table-list-enrichment`
> task type: UI task / VISUAL_ON_EXECUTION
> workflow_state: `implemented_local_evidence_captured`

## 1. 位置づけと注記

本ファイルは Phase 12 成果物の **作成手順と実行結果** を定義する。本ワークフローは automation-30 改善サイクルで実コード・focused spec・strict 7 outputs・aiworkflow-requirements 同期を同一 wave 反映する。

## 2. strict 7 outputs（`outputs/phase-12/` 配下に作成）

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `main.md` | Phase 12 全体サマリ・各 Task の結果集約 |
| 2 | `implementation-guide.md` | 中学生レベル例え話 + 技術詳細の 2 部構成実装ガイド |
| 3 | `system-spec-update-summary.md` | システム仕様更新サマリ（新規 IF 追加有無） |
| 4 | `documentation-changelog.md` | ドキュメント変更履歴 |
| 5 | `unassigned-task-detection.md` | 未タスク検出結果（0 件でも出力必須） |
| 6 | `skill-feedback-report.md` | skill 改善フィードバック（なしでも出力必須） |
| 7 | `phase12-task-spec-compliance-check.md` | canonical 9 headings 準拠の compliance check（root evidence） |

## 3. Task 12-1: 実装ガイド（`implementation-guide.md`）

2 部構成を必須とする。

- **Part 1（中学生レベル例え話）**: 「会員リストの各行に、これまで隠れていた職業・区画・会員種別・タグを“名札シール”のように貼って、表を開かずに一目で分かるようにした」程度の平易な例え話で説明する。
- **Part 2（技術詳細）**: `MembersTable.tsx` の修正点を型・props・chip 描画ロジック・コードスニペットで記述。occupation small text / `zoneTone` zone chip(dot) / `statusTone` type chip / tag pill（最大2件 + `+N`）/ 未タグ warning chip の各描画を `Chip` 再利用前提で示す。`MembersTableProps` 不変・新規 primitive ゼロを明記。
- VISUAL タスクのため、**Phase 11 screenshot references**（`admin-members-table-enriched.png` / `admin-members-table-untagged.png`）を implementation-guide に明記する。screenshot 名は phase-11 spec / screenshot-plan.json と 3 か所一致させる（[FB-LLM-MOD-05-001]）。

## 4. Task 12-2: システム仕様更新（`system-spec-update-summary.md`）

- 本タスクは既存 optional フィールド（occupation / ubmZone / ubmMembershipType / tags）の **参照のみ** で、新規インターフェース追加なし → **Step 2（新規 IF 仕様化）は N/A 見込み**。
- ただし `implemented_local_evidence_captured` UI task の close-out では **Step 1-A〜1-C を same-wave で閉じる**（既存仕様への描画反映記述・整合確認）。データ層 schema は #968 で確定済のため変更しない。

## 5. Task 12-4: 未タスク検出（`unassigned-task-detection.md`、0 件でも出力必須）

- Phase 3 MINOR を current/baseline 分離で判定する。
  - M-1: zone / membershipType の人間可読ラベル辞書化は、Issue #981 AC / prototype raw 表示との整合性から no-task 判定にする。
  - M-2: tag pill overflow `+N` ホバー tooltip 表示は、同サイクル内で `title` 付与 + TC-MT-17 により解消済みとして記録する。
- Issue #982（tag write）/ #983（photo R2）との重複チェックを実施。**別 Issue が既起票済のため重複登録しない**。
- Phase 11 で HIGH 問題が `unassigned-task/` 自動生成された場合は、それも detection に転記する。
- 2 回検証（detection 明示 + 独立 grep `TODO/FIXME/skip` 0 + 関連 OPEN Issue 確認）を実施し、current/baseline を分離記録する。

## 6. Task 12-5: skill フィードバック（`skill-feedback-report.md`、なしでも出力必須）

- 本サイクルで得た skill 改善点（例: VISUAL タスクの screenshot 3 か所一致徹底、MINOR 引き継ぎルール）を記録。改善点が無い場合も「改善なし」と明示して出力する。

## 7. Task 12-6: compliance check（`phase12-task-spec-compliance-check.md`、root evidence）

- canonical 9 headings に逐語準拠した compliance check を **root evidence** として残す。
- workflow_state（`implemented_local_evidence_captured`）と各 Phase 記述の parity を確認する。

## 8. artifacts parity

- `artifacts.json`（root）と `outputs/artifacts.json` を Phase 12 完了前に diff し **同期** する。gate（Gate-A/B/C）の `status`（enum: `passed`/`pending`）/ `passed_at`（ISO）/ `evidence_path` を両ファイルで一致させる。

## 9. index 再生成と検証コマンド

```bash
# skill indexes 再生成（idempotent であること）
mise exec -- pnpm indexes:rebuild
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js

# gate metadata 検証（ERROR=0 を期待）
mise exec -- pnpm gate-metadata:validate

# Phase 12 compliance 検証（PASS を期待）
mise exec -- pnpm verify:phase12-compliance
```

- `gate-metadata:validate` は ERROR=0。
- `verify:phase12-compliance` は PASS（`hasCompletedTasksAncestor` は配置に応じて判定）。
- `indexes:rebuild` は 2 回実行で md5 一致（idempotent）を確認。

## 完了条件

- [ ] strict 7 outputs が列挙された
- [ ] Task 12-1 が Part 1（例え話）+ Part 2（技術詳細）2 部構成 + Phase 11 screenshot references 明記要件で定義された
- [ ] Task 12-2 が Step 2 N/A 見込み + Step 1-A〜1-C same-wave close で定義された
- [ ] Task 12-4 が M-1 no-task 判定 / M-2 解消済み + #982/#983 重複排除 + 0 件でも出力必須で定義された
- [ ] Task 12-5 / Task 12-6（canonical 9 headings root evidence）が定義された
- [ ] artifacts.json / outputs/artifacts.json parity 手順が記された
- [ ] index 再生成・`gate-metadata:validate` ERROR=0 / `verify:phase12-compliance` PASS の検証コマンドが記された
- [x] strict 7 outputs を本サイクルで生成する旨が注記された
