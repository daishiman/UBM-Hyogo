# Phase 7 / main.md — 検証項目網羅性 サマリ

## 概要

AC-1〜AC-5 が Phase 1〜6 のどこで定義/検証されたかを `coverage-matrix.md` で完全可視化。3 軸（mapping / sync direction / backup）はいずれも 2 Phase 以上で検証済み。Phase 6 異常系（A1〜A7）も AC へ取り込み完了。

## 完了条件チェック

- [x] AC-1〜AC-5 すべてに証跡パスが付与されている
- [x] 3 軸（mapping / direction / backup）すべて 2 つ以上の Phase で検証
- [x] 未カバー項目に追跡先 Phase（11/12/unassigned/05a/04）が割り当て済み
- [x] coverage 対象が本タスクの変更/作成ファイルに限定されている

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | AC が「どこで PASS と判定したか」即特定可能 |
| 実現性 | OK | NON_VISUAL で CLI/SQL ベースで検証可能 |
| 整合性 | OK | 不変条件は qa-report.md に分離（重複定義回避） |
| 運用性 | OK | 1 表で読み切れる構成 |

## 残課題（Phase 8 入力）

- 表記揺れ（MINOR）: phase-04 / phase-05 で同一 cron 値・batch size を別表記している箇所が残る → Phase 8 で統一
- Secrets キー名: 仕様書では既に `GOOGLE_SERVICE_ACCOUNT_JSON` で統一済みだが Phase 8 で再確認

## blocker / handoff

- blocker: なし
- 引き継ぎ: MINOR / wording 揺れリストを Phase 8 の DRY 化入力に
- ブロック条件解除: 未カバー AC で PASS なしの残項目なし

## 成果物

- `outputs/phase-07/coverage-matrix.md`
