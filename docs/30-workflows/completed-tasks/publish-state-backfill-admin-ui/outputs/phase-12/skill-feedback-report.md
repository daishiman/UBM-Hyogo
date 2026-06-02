# Skill Feedback Report — publish-state-backfill-admin-ui

## 対象 skill

`task-specification-creator`（Phase 1-13 仕様書生成）。

## 学び（本サイクルで得た知見）

### L-1: P50 で既存実装 merged を検出 → existing-hardening モードへ分岐

- Phase 1 の P50（既存実装状態確定）で `git log` / `ls` を実行し、Task A が PR #1064 / commit `745c95115` で dev へ landed 済みと確定。
- greenfield 新規実装ではなく **landed 実装の正本記述（existing-hardening）** へ taskType を切替。仕様書は「後続実装者が再実装すると同一成果物へ収束する」no-op 記述として作成する。
- 教訓: 仕様書作成前に必ず P50 で実コードを `ls`/`git log` 検証し、implemented を見落として重複実装仕様を書かないこと。

### L-2: 元タスクファイルの corrupted endpoint path を実コードへ補正

- 元タスクファイル A の proxy path 定数が `"/api/admin/sync/responses?fullSync=true-publish-state"`（文字列破損）だった。
- 実コード `backfill.ts` の `BACKFILL_PUBLISH_STATE_PATH = "/api/admin/sync/backfill-publish-state"` を正本とし、phase-1.md「元タスクファイルとの乖離補正」表に明記して補正。
- 教訓: 元タスクファイルと実コードが乖離する場合、**実コードを正本**とし、乖離を表で可視化してから仕様書へ持ち込む。

### L-3: docs spec を landed 実装の正本記述として作成

- workflow_state=implemented_local_evidence_captured / verdict=PASS_BOUNDARY_SYNCED_RUNTIME_PENDING のタスクでは、Phase 12 ドキュメントは「動いている UI を契約として再現可能にし、runtime user gate を隠さない」ことが目的。
- 中学生レベル概念説明（Part 1）と技術契約（Part 2）の両方を実コードに一致させ、3 層整合テスト（endpoint D1 / web schema / panel）を連携点として記録する。

### L-4: strict-7 §4 evidence は実在ファイルのみ present 化

- `phase12-task-spec-compliance-check.md` の §4 Phase 11 evidence inventory は、物理 file 存在検査を経る。
- staging screenshot 未取得（user-gated）のため screenshot 行は `n/a`、実在する `outputs/phase-11/*.md` のみ `present` とした。存在しないパスを present にすると CI gate で FAIL する。

## skill への反映結果

- `task-specification-creator/references/phase-template-phase1.md` に「landed 実装検出時の existing-hardening 分岐」を同一 wave で反映済み。
- `task-specification-creator/SKILL-changelog.md` / `SKILL.md` に `v2026.06.01-existing-hardening-p50-drift-table` として履歴を追加済み。
- 未反映の skill feedback は 0 件。
