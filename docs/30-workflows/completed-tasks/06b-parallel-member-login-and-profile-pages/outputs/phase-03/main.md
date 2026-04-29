# Phase 03 outputs: 設計レビュー

## サマリ

5 案を比較し、A 案（URL query 正本 + RSC で gate-state 描画 + middleware で `/profile` redirect）を採用。B / C / E は不変条件 #8、C は #6、D は #9 に抵触するため不採用。リスク 5 件と ADR 4 件を登録した。

## 代替案比較（5 種）

| 案 | 概要 | Pros | Cons | 不変条件適合 |
| --- | --- | --- | --- | --- |
| A | URL query 正本 + RSC で gate-state 描画 + middleware で `/profile` redirect | reload 復元、SEO 安全、SSR 完結 | URL に email を載せた場合 leak（length）→ form submit 後は state のみ残す | #8, #9 OK |
| B | client state 正本（useState）+ React Context | 柔軟 | reload で state 消失、`/no-access` 化リスク | #8 違反 |
| C | localStorage に gate-state 保存 | UX continuous | 不変条件 #8 違反、leak リスク | #6, #8 違反 |
| D | route 分割（`/login`, `/login/sent`, `/login/unregistered`...） | URL で意味を持つ | route 増、`/no-access` に近い | #9 リスク |
| E | session/cookie に gate-state 保存 | reload 復元 | cookie inflate、SSR 複雑 | #8 リスク |

採用: A 案 / 不採用: B (#8), C (#6 #8), D (#9), E (#8)

## A 案採用根拠

| 観点 | 根拠 |
| --- | --- |
| 不変条件 #8 | URL が正本、localStorage / sessionStorage 不採用 |
| 不変条件 #9 | `/no-access` 不存在、`/login` で 5 状態を吸収 |
| RSC 適合 | searchParams を Server で zod parse → component に渡せる |
| SEO | `/login` 自体は noindex 想定だが、SSR 完結で問題なし |
| 復元性 | reload で state 復元 |

## リスク登録

| リスク | 影響 | 対策 | 残リスク |
| --- | --- | --- | --- |
| URL に email を載せた場合 leak | プライバシー | submit 直後に history.replaceState で email を削除（`?state=sent` のみ残す） | low |
| Magic Link の再送 spam | コスト | cooldown 60s + 送信回数 server 側 limit（05b） | low |
| Google OAuth ボタンの popup blocker | UX | primary CTA としてフルページ redirect 利用 | low |
| `/profile` で session 切れ | UX | error boundary で `/login` redirect | low |
| editResponseUrl が null | UX | button disabled + tooltip 「Google Form 再回答 URL を取得中」 | low |

## ADR

| ADR | 内容 |
| --- | --- |
| ADR-06b-001 | `/login` の状態は URL query 正本 |
| ADR-06b-002 | `/profile` は read-only、編集 UI 一切なし（不変条件 #4） |
| ADR-06b-003 | `/no-access` ルート不採用（不変条件 #9） |
| ADR-06b-004 | session middleware は `/profile/:path*` のみ |

## 不変条件チェック

- #4 / #5 / #6 / #8 / #9 すべて A 案で担保
