# issue-1080 bulk tag 部分失敗結果の member/tag 表示名改善

`[実装区分: 実装仕様書]` — apps/web のみのコード変更を伴う。apps/api 非接触。

> **判定根拠（CONST_004）**: Issue #1080 の目的「部分失敗結果を memberId/tagId だけでなく
> member 表示名 / tag label で確認できる」は、`BulkActionBar.tsx` の result summary 表示ロジック
> と props 契約を変更しなければ達成できない。よってデフォルトの実装仕様書として作成する。

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task_id | `issue-1080-bulk-tag-result-member-labels` |
| github_issue | #1080（= `task-issue-1036-followup-004-bulk-tag-result-member-labels`） |
| github_issue_state | **OPEN**（ユーザー認識「クローズド」と乖離。状態は変更しない / user-gated） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 消費 unassigned spec | `docs/30-workflows/completed-tasks/issue-1080-bulk-tag-result-member-labels/task-issue-1036-followup-004-bulk-tag-result-member-labels.md` |
| workflow_state | `implemented_local_evidence_captured` |
| 実装区分 | 実装完了（VISUAL_ON_EXECUTION / staging visual は user-gated） |
| implementation_mode | `new` |
| 優先度 / 規模 | 低 / 小規模 |
| スコープ範囲 | apps/web の `BulkActionBar.tsx` / `MembersClientShell.tsx` / 既存 component test |
| apps/api 差分 | なし |

## 調査サマリー（issue が古い可能性の検証結果）

| 確認 | 結果 |
| --- | --- |
| 別タスクで解決済みか | **未解決**。`BulkActionBar.tsx:268` は `{r.memberId}` 生表示、`:277` は `{r.tagId}` 生表示のまま |
| #1078（large catalog UX）との重複 | なし（picker のみ・result summary 非接触） |
| #1079（audit batch filter）との重複 | なし（audit viewer / API 側） |
| 親から表示名注入可否 | 現状 `selectedIds` のみ注入。`BulkRepublishDrawer` が既に `candidates(displayName)` を注入する前例あり → 同パターンで `membersById` 注入が可能 |
| 表示名解決の素材 | member: `AdminMemberListItem.fullName`、tag: `AdminTagRef.label`（`fetchTagMaster().available`） |

> issue 本体は「将来 UX 改善」想定で十分新しく、現行コードと乖離なし。`memberId` / `tagId` 生表示の改善という
> 根本課題は現在も有効。よって本 issue の実行は必要であり、本ディレクトリに実装仕様書を作成する。

## 受け入れ基準（issue #1080 と同一）

| ID | 受け入れ基準 | 設計対応 |
| --- | --- | --- |
| AC-1 | `skipped_deleted` の表示に member 表示名または email が出る | `membersById[memberId].fullName` を表示 |
| AC-2 | `tag_not_found` の表示に tag label 解決済みなら label、未解決なら tagId | `tagLabelById[tagId]` 解決・未解決時は `{tagId}（未登録）` |
| AC-3 | API response shape は `{ memberId, tagId, status }` を維持 | UI 側のみ変更・apps/api 非接触 |
| AC-4 | 表示名が手元に無い場合も memberId 表示で壊れない | `?? r.memberId` fallback |
| AC-5 | component test が partial failure の label 表示と fallback を検証 | `BulkActionBar.spec.tsx` 拡張 |

## Phase 一覧

| Phase | ファイル | 目的 | status |
| --- | --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | 要件定義・inventory・命名規則・タスク分類 | completed |
| 2 | `outputs/phase-2/phase-2.md` | 設計（props 契約・state ownership・表示解決ロジック） | completed |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー（Phase 4 進行判定） | completed |
| 4 | `outputs/phase-4/phase-4.md` | テスト作成（TDD Red / ケース定義） | completed |
| 5 | `outputs/phase-5/phase-5.md` | 実装（変更ファイル・差分方針）= task-A 本体 | completed |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（fail path / 後方互換 guard） | completed |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更行の line/branch） | completed |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング（重複・navigation drift） | completed |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（typecheck/lint/tokens/parity） | completed |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC 判定・blocker） | completed |
| 11 | `outputs/phase-11/phase-11.md` | 手動テスト・視覚検証（VISUAL） | completed |
| 12 | `outputs/phase-12/phase-12.md` | ドキュメント更新・spec sync・未タスク・feedback | completed |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（user 承認後のみ） | blocked |

## 単一サイクル完了性（CONST_007）

本 workflow は単一 task（task-A）で構成し、同一サイクルで apps/web の実装・focused component test・Phase 12 正本同期まで完了した。将来タスクへの先送りはなし。commit / PR / Issue mutation / staging authenticated visual baseline のみ user-gated として残す。
