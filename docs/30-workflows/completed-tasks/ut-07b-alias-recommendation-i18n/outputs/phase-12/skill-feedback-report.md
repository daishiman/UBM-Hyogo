# Phase 12 — skill feedback report

## テンプレ改善

closed Issue 由来の implementation task では、`apps/` / `packages/` 差分が入った時点で `spec_created` を禁止し、Phase 12 strict 7 と正本同期へ自動的に再分類する gate が有効だった。既存 skill ルールで充足しており、新規 skill 改修は不要。

## ワークフロー改善

`--run` が package script 経由で広く解釈され apps/api 全体が走ったが、結果として対象 spec と回帰 suite の両方を確認できた。証跡には focused 20 tests と wider 300 tests を分けて記録するのがよい。

## ドキュメント改善

`phase-12.md` の「6 ファイル」表記は strict 7 と矛盾していたため補正した。今後の task spec 生成では Phase 12 `main.md` を必ず含める。
