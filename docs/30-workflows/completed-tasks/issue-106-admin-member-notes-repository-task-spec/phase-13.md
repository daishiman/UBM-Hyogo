# Phase 13: 承認ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 状態 | blocked_pending_user_approval |

## 目的

commit、push、PR、Issue 状態変更をユーザー承認なしで実行しないための最終ゲートを定義する。承認前は `blocked_pending_user_approval` として扱い、root `workflow_state=implemented_pending_user_approval` のまま停止する。

## 実行タスク

1. 変更ファイル一覧を確認する。
2. 実装・テスト・ドキュメント evidence をまとめる。
3. commit / push / PR 作成は明示承認まで停止する。
4. Issue #106 は closed のまま維持する。

## 参照資料

- `git status --short`
- `phase-10.md`
- `phase-11.md`
- `phase-12.md`

## 実行手順

1. `git status --short` で意図しないファイル変更がないか確認する。
2. 変更サマリーを作成する。
3. ユーザーが明示的に依頼した場合のみ commit を作成する。
4. PR 作成が必要な場合も、ユーザー承認後に draft PR として作成する。
5. Issue #106 を close / reopen / comment しない。

## 統合テスト連携

Phase 13 では新規テストを追加しない。Phase 9 / 11 の evidence を引用する。

## 多角的チェック観点（AIが判断）

- ユーザー指示なしに push しない。
- closed Issue の状態を変更しない。
- Phase 1-12 の実装検証完了と Phase 13 の公開操作を混同しない。

## サブタスク管理

| ID | 内容 | 完了条件 |
| --- | --- | --- |
| P13-1 | status check | 変更ファイル一覧が確認済み |
| P13-2 | summary | 変更サマリーが作成済み |
| P13-3 | approval gate | commit / PR が停止状態 |

## 成果物

- local-check-result.md
- change-summary.md
- pr-info.md（PR 作成後のみ）
- pr-creation-result.md（PR 作成後のみ）
- approval-note.md（補助）
- pr-blocked.md（補助）

## 完了条件

- [ ] ユーザー承認なしの commit / push / PR が発生していない。
- [ ] Issue #106 の closed 状態を維持している。

## タスク100%実行確認【必須】

- [ ] 禁止アクションを実行していない。

## 次Phase

なし。ユーザー承認がある場合のみ commit / PR workflow へ進む。
