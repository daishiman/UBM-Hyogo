# Phase 3: 設計レビュー（ゲート）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

Phase 4（テスト作成）へ進めるかを判定する。

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R1 | endpoint shape が一意か | PASS | task-A に request/response/error を全列挙 |
| R2 | テーブル名の正本性 | PASS | `member_tags`（`tag_assignments` 表記全廃） |
| R3 | 冪等性の担保方法 | PASS | server idempotency middleware は未配線。POST は PK `INSERT OR IGNORE`、DELETE は no-op 204 で担保 |
| R4 | audit の二重記録防止 | PASS | `changes > 0` の state 変化時のみ記録 |
| R5 | 409 条件の実カラム整合 | PASS | `member_status.is_deleted = 1` で 409（detail view と同カラム） |
| R6 | tag master 読取経路 | PASS | `GET .../tags` の `available` で新設（master write は scope 外） |
| R7 | invariant #13 の扱い | PASS | 「queue / admin manual」2 経路へ再定義（根本論点を解決） |
| R8 | 型 gate（test-d）整合 | PASS | `unassign*` を allowlist に明示追加 |
| R9 | web invariant 準拠 | PASS | `useAdminMutation` 経由（#10）/ 新規 `<input>` なし（#9）/ token のみ（#5） |
| R10 | 1 PR サイクル完結（CONST_007） | PASS | task-A/B/C は同一 PR。先送りなし |
| R11 | regression 範囲 | PASS | detail tags shape `{code,label,category,source}` 不変を AC-6/A-T11 で保証 |

## 命名規則 vs 実装名の照合（FB-01 / FB-04）

| 設計名 | 既存衝突 | 判定 |
| --- | --- | --- |
| `assignTagToMemberByAdmin` | `assignTagsToMember`（複数形・queue 専用）と別物 | OK（単数 + `ByAdmin` で区別） |
| `unassignTagFromMemberByAdmin` | なし | OK |
| audit `admin.member.tag_assigned` | `admin.tag.queue_resolved` と名前空間分離 | OK |
| `:memberId` | 既存 members router と一致 | OK |

## 残リスクと対策

| リスク | 対策 |
| --- | --- |
| 削除済み member への mutation | `member_status.is_deleted = 1` で 409。Phase 4 で `is_deleted=1` seed テスト（A-T6/A-T9） |
| `available` master が大量 | MVP は `tag_definitions WHERE active=1` 全件。pagination は scope 外（将来 master 画面で対応） |
| pill click 連打で二重 mutation | pending 中 pill 単位 disabled（B-T6 で担保） |

## 判定

**APPROVED — Phase 4 へ進行可。**

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 本ファイル（レビュー判定 + 残リスク）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- R1〜R11 全 PASS（達成済み）
- 命名衝突なし（達成済み）
