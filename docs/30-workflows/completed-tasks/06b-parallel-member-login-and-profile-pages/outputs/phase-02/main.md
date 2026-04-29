# Phase 02 outputs: 設計

## サマリ

`/login`（Server で gate-state 解決 + Client で form 切替）と `/profile`（Server で session lookup + 04b fetch、Client なし）の page tree、Server / Client 境界、AuthGateState ↔ UI 対応 5 行、データ取得（zod parse + Promise.all）、session middleware（matcher: `/profile/:path*`）を確定。env 変数は `PUBLIC_API_BASE_URL` と `AUTH_URL` の 2 つ。

## 設計の柱

1. URL query 正本（`loginQuerySchema` で zod parse、不変条件 #8）
2. `/profile` は RSC のみ（Client component なし、不変条件 #4）
3. middleware で `/profile/:path*` を gate（不変条件 #9: `/no-access` 不採用）
4. 全 fetch は apps/api 経由（`fetchAuthed` で session cookie 転送、不変条件 #5）
5. AuthGateState 5 状態 × Banner + CTA を switch case で網羅

## 関連ドキュメント

- `page-tree.md` — apps/web/app 配下のディレクトリ構造
- `auth-gate-state-ui.md` — AuthGateState 5 状態 × Banner / 主 CTA / 副 CTA
- `data-fetching.md` — `loginQuerySchema` / `fetchAuthed` / middleware 設計

## env 変数

| 変数 | 種別 | 用途 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | var | apps/api ベース URL |
| `AUTH_URL` | var | Auth.js base URL（05a/b 共有） |

## 不変条件チェック

- #4: `/profile` の Server / Client いずれにも編集 form 配置なし
- #5: 全 fetch は apps/api 経由（D1 直接禁止）
- #6: Client にも `window.UBM` 参照なし
- #7: session.memberId のみ参照、responseId は API レスポンス内のみ
- #8: `/login` 状態は URL query 正本（localStorage なし）
- #9: `/no-access` ルート不存在

## 次 Phase 引き継ぎ

- AuthGateState UI 対応 5 行
- session middleware 設計
- env 2 変数
