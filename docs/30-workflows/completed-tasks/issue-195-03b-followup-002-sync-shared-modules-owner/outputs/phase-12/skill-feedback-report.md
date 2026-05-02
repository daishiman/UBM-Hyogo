# Skill Feedback Report

## task-specification-creator

| 項目 | 提案 | Routing |
| --- | --- | --- |
| code / NON_VISUAL governance owner 表 template | `_design/` owner table + skeleton 実体化タスク向けに AC / Phase 6-11 / Phase 12 7 files のテンプレを追加する | Promote candidate |
| Phase 12 filename drift guard | `system-spec-update.md` / `docs-update-history.md` の旧名を検出し、正本名へ誘導する | Promote candidate |

## aiworkflow-requirements

| 項目 | 提案 | Routing |
| --- | --- | --- |
| workflow governance design category | `docs/30-workflows/_design/` を resource-map 分類として扱う | Promote candidate |
| current canonical deletion guard | current canonical path が削除差分に入った場合、legacy mapping または move destination なしでは FAIL とする。今回実測の削除差分は 0 件 | Promote candidate |

## Same-Wave Handling

このターンでは skill 本体のテンプレ改修は行わず、対象 workflow と aiworkflow inventory の最小同期に留めた。関連する実装契約・用語統一は `task-issue195-sync-jobs-contract-schema-consolidation-001.md` と `task-issue195-owner-coowner-terminology-normalization-001.md` に formalize 済み。current canonical deletion guard は運用知見として残すが、今回実測の deletion blocker は 0 件。
