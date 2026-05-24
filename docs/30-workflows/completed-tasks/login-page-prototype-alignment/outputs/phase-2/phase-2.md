# Phase 2: 設計詳細（コンポーネント / CSS / icon / token / layout contract）

## 0. 設計方針サマリー

- **再構築ではなく整合 (alignment)**: 既存 component の責務境界 (Server vs Client、Card vs Panel vs Form) は維持しつつ、JSX 構造・className 付与・props 渡し方を プロトタイプに揃える
- **OKLch token 経由のみ**: 色は `--ubm-color-*` の reference 経由のみ。プロトタイプの `var(--accent)` / `var(--border)` / `var(--ok)` 等は `apps/web/src/styles/tokens.css` の対応 token にマッピングする
- **CSS の置き場所**: 既存 `apps/web/src/styles/legacy-public.css` と同じ "global CSS at @layer components" 方式を踏襲し、**新規 `apps/web/src/styles/auth.css` を作成**して `globals.css` から `@import "./auth.css";` する。プロトタイプ準拠の `.auth-shell` / `.auth-card` / `.brand-mark` / `.brand-title` の 4 class をここに閉じる
- **Icon 追加**: `apps/web/src/components/ui/icons.ts` の `IconName` union を 4 値追加し、`Icon.tsx` の path map に追記する

## 1. コンポーネント構造図（After）

```
app/login/page.tsx (Server)
└── <LoginShell>                          (新 wrapper / Server)
    └── <LoginCard state title subtitle>  (改修 / Server)
        ├── <header class="brand">
        │   ├── <span class="brand-mark">兵</span>
        │   └── <span class="brand-title">
        │         <span class="jp">UBM兵庫支部会</span>
        │         <span class="en">Member Portal</span>
        │       </span>
        │   <h1>{title}</h1>
        │   {subtitle ? <p>{subtitle}</p> : null}
        ├── <CardContent>
        │   └── <LoginPanel state ... />  (改修 / Client)
        │       ├── input state:
        │       │   ├── <Banner> (gate / error 条件付き)
        │       │   ├── <MagicLinkForm>      ← 順序 1
        │       │   ├── <OrDivider/>          ← 順序 2（新）
        │       │   ├── <GoogleOAuthButton>   ← 順序 3
        │       │   └── <p class="login-register-cta">…</p>
        │       └── 他 state: <LoginStatus state />
        └── (CardFooter は未使用)
```

### 新規 / 改修 component の責務

| component | 責務 | server/client | 新規 or 改修 |
|---|---|---|---|
| `LoginShell` | `.auth-shell` 全面 wrapper（main 直下、Card の外側） | Server | **新規** (`apps/web/app/login/_components/LoginShell.tsx`) |
| `LoginCard` | `.auth-card` ＋ brand header ＋ children slot | Server | 改修（既存 file） |
| `LoginPanel` | state="input" 時の DOM 順序と OrDivider 挿入 | Client | 改修（既存 file） |
| `OrDivider` | 両側 hairline + OR テキストの 1 行 row | Server | **新規** (`apps/web/app/login/_components/OrDivider.tsx`) |
| `MagicLinkForm` | placeholder / size / leftIcon / label を更新 | Client | 改修（既存 file） |
| `GoogleOAuthButton` | variant / size / block / leftIcon / label を更新 | Client | 改修（既存 file） |
| `LoginStatus` | sent state を inbox icon block + email 強調へ再構成 | Server | 改修（既存 file） |

`LoginShell` は server component で副作用がない単なる `<div className="auth-shell">` ラッパーだが、`page.tsx` から `<main>` を取り除き `<main><LoginShell>...</LoginShell></main>` の構造にして責務分離する。

## 2. Props / 型設計

### `LoginShell`

```ts
// apps/web/app/login/_components/LoginShell.tsx
import type { ReactNode } from "react";

export interface LoginShellProps {
  readonly children: ReactNode;
}

export function LoginShell({ children }: LoginShellProps) {
  return <div className="auth-shell">{children}</div>;
}
```

### `OrDivider`

```ts
// apps/web/app/login/_components/OrDivider.tsx
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

### `LoginCard`（差分のみ）

```ts
// apps/web/app/login/_components/LoginCard.tsx
// header の中身を SVG から brand-mark + brand-title 構造に差し替え
<header className="login-card-header">
  <div className="brand login-brand">
    <span className="brand-mark" aria-hidden="true">兵</span>
    <span className="brand-title">
      <span className="jp">UBM兵庫支部会</span>
      <span className="en">Member Portal</span>
    </span>
  </div>
  <h1 className="login-card-title">{title}</h1>
  {subtitle ? <p className="login-card-subtitle">{subtitle}</p> : null}
</header>
```

`Card` の `data-testid` / `data-state` props は無改変。

### `MagicLinkForm`（差分）

```ts
<Field id="magic-link-email" label="メールアドレス" required>
  <Input
    id="magic-link-email"
    type="email"
    required
    autoComplete="email"
    inputSize="lg"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</Field>
<Button
  type="submit"
  variant="primary"
  size="lg"
  block
  leftIcon={<Icon name="send" size={18} />}
  disabled={submitting || cooldown > 0 || email.length === 0}
  loading={submitting}
>
  {cooldown > 0 ? `${cooldown}s 後に再送可能` : "マジックリンクを送る"}
</Button>
```

### `GoogleOAuthButton`（差分）

```ts
<Button
  type="button"
  variant="ghost"
  size="lg"
  block
  leftIcon={<Icon name="google" size={18} />}
  onClick={onClick}
  disabled={busy}
  loading={busy}
>
  Googleでログイン
</Button>
```

### `LoginPanel`（input state 部分の差分）

```ts
return (
  <section data-panel="input" className="login-panel">
    {gate === "admin_required" ? <Banner tone="warning" title="管理者権限が必要です">...</Banner> : null}
    {error ? <Banner tone="danger" title="ログインエラー">{error}</Banner> : null}
    <MagicLinkForm redirect={redirect} />
    <OrDivider />
    <GoogleOAuthButton redirect={redirect} />
    <p className="login-register-cta">
      会員でない方は <a href="/register">メンバー登録</a> から
    </p>
  </section>
);
```

### `LoginStatus`（sent state 差分）

```ts
// state === "sent" 分岐内
return (
  <div className="login-sent-block">
    <div className="login-sent-icon" aria-hidden="true">
      <Icon name="inbox" size={28} />
    </div>
    <h2 className="login-sent-title">メールをご確認ください</h2>
    <p className="login-sent-body">
      <b>{email}</b> 宛にログイン用のリンクをお送りしました。<br />
      数分以内に届かない場合は迷惑メールをご確認ください。
    </p>
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<Icon name="arrow-left" size={16} />}
      onClick={() => router.push(/* /login へ戻す */)}
    >
      戻る
    </Button>
  </div>
);
```

他 state（unregistered / deleted / rules_declined / error）は既存表示 + Banner を維持し、本サイクルでは変更しない。

## 3. State 設計

- 既存の `searchParams` → `parseLoginQuery` → 6 state（input / sent / unregistered / deleted / rules_declined / error）の駆動経路を**無改変**で維持
- Client 側の追加 state はゼロ（OrDivider は stateless、LoginShell も stateless）
- `MagicLinkForm` の `email` / `cooldown` / `submitting` local state は既存のまま
- `GoogleOAuthButton` の `busy` 局所 state は既存のまま

## 4. CSS 配置と OKLch token mapping

### 4.1 新規ファイル: `apps/web/src/styles/auth.css`

```css
/* ---------- auth screens (login + register 系共通の wrapper) ---------- */
@layer components {
  .auth-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: var(--ubm-color-surface-bg);
    position: relative;
    overflow: hidden;
  }
  .auth-shell::before {
    content: "";
    position: absolute;
    inset: -100px;
    background:
      radial-gradient(circle at 20% 10%,
        color-mix(in oklch, var(--ubm-color-accent) 12%, transparent),
        transparent 40%),
      radial-gradient(circle at 85% 80%,
        color-mix(in oklch, var(--ubm-color-info) 10%, transparent),
        transparent 40%);
    pointer-events: none;
    z-index: 0;
  }
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: var(--ubm-color-surface-panel);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-2xl);
    padding: 32px;
    box-shadow: var(--ubm-shadow-md);
    z-index: 1;
    position: relative;
  }

  /* brand inside auth card (override default .brand border-bottom) */
  .login-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0;
    border-bottom: 0;
    margin-bottom: 24px;
  }
  .brand-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--ubm-color-text-primary);
    color: var(--ubm-color-surface-panel);
    display: grid;
    place-items: center;
    font-family: var(--ubm-font-serif);
    font-weight: 600;
    font-size: 18px;
    letter-spacing: -0.02em;
  }
  .brand-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .brand-title .jp {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--ubm-color-text-primary);
  }
  .brand-title .en {
    font-size: 11px;
    color: var(--ubm-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-family: var(--ubm-font-en);
  }

  .login-card-title {
    font-size: 24px;
    margin: 0 0 6px 0;
    color: var(--ubm-color-text-primary);
  }
  .login-card-subtitle {
    margin: 0 0 20px 0;
    font-size: 13.5px;
    color: var(--ubm-color-text-secondary);
  }

  /* login-panel stack rhythm */
  .login-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* OR divider */
  .login-or-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0;
    color: var(--ubm-color-text-muted);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-family: var(--ubm-font-en);
  }
  .login-or-line {
    flex: 1;
    height: 1px;
    background: var(--ubm-color-border-default);
  }
  .login-or-label {
    line-height: 1;
  }

  /* register CTA */
  .login-register-cta {
    margin-top: 20px;
    text-align: center;
    font-size: 12.5px;
    color: var(--ubm-color-text-secondary);
  }
  .login-register-cta a {
    color: var(--ubm-color-accent);
    font-weight: 500;
    text-decoration: none;
  }
  .login-register-cta a:hover {
    text-decoration: underline;
  }

  /* sent state */
  .login-sent-block {
    text-align: center;
    padding: 20px 0;
  }
  .login-sent-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: var(--ubm-color-ok-soft);
    color: var(--ubm-color-ok);
    display: grid;
    place-items: center;
    margin: 0 auto 16px;
  }
  .login-sent-title {
    font-size: 20px;
    margin: 0;
    color: var(--ubm-color-text-primary);
  }
  .login-sent-body {
    margin-top: 8px;
    font-size: 13px;
    color: var(--ubm-color-text-secondary);
    line-height: 1.6;
  }
  .login-sent-body b {
    color: var(--ubm-color-text-primary);
  }
}
```

### 4.2 `apps/web/src/styles/globals.css` への追記

```css
/* L3 付近 (legacy-public.css の import の直後) */
@import "./auth.css";
```

### 4.3 OKLch token mapping 一覧（プロトタイプ → tokens.css）

| プロトタイプ token | apps/web 採用 token | 用途 |
|---|---|---|
| `var(--bg)` | `var(--ubm-color-surface-bg)` | auth-shell 背景 |
| `var(--panel)` | `var(--ubm-color-surface-panel)` | auth-card 背景 |
| `var(--border)` | `var(--ubm-color-border-default)` | auth-card border / OR line |
| `var(--text)` | `var(--ubm-color-text-primary)` | brand-mark fg / h1 / b 強調 |
| `var(--text-2)` | `var(--ubm-color-text-secondary)` | subtitle / sent body |
| `var(--text-3)` | `var(--ubm-color-text-muted)` | OR text / brand-title .en |
| `var(--accent)` | `var(--ubm-color-accent)` | register link / radial gradient #1 |
| `var(--info)` | `var(--ubm-color-info)` | radial gradient #2 |
| `var(--ok)` | `var(--ubm-color-ok)` | sent icon foreground |
| `var(--ok-soft)` | `var(--ubm-color-ok-soft)` | sent icon block 背景 |
| `var(--shadow-md)` | `var(--ubm-shadow-md)` | auth-card shadow |
| `var(--font-serif)` | `var(--ubm-font-serif)` | brand-mark 兵 |
| `var(--font-en)` | `var(--ubm-font-en)` | OR / brand-title .en |
| border-radius 24 | `var(--ubm-radius-2xl)` (28px) または直値 `24px` | auth-card。プロトタイプ準拠で `24px` リテラルを採用（`--ubm-radius-2xl` は 28px のため不一致） |

> **注**: `border-radius: 24px;` のみ token に該当値が無い（既存 `--ubm-radius-xl=20` / `--ubm-radius-2xl=28`）。プロトタイプ正本は `24px` のため、本サイクルでは `24px` リテラルを `auth.css` 内に許容する。色ではないため `verify-design-tokens` の HEX gate 対象外。token 追加は scope 外（FR 含まない）。

## 5. Icon 拡張設計

### 5.1 `apps/web/src/components/ui/icons.ts` 改修

```ts
export type IconName =
  | "chevron-down"
  | "chevron-up"
  | "x"
  | "search"
  | "check"
  | "menu"
  | "external-link"
  | "send"
  | "google"
  | "inbox"
  | "arrow-left";
```

### 5.2 `apps/web/src/components/ui/Icon.tsx` への path 追加

各 icon は 24x24 viewBox / `stroke="currentColor"` / `stroke-width="1.6"` / `fill="none"` の lucide 系 path をベースとする（既存 `chevron-*` 系と同じスタイル）。`google` のみマルチカラー官公色のため、`<svg>` 内に `<path fill="...">` を 4 色固定で持つ（branding 例外として HEX 直書きを許容するが `verify-design-tokens` の対象に Google のブランドカラーが入らないか Phase 4 で確認し、必要なら icons.ts 経由の inline ではなく `text-current` で 1-tone 表現に振る）。

| icon name | SVG 内容（要約） | 備考 |
|---|---|---|
| `send` | paper plane outline 24x24 | currentColor stroke のみ |
| `google` | G 文字 multi-color | 4 色 HEX は Google ブランドガイドライン色。HEX 直書き許容 (verify-design-tokens で除外設定を Phase 4 で検討) |
| `inbox` | inbox tray outline | currentColor stroke のみ |
| `arrow-left` | ← 矢印 | currentColor stroke のみ |

### 5.3 Icon HEX 例外の扱い

`google` icon の brand color (HEX 4 色) は `verify-design-tokens` gate の例外として `apps/web/src/components/ui/Icon.tsx` のみを exclude する。Phase 4 で `scripts/verify-design-tokens.mjs` の exclude rule を確認し、既に Icon.tsx が exclude されていれば無改変、未除外なら exclude 追加を別タスクとして Phase 12 unassigned-task に書く。

> **シンプル fallback**: gate 除外調整が難しい場合は、google icon を `currentColor` の 1-tone path（Google "G" silhouette）にして HEX 不使用にする選択肢を Phase 4 で残す。プロトタイプ自体も `<Icon name="google">` を呼ぶだけで色指定はしていないため、1-tone でも正本準拠を満たす。

## 6. レイアウト contract

| 観点 | contract |
|---|---|
| viewport | `auth-shell` は `min-height: 100vh`。`/login` への直接アクセスで scrollbar が出ない範囲（≤ 720px height）でも card 全体が縦中央配置 |
| max-width | auth-card `max-width: 420px`、それを超えるビューポートでは中央寄せ |
| padding | auth-shell `padding: 24px`、auth-card `padding: 32px` |
| spacing | login-panel 内は `gap: 12px`（Button・Form・OrDivider・register-cta の縦リズム） |
| z-index | auth-shell::before（gradient 装飾）= 0、auth-card = 1 |
| 装飾 | radial-gradient 2 つ（accent / info）を `auth-shell::before` で固定。card 自身は装飾なし |
| mobile | breakpoint なし（card max-width 内に収まる単一カラム）。padding は固定 |
| dark mode | 本サイクル対象外（`tokens.css` の dark mode 制御が tokens.css 自体に閉じていれば自動追随、別途分岐は書かない） |

## 7. data-* 属性 / a11y contract

| 要素 | 属性 | 目的 |
|---|---|---|
| `Card` (= auth-card 内) | `data-testid="login-card"` / `data-component="login-card"` / `data-state={state}` | E2E から state 切替を assert |
| `LoginPanel` `<section>` | `data-panel="input"` | input パネル特定 |
| `OrDivider` 外枠 | `role="separator"` + `aria-label="または"` | a11y |
| `brand-mark` `<span>` | `aria-hidden="true"` | h1 が screen reader 上の主見出し |
| `brand-title .en` | （特に指定なし） | 装飾扱い（jp が主、en は読まれても可） |
| sent state icon block | `aria-hidden="true"` | h2 が主見出し |
| h1 / h2 | （native heading） | ヒエラルキー維持 |

## 8. 依存関係（既存 → 追加）

- `apps/web/src/components/ui/Card.tsx` / `CardContent` / `CardFooter` — 無改変
- `apps/web/src/components/ui/Button.tsx` — 無改変（既存 `variant` / `size` / `block` / `leftIcon` が要件を満たす）
- `apps/web/src/components/ui/Input.tsx` — 無改変（`inputSize="lg"` 既存）
- `apps/web/src/components/ui/Field.tsx` — 無改変（`required` 既存）
- `apps/web/src/components/ui/Icon.tsx` — 拡張（IconName + path map）
- `apps/web/src/components/ui/Banner.tsx` — 無改変
- `apps/web/src/lib/url/login-query.ts` — 無改変
- `apps/web/src/lib/url/login-state.ts` — 無改変
- `apps/web/src/lib/auth/magic-link-client.ts` — 無改変
- `apps/web/src/lib/auth/oauth-client.ts` — 無改変
- 新規依存パッケージ: なし

## 9. Phase 2 完了条件

- [x] After のコンポーネント構造図と新規 / 改修 component の責務表を明示
- [x] 各 component の Props / 型シグネチャ要旨を提示
- [x] State 駆動経路を「無改変」と確定
- [x] CSS 配置場所（`apps/web/src/styles/auth.css` 新規 + `globals.css` から import）を確定
- [x] OKLch token mapping 14 行を確定
- [x] Icon 拡張対象（4 値）と HEX 例外の扱いを規定
- [x] レイアウト contract（max-width / padding / spacing / z-index）を確定
- [x] data-* / a11y contract を確定
- [x] 依存関係の改修 / 無改変を明示し、新規依存パッケージなしを確定
