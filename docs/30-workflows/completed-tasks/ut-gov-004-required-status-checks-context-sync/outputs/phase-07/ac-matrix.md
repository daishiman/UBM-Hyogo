# Phase 7: AC マトリクス / カバレッジ確認

## phase-1 投入対象

`ci` / `Validate Build` / `verify-indexes-up-to-date` の 3 件（`outputs/phase-05/required-contexts-final.md`）。

## AC × 成果物 トレース

| AC | 内容 | 充足成果物 | カバレッジ |
| --- | --- | --- | --- |
| AC-1 | 全 workflow / job / matrix 後の context 一覧 | phase-02/context-name-mapping.md §1 / phase-05/workflow-job-inventory.md | ✅ |
| AC-2 | 草案 8 件すべて rename / exclude 確定 | phase-02/context-name-mapping.md §2 | ✅ |
| AC-3 | 30 日以内 success 証跡 | phase-02/context-name-mapping.md §5 / phase-05/required-contexts-final.md 実績証跡 | ✅ |
| AC-4 | 除外 + 後追い投入条件 | phase-02/staged-rollout-plan.md §フェーズ 2 / phase-05/staged-rollout-plan.md | ✅ |
| AC-5 | lefthook ↔ CI 対応表 | phase-02/lefthook-ci-correspondence.md §1 / phase-05/lefthook-ci-mapping.md | ✅ |
| AC-6 | UT-GOV-001 入力リストの参照可能パス | phase-05/required-contexts-final.md / phase-08/confirmed-contexts.yml | ✅ |
| AC-7 | strict 採否（dev/main 別、根拠付き） | phase-02/lefthook-ci-correspondence.md §3 / phase-05/strict-mode-decision.md / phase-09/strict-decision.md | ✅ |
| AC-8 | フルパス記載規約 | phase-02/context-name-mapping.md §1, §2 | ✅ |
| AC-9 | 名前変更運用 (経路 A/B) | phase-02/staged-rollout-plan.md §名前変更事故対応 | ✅ |
| AC-10 | 4条件 PASS / MAJOR ゼロ | phase-01/main.md §2 / phase-03/main.md §1 | ✅ |

## カバレッジ集計

| 観点 | カバー率 | 備考 |
| --- | --- | --- |
| AC | 10 / 10 (100%) | MAJOR ゼロ |
| 苦戦箇所 | 6 / 6 (100%) | AC-3,4,5,7,8,9 で吸収 |
| 失敗ケース | 7 / 7 (100%) | phase-06/failure-cases.md |
| 4条件 | 4 / 4 PASS | phase-01 §2 / phase-03 §1 |

## phase-1 cut-off の最終確認

3 条件 AND（実在 / 30日 success / フルパス一致）を満たすのは 3 件。すべて phase-1 投入対象として確定。

## 草案 8 contexts の最終処遇（Phase 2/8/12 と同期）

| 草案名 | 最終処遇 | required check 粒度 | 後続条件 |
| --- | --- | --- | --- |
| typecheck | rename -> `ci` | `ci` aggregate job 内のステップ。個別 required check ではない | `ci` name 変更時は本タスク再実行 |
| lint | rename -> `ci` | `ci` aggregate job 内のステップ。個別 required check ではない | 同上 |
| unit-test | exclude | 現時点で独立 workflow/job なし | UT-GOV-005 で workflow 新設後、success 実績を確認 |
| integration-test | exclude | 現時点で独立 workflow/job なし | UT-GOV-005 で workflow 新設後、success 実績を確認 |
| build | rename -> `Validate Build` | job 単位 | `Validate Build` name 変更時は本タスク再実行 |
| security-scan | exclude | 現時点で独立 workflow/job なし | UT-GOV-005 で workflow 新設後、success 実績を確認 |
| docs-link-check | exclude | 現時点で独立 workflow/job なし | UT-GOV-005 で workflow 新設後、success 実績を確認 |
| phase-spec-validate | rename -> `verify-indexes-up-to-date` | job 単位。ただし Phase 仕様 validator ではなく index drift gate | Phase validator を別途作る場合は UT-GOV-005/007 系の後続で扱う |
