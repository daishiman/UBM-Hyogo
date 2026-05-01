# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 注意 | 本仕様書作成タスクでは実装しない |

## 目的

実装者が迷わず repository を追加または既存実装を確認できる手順を定義する。

## 実行タスク

1. 既存 `apps/api/src/repository/adminNotes.ts` がある場合は重複新設しない。
2. 未実装の場合のみ repository を作成する。
3. `_shared/db.ts`、`_shared/brand.ts`、D1 `prepare/bind` 規約に従う。
4. public/member view model 型を import しない。

## 参照資料

- `apps/api/src/repository/adminNotes.ts`
- `apps/api/src/repository/identities.ts`
- `apps/api/src/repository/status.ts`
- `apps/api/src/repository/_shared/brand.ts`

## 実行手順

1. `AdminMemberNoteRow` を DB row 型として定義する。
2. `RawNoteRow` から branded row への mapper を作る。
3. `SELECT_COLS` を定義し、列 alias を TS 側に合わせる。
4. `listByMemberId(c, memberId)` を実装する。
5. `findById` や CRUD は Issue #106 の read repository 必須範囲から外し、04c consumer handoff または別 AC として扱う。
6. ファイル冒頭に不変条件 #11 / #12 を明記する。

## 統合テスト連携

実装後に Phase 4 の repository test を追加し、Phase 9 でまとめて実行する。

## 多角的チェック観点（AIが判断）

- `admin_member_notes` 専用 repository が `member_responses` を触らない。
- SQL は `member_id` bind を必須とする。
- `created_at DESC` と Issue 元指示の `occurred_at DESC` 差分は現行 DDL に合わせて解消する。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P5-1 | repository 実装 | read API が存在 |
| P5-2 | mapper 実装 | snake_case から camelCase に変換 |
| P5-3 | invariant comment | #11/#12 が grep 可能 |

## 成果物

- `apps/api/src/repository/adminNotes.ts`
- 必要な repository test
- 実装メモ

## 完了条件

- [ ] `listByMemberId` が対象 member の notes を返す。
- [ ] 戻り値は 04c route で audit DTO に変換できる。
- [ ] public/member view model 型を import していない。

## タスク100%実行確認【必須】

- [ ] 実装対象が既存ファイルと重複していない。

## 次Phase

Phase 6: 異常系検証。
