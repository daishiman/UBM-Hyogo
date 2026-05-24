# Phase 4: 実装ガイド本体

**[実装区分: 実装仕様書]**

Phase 2 (設計詳細) の決定を「後続実装者がそのまま編集できる粒度」のコード骨格・差分指示・関数シグネチャに落とす。

## 0. 前提

- 実装モード: `existing-route-alignment`（Phase 1 §4 決定）
- 工程順序の正規経路は Phase 5 を参照
- 全 component の責務・props 設計は Phase 2 §1〜§2 が正本

## 1. 変更対象ファイル全量マップ

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/web/src/styles/tokens.css` | 検証のみ | 追加 token 不要を確認（accent / border / surface / ink 系がすべて存在） |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `@import "./auth.css";` を追加 |
| 3 | `apps/web/src/styles/auth.css` | 新規 | auth-shell / auth-card / brand-mark / brand-title / login-or-divider / login-status-icon の class 群 |
| 4 | `apps/web/src/components/ui/icons.ts` | 編集 | `IconName` union に `"send" \| "google" \| "inbox" \| "arrow-left"` を追加 |
| 5 | `apps/web/src/components/ui/Icon.tsx` | 編集 | 4 アイコンの SVG path を追加 |
| 6 | `apps/web/app/login/_components/LoginShell.tsx` | 新規 | `.auth-shell` 専用 wrapper |
| 7 | `apps/web/app/login/_components/OrDivider.tsx` | 新規 | OR 罫線 separator |
| 8 | `apps/web/app/login/_components/LoginCard.tsx` | 編集 | header 内 brand-mark "兵" + 2 段タイトル + h1 + subtitle |
| 9 | `apps/web/app/login/_components/LoginPanel.client.tsx` | 編集 | input state: MagicLinkForm → OrDivider → GoogleOAuthButton → register link |
| 10 | `apps/web/app/login/_components/MagicLinkForm.client.tsx` | 編集 | primary / block / lg / send icon / 文言更新 |
| 11 | `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | 編集 | ghost / block / lg / google icon |
| 12 | `apps/web/app/login/_components/LoginStatus.tsx` | 編集 | sent state を inbox icon block + email 強調へ再構成、戻る button (arrow-left icon) |
| 13 | `apps/web/app/login/page.tsx` | 編集 | `<main>` 直下を `<LoginShell>` ラップ、TITLES の subtitle 文言更新 |

CSS 1 行・icon 4 行を除けば構造的差分は約 380 LoC。1 サイクル完了スコープ (CONST_007 OK)。

## 2. CSS 仕様 — `apps/web/src/styles/auth.css`

```css
@layer components {
  .auth-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: var(--ubm-space-6) var(--ubm-space-4);
    background: var(--ubm-color-surface-1);
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: var(--ubm-color-surface);
    border: 1px solid var(--ubm-color-border);
    border-radius: 24px; /* 既存 token --ubm-radius-xl=20 / 2xl=28 の中間。リテラル許容（Phase 2 §4.3 注記） */
    padding: var(--ubm-space-7);
    box-shadow: var(--ubm-shadow-card);
  }

  .auth-card > header {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-space-2);
    margin-bottom: var(--ubm-space-5);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--ubm-space-3);
  }
  .brand-mark {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--ubm-color-accent-soft);
    color: var(--ubm-color-accent-ink);
    font-weight: 700;
    font-size: 20px;
    display: grid;
    place-items: center;
  }
  .brand-title { display: flex; flex-direction: column; line-height: 1.2; }
  .brand-title .jp { font-weight: 600; font-size: 14px; color: var(--ubm-color-text); }
  .brand-title .en {
    font-family: var(--ubm-font-en, ui-sans-serif);
    font-size: 10.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ubm-color-text-3);
  }

  .auth-card h1 { font-size: 24px; line-height: 1.3; margin: 0; color: var(--ubm-color-text); }
  .auth-card header > p { font-size: 13.5px; color: var(--ubm-color-text-2); margin: 0; }

  /* OR divider */
  .login-or-divider {
    display: flex;
    align-items: center;
    gap: var(--ubm-space-3);
    margin: var(--ubm-space-2) 0;
    color: var(--ubm-color-text-3);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .login-or-line { flex: 1; height: 1px; background: var(--ubm-color-border); }
  .login-or-label { font-family: var(--ubm-font-en, ui-sans-serif); }

  /* Register CTA */
  .login-register-cta {
    margin-top: var(--ubm-space-5);
    text-align: center;
    font-size: 13px;
    color: var(--ubm-color-text-2);
  }
  .login-register-cta a { color: var(--ubm-color-accent); font-weight: 500; }

  /* sent state large icon block */
  .login-status-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--ubm-color-ok-soft);
    color: var(--ubm-color-ok);
    display: grid;
    place-items: center;
    margin: 0 auto var(--ubm-space-4);
  }
}
```

> token 名は `apps/web/src/styles/tokens.css` 実在を Phase 5 の Step 1 で grep 検証する。`--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--ubm-color-ok-soft` / `--ubm-color-ok` / `--ubm-color-text-2` / `--ubm-color-text-3` / `--ubm-shadow-card` が未定義の場合は最寄りの token に置換し、欠落 token は phase-5 §3 で follow-up task として記録する。

## 3. Icon 拡張 — `apps/web/src/components/ui/icons.ts` & `Icon.tsx`

### 3.1 `icons.ts`

```ts
export type IconName =
  | "chevron-down"
  | "chevron-up"
  | "x"
  | "search"
  | "check"
  | "menu"
  | "external-link"
  | "send"        // ← 追加
  | "google"      // ← 追加
  | "inbox"       // ← 追加
  | "arrow-left"; // ← 追加
```

### 3.2 `Icon.tsx` 追加 path（24×24 viewBox、`currentColor` で塗る）

| name | path d (簡潔版) |
|------|---|
| `send` | `M3 11l18-8-8 18-2-8-8-2z`（Lucide Send 相当） |
| `inbox` | `M22 13H2M5.45 5.11L2 13v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-7.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z` |
| `arrow-left` | `M19 12H5M12 19l-7-7 7-7` |
| `google` | Google "G" multipath（4 色版 or 1-tone `currentColor` 版）。**brand color HEX を埋め込まない方針** とし、`currentColor` 1-tone で実装する（Phase 3 §6 リスク R-3 の選択肢 B / `verify-design-tokens` exempt 不要） |

> 1-tone google icon は brand guideline violation の懸念があるが MVP 許容。将来「正規 4 色版に差し替える」案は Phase 13 §4 で follow-up unassigned-task として記録する。

## 4. Component 完全シグネチャ

### 4.1 `LoginShell.tsx` (新規, Server Component)

```tsx
import type { ReactNode } from "react";

export interface LoginShellProps {
  readonly children: ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return <div className="auth-shell">{children}</div>;
}
```

### 4.2 `OrDivider.tsx` (新規, Server Component)

```tsx
export function OrDivider() {
  return (
    <div className="login-or-divider" role="separator" aria-label="または">
      <span className="login-or-line" aria-hidden="true" />
      <span className="login-or-label">OR</span>
      <span className="login-or-line" aria-hidden="true" />
    </div>
  );
}
```

### 4.3 `LoginCard.tsx` (改修)

```tsx
import type { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "../../../src/components/ui/Card";
import type { LoginGateState } from "../../../src/lib/url/login-query";

export interface LoginCardProps {
  readonly state: LoginGateState;
  readonly title: string;
  readonly subtitle?: string;
  readonly footerSlot?: ReactNode;
  readonly children: ReactNode;
}

export function LoginCard({ state, title, subtitle, footerSlot, children }: LoginCardProps) {
  return (
    <Card
      className="auth-card"
      data-testid="login-card"
      data-component="login-card"
      data-state={state}
    >
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">兵</span>
          <span className="brand-title">
            <span className="jp">UBM兵庫支部会</span>
            <span className="en">Member Portal</span>
          </span>
        </div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <CardContent>{children}</CardContent>
      {footerSlot ? <CardFooter>{footerSlot}</CardFooter> : null}
    </Card>
  );
}
```

旧 SVG 円形ロゴは廃止。`aria-label="UBM 兵庫支部会"` 相当の意味は h1 と brand-title が担う。

### 4.4 `LoginPanel.client.tsx` (改修, 順序入替)

```tsx
"use client";
import type { LoginGateState } from "../../../src/lib/url/login-query";
import { Banner } from "../../../src/components/ui/Banner";
import { GoogleOAuthButton } from "./GoogleOAuthButton.client";
import { LoginStatus } from "./LoginStatus";
import { MagicLinkForm } from "./MagicLinkForm.client";
import { OrDivider } from "./OrDivider";

export interface LoginPanelProps {
  readonly state: LoginGateState;
  readonly email?: string;
  readonly redirect: string;
  readonly error?: string;
  readonly gate?: string;
}

export function LoginPanel({ state, redirect, error, gate }: LoginPanelProps) {
  if (state === "input") {
    return (
      <section data-panel="input">
        {gate === "admin_required" ? (
          <Banner tone="warning" title="管理者権限が必要です">
            管理者アカウントでログインしてください。
          </Banner>
        ) : null}
        {error ? (
          <Banner tone="danger" title="ログインエラー">{error}</Banner>
        ) : null}
        <MagicLinkForm redirect={redirect} />
        <OrDivider />
        <GoogleOAuthButton redirect={redirect} />
        <p className="login-register-cta">
          会員でない方は <a href="/register">メンバー登録</a> から
        </p>
      </section>
    );
  }
  return (
    <LoginStatus
      state={state}
      redirect={redirect}
      {...(error !== undefined ? { error } : {})}
    />
  );
}
```

### 4.5 `MagicLinkForm.client.tsx` (改修)

差分要点:
- Button props に `variant="primary" size="lg" block leftIcon="send"`
- placeholder `you@example.com`
- 既存 cooldown / submit ロジック・state / replaceLoginState は完全維持
- button label を Phase 2 §5 表に従い更新（`"マジックリンクを送る"` 既定、cooldown 中は `"${n}s 後に再送可能"` 維持）

```tsx
<Button
  type="submit"
  variant="primary"
  size="lg"
  block
  leftIcon="send"
  disabled={submitting || cooldown > 0 || email.length === 0}
>
  {cooldown > 0 ? `${cooldown}s 後に再送可能` : "マジックリンクを送る"}
</Button>
```

`Button` component が `variant` / `size` / `block` / `leftIcon` props を未対応の場合は phase-5 Step 4 で `apps/web/src/components/ui/Button.tsx` を確認し、未対応 props は当該 component への最小拡張（既存 `variant: "primary" | "ghost" | ...` 等の既存型を踏襲）で対応する（同サイクル内）。

### 4.6 `GoogleOAuthButton.client.tsx` (改修)

```tsx
<Button
  type="button"
  variant="ghost"
  size="lg"
  block
  leftIcon="google"
  onClick={onClick}
  disabled={busy}
  loading={busy}
>
  Googleでログイン
</Button>
```

### 4.7 `LoginStatus.tsx` (改修, sent state 強化)

sent state を以下構造に置換:

```tsx
<section data-panel="sent" style={{ textAlign: "center" }}>
  <div className="login-status-icon" aria-hidden="true">
    <Icon name="inbox" size={28} />
  </div>
  <h2>メールをご確認ください</h2>
  <p>
    <strong>{email}</strong> 宛にログイン用のリンクをお送りしました。<br />
    数分以内に届かない場合は迷惑メールをご確認ください。
  </p>
  <Button variant="ghost" size="sm" leftIcon="arrow-left" onClick={() => router.push("/login")}>
    戻る
  </Button>
</section>
```

他 state (`unregistered` / `deleted` / `rules_declined` / `error`) は既存 Banner 表現を維持（Phase 7 で edge case 補強）。

### 4.8 `page.tsx` (改修)

```tsx
import { parseLoginQuery } from "../../src/lib/url/login-query";
import { LoginCard } from "./_components/LoginCard";
import { LoginPanel } from "./_components/LoginPanel.client";
import { LoginShell } from "./_components/LoginShell";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  input: {
    title: "会員ログイン",
    subtitle: "Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。",
  },
  sent: { title: "メールをご確認ください" },
  unregistered: { title: "アカウントが見つかりません" },
  deleted: { title: "アカウントが削除されています" },
  rules_declined: { title: "利用規約の同意が必要です" },
  error: { title: "ログインに失敗しました" },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const raw = (await searchParams) ?? {};
  const q = parseLoginQuery(raw);
  const meta = TITLES[q.state] ?? TITLES.input!;
  const panelProps = { state: q.state, redirect: q.redirect, ...(q.email !== undefined ? { email: q.email } : {}), ...(q.error !== undefined ? { error: q.error } : {}), ...(q.gate !== undefined ? { gate: q.gate } : {}) };
  return (
    <main>
      <LoginShell>
        <LoginCard state={q.state} title={meta.title} {...(meta.subtitle !== undefined ? { subtitle: meta.subtitle } : {})}>
          <LoginPanel {...panelProps} />
        </LoginCard>
      </LoginShell>
    </main>
  );
}
```

`TITLES.input.title` を "UBM 兵庫支部会へログイン" → **"会員ログイン"** に変更（プロトタイプ準拠）。brand-title (`UBM兵庫支部会` + `Member Portal`) は LoginCard header で常に表示されるため、h1 はステート別の title だけを担う。

## 5. 文言一覧 (現状 → プロトタイプ)

| 箇所 | 現状 | After |
|------|------|-------|
| h1 (input) | `UBM 兵庫支部会へログイン` | `会員ログイン` |
| subtitle (input) | `登録済みのメールアドレスでログインしてください。` | `Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。` |
| primary button | `メールリンクを送信` | `マジックリンクを送る` |
| OAuth button | `Google でログイン` | `Googleでログイン`（半角スペース除去） |
| register link | `未登録の方は 会員登録ページから新規登録` | `会員でない方は メンバー登録 から` |
| h2 (sent) | (なし、TITLES から h1) | `メールをご確認ください` |

## 6. DoD (Definition of Done) — Phase 4 範囲

- [ ] §1 の全 13 件のファイル変更が完了し、`git status` で差分が確認できる
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `rg -n '#[0-9a-fA-F]{3,8}' apps/web/src/styles/auth.css apps/web/app/login` で HEX 直書きが 0 件
- [ ] dev server (`pnpm dev`) で `/login` を開き Phase 6 §2 のチェックリストが全項目 OK
