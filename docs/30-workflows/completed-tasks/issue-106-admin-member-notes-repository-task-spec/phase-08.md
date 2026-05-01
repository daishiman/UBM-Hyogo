# Phase 8: DRY / 命名整理

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 対象 | naming / duplication |

## 目的

repository 名、row 型、DTO 型、helper の重複と命名揺れを整理する。

## 実行タスク

1. `adminMemberNotes.ts` と `adminNotes.ts` の命名差分を整理する。
2. DB row 型と audit DTO 型を混同しない。
3. SQL 列 alias の重複を `SELECT_COLS` に集約する。
4. mapper を 1 箇所に集約する。

## 参照資料

- `apps/api/src/repository/adminNotes.ts`
- `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/phase-08.md`

## 実行手順

| 対象 | 採用 | 理由 |
| --- | --- | --- |
| repository file | `adminNotes.ts` | 現行 02c 正本と一致 |
| DB row type | `AdminMemberNoteRow` | row 型であることを明示 |
| read function | `listByMemberId` | 既存 repository 命名と一致 |
| builder DTO | route/service adapter | DB row と view audit を分離 |

## 統合テスト連携

rename が発生する場合は import path の回帰を typecheck で検出する。

## 多角的チェック観点（AIが判断）

- Issue 元ファイル名に引っ張られて duplicate repository を作らない。
- `note_type` / `request_status` を view model の名前に混ぜない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P8-1 | naming table | 採用名と却下名が明記済み |
| P8-2 | duplication check | duplicate file がない |

## 成果物

- naming decision
- duplication review

## 完了条件

- [ ] repository の canonical 名が 1 つに固定されている。
- [ ] DTO と row 型の責務が分離されている。

## タスク100%実行確認【必須】

- [ ] 命名差分を Phase 12 で docs に残す準備がある。

## 次Phase

Phase 9: 品質保証。

