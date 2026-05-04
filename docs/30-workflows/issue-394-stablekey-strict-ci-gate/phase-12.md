# Phase 12: ドキュメント・未タスク・スキルフィードバック

task-specification-creator skill の Phase 12 必須 5 タスク + compliance check（合計 7 ファイル）を実施する。

## Task 12-1: implementation-guide.md（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md`

- Part 1: 「stableKey という名前のキーをコードに直書きしてはいけない理由を、ロボット（CI）が必ず気づくようにする」を中学生レベルで説明
- Part 2: ci.yml 差分 / strict コマンド / 親 workflow AC-7 昇格 / required context 維持戦略 を技術者レベルで記述

## Task 12-2: システム仕様書更新（Step 1-A/B/C + 条件付き Step 2）

`outputs/phase-12/system-spec-update-summary.md`

- Step 1-A: 03a 親 workflow `index.md` の `状態` / `ゲート状態` 更新（`enforced_dry_run` → `enforced` / `warning_mode` → `strict_required`）
- Step 1-B: 03a 親 `outputs/phase-12/implementation-guide.md` の AC-7 を `fully enforced` に更新
- Step 1-C: aiworkflow-requirements の branch protection current facts に required context `ci` の lint step 名を反映
- Step 2: drift があれば aiworkflow-requirements を SSOT に戻す

## Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md`

- 本 workflow / 親 workflow / aiworkflow-requirements の更新行をリスト化

## Task 12-4: unassigned-task-detection.md（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md`

候補:

- pre-commit hook 化（local 早期検出）
- `if: always()` で `pnpm lint` 失敗時も strict が走る挙動への切替検討
- 03b 側への展開

該当ありの場合は Issue 化候補として記述、なしの場合は「0 件」と明示。

## Task 12-5: skill-feedback-report.md（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md`

task-specification-creator skill / aiworkflow-requirements skill への feedback。なしの場合は「改善点なし」と明示。

## Task 12-6: phase12-task-spec-compliance-check.md（compliance check）

`outputs/phase-12/phase12-task-spec-compliance-check.md`

7 ファイル実体チェック:

```bash
for f in implementation-guide.md system-spec-update-summary.md documentation-changelog.md \
         unassigned-task-detection.md skill-feedback-report.md \
         phase12-task-spec-compliance-check.md main.md; do
  test -f "outputs/phase-12/$f" && echo "PASS: $f" || echo "FAIL: $f"
done
```

## workflow_state 取扱

`spec_created` 状態のため workflow root の `metadata.workflow_state` は据え置き、`phases[].status` のみ更新。実装完了時に enforced → completed へ昇格。

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 12 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 12: ドキュメント・未タスク・スキルフィードバック の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

## 実行タスク

- 現行 148 violations を前提に、CI を壊す変更を実行しない。
- cleanup 後に実行する作業と、今回実体化する evidence を分離する。
- AC / 依存関係 / Phase 12 strict outputs との整合を確認する。

## 参照資料

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/index.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md
- .github/workflows/ci.yml
- package.json
- scripts/lint-stablekey-literal.mjs

## 成果物/実行手順

- 対応する `outputs/phase-12/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
