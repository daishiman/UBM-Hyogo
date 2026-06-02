# Phase 1: 要件定義

> 正本は `outputs/phase-1/requirements.md`。本ファイルは root index からの導線兼サマリ。

## 目的

admin サイドバー nav に、Google Form の回答一覧/編集画面を**別タブで開く外部リンク**を 1 項目追加する。
D1 同期前の生回答・同意状態を直接確認し、メンバー非表示の原因切り分けを高速化する。

## 受け入れ条件（AC）

| ID    | 条件 |
| ----- | ---- |
| AC-D1 | admin サイドバー項目クリックで Google Form 編集 URL が**別タブ**で開く（元画面は遷移・リロードしない） |
| AC-D2 | 外部リンクは `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） |
| AC-D3 | URL は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止） |
| AC-D4 | 外部リンクと視覚/支援技術で判別可能（`↗` + sr-only「（外部リンク）」）かつ active 判定対象外 |

## 実装区分

**実装仕様書（VISUAL）**。dev へ landed 済み実装の正本記述（verify_existing）。詳細・現状コード anchor
（実コード verbatim 確認済み）・命名規則・外部リンク仕様・スコープは `outputs/phase-1/requirements.md` を参照。

> 実コード要点: 実装は PR #1064 / commit `745c95115` で dev にマージ済み（`git diff origin/dev...HEAD -- apps/web` は空）。
> 描画は `SidebarNavItem.tsx` の `item.external` 分岐で `<a target="_blank" rel="noopener noreferrer">` を出し、
> `↗`（非 collapsed・`aria-hidden`）+ sr-only「（外部リンク）」で判別。external は `data-active`/`aria-current` を出さない。
> label は実装上「Form回答」。

## 不変条件

- 不変条件 #7（外部 link 遷移 / iframe 不採用） / #8（`*.spec.{ts,tsx}` のみ） / #9（admin form input 対象外）
- OKLch トークン正本化（HEX 直書き禁止）。既存 API のみ接続（D1 / API / Form schema 不変）
