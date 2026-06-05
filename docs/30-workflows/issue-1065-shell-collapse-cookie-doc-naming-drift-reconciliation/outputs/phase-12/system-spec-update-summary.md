# System Spec Update Summary — issue-1065

- 区分: 実装仕様書（NON_VISUAL / implemented_local_evidence_captured）
- workflow_state: `implemented_local_evidence_captured`（実装 landed local・uncommitted / commit・PR は user-gated）

---

## Step 1-A: 完了タスク記録（実装/同期 wave・2026-06-03 完了）

実装が working tree に landed したため、ledger 系への確定記録を本 wave で実施した。

| 対象 | 状態 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | **追記済** | `2026-06-03 / issue-1065-... / implemented_local_evidence_captured` 行を prepend |
| skill `task-specification-creator/SKILL-changelog.md` | **追記済** | `v2026.06.03-issue1065-shell-collapse-cookie-premise-verification-and-label-promotion` 行 + `SKILL.md` 先頭 + `references/resource-map.md` 変更履歴 |
| skill references promotion | **追記済** | `phase-template-phase1.md` issue 前提検証 gate / `phase12-skill-feedback-promotion.md` Applied Examples / `patterns-lessons-and-pitfalls.md` L-I1065-001/002 |
| `aiworkflow-requirements/indexes/topic-map.md` / `keywords.json` | **N/A（再生成不要）** | `task-specification-creator` は `indexes/` を持たず `indexes:rebuild` 非対象。aiworkflow-requirements references は本タスクで未編集のため drift なし（冪等確認のみ） |

> workflow 内ファイル（phase-1〜12 / outputs）に加え、skill 反映と LOGS 追記を本 wave で完了。

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（実装 landed local・uncommitted） |
| implementation_status | `implemented_local_evidence_captured` |
| Gate-A（Phase 1-3） | passed |
| Gate-B（Phase 4-13 specs） | passed |
| Gate-C（commit / PR 実行） | pending（user-gated・commit/PR 未実施のため passed_at=null 維持） |

コード差分は landed（dead alias 3 行削除 + issue-1024 design doc primary 名整合）。ローカル evidence（typecheck green / focused Vitest 4 pass / dead alias 参照 0）取得済み。commit / push / PR は user 明示承認後に実行する。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation.md` | source（本 workflow が consume） | **consumed（論理）**（本 workflow へ昇格・physical move は close-out wave） |
| `docs/30-workflows/completed-tasks/issue-1024-sidebar-collapse-cookie-persistence/` | parent（命名 drift の発生元・doc 整合対象） | completed（doc は本タスクで primary 名へ整合済み） |
| GitHub Issue #1065 | 起点 issue | CLOSED（2026-06-02T21:40:20Z・reopen しない） |

> source unassigned-task の physical move（completed-tasks への co-locate）と workflow dir の completed-tasks 移動は close-out wave（user-gated）で実施する。本 wave では現位置に温存し、論理 consumed 宣言のみで整合する。

## Step 2: 新規インターフェース / 仕様更新の有無

**新規 interface 追加なし**（export を**削除のみ**する変更）。

- 公開 API / IPC Bridge / Preload API の新規・変更は**なし**。`shell-collapse-cookie.ts` は `apps/web` 内部 helper であり、IPC / 公開 API 境界に存在しない。
- したがって `aiworkflow-requirements` skill（IPC 契約 / API spec / 状態管理仕様の正本）への更新は **不要（N/A）**。
  - 理由: cookie I/O は `apps/web` 内部 module 間の関数呼び出しであり、Bridge / Preload / 公開 endpoint surface いずれにも該当しない。命名整理（dead alias 削除）は契約変更を伴わない。

| 更新対象 | 要否 | 理由 |
| --- | --- | --- |
| aiworkflow-requirements 仕様（IPC/API） | 不要（N/A） | 内部 helper・公開境界でない |
| design-tokens.md | 不要（N/A） | 色 / token 非関与 |
| API schema spec | 不要（N/A） | apps/api 非変更 |
