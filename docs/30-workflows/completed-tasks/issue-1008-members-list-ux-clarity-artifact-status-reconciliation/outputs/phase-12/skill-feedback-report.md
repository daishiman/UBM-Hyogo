# Phase 12: スキルフィードバックレポート

改善点が無くても本レポートは必須出力とする。テンプレート改善 / ワークフロー改善 /
ドキュメント改善の 3 観点で所見を記録する。

## 1. テンプレート改善

| 観点 | 所見 |
|------|------|
| Phase 4-9 の docs-only 読み替えコスト | reconciliation のような docs-only spec に Phase 4（test-plan）/ Phase 6（test-additions）/ Phase 7（coverage）/ Phase 8（refactor）/ Phase 9（QA）を適用する際、「コード実装前提」のテンプレ文言を「JSON status assert の read-only 検証計画」へ毎回読み替える必要がある。読み替えの定型（test = jq/diff/rg assert、refactor = N/A、coverage = 対象 status フィールド網羅）をテンプレ側に docs-only バリアントとして用意すると読み替えコストが下がる。 |
| 改善要否 | no-op（既存 `phase-12-spec.md` の strict 7 / Phase 12 task rules と `phase12-skill-feedback-promotion.md` の routing rules で吸収。evidence: `system-spec-update-summary.md` Step 1-D）|

## 2. ワークフロー改善

| 観点 | 所見 |
|------|------|
| status drift の早期検知 | 実装マージ時（feat #1009 / commit `37fe488e8`）に `artifacts.json` が `spec_created` のまま登録され、以降のコミットで補正されず drift が残った。close-out 自動化フックまたは CI gate で「`apps/` 実装ファイルが commit に含まれるのに対応 workflow の `artifacts.json` が `spec_created`」のパターンを検出できると、本 reconciliation 自体を未然に防げる。 |
| sub-task の phase status 表記揺れ | sub-task A/B/C で phase status 値が `spec_created` / `completed` / `pending` で混在していた。complete-phase 系ツールが phase status を `completed`/`pending` の 2 値へ正規化する運用にできると揺れが減る。 |
| 改善要否 | promote（status drift の早期検知を `task-specification-creator/references/patterns-lessons-and-pitfalls.md` の `SP-STATUS-RECON-001` へ昇格。sub-task phase status 表記揺れも同 gate に含める）|

## 3. ドキュメント改善

| 観点 | 所見 |
|------|------|
| `implemented_local_runtime_pending` 境界の正本参照 | 整合先 state（`implemented_local_runtime_pending` + Gate-A/B passed + Gate-C pending）は `issue-976` 等の既存完了タスクを正本例として参照したが、この境界定義そのものを `gate-metadata.md` 等に「Gate-C が staging visual baseline で user-gated の場合の標準形」として明文化すると、後続の reconciliation で都度既存例を探す手間が減る。 |
| 改善要否 | no-op（`implemented_local_runtime_pending` は既存 workflow-state vocabulary と完了タスク実例で運用済み。本 wave では target artifacts と aiworkflow inventory を一致させることで十分。evidence: `phase12-task-spec-compliance-check.md`）|

## 総合所見

本タスクは docs-only reconciliation spec として既存テンプレートで問題なく仕様化できた。
致命的なスキル不備は検出されない。§2 の「実装マージ時の status drift 早期検知」は
再発防止価値が高いため、本 wave で `task-specification-creator` の reusable pattern へ
昇格した。残る所見は既存 rule で吸収できるため、no-op reason と evidence path を明記して
閉じる。
