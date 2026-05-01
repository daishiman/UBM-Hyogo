# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 対象 | repository read path |

## 目的

実装が失敗しやすい入力、境界、情報漏洩パターンを事前に列挙する。

## 実行タスク

1. 存在しない member の扱いを確認する。
2. 別 member の note 混入を確認する。
3. DB 列名 drift を確認する。
4. public/member response leak を確認する。

## 参照資料

- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/src/repository/__tests__/adminNotes.test.ts`
- `apps/api/src/view-models/public/`

## 実行手順

| ID | ケース | 期待 |
| --- | --- | --- |
| F-1 | unknown memberId | `[]` |
| F-2 | other member note exists | 混入しない |
| F-3 | request row exists | general と同じく row として読める |
| F-4 | public profile JSON | `adminNotes` / `notes` が出ない |
| F-5 | repository から `member_responses` へ UPDATE | 禁止 |

## 統合テスト連携

F-1 から F-3 は repository test、F-4 は view-model または route contract test、F-5 は grep / static assertion で検証する。

## 多角的チェック観点（AIが判断）

- `request_status` は 04b-followup の列であり、read repository は NULL を許容する。
- request 系 row を返すか UI 側で filter するかは 04c の表示要件で決める。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P6-1 | failure matrix | F-1〜F-5 が記録済み |
| P6-2 | static checks | 禁止 SQL / 禁止 import が確認可能 |

## 成果物

- failure-cases.md 相当
- static check plan

## 完了条件

- [ ] 異常系が Phase 7 の AC matrix に接続されている。

## タスク100%実行確認【必須】

- [ ] 情報漏洩系の異常ケースを省略していない。

## 次Phase

Phase 7: AC トレース。

