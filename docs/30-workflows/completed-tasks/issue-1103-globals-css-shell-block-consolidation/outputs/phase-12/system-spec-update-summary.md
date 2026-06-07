# System Spec Update Summary — issue-1103

- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new / status: implemented_local_evidence_captured）
- workflow_state: `implemented_local_evidence_captured`（local implementation 完了・commit / push / PR / staging screenshot は user-gated）

---

## Step 1-A: 完了タスク記録（implemented_local_evidence_captured・2026-06-05）

本タスクは **implemented_local_evidence_captured**（仕様書作成と local 実装完了）段階。記録対象と要否は下表のとおり。

| 対象 | 状態 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | implemented_local_evidence_captured 段階の記録 | 本 wave で local 実装完了として同期 |
| task-specification-creator skill / references | **N/A（変更不要）** | 本タスクで新規 promotion 対象の知見なし（既存 template で吸収可能・skill-feedback-report.md §promotion 参照） |
| aiworkflow-requirements SKILL / changelog | 更新済み | `SKILL.md` / `SKILL-changelog.md` に issue-1103 の `implemented_local_evidence_captured / implementation / NON_VISUAL` 記録を追加 |
| aiworkflow-requirements references | 更新済み | `references/task-workflow-active.md` と `references/workflow-issue-1103-globals-css-shell-block-consolidation-artifact-inventory.md` を同期 |
| aiworkflow-requirements indexes | 更新済み | `indexes/topic-map.md` / `indexes/keywords.json` に issue-1103 artifact inventory 参照を反映 |

> 本 wave は workflow 内ファイル（phase-1〜13 spec / outputs）の作成と `apps/web/src/styles/globals.css` の local 実装を完了した。

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（仕様書作成完了・コード差分あり） |
| implementation_status | `implemented_local_evidence_captured`（local 実装完了・commit / push / PR は user-gated） |
| Gate-A（Phase 1-3 spec 完成） | passed（仕様書として完成） |
| Gate-B（Phase 4-13 spec + strict 7 完成） | passed（仕様書として完成） |
| Gate-C（local implementation evidence） | passed（commit / push / PR は user-gated） |

コード差分は `apps/web/src/styles/globals.css` の後発重複ブロック削除のみ。Phase 1-13 の実装仕様書と Phase 11 evidence / Phase 12 strict 7 を本 wave で同期。commit / push / PR は user 明示承認後にのみ実行する。

> **Drift 回避**: Gate-A / Gate-B は仕様書完成、Gate-C は local implementation evidence を示す。remote landed / PR 作成済みは主張しない。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/unassigned-task-specs/sidebar-footer-pinning-and-account-popover-ux-followup-002-globals-css-sidebar-block-consolidation.md` | source（本 workflow が consume） | **consumed（論理）**（本 workflow へ昇格・physical move は close-out wave / user-gated） |
| `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/` | parent（重複の発生元・Phase 8 Task 8-1 で整合のみ実施） | completed（物理統合は本 follow-up へ分離） |
| GitHub Issue #1103 | 起点 issue | CLOSED（reopen しない） |

> source unassigned-task の physical move（completed-tasks への co-locate）と workflow dir の移動は close-out wave（user-gated）で実施する。本 wave では現位置に温存し、論理 consumed 宣言のみで整合する。

## Step 2: 新規インターフェース / 仕様更新の有無

**新規 interface 追加なし**（CSS 内部の重複ブロックを**削除のみ**する変更）。判定 = **N/A**。

- 公開 API / IPC Bridge / Preload API / 型定義の新規・変更は**なし**。`globals.css` は `apps/web` のスタイル定義であり、公開 API / 契約境界に存在しない。
- 重複削除は computed style 不変（byte 一致 + cascade 文脈同一）であり、CSS contract（描画値）も変えない。
- したがって `aiworkflow-requirements` skill（IPC 契約 / API spec / 状態管理仕様の正本）への更新は **不要（N/A）**。

| 更新対象 | 要否 | 理由 |
| --- | --- | --- |
| aiworkflow-requirements 仕様（IPC/API） | 不要（N/A） | CSS 内部リファクタ・公開境界でない |
| design-tokens.md | 不要（N/A） | token 定義は変更せず・token 変数経由を維持（HEX 直書き増加 0 / AC-6） |
| API schema spec | 不要（N/A） | apps/api 非変更 |
| 型定義 / 公開 export | 不要（N/A） | CSS のみ・TS 公開 API 不変 |
