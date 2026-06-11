# Phase 4: テスト作成（検証手順設計）

## 4.1 docs-only における Phase 4 の読み替え宣言

本タスクは **NON_VISUAL / docs-only**（CONST_004 例外）であり、コードシンボルを一切追加しない。
したがって Phase 4 の「テスト作成」を **「検証手順の設計」** と読み替える:

| 通常タスク | 本タスク（docs-only）での読み替え |
|------------|-----------------------------------|
| ユニットテスト / 結合テストの作成 | `gh` / `grep` による検証コマンド群の設計 |
| アサーション（expect） | 「期待結果つき検証ケース」テーブル |
| テストランナー実行 | 実装プロンプト（03.実装.md）で #524 編集**後**に手動実行 |

> 本フェーズではテストコードを書かない。検証コマンドは Phase 5（編集）完了後に実行する設計とし、ここでは「何をどの期待値で確認するか」を確定する。

## 4.2 検証ケース（VC-01〜VC-06）

| ID | コマンド | 期待値 | 確認する AC | 意味 |
|----|----------|--------|-------------|------|
| VC-01 | `gh issue view 524 --json body -q .body \| grep -c "Issue #407"` | `0` | AC-1 | #524 本文の通知統合対象テーブルから CF rotation reminder 行（Issue #407）が削除済み |
| VC-02 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-reminder.yml"` | `0` | AC-2 | #524「参照」節から削除済み workflow パスが除去済み |
| VC-03 | `gh issue view 524 --json body -q .body \| grep -c "cf-token-rotation-runbook.md"` | `0` | AC-2 | #524「参照」節から tombstone runbook パスが除去済み |
| VC-04 | `gh issue view 524 --json body -q .body \| grep -c "2026-06-08 更新"` | `1` | AC-3 | #524 冒頭に rotation 撤廃の経緯注記が追加済み |
| VC-05 | `grep -c "cf-token-rotation-reminder.yml\|cf-token-rotation-runbook.md" docs/30-workflows/issues/issue-524.md` | `0` | AC-4 | ローカルミラーから dangling 2 パスが除去済み |
| VC-06 | `gh issue view 1175 --json state -q .state` | `CLOSED` | AC-5 / 不変条件 | 起点 issue #1175 は再オープンせず closed のまま |

> VC-04 の `"2026-06-08 更新"` は Phase 2 差分 1 で追加する撤廃注記ブロック先頭行の固定マーカー。AC-3 のスコープ縮小（3→2 件）はこの注記文中で明示される。

## 4.3 検証の実行タイミング

- VC-01〜VC-06 は **実装プロンプト（03.実装.md）で #524 本文編集およびミラー md 編集を反映した後**に実行する。
- リモート反映（`gh issue edit 524`）は **user-gated**。よって VC-01〜VC-04（リモート参照）はユーザー承認後の反映完了を前提に実行する。
- VC-05（ローカル grep）はミラー md 編集後にローカルで即時実行可能。

## 4.4 期待結果の判定基準

- 全 6 ケースが期待値に一致したとき検証 PASS とする。
- いずれか 1 件でも不一致なら、Phase 5 の該当差分（VC↔AC 対応）へ戻って再編集する。

## 完了条件（Phase 4）

- [x] docs-only における Phase 4 の読み替え（検証手順設計）を宣言した。
- [x] 検証ケース VC-01〜VC-06 をコマンド・期待値・確認 AC つきで列挙した。
- [x] 検証は #524 編集後に実装プロンプトで実行する旨を明記した。
- [x] 期待結果の判定基準を定義した。
