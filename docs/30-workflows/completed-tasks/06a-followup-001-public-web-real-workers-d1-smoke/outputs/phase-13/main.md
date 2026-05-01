# Phase 13 outputs — main

## ステータス

- 状態: spec_created（PR 未作成。user 承認 gate 待ち）

## 出力ファイル一覧

| ファイル | 役割 |
| --- | --- |
| `main.md`（本ファイル） | Phase 13 出力の index |
| `local-check-result.md` | `pnpm typecheck` / `pnpm lint` / 関連 vitest の placeholder |
| `change-summary.md` | 本 PR で変更するファイル一覧（仕様書のみ） |
| `pr-template.md` | PR タイトル / body 案（`Refs #273` 固定） |
| `pr-info.md` | user GO 後の PR URL / CI 結果記録（現時点 pending） |
| `pr-creation-result.md` | user GO 後の PR 作成プロセス実行ログ（現時点 pending） |

## サマリ

- 本 PR は Markdown 仕様書のみを変更する。コード変更・migration・実 smoke 実行は含まない。
- Issue #273 は CLOSED のままで、本 PR は `Refs #273` のみで参照する。
- commit / push / PR 作成は user の明示 GO 後に実施する。

## 完了条件

- 5 ファイル（local-check-result.md / change-summary.md / pr-template.md / pr-info.md / pr-creation-result.md）が outputs/phase-13/ 配下に実体存在
- pr-template.md に `Closes #273` が含まれていない
- 関連する CI gate（typecheck / lint / build）が PR push 後に green
