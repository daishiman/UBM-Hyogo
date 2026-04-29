# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 12 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

task-specification-creator skill の Phase 12 必須 5 タスク（実装ガイド / システム仕様書更新 / 変更履歴 / 未タスク検出 / skill フィードバック）に **準拠**したドキュメント更新を行う。docs-only / spec_created でも Step 1-A〜1-D と Step 2 判定を省略せず、aiworkflow-requirements への正本更新要否を `実施` / `N/A` / `BLOCKED` のいずれかで記録する。

## 実行タスク

- 7 ファイル（canonical 6 成果物 + 準拠チェック 1 件）を `outputs/phase-12/` 配下に作成する。
- **`implementation-guide.md`**：後続実装タスクが本仕様書に基づき dry-run / security review を実走する手順書。**Part 1（中学生レベル概念説明）**で「pull_request_target とは何か / なぜ危険か / どう分離するか」を比喩を用いて説明し、**Part 2（技術者レベル）**で actionlint / yq / gh コマンドと検証フローを記述する。
- **`system-spec-update-summary.md`**：Step 1-A（完了タスク記録）/ Step 1-B（実装状況 = `spec_created`）/ Step 1-C（関連タスク更新）/ Step 1-D（上流 runbook 差分追記タイミング）/ Step 2（正本仕様更新要否）を記録する。新規 API / D1 / IPC / UI / auth / Cloudflare Secret 変更がなければ Step 2 = `N/A` と理由を明記し、必要なら same-wave 更新または未タスク化する。
- **`documentation-changelog.md`**：13 Phase で生成された全 Markdown（index.md / phase-01.md 〜 phase-13.md / 各 outputs）の変更履歴を時系列で列挙。
- **`unassigned-task-detection.md`**：本タスクから派生した未割当タスクを検出。**0 件でも出力必須**。候補：(a)dry-run 実走の別 PR、(b)secrets 棚卸し自動化、(c)`workflow_run` 使用ケースの将来追加レビュー、(d)OIDC 化評価。
- **`skill-feedback-report.md`**：task-specification-creator / aiworkflow-requirements skill 利用時の改善提案。**改善点なしでも出力必須**。
- **`phase12-task-spec-compliance-check.md`**：Phase 1-11 が task-specification-creator skill の Phase テンプレ仕様（章構成 7 章 / メタ情報必須項目 / 完了条件チェックリスト形式）に準拠しているかのチェック結果。
- 計画系 wording 残存確認を実行し、Phase 12 outputs に後追い・先送り表現が残らないことを `phase12-task-spec-compliance-check.md` に記録する。
- Part 1 セルフチェック：中学生が読んで理解できる比喩（例：「`pull_request_target` は学校に来る人を入口で名札チェックする係」「PR head の checkout は名札チェック係に校舎の鍵を渡す行為」）が含まれているか確認。
- Part 2 セルフチェック：actionlint / yq / gh / grep の各コマンドが Step 単位で実行可能か確認。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

本 Phase は docs に閉じる。dry-run 実走は後続実装タスクで実行する。

## 完了条件

- [ ] 7 ファイルすべてが outputs/phase-12/ 配下に作成されている。
- [ ] implementation-guide.md に Part 1（中学生レベル）と Part 2（技術者レベル）が両方含まれる。
- [ ] unassigned-task-detection.md が 0 件でも出力されている。
- [ ] skill-feedback-report.md が改善点なしでも出力されている。
- [ ] phase12-task-spec-compliance-check.md で Phase 1-11 の準拠が確認されている。
- [ ] system-spec-update-summary.md に Step 1-A〜1-D と Step 2 判定（実施 / N/A / BLOCKED）が記録されている。
- [ ] artifacts.json の Phase 12 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
