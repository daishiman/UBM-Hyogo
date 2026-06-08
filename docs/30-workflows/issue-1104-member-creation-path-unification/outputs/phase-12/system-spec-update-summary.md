# System Spec Update Summary — issue-1104

- 区分: 実装仕様書（NON_VISUAL / implementation_mode: new / implemented_local_evidence_captured）
- workflow_state: `implemented_local_evidence_captured`（ローカル実装・証跡取得済み / commit・PR は user-gated）

---

## Step 1-A: 完了タスク記録

本 workflow は **implemented_local_evidence_captured**（ローカル実装・証跡取得済み）段階であり、aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory と task-specification-creator の Phase 1 gate を同一 wave で反映した。

| 対象 | 状態 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | 未記録 | commit/PR 未実施のため workflow LOGS の完了行は未追加。aiworkflow ledgers は同 wave 反映済み |
| skill `task-specification-creator/SKILL-changelog.md` | **該当なし（後述 §Step 2 / skill-feedback 参照）** | issue 棚卸し再検証 gateを task-specification-creator references へ反映済み |
| `aiworkflow-requirements/indexes/*` / `references/*` | **反映済み** | 内部 repository helper のため IPC/API/state SSOT 本文は不要。ただし workflow ledger と導線として quick-reference・resource-map・task-workflow-active・artifact inventory を手動同期 |

> implemented_local_evidence_captured 段階のため「完了タスク記録」は spec backbone + Phase 11/12 成果物の作成にとどまる。実装が landed した時点（ユーザー承認後の実装 wave）で LOGS.md 等への確定記録を行う。

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（ローカル実装・証跡取得済み） |
| implementation_status | `implemented_local_evidence_captured` |
| Gate-A（Phase 1-3 設計） | passed（4 条件評価 PASS・`phase-3.md`） |
| Gate-B（実装） | passed（`createMemberWithStatus` 新設 + 経路差し替え + focused D1 tests PASS） |
| Gate-C（commit / PR / staging） | pending（external_ops すべて user-gated・passed_at=null） |

コード差分は `apps/api` に発生済み。`createMemberWithStatus` の新設、ingest（F-2）/ auto-link（F-3）差し替え、回帰テスト（F-5）は本 wave で完了。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | 関係 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/admin-member-detail-status-404-fix-followup-001-member-creation-path-unification.md` | source（本 workflow が consume） | **consumed（論理）**（本 workflow へ昇格・physical move は close-out wave・user-gated） |
| `docs/30-workflows/.../admin-member-detail-status-404-fix`（親） | parent（予防 + backfill で止血済み） | landed 済（本タスクはその予防を構造化する差分） |
| followup-002（`member_status.member_id` → `member_identities` FK 制約） | sibling（DB 層整合性・別関心） | **本タスク scope-out**（既存分離・重複対応しない・AC-7） |
| GitHub Issue #1104 | 起点 issue | CLOSED（2026-06-05T01:50:06Z・reopen しない） |

> source unassigned-task の physical move（completed-tasks への co-locate）と workflow dir の completed-tasks 移動は close-out wave（user-gated）で実施する。本 spec 段階では現位置に温存し、論理 consumed 宣言のみで整合する。

## Step 2: 新規インターフェース / 仕様更新の有無（N/A 判定）

**aiworkflow-requirements の公開仕様更新は N/A。ledger / index 同期は実施済み**。

- `createMemberWithStatus` は `apps/api` の **内部 repository helper** であり、IPC Bridge / Preload API / 公開 endpoint surface のいずれの境界にも存在しない。
- 既存 endpoint surface・レスポンス shape は不変（新規 endpoint なし・D1 schema 変更なし・FK 導入なし）。公開境界に追加・変更が一切ないため、aiworkflow-requirements（IPC 契約 / API spec / 状態管理仕様の正本）本文への更新は不要。
- 一方で workflow tracking と検索導線は必要なため、quick-reference / resource-map / task-workflow-active / artifact inventory は同 wave で更新済み。

| 更新対象 | 要否 | 理由 |
| --- | --- | --- |
| aiworkflow-requirements 仕様（IPC/API/state 本文） | 不要（N/A） | 内部 repository helper・公開境界でない・endpoint surface 不変 |
| aiworkflow-requirements ledgers / indexes / artifact inventory | 必要・反映済み | workflow tracking / 検索導線 / evidence inventory として同 wave 同期 |
| design-tokens.md | 不要（N/A） | 色 / token 非関与（NON_VISUAL・apps/web 無変更） |
| API schema spec（`01-api-schema.md` 等） | 不要（N/A） | apps/api の endpoint / レスポンス shape 不変。生成責務集約は内部ロジックに閉じる |
| D1 schema / migrations | 不要（N/A） | 既存 `ensureMemberStatusRow`（`INSERT OR IGNORE`）を再利用。新規 migration なし（AC-7） |
