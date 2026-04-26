# Phase 8 / main.md — 設定 DRY 化 サマリ

## 概要

D1 schema / Sheets column / env キー / sync 設定値の表記を Before/After 表で固定。env と sync constants を 4 列正本表として `refactor-record.md` に集約。コード変更なし。

## 完了条件チェック

- [x] refactor-record.md に 対象 / Before / After / 理由 完備
- [x] env / Secrets / sync constants の正本が 1 箇所に固定
- [x] 削除対象を列挙
- [x] downstream handoff 明記

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | 下流 04/05a/05b の手戻り削減 |
| 実現性 | OK | 仕様書のみで完結 |
| 整合性 | OK | 不変条件 1〜7 と矛盾しない |
| 運用性 | OK | Secrets は placeholder のみ |

## blocker / handoff

- blocker: なし
- 引き継ぎ: refactor-record.md を Phase 9 の link 切れ・実値混入チェックの入力に
- ブロック条件解除: Before/After 表に空欄なし

## 成果物

- `outputs/phase-08/refactor-record.md`
