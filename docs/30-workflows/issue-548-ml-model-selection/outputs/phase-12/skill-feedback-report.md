# Skill Feedback Report

## テンプレ改善

複数候補比較タスクでは `candidates` / `criteria` / `tieBreaker` / `datasetBoundary` を Phase 1 の固定セクションにする。Synthetic fixture は harness smoke、本番 winner は production-equivalent dataset replay と分けて記録する。

Promotion: `task-specification-creator/references/phase12-skill-feedback-promotion.md` に Synthetic Harness vs Production Winner Rule として反映済み。

## ワークフロー改善

`spec_created / implementation / NON_VISUAL` で Phase 11 evidence path を予約する場合、`PENDING_IMPLEMENTATION_EVIDENCE` を明示し、`PASS` や exit 0 を未実行で書かない。Phase status は `completed` / `pending` / `blocked` に正規化する。

Promotion: 今回は実装済み synthetic evidence が存在したため、reserved evidence rule ではなく `implemented_synthetic` reclassification として root/outputs artifacts、Phase 11、Phase 12 compliance、SSOT indexes に反映済み。

## ドキュメント改善

FU-03-A -> FU-03-B -> FU-03-C -> FU-03-D の依存図を親タスクの successor trace に残す。存在しない `unassigned-task/issue-515-ml-model-selection.md` を正本として参照し続けない。
