# task-10-ui-primitives

> Phase: 04-design-system / Task #10
> 改訂日: 2026-05-07
> 出典: phase-1.md §3 / phase-2.md DAG / phase-3.md §4.10 / `claude-design-prototype/primitives.jsx` (273 行) / `claude-design-prototype/styles.css` (1012 行)

---

## 0. 自己完結コンテキスト

このタスクは下流の task-11..17（screens 全 7 タスク）が再度本ファイルを **読まずに primitive Props を把握できる** よう、全 11 primitive の Props 型シグネチャを §0.7 に inline 展開する。必読は `outputs/phase-1..3`、`CLAUDE.md`、直接の上流である `03-spec-source/task-08-design-tokens-doc.md` および同 phase の `task-09-tailwind-v4-setup.md`。

### 0.1 上位ゴール

`claude-design-prototype/primitives.jsx`（JS, 273 行）の primitive 群を、`apps/web/src/components/ui/` 配下の **TypeScript / RSC-safe** な 11 primitive（Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner）として再実装する。CVA + `tailwind-merge` で variant を型安全に宣言し、すべての色は task-09 の `@theme` 経由で OKLch tokens に直結（HEX 直書き 0 件）。barrel export `@/components/ui` から後続 7 タスクが直接 import 可能な状態にする。

### 0.2 DAG 座標

- **依存元（上流）**: `task-08-design-tokens-doc`（OKLch token semantic = accent / ok / warn / danger / info / zone-a..e）、`task-09-tailwind-v4-setup`（Tailwind v4 + `@theme inline` 完成 = `bg-accent` 等の utility 名空間）
- **依存先（下流）**: `task-11`（公開トップ）、`task-12`（ディレクトリ）、`task-13`（登録）、`task-14`（マイページ）、`task-15`（admin dashboard / members）、`task-16`（admin events）、`task-17`（admin settings）
- **直列性**: task-09 完了後にのみ着手可。本タスク完了後、task-11..17 が **並列着手可能**になる（= 本タスクは並列度を解放する gating task）。
- **ロールバック容易度**: 高（新規ディレクトリ `apps/web/src/components/ui/` 追加のみ。既存コードの書き換えなし）。

### 0.3 触れるファイル群

- C（新規 11 primitive）: `apps/web/src/components/ui/{button,card,badge,input,select,sidebar,stat,empty-state,avatar,field,banner}.tsx`
- C: `apps/web/src/components/ui/index.ts`（barrel export）、`apps/web/src/lib/cn.ts`（clsx + tailwind-merge）
- C: `apps/web/src/components/ui/__tests__/*.test.tsx`（11 primitive × smoke + a11y）
- C: `apps/web/src/test-utils/setup.ts`（jest-dom + jest-axe）、`apps/web/vitest.config.ts`（jsdom 設定）
- M: `apps/web/package.json`（`lucide-react` / `jest-axe` / `@testing-library/*` 追加）
- R（不変）: `apps/web/src/styles/{tokens,globals}.css`（task-09 で確定済み）、`apps/api/**`、既存 `apps/web/app/**` ページ実装

### 0.4 既存 API（不変）

- `apps/api`（Hono on Cloudflare Workers）に一切影響を与えない。
- `apps/web/app/**` の既存ページ実装は本タスクで書き換えない（後続 task-11..17 が利用するための primitive 提供に留まる）。
- D1 binding 経路、Auth.js 認証経路はすべて不変。
- task-09 で確定した `tokens.css` / `globals.css @theme` ブロックは本タスクで変更しない（token 値は task-08 が正本）。

### 0.5 不変条件

1. すべての色は OKLch token 由来の Tailwind utility（`bg-accent` / `text-info` 等）のみで表現する。HEX 直書き / `bg-[#...]` は **0 件**（task-18 CI gate）。
2. CVA の `cva()` で variant を宣言し、`VariantProps<typeof xxxVariants>` を Props に交差させる。
3. `cn()` ヘルパー（`clsx` + `tailwind-merge`）をすべての primitive で `className` マージに使用する。
4. RSC-safe を原則とし、`'use client'` は `Sidebar` のみ（`usePathname` 利用のため）。他 10 primitive は server-safe（`forwardRef` + `useId` のみ）。
5. アイコンは `lucide-react` 採用。prototype 自前 `Icon` 実装は移植しない。
6. 各 primitive に最低 1 ケースの smoke test と 1 ケースの jest-axe a11y test（合計 22 ケース以上）。
7. barrel export `@/components/ui` のみを下流の import 経路とし、ファイル直接 import (`@/components/ui/button`) は規約として禁止（実装時 ESLint rule は task-18 検討）。
8. 11 primitive 以外（Modal / Drawer / Toast / DataTable / Tabs / Skeleton 等）は本タスクのスコープ外。必要時に発生 task で追加する。

### 0.6 上流から受け取るシグネチャ（task-08 + task-09 → task-10）

#### 0.6.1 task-08 の token semantic（不変）

| semantic | 用途 | 対応 token |
|---------|------|-----------|
| accent | 主アクション・ブランド | `--ubm-color-accent` / `-soft` / `-ink` |
| ok (success) | 成功・完了状態 | `--ubm-color-ok` / `-soft`（utility 名は `success`） |
| warn (warning) | 警告・注意 | `--ubm-color-warn` / `-soft`（utility 名は `warning`） |
| danger | エラー・破壊的操作 | `--ubm-color-danger` / `-soft` |
| info | 情報・通知 | `--ubm-color-info` / `-soft` |
| zone-a..e | 5 zone 識別色（Avatar hue 等） | `--ubm-color-zone-a..e` |
| surface (bg / panel) | 背景面 | `--ubm-color-surface-bg` / `-panel`（utility 名は `bg` / `panel`） |
| text (ink / muted) | 本文 / 弱め | `--ubm-color-text-primary` / `-muted`（utility 名は `ink` / `muted`） |
| border (line) | 区切り線 | `--ubm-color-border-default`（utility 名は `line`） |

#### 0.6.2 task-09 が確定した Tailwind utility class 名（不変）

primitive 内で利用可能な utility（OKLch tokens に bridge 済み）:

```
背景:    bg-bg / bg-panel / bg-accent / bg-accent-soft / bg-success / bg-success-soft
        bg-warning / bg-warning-soft / bg-danger / bg-danger-soft / bg-info / bg-info-soft
        bg-zone-a / bg-zone-b / bg-zone-c / bg-zone-d / bg-zone-e
文字:    text-ink / text-muted / text-accent / text-accent-ink / text-success / text-warning
        text-danger / text-info / text-zone-a..e / text-white
ボーダー: border-line / border-accent / border-success / border-warning / border-danger / border-info
半径:    rounded-sm / rounded-md / rounded-lg / rounded-xl / rounded-pill
影:      shadow-sm / shadow-md / shadow-lg
フォント: font-sans / font-mono
任意値:  duration-(--ubm-motion-base) / [transition-duration:var(--ubm-dur-base)]
focus:   focus-visible:ring-accent / focus-visible:ring-danger
```

これらは task-09 の `@theme inline` ブロックで定義済み。`@/lib/cn.ts` の `cn()` で衝突解決。

### 0.7 下流へ渡すシグネチャ（task-10 → task-11..17）

下流 7 タスク（task-11..17）は本ファイルを再読せずとも以下の **import パス + Props 型シグネチャ** で primitive を利用できる。すべて barrel export `@/components/ui` から提供される。

```ts
// 共通 import（後続 task-11..17 はこの 1 行のみで全 primitive 利用可）
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Input, Select, Sidebar, SidebarNavItem, SidebarSection,
  Stat, EmptyState, Avatar, Field, Banner,
  buttonVariants, badgeVariants,
  type ButtonProps, type BadgeProps, type InputProps, type SelectProps,
  type SidebarNavItemProps, type StatProps, type EmptyStateProps,
  type AvatarProps, type FieldProps, type BannerProps,
} from "@/components/ui";

// CVA は class-variance-authority、ReactNode/HTMLAttributes は React からの再利用前提
import type { VariantProps } from "class-variance-authority";
import type {
  ReactNode, ButtonHTMLAttributes, InputHTMLAttributes,
  SelectHTMLAttributes, HTMLAttributes,
} from "react";

// ───────────────────────────────────────────────────────────────
// 1) Button — primary action / inline action
// ───────────────────────────────────────────────────────────────
declare const buttonVariants: (props?: {
  variant?: 'primary' | 'accent' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
}) => string;

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'accent' | 'ghost' | 'soft' | 'danger'; // default: 'ghost'
  size?: 'sm' | 'md' | 'lg';                                     // default: 'md'
  block?: boolean;                                                // default: false
  leftIcon?: ReactNode;                                           // lucide-react Icon 想定
  rightIcon?: ReactNode;
  // children / onClick / disabled 等は ButtonHTMLAttributes から継承
}
// 用例: <Button variant="primary" leftIcon={<Plus size={16}/>}>追加</Button>
// 注意: type は default 'button'（form 内で submit 化したい時のみ type="submit"）

// ───────────────────────────────────────────────────────────────
// 2) Card — 合成 primitive（Header / Title / Description / Content / Footer）
// ───────────────────────────────────────────────────────────────
type CardProps = HTMLAttributes<HTMLDivElement>;
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;       // <h3> 固定
type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>; // <p> 固定
type CardContentProps = HTMLAttributes<HTMLDivElement>;
type CardFooterProps = HTMLAttributes<HTMLDivElement>;
// 用例: <Card><CardHeader><CardTitle>…</CardTitle></CardHeader><CardContent>…</CardContent></Card>

// ───────────────────────────────────────────────────────────────
// 3) Badge — chip 系・status 表示
// ───────────────────────────────────────────────────────────────
declare const badgeVariants: (props?: {
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  outline?: boolean;
}) => string;

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info'; // default: 'default'
  outline?: boolean;                                                         // default: false
  dot?: boolean; // 先頭に小さな丸インジケータを置く
}
// 用例: <Badge tone="success" dot>公開中</Badge>

// ───────────────────────────────────────────────────────────────
// 4) Input — native <input> ラッパ（forwardRef 必須）
// ───────────────────────────────────────────────────────────────
interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg'; // default: 'md'（HTML 標準 size と衝突するため inputSize に rename）
  invalid?: boolean;               // true で aria-invalid + danger ring
}
// 用例: <Input type="email" inputSize="md" invalid={!!error} {...register("email")}/>

// ───────────────────────────────────────────────────────────────
// 5) Select — native <select> ラッパ（MVP は Radix 非依存）
// ───────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean; // true で aria-invalid + danger border
  // children に <option> を直接置く前提
}
// 用例: <Select defaultValue="all"><option value="all">全て</option>…</Select>

// ───────────────────────────────────────────────────────────────
// 6) Sidebar — admin 用 navigation（'use client'。usePathname 利用）
// ───────────────────────────────────────────────────────────────
interface SidebarProps {
  children: ReactNode;        // SidebarSection / SidebarNavItem を並べる
  header?: ReactNode;         // logo 等
  footer?: ReactNode;         // user menu 等
}

interface SidebarNavItemProps {
  href: string;               // next/link href
  icon: ReactNode;            // lucide-react Icon
  label: string;
  matchPrefix?: string;       // active 判定を prefix match にする（既定は完全一致）
}

interface SidebarSectionProps {
  title?: string;             // セクション見出し（uppercase で表示）
  children: ReactNode;        // SidebarNavItem を並べる
}
// active item に aria-current="page" が自動付与される（不変条件）。

// ───────────────────────────────────────────────────────────────
// 7) Stat — KPI 表示（admin dashboard 用）
// ───────────────────────────────────────────────────────────────
interface StatProps {
  label: string;              // KPI 見出し
  value: ReactNode;           // 数値・テキスト・ReactNode 自由
  delta?: ReactNode;          // 増減表示（任意）
  tone?: 'neutral' | 'up' | 'down'; // delta の色（default: 'neutral'）
  className?: string;
}
// 用例: <Stat label="会員数" value={1234} delta="+12 (今月)" tone="up"/>

// ───────────────────────────────────────────────────────────────
// 8) EmptyState — 0 件・未取得時の表示
// ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;           // lucide-react Icon
  title: string;
  description?: string;
  action?: ReactNode;         // <Button> を置く想定
  className?: string;
}
// role="status" が自動付与される。

// ───────────────────────────────────────────────────────────────
// 9) Avatar — 画像なし initial 表示（hue で zone 色振り分け）
// ───────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;               // 先頭 1 文字を initial として表示
  hue?: number;               // member id の hash 値等。zone 5 色に modulo 配色（default: 0）
  size?: 'sm' | 'md' | 'lg' | 'xl'; // default: 'md'
  className?: string;
}
// role="img" + aria-label={name} が自動付与される。

// ───────────────────────────────────────────────────────────────
// 10) Field — label + description + error の wrapper（render-prop で a11y を強制）
// ───────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;         // ラベル末尾に "*必須"
  optional?: boolean;         // ラベル末尾に "任意"
  description?: string;       // 補助説明
  error?: string;             // エラー文（あると role="alert"）
  children: (controlProps: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }) => ReactNode;            // render-prop で id / aria 属性を control に強制注入
  className?: string;
}
// 用例:
//   <Field label="メール" required error={errors.email?.message}>
//     {(p) => <Input type="email" {...p} {...register("email")}/>}
//   </Field>

// ───────────────────────────────────────────────────────────────
// 11) Banner — 公開状態 / 警告告知
// ───────────────────────────────────────────────────────────────
interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'warning' | 'danger'; // default: 'info'
  icon?: ReactNode;
  title?: string;
  action?: ReactNode;          // 右端アクション
  // children は本文 ReactNode
}
// tone='danger'|'warning' で role="alert"、それ以外で role="status" が自動付与される（不変条件）。
```

#### 0.7.1 補助 export

- `buttonVariants(props)` / `badgeVariants(props)`: CVA 関数を named export。下流が同じ variant 体系で別要素（例: `<a className={buttonVariants({variant:'primary'})}>`）に展開する用途。
- `cn(...inputs: ClassValue[]): string`（`@/lib/cn` から。`@/components/ui` の barrel には含めない）

#### 0.7.2 RSC / `'use client'` 境界

- server-safe（'use client' 不要）: Button / Card / Badge / Input / Select / Stat / EmptyState / Avatar / Field / Banner（10 primitive）
- client-only: Sidebar（`usePathname` のため）

下流 task-11..17 は server component から 10 primitive を直接使い、Sidebar のみ client boundary を意識する。

### 0.8 用語

| 用語 | 意味 |
|------|------|
| primitive | 単一責務・最小単位の UI コンポーネント。本タスクで提供する 11 種 |
| CVA (class-variance-authority) | variant 宣言を型安全に行うライブラリ。`cva(base, { variants })` で生成 |
| `cn()` | `clsx` + `tailwind-merge` を組み合わせた className マージユーティリティ |
| variant | primitive の見た目バリエーション（Button の `variant`、Badge の `tone` 等） |
| tone | semantic な色用途を表す variant 名（accent / success / warning / danger / info） |
| render-prop | children に関数を渡すパターン。Field が `useId` で生成した id / aria 属性を control に強制注入する用途で採用 |
| barrel export | `index.ts` で再 export し、利用側の import を 1 経路に集約する慣習 |
| smoke test | 「壊れていないこと」を確認する最小単位のテスト（render + 1 interaction） |
| jest-axe | a11y critical 違反を自動検出する Vitest 互換 matcher（`toHaveNoViolations`） |
| zone | UBM が使う 5 区分（a..e）。Avatar の hue 振り分けや将来の地区別マーカーで利用 |

---

## 1. ヘッダー

| 項目 | 値 |
|------|-----|
| 実装区分 | Frontend / UI primitives ライブラリ |
| 想定工数 | 2.5 day（20 hours） |
| 依存タスク | **task-08（design tokens 正本）** + **task-09（Tailwind v4 + @theme 完成）** |
| 並列可否 | task-09 完了後にのみ着手可。task-11..17 は本タスク完了後に着手 |
| 担当領域 | `apps/web/src/components/ui/` 新設のみ |
| 影響度 | 後続 7 タスク（task-11..17）の前提となるため高 |
| ロールバック容易度 | 高（新規ディレクトリのみ。既存コードを書き換えない） |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `claude-design-prototype/primitives.jsx`（JS, 273 行）の primitive コンポーネント群を、`apps/web/src/components/ui/` 配下の **TypeScript / RSC-safe** primitive に移植する。
2. 11 種の primitive（Button / Card / Badge / Input / Select / Sidebar / Stat / EmptyState / Avatar / Field / Banner）を **CVA + Radix 風 API** で実装し、`bg-accent` `text-info` 等の Tailwind utility 経由で OKLch tokens を参照する。
3. `class-variance-authority`（CVA）で variant を型安全に宣言し、`tailwind-merge` で衝突解決する。
4. アイコンは `lucide-react` を採用し、`Icon` の自前実装は廃止する（prototype の `Icon` は破棄）。
5. 各 primitive に **vitest + @testing-library/react による smoke test 1 ケース以上** + a11y 検証（jest-axe）を 1 ケース。
6. `apps/web/src/components/ui/index.ts` で barrel export を提供し、後続 task-11..17 が `import { Button, Card } from "@/components/ui"` で利用可能にする。

### 2.2 非ゴール

- 完全な shadcn/ui 移植（必要 block のみ参照、依存 (`@radix-ui/*`) は最小限）。
- Toast / Modal / Drawer / DataTable / Tabs / Skeleton 等の interactive primitive（後続 task-11..17 で発生時に追加。本タスクの 11 種に絞る）。
- Storybook 本格導入（smoke test で代替）。
- フォームバリデーション（react-hook-form / zod）統合。task-13/14 の登録/プロフィール画面で実装する。
- ダークモードのスタイル微調整（token 側で追従するため不要）。

---

## 3. 変更対象ファイル表

| path | 種別 | 概要 |
|------|------|------|
| `apps/web/src/components/ui/button.tsx` | C | `Button` primitive。CVA variant: `variant`(primary/accent/ghost/soft/danger) × `size`(sm/md/lg)。 |
| `apps/web/src/components/ui/card.tsx` | C | `Card` / `CardHeader` / `CardTitle` / `CardContent` / `CardFooter` の合成 primitive。 |
| `apps/web/src/components/ui/badge.tsx` | C | `Badge` (= prototype の Chip)。tone(default/accent/success/warning/danger/info) × outline boolean。 |
| `apps/web/src/components/ui/input.tsx` | C | `Input` primitive（native input ラッパ）。`size`(sm/md/lg) variant。`forwardRef` 必須。 |
| `apps/web/src/components/ui/select.tsx` | C | `Select` primitive（native select ベース。Radix Select は後続 task で必要時に置換）。 |
| `apps/web/src/components/ui/sidebar.tsx` | C | admin layout 用 `Sidebar` / `SidebarNavItem` / `SidebarSection`。`'use client'`（active state 持つため）。 |
| `apps/web/src/components/ui/stat.tsx` | C | KPI 用 `Stat` primitive。`label` / `value` / `delta` / `tone` を表示。 |
| `apps/web/src/components/ui/empty-state.tsx` | C | `EmptyState` primitive。`icon` / `title` / `description` / `action`。 |
| `apps/web/src/components/ui/avatar.tsx` | C | `Avatar` primitive（写真 store 機能は MVP では除外し、initial + hue 配色のみ実装）。 |
| `apps/web/src/components/ui/field.tsx` | C | `Field`(label + description + error wrapper) primitive。`<label>` 関連付けを内部で `useId`。 |
| `apps/web/src/components/ui/banner.tsx` | C | `Banner` primitive（公開状態 / 警告告知用）。tone(info/success/warning/danger)。 |
| `apps/web/src/components/ui/index.ts` | C | barrel export。 |
| `apps/web/src/lib/cn.ts` | C | `cn()` ヘルパー（clsx + tailwind-merge）。 |
| `apps/web/src/components/ui/__tests__/*.test.tsx` | C | 11 primitive それぞれに smoke test + a11y test。 |
| `apps/web/package.json` | M | `lucide-react@^0.450.0` / `jest-axe@^9.0.0` / `@testing-library/react@^16.0.0` / `@testing-library/jest-dom@^6.5.0` / `@testing-library/user-event@^14.5.2` を追加。 |
| `apps/web/vitest.config.ts` | C/M | jsdom env / setupFiles 設定。 |
| `apps/web/src/test-utils/setup.ts` | C | `@testing-library/jest-dom` の expect 拡張 + jest-axe 登録。 |

### 3.1 shadcn/ui からの流用判断

| block | 採用 | 理由 |
|-------|------|------|
| `button` | △（参考） | CVA variant 構造を参考にしつつ、tone を OKLch token 名に置換 |
| `card` | ○ | shadcn の構成（Header/Title/Description/Content/Footer）をそのまま採用 |
| `badge` | △（参考） | shadcn の variant 構造を tone に拡張 |
| `input` | ○ | shadcn 構造をそのまま採用 |
| `label` | ○ | `field.tsx` 内部で `<label htmlFor>` パターンを採用 |
| `dialog` / `dropdown-menu` / `sheet` / `tooltip` | × | 本タスクでは未採用。後続 task-15/16 で必要時に追加 |
| `select` | × | Radix `@radix-ui/react-select` 依存を MVP では避け native select で開始 |
| `avatar` | △ | shadcn は Radix 依存。本タスクは画像なし initial 表示のみで native 実装 |
| `sidebar` | × | shadcn の sidebar block は重い。プロトタイプ準拠で自前実装 |
| `sonner` (toast) | × | 本タスク非対象 |

---

## 4. 関数 / 型シグネチャ実例

### 4.1 `apps/web/src/lib/cn.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class 衝突を解消しつつ条件付き class を結合する標準ヘルパー。
 * すべての primitive で className マージに使用する。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 4.2 `apps/web/src/components/ui/button.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button primitive
 *
 * - tone は OKLch token に直結（bg-accent / text-info 等）
 * - polymorphic は本 MVP では未対応（必要時 Slot で後追い）
 */
const buttonVariants = cva(
  // base: 共通 layout / focus / disabled
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-md font-medium",
    "transition-colors duration-(--ubm-motion-base)",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-ink",
        accent:
          "bg-accent-soft text-accent-ink hover:bg-accent-soft/80",
        ghost:
          "bg-transparent text-ink hover:bg-line/60",
        soft:
          "bg-panel text-ink border border-line hover:bg-line/40",
        danger:
          "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * `lucide-react` の Icon コンポーネントを直接渡す（先頭表示）。
   * 例: `<Button leftIcon={<Plus size={16}/>}>追加</Button>`
   */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, block, leftIcon, rightIcon, children, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...rest}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
);

export { buttonVariants };
```

### 4.3 `apps/web/src/components/ui/card.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-panel text-ink rounded-lg border border-line shadow-sm",
      className,
    )}
    {...rest}
  />
));
Card.displayName = "Card";

export const CardHeader = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pb-3 flex flex-col gap-1.5", className)} {...rest} />
);

export const CardTitle = ({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold leading-none", className)} {...rest} />
);

export const CardDescription = ({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted", className)} {...rest} />
);

export const CardContent = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-3", className)} {...rest} />
);

export const CardFooter = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-3 flex items-center gap-2", className)} {...rest} />
);
```

### 4.4 `apps/web/src/components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "rounded-pill border px-2 py-0.5",
    "text-xs font-medium",
  ],
  {
    variants: {
      tone: {
        default: "bg-line/40 text-ink border-line",
        accent: "bg-accent-soft text-accent-ink border-accent/30",
        success: "bg-success-soft text-success border-success/30",
        warning: "bg-warning-soft text-warning border-warning/30",
        danger: "bg-danger-soft text-danger border-danger/30",
        info: "bg-info-soft text-info border-info/30",
      },
      outline: {
        true: "bg-transparent",
        false: "",
      },
    },
    defaultVariants: { tone: "default", outline: false },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, outline, dot, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, outline }), className)} {...rest}>
      {dot && <span aria-hidden className="size-1.5 rounded-pill bg-current" />}
      {children}
    </span>
  );
}

export { badgeVariants };
```

### 4.5 `apps/web/src/components/ui/input.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  [
    "w-full bg-panel text-ink",
    "border border-line rounded-md",
    "placeholder:text-muted",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
    "disabled:opacity-60 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      inputSize: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base",
      },
      invalid: {
        true: "border-danger focus-visible:ring-danger",
        false: "",
      },
    },
    defaultVariants: { inputSize: "md", invalid: false },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, inputSize, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ inputSize, invalid }), className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);
```

### 4.6 `apps/web/src/components/ui/select.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border bg-panel pl-3 pr-8 text-sm text-ink",
          "border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent",
          invalid && "border-danger focus-visible:ring-danger",
          "disabled:opacity-60",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
```

### 4.7 `apps/web/src/components/ui/sidebar.tsx`

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  /** path 完全一致以外で active 判定したい場合に prefix を渡す */
  matchPrefix?: string;
}

export function SidebarNavItem({ href, icon, label, matchPrefix }: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = matchPrefix ? pathname.startsWith(matchPrefix) : pathname === href;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
        "text-ink hover:bg-line/40 transition-colors duration-(--ubm-motion-fast)",
        active && "bg-accent-soft text-accent-ink font-medium",
      )}
    >
      <span aria-hidden className="size-4 shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export interface SidebarProps {
  children: React.ReactNode;
  /** ヘッダ位置に表示するロゴ等 */
  header?: React.ReactNode;
  /** フッタ位置（user menu 等） */
  footer?: React.ReactNode;
}

export function Sidebar({ children, header, footer }: SidebarProps) {
  return (
    <aside
      aria-label="primary navigation"
      className="flex h-screen w-60 flex-col border-r border-line bg-panel"
    >
      {header && <div className="p-4 border-b border-line">{header}</div>}
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {children}
      </nav>
      {footer && <div className="p-3 border-t border-line">{footer}</div>}
    </aside>
  );
}

export function SidebarSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      {title && (
        <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
```

### 4.8 `apps/web/src/components/ui/stat.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const statDeltaVariants = cva("text-xs font-medium", {
  variants: {
    tone: {
      neutral: "text-muted",
      up: "text-success",
      down: "text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface StatProps extends VariantProps<typeof statDeltaVariants> {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, delta, tone, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border border-line bg-panel p-4", className)}>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold leading-tight text-ink">{value}</div>
      {delta != null && <div className={statDeltaVariants({ tone })}>{delta}</div>}
    </div>
  );
}
```

### 4.9 `apps/web/src/components/ui/empty-state.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-panel p-10 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
```

### 4.10 `apps/web/src/components/ui/avatar.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-pill font-medium select-none",
  {
    variants: {
      size: {
        sm: "size-6 text-xs",
        md: "size-8 text-sm",
        lg: "size-10 text-base",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const HUE_BG_CLASS = [
  "bg-zone-a/20 text-zone-a",
  "bg-zone-b/20 text-zone-b",
  "bg-zone-c/20 text-zone-c",
  "bg-zone-d/20 text-zone-d",
  "bg-zone-e/20 text-zone-e",
] as const;

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  /** member id 等から hash を取って zone カラーを circular に割り当てる */
  hue?: number;
  className?: string;
}

export function Avatar({ name, hue = 0, size, className }: AvatarProps) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const idx = ((hue % HUE_BG_CLASS.length) + HUE_BG_CLASS.length) % HUE_BG_CLASS.length;
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(avatarVariants({ size }), HUE_BG_CLASS[idx], className)}
    >
      {initial}
    </span>
  );
}
```

### 4.11 `apps/web/src/components/ui/field.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  error?: string;
  children: (controlProps: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
  className?: string;
}

/**
 * Field は **render-prop** で control に id / aria-describedby / aria-invalid を渡す。
 * これにより `<label htmlFor>` の関連付けと a11y 属性付与を漏れなく強制する。
 */
export function Field({ label, required, optional, description, error, children, className }: FieldProps) {
  const id = React.useId();
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink flex items-center gap-1">
        {label}
        {required && <span className="text-danger text-xs">*必須</span>}
        {optional && <span className="text-muted text-xs">任意</span>}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) || undefined })}
      {description && !error && (
        <p id={descId} className="text-xs text-muted">{description}</p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
```

使用例:

```tsx
<Field label="メール" required error={form.email?.error}>
  {(p) => <Input type="email" {...p} value={form.email.value} onChange={…} />}
</Field>
```

### 4.12 `apps/web/src/components/ui/banner.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const bannerVariants = cva(
  "flex items-start gap-3 rounded-md border p-3 text-sm",
  {
    variants: {
      tone: {
        info: "bg-info-soft text-info border-info/30",
        success: "bg-success-soft text-success border-success/30",
        warning: "bg-warning-soft text-warning border-warning/30",
        danger: "bg-danger-soft text-danger border-danger/30",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  icon?: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export function Banner({ className, tone, icon, title, action, children, ...rest }: BannerProps) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"}
         className={cn(bannerVariants({ tone }), className)} {...rest}>
      {icon && <span aria-hidden className="mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1">
        {title && <div className="font-medium leading-tight">{title}</div>}
        {children && <div className="text-sm">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
```

### 4.13 `apps/web/src/components/ui/index.ts`

```ts
// Barrel export — 後続 task-11..17 はここから import する
export { Button, buttonVariants, type ButtonProps } from "./button";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { Input, type InputProps } from "./input";
export { Select, type SelectProps } from "./select";
export { Sidebar, SidebarNavItem, SidebarSection, type SidebarNavItemProps } from "./sidebar";
export { Stat, type StatProps } from "./stat";
export { EmptyState, type EmptyStateProps } from "./empty-state";
export { Avatar, type AvatarProps } from "./avatar";
export { Field, type FieldProps } from "./field";
export { Banner, type BannerProps } from "./banner";
```

---

## 5. 入力・出力・副作用

### 5.1 入力

- `claude-design-prototype/primitives.jsx`（参照のみ。直接コードは使わず TypeScript で書き直す）
- task-08 design tokens（OKLch token 名）
- task-09 `globals.css @theme`（utility 名 = `bg-accent` `text-info` 等）

### 5.2 出力

- `apps/web/src/components/ui/*.tsx`（11 ファイル + index.ts + cn.ts）
- 11 primitive 分のテストファイル
- `apps/web/package.json` 更新

### 5.3 副作用

- prototype 由来の global css class（`.btn` `.chip` `.field` 等）への依存を **本タスクで完全に断つ**。task-09 で削除した `app/styles.css` の代替が primitive 経由でのみ提供される状態にする。
- `lucide-react` 追加によるバンドルサイズ増（tree-shake 前提・per-icon import を徹底）。

---

## 6. テスト方針

### 6.1 stack

- vitest（既存設定を `apps/web/vitest.config.ts` で jsdom 化）
- `@testing-library/react` / `@testing-library/user-event` / `@testing-library/jest-dom`
- `jest-axe`（a11y critical 違反 0 を検証）

### 6.2 `apps/web/vitest.config.ts`（差分例）

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-utils/setup.ts"],
    globals: true,
    css: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

### 6.3 `apps/web/src/test-utils/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend({ toHaveNoViolations });
```

### 6.4 smoke test 例 — Button

```tsx
// apps/web/src/components/ui/__tests__/button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Button } from "../button";

describe("Button", () => {
  it("クリックで onClick が呼ばれる", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>送信</Button>);
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disabled 時はクリックされない", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick} disabled>送信</Button>);
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("a11y 違反がない", async () => {
    const { container } = render(<Button variant="primary">送信</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### 6.5 smoke test 例 — Field（render-prop a11y 確認）

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Field } from "../field";
import { Input } from "../input";

it("Field: label と input が htmlFor で関連付く", async () => {
  render(
    <Field label="メール" required description="連絡先">
      {(p) => <Input type="email" {...p} />}
    </Field>,
  );
  const input = screen.getByLabelText(/メール/);
  expect(input).toBeInTheDocument();
  expect(input).toHaveAttribute("aria-describedby");
});

it("Field: a11y violation なし", async () => {
  const { container } = render(
    <Field label="メール"><span>{(p) => <Input {...p} />}</span></Field>,
  );
  expect(await axe(container)).toHaveNoViolations();
});
```

### 6.6 全 primitive のテストカバレッジ要件

| primitive | 必須テスト |
|-----------|-----------|
| Button | onClick / disabled / a11y |
| Card | render + composition smoke |
| Badge | tone variant 切替 + a11y |
| Input | value/onChange / invalid 時の aria-invalid / a11y |
| Select | option 切替 / a11y |
| Sidebar | active な NavItem に `aria-current="page"` / a11y |
| Stat | label / value 表示 + delta tone |
| EmptyState | role="status" / action click |
| Avatar | initial 表示 / aria-label |
| Field | label-input 関連付け / error 時 role="alert" |
| Banner | tone=danger で role="alert" / a11y |

---

## 7. ローカル実行コマンド

```bash
# 依存追加
mise exec -- pnpm install

# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# unit + a11y テスト
mise exec -- pnpm --filter @ubm-hyogo/web test

# Next dev で primitive 動作確認（開発中）
mise exec -- pnpm --filter @ubm-hyogo/web dev

# Cloudflare Workers ビルド検証（最終確認）
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

---

## 8. DoD（Definition of Done）

- [ ] `apps/web/src/components/ui/` 配下に 11 primitive ファイルすべて（button / card / badge / input / select / sidebar / stat / empty-state / avatar / field / banner）が存在する
- [ ] `apps/web/src/components/ui/index.ts` から 11 primitive の named export が解決でき、`import { Button, Card, Badge, Input, Select, Sidebar, SidebarNavItem, Stat, EmptyState, Avatar, Field, Banner } from "@/components/ui"` が typecheck を通る
- [ ] 各 primitive が **CVA で variant を宣言**しており、`bg-accent` / `text-info` / `border-warn` 等 OKLch token 由来の Tailwind utility のみで色を表現している（HEX 直書き / `bg-[#...]` 0 件）
- [ ] `lucide-react` を採用し、prototype の自前 `Icon` 実装は移植していない
- [ ] `pnpm --filter @ubm-hyogo/web typecheck` が **0 error** で完了する
- [ ] `pnpm --filter @ubm-hyogo/web test` が pass し、各 primitive に最低 1 ケースの smoke test と 1 ケースの jest-axe テストが存在する（合計 22 ケース以上）
- [ ] `pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0 で完了する
- [ ] Field primitive が `useId` で `<label htmlFor>` と control の id / aria-describedby / aria-invalid を漏れなく接続している
- [ ] Sidebar の active item に `aria-current="page"` が付与される
- [ ] Banner で `tone=danger|warning` のとき `role="alert"`、それ以外で `role="status"` が付与される

---

## 9. リスク / 制約

| リスク | 影響 | 緩和策 |
|--------|------|--------|
| Tailwind v4 で arbitrary property `transition-colors duration-(--ubm-motion-base)` が未対応 | duration が効かない | v4 では `var()` ベースの arbitrary value をサポート。動作不可なら `[transition-duration:var(--ubm-motion-base)]` 形式に置換 |
| `'use client'` 汚染 | RSC tree が広がりバンドル増 | Sidebar のみ client。他 10 primitive はすべて server-safe（`forwardRef` のみ）。Field の `useId` は React 19 で server-safe |
| `lucide-react` per-icon import 漏れ | バンドル増 | ESLint rule `no-restricted-imports` を将来追加（task-18 で検討） |
| native `<select>` の見た目差 | UX 一貫性 | MVP 許容。task-15/16 で必要時に Radix Select に差し替え |
| Avatar の hue 配色が 5 色（zone 数）に限定 | id ハッシュとの非一致 | `hue` を caller 側で `hash(id) % 5` で整数化する責務に明示 |

---

## 10. 後続タスクへのハンドオフ

- task-11..14（公開層 / 会員層）は本 11 primitive のみで構築可能（DataTable / Modal / Drawer などは task-15..17 で必要時に追加）。
- task-15 (admin-dashboard-and-members) では `Sidebar` + `Stat` + `Card` + `Badge` を中心に組み立てる。`MemberDrawer` は本タスクで未提供のため、当該 task で `Drawer` primitive を新設する（本仕様外）。
- task-18 (verify-tokens-and-playwright-smoke) は `apps/web/src` の HEX 直書き / `bg-[#` を grep で fail 判定するため、本タスクの primitive はすべて token utility のみで構成すること（DoD 必須）。
- shadcn/ui からの追加 block 採用は本仕様 §3.1 の表を更新し、必ず別タスクで扱う（本タスクで block を増やさない）。


---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
