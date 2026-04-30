# 実装ランブック

## ステップ 1: middleware

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

## ステップ 2: `/login`

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
  }
  return (<form onSubmit={(e) => { e.preventDefault(); submit() }}>
    <FormField label="メールアドレス" type="email" value={email} onChange={setEmail} required />
    <Button type="submit" disabled={cooldown > 0}>{cooldown > 0 ? `${cooldown}s 後に再送可` : "メールリンクを送信"}</Button>
  </form>)
}
```

## ステップ 3: `/profile`

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
      <ProfileFields fields={profile.fields} />
      <EditCta editResponseUrl={profile.editResponseUrl} responderUrl={RESPONDER_URL} />
      <AttendanceList attendance={me.attendance} />
    </>
  )
}
```

```tsx
// StatusSummary.tsx (placeholder)
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
// EditCta.tsx (placeholder)
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

## ステップ 4: ESLint custom rule

```js
// .eslintrc.* (placeholder)
{
  rules: {
    "no-restricted-syntax": ["error",
      { selector: "JSXElement[openingElement.name.name='form'][parent.parent.parent.parent.parent.parent.openingElement.name.name='ProfilePage']", message: "profile に本文編集 form は不可" },
      { selector: "MemberExpression[object.name='localStorage']", message: "localStorage は不採用（不変条件 #8）" },
      { selector: "Literal[value='/no-access']", message: "/no-access ルートは不採用（不変条件 #9）" },
    ],
    "no-restricted-globals": ["error", "UBM"],
  },
}
```

## ステップ 5: sanity check

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
