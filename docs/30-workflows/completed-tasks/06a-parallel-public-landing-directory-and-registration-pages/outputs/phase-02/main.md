# Phase 2 成果物 — 設計サマリ

## 概要

4 ルートの App Router 構成、Server / Client 境界、URL query contract、04a API への fetch 設計、UI primitives の組み合わせを確定する。

詳細は同フォルダの 3 ドキュメントに分割:
- `page-tree.md` — apps/web/app の構造と境界
- `url-query-contract.md` — `q/zone/status/tag/sort/density` の zod schema
- `data-fetching.md` — RSC fetch + revalidate

## 主要決定

| 観点 | 決定 | 根拠 |
| --- | --- | --- |
| ルートグループ | `apps/web/app/(public)/` 配下に 4 ルート | 06b/06c (member/admin) と並列配置 |
| Server / Client 境界 | page.tsx は全て Server, FilterBar のみ Client | 不変条件 #8、SSR で初期 HTML 確定 |
| URL query 解析 | zod `catch` で fallback | 不正値→初期値、AC-6 |
| データ取得 | `fetchPublic<T>(path)` 共通化 | DRY、AC-1/AC-10 |
| revalidate | `/`60s, `/members`30s, `/members/[id]`60s, `/register`600s | 無料枠 + 鮮度のバランス |
| density 切替 | `router.replace` で history 汚染回避 | Q1 仮決定 |
| tag 上限 | apps/web 側で 5 件 truncate | Q2 確定値 |

## 環境変数

| 変数 | 区分 | 配置 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | public var | wrangler vars |
| `GOOGLE_FORM_RESPONDER_URL` | public const | コード固定 + spec 値 |

## 構成図

```mermaid
graph LR
  L[layout.tsx (root)] --> PL[(public)/layout.tsx]
  PL --> P0[/]
  PL --> P1[/members]
  PL --> P2[/members/:id]
  PL --> P3[/register]
  P0 --> S1[GET /public/stats]
  P0 --> S2[GET /public/members?limit=6]
  P1 --> S3[GET /public/members?{search}]
  P1 --> CL[MembersFilterBar.client]
  P2 --> S4[GET /public/members/:id]
  P3 --> S5[GET /public/form-preview]
  P3 --> EXT[Google Form responderUrl]
```

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | page tree | completed |
| 2 | Server / Client 境界 | completed |
| 3 | URL query zod | completed |
| 4 | data fetching | completed |
| 5 | dependency matrix | completed |
| 6 | env | completed |

## 完了条件チェック

- [x] 4 ルートが page tree に含まれる
- [x] Server / Client 境界が 6 component 以上で表化
- [x] URL query zod の `catch` で不正値フォールバック
- [x] data fetching に revalidate が指定される
