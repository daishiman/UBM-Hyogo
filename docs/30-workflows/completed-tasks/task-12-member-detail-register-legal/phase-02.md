# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-12 の 4 画面の実装仕様（コンポーネント分解 / 関数シグネチャ / ファイル一覧 / データフロー / 状態マトリクス）を固定する。一次原典 §3〜4 を Phase 2 形式に再構成し、Phase 5 実装ランブックがそのまま引用できる粒度で記述する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md` §0.6 / §3 / §4
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-02/main.md`

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` は 4 ページ + 404 page の HTTP / DOM / axe を一括検証する。本 Phase の DOM アンカー（`data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role`）が e2e selector の正本となる。

## 変更対象ファイル一覧

| path | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/app/(public)/members/[id]/page.tsx` | M | Server Component。`fetchPublicOrNotFound` 経由 + `notFound()` フォールバック + ProfileHero / Sections / Tags / Links / Activity の縦積み |
| `apps/web/app/(public)/register/page.tsx` | M | Server Component。`fetchPublic` で form-preview 取得 + `RegisterCallout` + `FormPreviewSections` + 失敗時 `role="alert"` |
| `apps/web/app/privacy/page.tsx` | M | Static page。`LegalProse` primitive 配下に `<h1>` / `<h2>` / `<p>` / `<ul>` |
| `apps/web/app/terms/page.tsx` | M | 同上（利用規約） |
| `apps/web/src/components/public/ProfileHero.tsx` | C/M | Avatar + `<h1>` + nickname + occupation + Chip 行（zone / membershipType / location） |
| `apps/web/src/components/public/MemberDetailSections.tsx` | C | publicSections を section ごとに `<section data-section={key}>` + `<h2>` + KVList。`data-stable-key` 焼き込み |
| `apps/web/src/components/public/MemberTags.tsx` | C | tags を Badge/Chip 配列、空時 `null` |
| `apps/web/src/components/public/MemberLinks.tsx` | C | 全 section から `kind === "url"` を抽出、`target="_blank" rel="noopener noreferrer"` |
| `apps/web/src/components/public/MemberActivity.tsx` | C | `section.key === "activity"` の timeline、なければ `null` |
| `apps/web/src/components/public/RegisterCallout.tsx` | C | responderUrl 外部 CTA + publicConsent / rulesConsent 説明 |
| `apps/web/src/components/public/FormPreviewSections.tsx` | M | sectionCount / fieldCount / 各 section field 概要（既存変更） |
| `apps/web/src/components/legal/LegalProse.tsx` | C | `<article className="prose" data-component="legal-prose">` 薄 wrapper |
| `apps/web/src/components/public/MemberDetailSections.test.tsx` | C | publicSections の `<h2>` / `data-stable-key` / url 除外 / value join を検証 |
| `apps/web/src/components/public/MemberLinks.test.tsx` | C | url 抽出 / 0 件で `null` / `target="_blank" rel="noopener noreferrer"` |
| `apps/web/src/components/public/MemberTags.test.tsx` | C | 0 件 `null` |
| `apps/web/src/components/public/RegisterCallout.test.tsx` | C | responderUrl が `<a>` href に反映、`target="_blank" rel="noopener noreferrer"` |
| `apps/web/src/components/public/FormPreviewSections.test.tsx` | C | 空 sections で crash しない |
| `apps/web/src/components/legal/LegalProse.test.tsx` | C | `<article className="prose">` で wrap、children 描画 |
| `apps/web/playwright/tests/public-detail-register-legal.spec.ts` | C | Playwright smoke。4 ページ + 404 + axe critical=0 |

種別: C=Create / M=Modify / D=Delete

## 関数・型シグネチャ

### `apps/web/app/(public)/members/[id]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";
import {
  fetchPublicOrNotFound,
  FetchPublicNotFoundError,
} from "@/src/lib/fetch/public";
import { ProfileHero } from "@/src/components/public/ProfileHero";
import { MemberDetailSections } from "@/src/components/public/MemberDetailSections";
import { MemberTags } from "@/src/components/public/MemberTags";
import { MemberLinks } from "@/src/components/public/MemberLinks";
import { MemberActivity } from "@/src/components/public/MemberActivity";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage(
  props: MemberDetailPageProps,
): Promise<JSX.Element>;
```

### `apps/web/src/components/public/ProfileHero.tsx`

```tsx
export interface ProfileHeroProps {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}
export function ProfileHero(props: ProfileHeroProps): JSX.Element;
```

DOM: `<header data-component="profile-hero">` + `Avatar(name=fullName)` + `<h1>` + nickname `<small>` + occupation `<p>` + Chip 行（`Badge tone="zone-a..e"` / `tone="success|info|neutral"` / location）。

### `apps/web/src/components/public/MemberDetailSections.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
export interface MemberDetailSectionsProps {
  sections: ReadonlyArray<Section>;
}
export function MemberDetailSections(
  props: MemberDetailSectionsProps,
): JSX.Element;
```

DOM: 各 section を `<section data-section={section.key}>` で wrap、`<h2>` に `section.label`、内部 `<dl>` の各 row に `data-stable-key={field.stableKey}`。`field.kind === "url"` は除外。

### `apps/web/src/components/public/MemberTags.tsx` / `MemberLinks.tsx` / `MemberActivity.tsx`

```tsx
export interface MemberTagsProps {
  tags: ReadonlyArray<{ code: string; label: string; category: string }>;
}
export function MemberTags(props: MemberTagsProps): JSX.Element | null;

export interface MemberLinksProps {
  sections: ReadonlyArray<Section>;
}
export function MemberLinks(props: MemberLinksProps): JSX.Element | null;

export interface MemberActivityProps {
  sections: ReadonlyArray<Section>;
}
export function MemberActivity(props: MemberActivityProps): JSX.Element | null;
```

### `apps/web/app/(public)/register/page.tsx`

```tsx
import type { z } from "zod";
import { FormPreviewViewZ } from "@ubm-hyogo/shared";
import { fetchPublic } from "@/src/lib/fetch/public";
import { RegisterCallout } from "@/src/components/public/RegisterCallout";
import { FormPreviewSections } from "@/src/components/public/FormPreviewSections";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

const FALLBACK_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export default async function RegisterPage(): Promise<JSX.Element>;
```

### `apps/web/src/components/public/RegisterCallout.tsx`

```tsx
export interface RegisterCalloutProps {
  responderUrl: string;
}
export function RegisterCallout(props: RegisterCalloutProps): JSX.Element;
```

DOM: `<section data-component="register-callout">` + 同意 2 点（`publicConsent` / `rulesConsent`）の説明 + 大型 CTA `<a target="_blank" rel="noopener noreferrer" href={responderUrl}>`。

### `apps/web/src/components/legal/LegalProse.tsx`

```tsx
import type { ReactNode } from "react";
export interface LegalProseProps {
  children: ReactNode;
}
export function LegalProse(props: LegalProseProps): JSX.Element;
```

実装: `<article className="prose" data-component="legal-prose">{children}</article>`。

### `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx`

```tsx
import type { Metadata } from "next";
import { LegalProse } from "@/src/components/legal/LegalProse";

export const metadata: Metadata;

export default function PrivacyPage(): JSX.Element;
// or
export default function TermsPage(): JSX.Element;
```

文面は一次原典 §3.3.2 / §3.3.3 を Phase 5 で同一に再掲（暫定文面、最終法務確認は本 task 非ゴール）。

## データフロー / 副作用

### `/(public)/members/[id]`

```
URL  ──► Server Component (app/(public)/members/[id]/page.tsx)
        │
        └─ fetchPublicOrNotFound("/public/members/{id}", { revalidate: 60 })
              │
              ├─ on Workers : env.API_SERVICE.fetch(...)
              └─ on local   : fetch(`${PUBLIC_API_BASE_URL}/public/members/{id}`)
              │
              ├─ apps/api/src/routes/public/member-profile.ts (Hono)
              │       └─ getPublicMemberProfileUseCase(id, { ctx({ DB }) })
              │
              └─ Zod parse via PublicMemberProfileZ.strict()
                    │
                    ├─ 404 → FetchPublicNotFoundError → notFound()
                    ├─ 200 → ProfileHero / Sections / Tags / Links / Activity 描画
                    └─ throw → app/error.tsx boundary（task-05、Sentry capture）
```

### `/(public)/register`

```
Server Component
  └─ fetchPublic("/public/form-preview", { revalidate: 600 })
        ├─ 200 → preview.responderUrl ?? FALLBACK_RESPONDER_URL を CTA 先に
        └─ throw → previewError 文言 + role="alert" + CTA は FALLBACK_RESPONDER_URL
CTA クリック → 外部 https://docs.google.com/forms/...（target="_blank"）
```

サーバ side redirect は採用しない（戻る操作で UX 劣化 + クッキーが渡せない）。iframe 埋め込みも採用しない（不変条件 #7）。

### `/privacy` / `/terms`

完全静的、API 接続なし。Next.js のフルプリレンダー対象。副作用なし。

### 副作用サマリー

| 種別 | 内容 |
| --- | --- |
| 入力 | params (`id`)、Cloudflare Workers env binding (`API_SERVICE`)、ローカル `PUBLIC_API_BASE_URL` |
| 出力 | React tree（4 画面）、`data-stable-key` 属性焼き込み、外部 link DOM |
| 副作用 | Workers fetch / Zod parse / `notFound()` の throw |
| 失敗時挙動 | 404 → Next.js notFound page、その他 throw → task-05 の `app/error.tsx` boundary（Sentry capture） |

## 上流依存の取り込み

| 上流 task | import | 用途 |
| --- | --- | --- |
| task-08 | `var(--ubm-color-zone-{a..e})` / `var(--ubm-color-status-*)` / `var(--ubm-radius-md)` / `var(--ubm-typography-prose-*)` | Chip / Hero / LegalProse のスタイル |
| task-09 | `prose` typography utility | LegalProse |
| task-10 | `import { Button, Card, Badge, Avatar, EmptyState } from "@/components/ui";` | ProfileHero / RegisterCallout / Tags / 404 fallback |
| task-05 | `apps/web/app/error.tsx` boundary（Sentry capture） | throw 経路の receiver |
| 既存 | `import { fetchPublic, fetchPublicOrNotFound, FetchPublicNotFoundError } from "@/src/lib/fetch/public"` | API 取得経路 |
| 既存 | `import { PublicMemberProfileZ, FormPreviewViewZ } from "@ubm-hyogo/shared"` | Zod schema 消費 |

本 task では `apps/api` / `packages/shared` / token 定義 / ui-primitives を **追加変更しない**（上流の export のみ消費）。

## 状態マトリクス

| 画面 | loading | empty | error |
| --- | --- | --- | --- |
| `/(public)/members/[id]` | `loading.tsx`（task-05）の Skeleton hero placeholder | 該当なし（404 で notFound） | `app/error.tsx`（task-05）で `ErrorState` + Sentry capture |
| `/(public)/register` | 軽量（preview なしでも CTA 先行表示可） | preview 取得失敗 → `<p role="alert" data-role="preview-error">` 文言、CTA は FALLBACK_RESPONDER_URL で機能 | `app/error.tsx`（致命例外時のみ） |
| `/privacy` / `/terms` | 静的のため事実上なし | 該当なし | 静的 build 失敗時のみ |

## 19 routes 整合（task-18 への引き継ぎ）

本 task が出力する routes は SCOPE.md の 19 routes 中 4 ルート（`/(public)/members/[id]` / `/(public)/register` / `/privacy` / `/terms`）。task-18 regression-smoke が `staging-smoke-checklist.md` を経由して同一ルートを再走査する。本 task の `data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role` アンカーが selector 正本となる。

## 設計上の判断

| 論点 | 判断 | 理由 |
| --- | --- | --- |
| Google Form を iframe 埋め込みするか | 採用しない | 不変条件 #7（再回答が本人更新の正規経路）+ Cookie / CSRF / 同意フロー上の制約 |
| サーバ side redirect で responderUrl に飛ばすか | 採用しない | 戻る操作で UX 劣化 + クッキー保持不可 |
| `MemberLinks` を section 内に置くか分離か | 分離 | url kind を統一 UI に集約（プロトタイプ §0.9.1 に整合） + a11y target="_blank" 必須付与の一元化 |
| `LegalProse` を `@/components/ui` に登録するか | しない | 法務 typography 専用 wrapper、ui-primitives 表面を増やさない（task-10 の export 不変） |
| revalidate 値 | 60s / 600s | Cloudflare 無料枠 + Google Form 変動頻度（form-preview は cron 同期 60s 上流のため UI 側 600s で十分） |
| `notFound()` を try/catch 内で呼ぶか | 専用 catch のみ throw 連鎖 | `notFound()` 自体が throw するため二重 throw を避ける |
| Avatar の a11y | `aria-hidden` + 隣接 visible 名 | `<h1>` で fullName が読み上げられるため Avatar は decorative |

## 完了条件

- [ ] 変更対象ファイル表が一次原典 §0.3 / §2 / §3 と整合
- [ ] 関数シグネチャが Next.js v15 規約（`params: Promise<{...}>` / Server Component）に準拠
- [ ] 上流 task（task-08/09/10/既存 fetch helper / shared schema）の export のみで実装が完結する設計になっている
- [ ] DOM アンカー（`data-page` / `data-component` / `data-section` / `data-stable-key` / `data-role="back|preview-error"`）が e2e selector 正本として列挙されている
- [ ] 状態マトリクスが loading / empty / error の 3 軸 × 4 画面で埋められている
