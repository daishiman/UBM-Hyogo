# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

`/login`, `/profile`, middleware を Next.js App Router で実装する手順を runbook + 擬似コード + sanity check で記述する。

## 実行タスク

1. middleware 実装
2. `/login` 実装
3. `/profile` 実装
4. ESLint custom rule（profile 編集 form 禁止 / localStorage 禁止）
5. sanity check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/page-tree.md | 構造 |
| 必須 | outputs/phase-02/auth-gate-state-ui.md | 5 状態 |
| 必須 | outputs/phase-02/data-fetching.md | fetch + middleware |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |

## 実行手順

### ステップ 1: middleware

```ts
// apps/web/middleware.ts (placeholder)
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
export async function middleware(req: Request) {
  const url = new URL(req.url)
  if (url.pathname.startsWith("/profile")) {
    const session = await getSession(req)
    if (!session) {
      const redirect = `/login?redirect=${encodeURIComponent(url.pathname)}`
      return NextResponse.redirect(new URL(redirect, req.url))
    }
  }
}
export const config = { matcher: ["/profile/:path*"] }
```

### ステップ 2: `/login`

```tsx
// apps/web/app/login/page.tsx (placeholder)
import { z } from "zod"
import { LoginPanel } from "./_components/LoginPanel.client"

const loginQuerySchema = z.object({
  state: z.enum(["input","sent","unregistered","rules_declined","deleted"]).default("input"),
  email: z.string().email().optional(),
  redirect: z.string().startsWith("/").default("/profile"),
})

export default async function LoginPage({ searchParams }: { searchParams: Record<string,string> }) {
  const q = loginQuerySchema.safeParse(searchParams)
  const params = q.success ? q.data : { state: "input" as const, redirect: "/profile" }
  return <LoginPanel state={params.state} email={params.email} redirect={params.redirect} />
}
```

```tsx
// apps/web/app/login/_components/LoginPanel.client.tsx (placeholder)
"use client"
import { Banner, Button } from "@/components"
import { MagicLinkForm } from "./MagicLinkForm.client"
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton"

export function LoginPanel({ state, email, redirect }: Props) {
  switch (state) {
    case "input":
      return (<>
        <h1>UBM 兵庫支部会へログイン</h1>
        <GoogleOAuthButton redirect={redirect} />
        <MagicLinkForm redirect={redirect} />
        <p>未登録の方は <a href="/register">こちら</a></p>
      </>)
    case "sent":
      return (<>
        <Banner tone="success">{email} 宛にログイン用メールを送信しました</Banner>
        <p>60 秒後に再送可能</p>
      </>)
    case "unregistered":
      return (<>
        <Banner tone="warn">登録された会員情報が見つかりません</Banner>
        <Button href="/register" variant="primary">登録ページへ</Button>
      </>)
    case "rules_declined":
      return (<>
        <Banner tone="warn">利用規約への同意が必要です</Banner>
        <Button href={RESPONDER_URL} variant="primary" target="_blank">Google Form で再回答</Button>
      </>)
    case "deleted":
      return (<>
        <Banner tone="error">このアカウントは削除されています</Banner>
        <p>管理者にお問い合わせください</p>
      </>)
  }
}
```

```tsx
// apps/web/app/login/_components/MagicLinkForm.client.tsx (placeholder)
"use client"
import { useState } from "react"
export function MagicLinkForm({ redirect }: { redirect: string }) {
  const [email, setEmail] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const submit = async () => {
    const res = await fetch("/api/auth/magic-link", { method: "POST", body: JSON.stringify({ email, redirect }) })
    const data = await res.json() as { state: AuthGateState }
    setCooldown(60)
    history.replaceState(null, "", `/login?state=${data.state}&redirect=${encodeURIComponent(redirect)}`)
    /* trigger router refresh */
  }
  return (<form onSubmit={(e) => { e.preventDefault(); submit() }}>
    <FormField label="メールアドレス" type="email" value={email} onChange={setEmail} required />
    <Button type="submit" disabled={cooldown > 0}>{cooldown > 0 ? `${cooldown}s 後に再送可` : "メールリンクを送信"}</Button>
  </form>)
}
```

### ステップ 3: `/profile`

```tsx
// apps/web/app/profile/page.tsx (placeholder)
import { fetchAuthed } from "@/lib/fetch/authed"
import { StatusSummary, ProfileFields, EditCta, AttendanceList } from "./_components"

export default async function ProfilePage() {
  const [me, profile] = await Promise.all([
    fetchAuthed<MeView>("/me"),
    fetchAuthed<MemberProfile>("/me/profile"),
  ])
  return (
    <>
      <h1>マイページ</h1>
      <StatusSummary me={me} />
      <ProfileFields fields={profile.fields} /> {/* stableKey 経由のみ */}
      <EditCta editResponseUrl={profile.editResponseUrl} responderUrl={RESPONDER_URL} />
      <AttendanceList attendance={me.attendance} />
    </>
  )
}
```

```tsx
// apps/web/app/profile/_components/StatusSummary.tsx (placeholder)
export function StatusSummary({ me }: { me: MeView }) {
  return (
    <section>
      <KVList items={[
        { label: "公開状態", value: me.publishState },
        { label: "公開許可", value: me.publicConsent },
        { label: "規約同意", value: me.rulesConsent },
        { label: "削除", value: me.isDeleted ? "あり" : "なし" },
      ]} />
    </section>
  )
}
```

```tsx
// apps/web/app/profile/_components/EditCta.tsx (placeholder)
export function EditCta({ editResponseUrl, responderUrl }: Props) {
  return (
    <section>
      {editResponseUrl ? (
        <Button href={editResponseUrl} target="_blank" variant="primary">Google Form で編集する</Button>
      ) : (
        <Button disabled>編集 URL を取得中</Button>
      )}
      <p>新規回答する場合: <a href={responderUrl} target="_blank" rel="noopener noreferrer">Google Form (新規)</a></p>
    </section>
  )
}
```

### ステップ 4: ESLint custom rule

```js
// .eslintrc.* (placeholder)
{
  rules: {
    "no-restricted-syntax": ["error",
      // profile 配下で <form> + onSubmit による本文編集禁止（visibility / delete request 以外）
      { selector: "JSXElement[openingElement.name.name='form'][parent.parent.parent.parent.parent.parent.openingElement.name.name='ProfilePage']", message: "profile に本文編集 form は不可" },
      // localStorage 禁止
      { selector: "MemberExpression[object.name='localStorage']", message: "localStorage は不採用（不変条件 #8）" },
      // /no-access リテラル禁止
      { selector: "Literal[value='/no-access']", message: "/no-access ルートは不採用（不変条件 #9）" },
    ],
    "no-restricted-globals": ["error", "UBM"],
  },
}
```

### ステップ 5: sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `pnpm dev`（apps/web）起動 | port 3000 listen |
| S-02 | `curl http://localhost:3000/login` | 200 + input state |
| S-03 | `curl "http://localhost:3000/login?state=sent&email=foo@bar"` | 200 + sent state |
| S-04 | `curl "http://localhost:3000/login?state=unregistered"` | 200 + register CTA |
| S-05 | `curl -I http://localhost:3000/profile` | 302 → /login?redirect=/profile |
| S-06 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` | 0 件 |
| S-07 | `grep -r "/no-access" apps/web` | 0 件 |
| S-08 | `grep -r "form" apps/web/app/profile/_components` | 編集 form 不在 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 異常系（401, gate state 不整合） |
| Phase 7 | runbook ↔ AC × test ID |
| 08b | E-01〜E-10 を実行 |

## 多角的チェック観点

- 不変条件 #4: ステップ 3 で profile に編集 form / button なし
- 不変条件 #5: fetcher が apps/api 経由のみ
- 不変条件 #6: ステップ 4 で `window.UBM` 阻止
- 不変条件 #7: session.memberId のみ参照
- 不変条件 #8: ステップ 4 で localStorage 阻止
- 不変条件 #9: ステップ 4 / S-07 で `/no-access` 阻止

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | middleware | 5 | pending | matcher /profile/:path* |
| 2 | /login 実装 | 5 | pending | 5 状態 |
| 3 | /profile 実装 | 5 | pending | read-only |
| 4 | ESLint rule | 5 | pending | 4 rule |
| 5 | sanity check | 5 | pending | S-01〜S-08 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 実装手順 + ESLint + sanity |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 2 page + middleware の placeholder
- [ ] ESLint rule placeholder
- [ ] sanity check S-01〜S-08
- [ ] secret 値は含まない

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #4, #5, #6, #7, #8, #9 と対応
- 次 Phase へ failure case を引継ぎ

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項: 2 page の異常系（API 401, gate state 不整合, magic link 期限切れ）
- ブロック条件: runbook が placeholder で埋まっていない場合は進まない
