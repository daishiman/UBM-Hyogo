# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

4 ルートの App Router 構成、Server / Client 境界、URL query contract、04a API への fetch 設計、UI primitives の組み合わせを Mermaid + 表 + module ツリーで確定する。

## 実行タスク

1. page tree（apps/web/app）
2. Server / Client 境界の確定
3. URL query contract（zod schema）
4. data fetching 設計（RSC fetch + キャッシュ）
5. dependency matrix（04a / 00 / 05a / 05b）
6. env 表

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | 画面 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | URL contract |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |

## 実行手順

### ステップ 1: page tree

```
apps/web/app/
├── layout.tsx                  # AppHeader + ToastProvider + Auth.js session boundary
├── page.tsx                    # / (RSC) → Hero, StatCard, About, Featured, Recent meetings, FAQ, CTA
├── members/
│   ├── page.tsx                # /members (RSC, search params で fetch + Client コントロール内包)
│   ├── _components/
│   │   ├── MembersFilterBar.client.tsx   # FilterBar wrapper, URL query 連動
│   │   └── MemberList.tsx                # Server: fetch + map
│   └── [id]/
│       └── page.tsx            # /members/[id] (RSC, notFound() で 404)
└── register/
    └── page.tsx                # /register (RSC, form-preview fetch)
```

### ステップ 2: Server / Client 境界

| component | 種別 | 理由 |
| --- | --- | --- |
| `/page.tsx` | Server | データ fetch のみ、interaction 少 |
| `/members/page.tsx` | Server | searchParams から URL query を受けて fetch、UI primitives で render |
| `MembersFilterBar.client.tsx` | Client | input / Segmented の onChange で `router.push` |
| `/members/[id]/page.tsx` | Server | params から fetch、notFound() で 404 |
| `/register/page.tsx` | Server | form-preview fetch、リンクのみ |
| Toast / Modal / Drawer | Client | 状態あり、apps/web/components/ui |

### ステップ 3: URL query contract（zod）

```ts
// apps/web/lib/url/members-search.ts (placeholder)
import { z } from "zod"

export const membersSearchSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  zone: z.enum(["all", "0_to_1", "1_to_10", "10_to_100"]).catch("all"),
  status: z.enum(["all", "member", "non_member", "academy"]).catch("all"),
  tag: z.array(z.string()).catch([]),
  sort: z.enum(["recent", "name"]).catch("recent"),
  density: z.enum(["comfy", "dense", "list"]).catch("comfy"),
})

export type MembersSearch = z.infer<typeof membersSearchSchema>

export function toApiQuery(s: MembersSearch): URLSearchParams { /* ... */ }
```

### ステップ 4: data fetching

| route | endpoint | キャッシュ | revalidate |
| --- | --- | --- | --- |
| `/` | `GET /public/stats`, `GET /public/members?limit=6` | RSC fetch + revalidate 60s | 60 |
| `/members` | `GET /public/members?{query}` | per query | 30 |
| `/members/[id]` | `GET /public/members/:id` | per id | 60 |
| `/register` | `GET /public/form-preview` | static + revalidate 600s | 600 |

```ts
// 取得 helper の placeholder
export async function fetchPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${process.env.PUBLIC_API_BASE_URL}${path}`
  const r = await fetch(url, { next: { revalidate: 30 }, ...init })
  if (!r.ok) throw new Error(`fetch ${path} ${r.status}`)
  return r.json() as Promise<T>
}
```

### ステップ 5: dependency matrix

| 上流 | 引き渡し物 | 形式 |
| --- | --- | --- |
| 04a | `GET /public/{stats|members|members/:id|form-preview}` | view model JSON |
| 00 | UI primitives 15 種、tones.ts | apps/web/components/ui |
| 01b | view model 型 | packages/shared |
| 05a / 05b | session 状態 | layout 経由（公開層は不要だが header 表示で利用） |

### ステップ 6: env

| 区分 | 変数名 | 配置先 | 理由 |
| --- | --- | --- | --- |
| public var | `PUBLIC_API_BASE_URL` | wrangler vars | apps/web → apps/api 接続 |
| public const | `GOOGLE_FORM_RESPONDER_URL` | static | Form 公開 URL |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | alternative 検討（Server vs Client 境界） |
| Phase 4 | URL contract test 設計 |
| Phase 7 | AC trace |
| 08b | Playwright 検証 |

## 多角的チェック観点

- 不変条件 #1: members fetch では stableKey で field を select する設計
- 不変条件 #5: apps/web から D1 直接 import がないことを ESLint で阻止
- 不変条件 #6: `window.UBM` 不在を grep で検証
- 不変条件 #8: density / sort も URL query で reload 後復元
- 認可境界: 公開層は session 不要だが、header 表示用に session 結果を Server 側で取得して props 注入

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | page tree | 2 | pending | 4 ルート |
| 2 | Server / Client 境界 | 2 | pending | 表 |
| 3 | URL query zod | 2 | pending | placeholder |
| 4 | data fetching | 2 | pending | revalidate |
| 5 | dependency matrix | 2 | pending | 4 上流 |
| 6 | env | 2 | pending | 2 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/main.md | Phase 2 サマリ |
| 設計 | outputs/phase-02/page-tree.md | ファイルツリー + 境界 |
| 設計 | outputs/phase-02/url-query-contract.md | zod schema |
| 設計 | outputs/phase-02/data-fetching.md | fetch + キャッシュ |
| メタ | artifacts.json | phase 2 status |

## 完了条件

- [ ] 4 ルートが page tree に含まれる
- [ ] Server / Client 境界が 6 component 以上で表化
- [ ] URL query zod の `catch` で不正値フォールバック
- [ ] data fetching に revalidate が指定される

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 4 種ドキュメントが配置
- Mermaid syntax error なし
- 不変条件 #1, #5, #6, #8 への対応が明記
- 次 Phase へ alternative の論点を引継ぎ

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: density を Cookie にする案と URL query にする案の比較
- ブロック条件: page tree と URL contract が未完成なら進まない

## 構成図 (Mermaid)

```mermaid
graph LR
  ROOT[apps/web layout.tsx] --> P0[/]
  ROOT --> P1[/members]
  ROOT --> P2[/members/id]
  ROOT --> P3[/register]
  P0 --> S1[GET /public/stats]
  P0 --> S2[GET /public/members?limit=6]
  P1 --> S3[GET /public/members?q,zone,status,tag,sort]
  P1 --> CL[FilterBar.client]
  P2 --> S4[GET /public/members/:id]
  P3 --> S5[GET /public/form-preview]
  P3 --> EXT[Google Form responderUrl]
```

## 環境変数一覧

| 区分 | 代表値 | 置き場所 | 理由 |
| --- | --- | --- | --- |
| public variable | `PUBLIC_API_BASE_URL` | wrangler vars | apps/api 接続 |
| public const | `GOOGLE_FORM_RESPONDER_URL` | static | spec 固定 |

## 設定値表

| 項目 | 方針 | 根拠 |
| --- | --- | --- |
| revalidate | `/`60s, `/members`30s, `/members/:id`60s, `/register`600s | 04a Cache-Control と整合、無料枠 |
| density 正本 | URL query | 不変条件 #8 |
| sort 初期値 | `recent` | 12-search-tags.md |
| 404 | `notFound()` | App Router 標準 |

## 依存マトリクス

| 種別 | 対象 | 引き渡し物 | 理由 |
| --- | --- | --- | --- |
| 上流 | 04a | 4 endpoint | 公開データ取得 |
| 上流 | 00 | UI primitives | UI 構築 |
| 上流 | 01b | view model 型 | 型 4 層 |
| 上流 | 05a/b | session 状態 | header 表示 |
| 並列 | 06b/06c | shared layout | 共通 header |
| 下流 | 08b | URL spec | E2E |
