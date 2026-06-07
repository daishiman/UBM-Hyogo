# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `implemented_local_evidence_captured` |
| 対象 | Phase 12 成果物（implementation-guide / system-spec-update-summary / changelog / unassigned-task-detection / skill-feedback / compliance-check） |

> automation-30 改善で実コード・tests・aiworkflow 正本同期まで同一サイクルで反映した。
> runtime visual screenshot、commit、push、PR は user-gated として残す。

---

## 概要

本タスクは `/admin/audit` に bulk tag の batchId 検索（API filter + json_extract）・row 表示・copy 導線を
追加する**実装 workflow**である。Phase 12 では、実コード反映後の正本同期・証跡境界・残 user gate を記録する。

---

## 成果物索引

| 成果物 | パス | 内容 |
| --- | --- | --- |
| 実装ガイド | [`outputs/phase-12/implementation-guide.md`](outputs/phase-12/implementation-guide.md) | Part 1（中学生レベル）/ Part 2（技術者レベル・型 / SQL / API 例 / エラー / エッジケース）+ 視覚証跡 |
| system spec 反映サマリ | [`outputs/phase-12/system-spec-update-summary.md`](outputs/phase-12/system-spec-update-summary.md) | Step 1-A〜1-C / Step 2（新規インターフェースの正本反映判定） |
| ドキュメント changelog | [`outputs/phase-12/documentation-changelog.md`](outputs/phase-12/documentation-changelog.md) | workflow-local 同期 / global skill sync の 2 ブロック |
| 未タスク検出 | [`outputs/phase-12/unassigned-task-detection.md`](outputs/phase-12/unassigned-task-detection.md) | current 0 件 / baseline（index 最適化・単一 write batchId）+ 関連タスク差分確認 |
| skill フィードバック | [`outputs/phase-12/skill-feedback-report.md`](outputs/phase-12/skill-feedback-report.md) | テンプレ / ワークフロー / ドキュメント改善候補 |
| compliance check（root evidence） | [`outputs/phase-12/phase12-task-spec-compliance-check.md`](outputs/phase-12/phase12-task-spec-compliance-check.md) | canonical heading SSOT 準拠（実装後の 4 条件 + automation-30 compact evidence） |
| Phase 11 手動テスト | [`outputs/phase-11/manual-test-result.md`](outputs/phase-11/manual-test-result.md) | local evidence + runtime visual pending_user_gate |

---

## Phase 12 完了条件チェックリスト

| 条件 | 扱い | 状態 |
| --- | --- | --- |
| implementation-guide.md が 2 パート構成（中学生 / 技術者）で各 Part 本文 3 行以上 | 計画として両 Part を記述（heading-only ではない） | done |
| 視覚証跡セクションが canonical 名 3 点を列挙し Phase 11 を参照 | `audit-batchid-filter-empty/applied.png` / `audit-row-batchid-copy.png` を pending で列挙 | done |
| system-spec-update-summary が Step 1-A/1-B/1-C/Step 2 を個別記録 | 新規インターフェースは同一サイクルで aiworkflow に反映済み | done |
| documentation-changelog が workflow-local / global skill sync を別ブロックで記録 | global skill sync は全 Step「該当なし」 | done |
| unassigned-task-detection を 0 件でも出力（current / baseline 分離） | current 0 / baseline 2（B-1 index 最適化を AC-5 由来候補として記録） | done |
| skill-feedback-report を改善点なしでも出力 | T-1（json_extract の binding 落とし穴）等を記録 | done |
| compliance-check（root evidence）が存在 | 既存ファイルを非変更で維持 | done |
| local implementation / tests /正本同期を記録 | API/Web 実装 + focused tests + aiworkflow sync を記録 | done |
| runtime visual screenshot / commit / PR は user-gated | authenticated visual と GitHub 操作のみ pending | pending（user-gated） |

---

## runtime/user-gated 境界

- 実装（Task A/B/C のコード適用）・focused tests・正本 system spec（aiworkflow-requirements）同期は完了。
- Phase 11 screenshot・commit / push / PR 作成は **user-gated**。
- Issue #1079 は CLOSED 維持（reopen しない）。
