# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204（CLOSED のまま spec_created で扱う） |

## 目的

task-specification-creator skill の Phase 12 必須 5 タスク（実装ガイド / システム仕様書更新 / 変更履歴 / 未タスク検出 / skill フィードバック）に **準拠**したドキュメント更新を行う。本タスクは `implementation` / `VISUAL` 種別のため、dry-run 仕様（上流：UT-GOV-002）の機械コピーではなく、**実 workflow 編集**・**T-1〜T-5 dry-run 実走**・**GitHub Actions UI / branch protection スクリーンショット**という IMPL 特性を反映した記述に書き直す。aiworkflow-requirements への正本更新要否は `実施` / `N/A` / `BLOCKED` のいずれかで明示する。

## 実行タスク

- 7 ファイル（task-specification-creator skill の必須 5 タスク + 準拠チェック 1 件 + サマリ 1 件）を `outputs/phase-12/` 配下に作成する。
- **`implementation-guide.md`**：
  - **Part 1（中学生レベル概念説明）**：`pull_request_target` を「外部から来た人を学校の入口で名札チェックする係」に喩え、「PR head を checkout する＝名札チェック係に校舎の鍵を渡す行為」、「triage と build/test を分ける＝受付（権限あり）と教室（権限なし）を別棟にする」と段階的に説明する。なぜ secrets が漏れる危険があるのか、なぜ trigger 種別を分けるだけで防げるのかを比喩で必ず示す。
  - **Part 2（技術者レベル）**：`actionlint` / `yq` / `grep -E "persist-credentials|pull_request_target"` / `gh run view --log` / `gh api repos/:owner/:repo/branches/main/protection` / `git revert <commit>` の各コマンドを Step 単位で記述。**T-1〜T-5 dry-run 実走手順**（same-repo PR / fork PR / labeled trigger / workflow_dispatch audit / manual re-run）と **VISUAL evidence 取得手順**（GitHub Actions UI 実行ログのスクリーンショット撮影位置 / branch protection 画面の required status checks 同期確認位置）を含める。
- **`system-spec-update-summary.md`**：
  - Step 1-A：タスク記録（IMPL タスクとしての成果物 / 承認後に実走する T-1〜T-5 dry-run / VISUAL evidence 保存先）。
  - Step 1-B：実装状況 = `spec_created`（実 workflow 編集は Phase 5、dry-run 実走は Phase 11 で完了見込み）。
  - Step 1-C：関連タスク更新候補（UT-GOV-001 の required status checks 名同期、UT-GOV-007 の SHA pin 連携、UT-GOV-002 dry-run 仕様の `IMPL 適用済` 注記）。
  - Step 1-D：上流 runbook 差分追記タイミング（Phase 5 runbook が IMPL 実走時に発見した実機差分を反映する場合の追記ルール）。
  - Step 2：aiworkflow-requirements 正本更新要否判定。Governance / Branch Protection 系でも `.github/workflows/` の current inventory が変わる場合は `deployment-gha.md` を same-wave 更新し、アプリ層の API / UI / D1 / RBAC 契約が不変であることを明記する。OIDC / `workflow_run` / D1・KV メタデータ参照 / Secret 追加 / RBAC 拡張の再判定トリガに該当した場合は `BLOCKED` として未タスク化または同 wave 更新する。
- **`documentation-changelog.md`**：13 Phase で生成された全 Markdown（`index.md` / `phase-01.md`〜`phase-13.md` / 各 `outputs/phase-N/*`）と **実 workflow ファイル**（`.github/workflows/pr-target-safety-gate.yml` / `.github/workflows/pr-build-test.yml`）の追加 / 変更 / 削除を時系列で列挙。
- **`unassigned-task-detection.md`**：本タスクから派生した未割当タスクを検出。**0 件でも出力必須**。候補：(a) UT-GOV-002-EVAL（OIDC / `id-token: write` 化評価）、(b) UT-GOV-002-SEC（security review 最終署名）、(c) UT-GOV-002-OBS（secrets inventory automation）、(d) `workflow_run` 利用ケースが将来追加された場合のレビュー枠。
- **`skill-feedback-report.md`**：task-specification-creator / aiworkflow-requirements skill 利用時の改善提案。**改善点なしでも出力必須**。IMPL タスクで dry-run 仕様（docs-only）からの差分記述を行う際の skill ガイダンス過不足について 1 セクション設ける。
- **`phase12-task-spec-compliance-check.md`**：Phase 1〜11 が task-specification-creator skill の Phase テンプレ仕様（章構成 7 章 / メタ情報必須項目 / 完了条件チェックリスト形式）に準拠しているかのチェック結果を Phase 単位で `OK` / `要修正` で記録する。
- **`main.md`**：Phase 12 全体サマリ（7 ファイルへのリンク、Step 2 の判定結果、未タスク件数、skill フィードバック件数）。
- **Part 1 セルフチェック**：中学生が理解できる比喩が含まれ、専門用語（`permissions` / `OIDC` / `SHA pin` 等）の生語のみで説明されていないことを確認。
- **Part 2 セルフチェック**：actionlint / yq / gh / grep / git revert の各コマンドが Step 単位で実行可能（コピペ可能）であることを確認。
- **計画系 wording 残存確認**：「予定」「後ほど」「今後」等の後追い・先送り表現が Phase 12 outputs に残っていないことを `phase12-task-spec-compliance-check.md` 末尾に grep 結果として記録する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-12/*`
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

本 Phase は docs に閉じる。実 workflow の dry-run 実走と VISUAL evidence 取得は Phase 11 の承認後実行手順として参照し、`spec_created` 時点で完了済みとは扱わない。OIDC 化 / security review 最終署名 / secrets inventory automation は後続別タスク（UT-GOV-002-EVAL / SEC / OBS）に委譲する。

## 完了条件

- [ ] 7 ファイルすべてが `outputs/phase-12/` 配下に作成されている。
- [ ] `implementation-guide.md` に Part 1（中学生レベル比喩）と Part 2（技術者レベル：actionlint / yq / gh / grep / git revert + T-1〜T-5 dry-run 手順 + VISUAL evidence 取得手順）が両方含まれる。
- [ ] `system-spec-update-summary.md` に Step 1-A〜1-D と Step 2 判定（実施 / N/A / BLOCKED）と理由が記録されている。
- [ ] `documentation-changelog.md` に 13 Phase Markdown と実 workflow ファイル変更の両方が列挙されている。
- [ ] `unassigned-task-detection.md` が 0 件でも出力されている（候補 4 件の検討痕跡を含む）。
- [ ] `skill-feedback-report.md` が改善点なしでも出力されている。
- [ ] `phase12-task-spec-compliance-check.md` で Phase 1〜11 の準拠と計画系 wording 残存ゼロが確認されている。
- [ ] Part 1 / Part 2 セルフチェックを実施し記録した。
- [ ] root `artifacts.json` と `outputs/artifacts.json` の Phase 12 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
- [ ] Issue #204 は CLOSED のまま操作しない。
