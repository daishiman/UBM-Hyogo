# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

4 ルートを Next.js App Router で実装する手順を runbook + 擬似コード + sanity check で記述する。

## 実行タスク

1. apps/web/app 配下の 4 page 作成
2. URL query zod と FilterBar Client component
3. 共通 fetcher
4. UI primitives 組み込み
5. ESLint custom rule（stableKey 直書き禁止 / window.UBM 禁止）
6. sanity check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/page-tree.md | 構造 |
| 必須 | outputs/phase-02/url-query-contract.md | zod |
| 必須 | outputs/phase-02/data-fetching.md | fetch |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |

## 実行手順

### ステップ 1: layout.tsx

```tsx
// apps/web/app/layout.tsx (placeholder)
import { ToastProvider } from "@/components/ui/Toast"
import { AppHeader } from "@/components/layout/AppHeader"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>
          <AppHeader />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
```

### ステップ 2: `/` (Server Component)

```tsx
// apps/web/app/page.tsx (placeholder)
import { fetchPublic } from "@/lib/fetch"
import { Hero, StatCard, MemberCard, Timeline } from "@/components"

export default async function HomePage() {
  const [stats, members] = await Promise.all([
    fetchPublic<PublicStatsView>("/public/stats"),
    fetchPublic<PublicMemberListView>("/public/members?limit=6"),
  ])
  return (
    <>
      <Hero />
      <section><StatCard {...stats} /></section>
      <section>{members.items.map(m => <MemberCard key={m.memberId} member={m} />)}</section>
      <Timeline />
      {/* FAQ / CTA */}
    </>
  )
}
```

### ステップ 3: `/members`

```tsx
// apps/web/app/members/page.tsx (placeholder)
import { membersSearchSchema } from "@/lib/url/members-search"
import { MembersFilterBar } from "./_components/MembersFilterBar.client"

export default async function MembersPage({ searchParams }: { searchParams: Record<string,string|string[]> }) {
  const search = membersSearchSchema.parse(searchParams)
  const list = await fetchPublic<PublicMemberListView>("/public/members?" + toApiQuery(search))
  return (
    <>
      <MembersFilterBar initial={search} />
      {list.items.length === 0
        ? <EmptyState onClear={() => /* router.push('/members') */} />
        : <MemberList density={search.density} items={list.items} />}
    </>
  )
}
```

```tsx
// apps/web/app/members/_components/MembersFilterBar.client.tsx (placeholder)
"use client"
import { useRouter, useSearchParams } from "next/navigation"
export function MembersFilterBar({ initial }: { initial: MembersSearch }) {
  const router = useRouter(); const sp = useSearchParams()
  const update = (patch: Partial<MembersSearch>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (Array.isArray(v)) { next.delete(k); v.forEach(x => next.append(k, x)) }
      else next.set(k, String(v))
    })
    router.replace(`/members?${next.toString()}`)
  }
  return (/* Search + Select(zone) + Select(status) + tag chips + Segmented(sort/density) */)
}
```

### ステップ 4: `/members/[id]`

```tsx
// apps/web/app/members/[id]/page.tsx (placeholder)
import { notFound } from "next/navigation"
export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const r = await fetch(`${process.env.PUBLIC_API_BASE_URL}/public/members/${params.id}`, { next: { revalidate: 60 } })
  if (r.status === 404) notFound()
  if (!r.ok) throw new Error("fetch error")
  const m = await r.json() as PublicMemberProfile
  return (
    <>
      <ProfileHero member={m} />
      <KVList items={[
        { label: "ビジネス概要", value: m.businessOverview },
        { label: "スキル", value: m.skills },
        // ... stableKey 経由で参照（直書き禁止）
      ]} />
      <LinkPills links={m.socialLinks} />
    </>
  )
}
```

### ステップ 5: `/register`

```tsx
// apps/web/app/register/page.tsx (placeholder)
const RESPONDER_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform"

export default async function RegisterPage() {
  const preview = await fetchPublic<FormPreviewView>("/public/form-preview")
  return (
    <>
      <h1>UBM 兵庫支部会への登録</h1>
      <p>登録は Google Form 回答 → 自動同期 → ログイン → マイページ確認の順で進みます。</p>
      <a href={RESPONDER_URL} target="_blank" rel="noopener noreferrer">
        <Button variant="primary">Google Form で登録する</Button>
      </a>
      <FormPreviewSections sections={preview.sections} />
    </>
  )
}
```

### ステップ 6: ESLint custom rule

```js
// .eslintrc.* (placeholder)
{
  rules: {
    "no-restricted-globals": ["error", "UBM"],
    "no-restricted-syntax": ["error",
      { selector: "Literal[value=/^[0-9a-fA-F]{20,}$/]", message: "questionId 直書き禁止。stableKey を使え" },
    ],
  },
}
```

### ステップ 7: sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `pnpm dev`（apps/web）起動 | port 3000 listen |
| S-02 | `curl http://localhost:3000/` | 200 + Hero / Stats |
| S-03 | `curl http://localhost:3000/members?q=hello&zone=0_to_1&density=dense` | 200 + filtered |
| S-04 | `curl http://localhost:3000/members/UNKNOWN` | 404 |
| S-05 | `curl http://localhost:3000/register` | 200 + responderUrl リンク |
| S-06 | `grep -r "window.UBM" apps/web` | 0 件 |
| S-07 | `grep -r "no-access" apps/web/app` | 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 異常系（401 含むが公開層では稀） |
| Phase 7 | runbook ↔ AC × test ID |
| 08b | E-01〜E-07 を実行 |

## 多角的チェック観点

- 不変条件 #1: ステップ 4 で stableKey 経由参照、questionId 直書きなし
- 不変条件 #5: fetcher が apps/api 経由のみ
- 不変条件 #6: ステップ 6 / S-06 で `window.UBM` 阻止
- 不変条件 #8: density / sort / tag が URL query 正本
- 不変条件 #9: `/no-access` ルートを作らない（S-07）
- 不変条件 #10: revalidate で API 呼び出し低減

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | layout.tsx | 5 | pending | RSC root |
| 2 | / 実装 | 5 | pending | Hero + Stats |
| 3 | /members 実装 | 5 | pending | 検索 + 一覧 |
| 4 | /members/[id] 実装 | 5 | pending | notFound() |
| 5 | /register 実装 | 5 | pending | form-preview |
| 6 | ESLint rule | 5 | pending | UBM / questionId 禁止 |
| 7 | sanity check | 5 | pending | S-01〜S-07 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 4 page 実装 + ESLint + sanity |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 4 page の placeholder が runbook に
- [ ] ESLint rule placeholder
- [ ] sanity check S-01〜S-07
- [ ] secret 値は含まない

## タスク100%実行確認【必須】

- 全 7 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1, #5, #6, #8, #9, #10 と対応
- 次 Phase へ failure case を引継ぎ

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 4 page の異常系（API 5xx, 404, 不正 query）を整理
- ブロック条件: runbook が placeholder で埋まっていない場合は進まない
