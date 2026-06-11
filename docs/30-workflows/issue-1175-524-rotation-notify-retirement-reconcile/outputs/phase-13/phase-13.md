# Phase 13: PR 作成

## ステータス

`pending_user_approval`。GitHub issue #524 本文/title 編集は 2026-06-10 に完了済み。PR 作成・commit・push は **user の明示承認後のみ** 実行する。

## 想定 PR

| 項目 | 内容 |
|------|------|
| base ブランチ | `dev` |
| 分類 | docs（Issue hygiene / Governance reconciliation） |
| 含めるファイル | `docs/30-workflows/issue-1175-524-rotation-notify-retirement-reconcile/**`（仕様書一式） + ミラー `docs/30-workflows/issues/issue-524.md`（整合済み） |

> ミラー `issue-524.md` は 4 差分整合 + `updated_date: 2026-06-10` 更新済み。

## outward-facing 操作（PR とは独立・user-gated）

| 操作 | 種別 | 承認 |
|------|------|------|
| `gh issue edit 524` | GitHub issue #524 本文/title 上書き（リモート正本） | 実行済み |

> `gh issue edit` は PR マージとは独立して #524 のリモート本文/title を更新済み。以後の user gate は commit / push / PR のみ。

## 不変条件

1. 起点 issue **#1175 は CLOSED のまま**。PR で再オープンしない。
2. 整合対象 #524 は OPEN のまま（本タスクは本文整合のみ・残り 2 件の実装には触れない）。
3. コード surface への変更を含めない（PR は仕様書 + ミラー md のみ）。

## PR 本文に反映する内容

- [implementation-guide.md](../phase-12/implementation-guide.md) の 4 差分（Before/After）と適用手順。
- [phase-12.md](../phase-12/phase-12.md) の AC-1〜AC-5 達成状況。
- NON_VISUAL のためスクリーンショット専用セクションは設けない（代替証跡: phase-10 / phase-11）。

## 検証（PR 前 / 反映後）

- VC-01〜VC-06（[phase-4.md](../phase-4/phase-4.md)）: 実行済み PASS。
- RC-01〜RC-03（[phase-6.md](../phase-6/phase-6.md)）: 実行済み PASS。
- VC-05（ミラー grep）はローカルで即時検証可能。

## 完了条件（Phase 13）

- [x] PR base / 含めるファイル / outward-facing 操作の区分を確定した。
- [x] #1175 closed 維持・#524 OPEN 維持の不変条件を明記した。
- [x] status を `pending_user_approval` とした（commit / push / PR は user 承認後）。
