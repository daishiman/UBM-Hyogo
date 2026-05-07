# task-12: member-detail-register-legal

> 公開層のうち `/(public)/members/[id]`（会員詳細）, `/(public)/register`（入会登録）, `/privacy`（プライバシーポリシー）,
> `/terms`（利用規約）の **4 画面** を、設計言語と OKLch tokens に揃えて再構成する実装タスク。
>
> **依存**: task-08 (design-tokens-doc) / task-09 (tailwind-v4-setup) / task-10 (ui-primitives) 完了後に着手する。
> **並列可**: task-11（公開トップ・一覧）, task-13..17（会員/管理層）と並列実行可。

---

## §0. 自己完結コンテキスト

> このセクションは、本タスク単体で実装に着手できるよう、上位ワークフロー / 既存実装 / 上下流契約 / 用語 / プロトタイプ概念を **inline 自己完結** で要約する。
> 上位ドキュメント（`outputs/phase-1..3` / `CLAUDE.md` / task-08 / task-10 / プロトタイプ）への往復を最小化する目的。

### §0.1 上位ゴール

- ワークフロー `ui-prototype-alignment-mvp-recovery` の最終目的は、**Cloudflare Workers + Next.js（apps/web）の公開層 UI を `claude-design-prototype` の構造へ揃え、OKLch tokens / ui-primitives / 既存 API surface に整合させた MVP を復元する**こと。
- 本タスク（task-12）はその DAG のうち **公開会員詳細 `/(public)/members/[id]` / 入会登録 `/(public)/register` / 法務 2 画面 `/privacy`・`/terms`** の **計 4 画面**を担当する。詳細は `pages-public.jsx` 由来、register / privacy / terms は **プロトタイプ未掲載** のため本ワークフローで派生定義する。
- 不変条件（CLAUDE.md）: D1 直接アクセス禁止 / `apps/api` 経由のみ / OKLch tokens 必須 / `consent` キーは `publicConsent`/`rulesConsent` 統一 / Google Form 再回答が本人更新の正規経路（埋め込み iframe 不採用、外部 link 遷移）。

### §0.2 DAG 座標

- 依存元: **task-08（design-tokens-doc）/ task-09（tailwind-v4-setup）/ task-10（ui-primitives）**。これらが先に main に入っていなければ実装に着手しない。
- 依存先: **task-18（regression / verify-design-tokens）**。本タスクが終わると task-18 の HEX 直書き走査対象に含まれる。
- 並列可: **task-11（同 05-screens-public 配下、公開トップ・一覧）/ task-13..17（06-screens-member, 07-screens-admin）**。コンポーネントの新規追加が中心で衝突リスクは低い。
- 触らない領域: `apps/api/src/routes/public/*`（既存契約のみ消費）、認証層（`apps/web/app/(auth)`）、管理層、`/`・`/(public)/members`（task-11）。

### §0.3 触れるファイル群（新規 / 変更）

- 変更 (M): `apps/web/app/(public)/members/[id]/page.tsx`、`apps/web/app/(public)/register/page.tsx`、`apps/web/app/privacy/page.tsx`、`apps/web/app/terms/page.tsx`、`apps/web/src/components/public/{ProfileHero,FormPreviewSections}.tsx`
- 新規 (C): `apps/web/src/components/public/{MemberDetailSections,MemberTags,MemberLinks,MemberActivity,RegisterCallout}.tsx`、`apps/web/src/components/legal/LegalProse.tsx`、各 vitest、`apps/web/e2e/public-detail-register-legal.spec.ts`
- 不可触: `apps/api/**`、`packages/shared/**` の Z スキーマ（消費のみ）、token 定義（task-08 の正本）、`/`・`/(public)/members`（task-11 の責務）

### §0.4 既存 API surface（不変・本タスクで変更しない）

`apps/api/src/routes/public/` 配下に Hono Router として実装済み。本タスクは consumer 側のみ実装する。

| Method | Path | Hono ファイル | 備考 |
|--------|------|---------------|------|
| GET | `/public/members/:memberId` | `member-profile.ts` | 詳細画面のソース。404 で notFound()。 |
| GET | `/public/form-preview` | `form-preview.ts` | register 画面で responderUrl + section preview を取得。Cache 60s。 |
| GET | `/public/stats` | `stats.ts` | 本タスクでは未使用（task-11） |
| GET | `/public/members` | `members.ts` | 本タスクでは未使用（task-11） |

呼び出しは `apps/web/src/lib/fetch/public.ts`（既存）の `fetchPublic` / `fetchPublicOrNotFound` 経由のみ。Workers 上では `env.API_SERVICE.fetch(...)`、ローカルは `${PUBLIC_API_BASE_URL}` 直叩き。

### §0.5 不変条件（本タスクに効くもの）

1. `stableKey` 経由でのみ field を参照する。詳細ページは **全 KV row に `data-stable-key={field.stableKey}` を必ず付与**（task-18 監査対象）。
2. `consent` キーは `publicConsent` / `rulesConsent` のみ。RegisterCallout の説明文は **この 2 キー名のみ**を使う。
3. D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から `D1Database` import 禁止）。
4. GAS prototype は本番仕様に昇格させない（参照のみ）。
5. Google Form 再回答が本人更新の **正規経路**。register は外部 link 遷移（target=_blank）、iframe 埋め込み禁止、サーバ側 redirect 不採用。
6. revalidate は無料枠を意識する（member-profile=60s, form-preview=600s）。
7. 色は OKLch tokens のみ（HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止、task-18 が走査）。

### §0.6 上流シグネチャ（inline 展開）

#### §0.6.1 ui-primitives（task-10 由来、本タスクで使う側のみ要約）

- `Button`: `extends ButtonHTMLAttributes`, `VariantProps`（variant: primary/secondary/ghost/danger, size: sm/md/lg, block: bool）+ `leftIcon? rightIcon?: ReactNode`。
- `Card`: shadcn 構成、`Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`。
- `Badge`: `VariantProps`（tone: neutral/info/success/warn/danger/zone-a..e, outline: bool, dot: bool）+ `children`。Chip 表示に流用。
- `Input`: `extends InputHTMLAttributes<HTMLInputElement>`（本タスクでは register に form 自体は置かないので使用機会は少）。
- `Select`: `extends SelectHTMLAttributes<HTMLSelectElement>`（本タスクでは未使用想定）。
- `Avatar`: `{ name: string; hue?: number; size?: "sm"|"md"|"lg"|"xl"; className? }`。`role="img" aria-label={name}` で initial を描画。ProfileHero で利用。
- `EmptyState`: `{ icon?: ReactNode; title: string; description?: string; action?: ReactNode; className? }`、`role="status"`。Tags/Links 0 件は `null` 返却で empty 自体を出さないが、404 fallback で利用余地あり。
- `Field`: `{ label; required?; optional?; description?; error?; children: (controlProps) => ReactNode }` の **render-prop**。本タスクの register は外部 form なので使用なし、利用規約同意の説明文中で参照のみ。

import 経路: `import { Button, Card, Badge, Avatar, EmptyState } from "@/components/ui";`。

#### §0.6.2 既存 API（apps/api 既存、`@ubm-hyogo/shared` から zod スキーマを import して strict parse）

- `GET /public/members/:id` → 出力 `PublicMemberProfileZ`
  - 概念: `{ memberId; summary: { fullName; nickname; occupation; location; ubmZone | null; ubmMembershipType | null }; tags: Array<{ code; label; category }>; publicSections: Array<{ key; label; fields: Array<{ stableKey; label; kind; value }> }> }`
  - `kind` は `"text" | "url" | "tags" | "list"` 等。`url` は `MemberLinks` に集約、それ以外は `MemberDetailSections` の `KVList`。
  - `value` が配列 → `value.join(", ")`、null/empty → `"—"`。
- `GET /public/form-preview` → 出力 `FormPreviewViewZ`
  - 概念: `{ formId: string; responderUrl: string | null; sectionCount: number; questionCount: number; sections: Array<{ key; label; fieldCount; fields: Array<{ stableKey; label; kind; required }> }> }`。
  - `responderUrl` が null の場合は CLAUDE.md 記載の **FALLBACK_RESPONDER_URL**（`https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`）に fallback。
- `GET /public/stats` / `GET /public/members?...` → 本タスクでは未使用（task-11 が消費）。

`apps/web/src/lib/fetch/public.ts` の `fetchPublic` / `fetchPublicOrNotFound` は内部で `XxxZ.strict().parse()` を行い、404 のみ `FetchPublicNotFoundError` を throw する。

### §0.7 下流シグネチャ（task-18 / task-11 → consumer）

- task-18 `verify-design-tokens.ts` は `apps/web/src/components/{public,legal}/**` を走査対象に含める。本タスクは「`bg-[#`, `text-[#`, `#[0-9a-f]{3,8}` を含まない」状態で完了させる。
- 後続が依存する **本タスク産アンカー**: `data-page="member-detail" / data-page="register" / data-page="privacy" / data-page="terms" / data-component="profile-hero" / data-component="register-callout" / data-component="legal-prose" / data-section={section.key} / data-stable-key={field.stableKey} / data-role="back" / data-role="preview-error"`。
- task-11 が出す `data-role="back"`（一覧へ戻る）の互換: 本タスク詳細ページの `<a href="/members" data-role="back">` と同一属性で揃える。

### §0.8 用語

| 語 | 定義 |
|----|------|
| Zone | UBM の事業ステージ分類 0→1 / 1→10 / 10→100（token: `--ubm-color-zone-{a..e}`）。ProfileHero の Chip で使用。 |
| publishState | 会員の公開状態。詳細ページは `public` のみ表示対象（API 側で絞り込み済み）。 |
| stableKey | フォーム項目の安定識別子。詳細の全 KV row に `data-stable-key` で焼く（不変条件 #1 監査）。 |
| publicConsent / rulesConsent | Google Form 内で取得する 2 種同意キー。RegisterCallout の説明文は **この 2 キー名のみ**を使う。 |
| responderUrl | Google Form 公開回答 URL。`/public/form-preview` 由来 or FALLBACK_RESPONDER_URL。 |
| LegalProse | typography utility（`prose`）の薄い wrapper primitive。`<article className="prose" data-component="legal-prose">` で `<h1>/<h2>/<p>/<ul>` を統一描画。 |
| KVList | section 内の `{label, value}` ペアを `<dl><dt><dd>` で表現する内部表記（MemberDetailSections の row）。 |

### §0.9 担当画面の概念（プロトタイプ要約）

#### §0.9.1 `/(public)/members/[id]`（会員詳細）

- レイアウト: 戻るリンク → ProfileHero → MemberTags → MemberDetailSections（複数 `<section>`）→ MemberLinks → MemberActivity を縦積み。
- 主要セクション:
  - **ProfileHero**: Avatar + `<h1>` fullName + nickname small + occupation + Chip 行（zone / membershipType / location）。
  - **MemberDetailSections**: `publicSections` を section ごとに `<section data-section={key}>` + `<h2>` + `KVList` 展開。`url` kind は除外。
  - **MemberTags**: tags を Badge/Chip 配列。0 件は `null`。
  - **MemberLinks**: 全 section から `kind==="url"` を抽出し `target="_blank" rel="noopener noreferrer"` で表示。0 件は `null`。
  - **MemberActivity**: `section.key === "activity"` のものを timeline 表示。なければ `null`。
- 状態:
  - loading: `loading.tsx` で hero placeholder。
  - empty: 該当なし（API 404 → `notFound()` で Next.js 404 ページ）。
  - error: `error.tsx` で `ErrorState`（Sentry capture）。
- プロトタイプ由来 vs 派生: ProfileHero / Sections / Tags / Links は `pages-public.jsx` 由来。`data-stable-key` 焼き込みは本タスクの不変条件遵守派生。

#### §0.9.2 `/(public)/register`（入会登録）

- レイアウト: page-head（eyebrow + `<h1>` + 流れの説明） → RegisterCallout（同意 2 点 + 大型外部 CTA） → FormPreviewSections（section 概要）→ ログイン誘導。
- 主要セクション:
  - **RegisterCallout**: `publicConsent` / `rulesConsent` の **同意項目の説明**（編集 UI は置かない）+ `<a href={responderUrl} target="_blank" rel="noopener noreferrer">` の大型 CTA。
  - **FormPreviewSections**: `sectionCount`/`questionCount`/各 section の field 概要。
- 状態:
  - loading: 軽量。preview 取得中は CTA が先行表示できる。
  - empty: preview の sections が空 → FormPreviewSections は crash せず空 render。
  - error: preview 取得失敗 → `<p role="alert" data-role="preview-error">` 文言、CTA は **FALLBACK_RESPONDER_URL** で機能維持。
- プロトタイプ由来 vs 派生: **プロトタイプ未掲載**（本ワークフロー派生）。MVP 仕様（CLAUDE.md 不変条件 #7）に従い、外部 link 遷移を本タスクで定義。

#### §0.9.3 `/privacy` / `/terms`（法務 2 画面）

- レイアウト: `<main data-page="privacy|terms">` 配下に `LegalProse` 1 個、内部に `<h1>` → `<h2>` 階層 + `<p>`/`<ul>`。
- 主要セクション: `LegalProse` primitive で typography を統一。`<h1>` 1 個のみ、`<h2>` は 5〜6 項目。末尾に `<a href="/">トップに戻る</a>`。
- 状態: 完全静的、API 接続なし。Next.js のフルプリレンダー対象。loading/empty/error は事実上発生しない（build 失敗時のみ）。
- プロトタイプ由来 vs 派生: **プロトタイプ未掲載**（本ワークフロー派生）。文面は暫定（最終法務確認は非ゴール）、レイアウト整備のみが本タスクの責務。

---

## 0. ヘッダー

| 項目 | 値 |
|------|----|
| task id | task-12 |
| ワークフロー | `ui-prototype-alignment-mvp-recovery` |
| Phase | Phase 4-7（実装） |
| 区分 | screens-public |
| 対象画面 | `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 依存タスク | task-08, task-09, task-10（完了必須） |
| 並列可タスク | task-11, task-13, task-14, task-15, task-16, task-17 |
| 単一責務 | 「公開メンバー詳細・登録導線・法務 2 画面を再構成し、`/public/members/:id` API と Google Form responderUrl に接続する」 |
| 想定工数 | 1.0 人日（実装 + 単体テスト + a11y 検証） |
| outputs | `apps/web/app/(public)/members/[id]/page.tsx`, `apps/web/app/(public)/register/page.tsx`, `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`, `apps/web/src/components/public/MemberDetail*`, `apps/web/src/components/legal/LegalProse.tsx` |

---

## 1. ゴール / 非ゴール

### 1.1 ゴール

1. `/(public)/members/[id]` を **ProfileHero + 公開セクション分割（KVList）+ Tags + Links + Activity timeline + 戻るリンク** で再構成する。
2. `/(public)/register` を **登録導線（Google Form responderUrl への外部 link）+ 同意項目の説明 + form-preview セクション** で構成する。
3. `/privacy` と `/terms` を **typography 中心レイアウト**（`prose` / `LegalProse` primitive）に整える。
4. すべて OKLch tokens 経由（HEX 直書き禁止、不変条件遵守）。
5. データ取得は `apps/web/src/lib/fetch/public.ts` 経由のみ（不変条件 #5）。
6. 会員詳細は **不変条件 #1（stableKey 経由のみ field 参照）** を厳守。
7. vitest（LegalProse render / detail props mapping）と Playwright smoke（`/members/:id`, `/register`, `/privacy`, `/terms` の 200 + 主要要素 visible + axe critical 0）。

### 1.2 非ゴール

- `/`, `/members`（一覧）は **task-11 の責務**。本タスクでは触らない。
- 認証 / 管理層、`/profile` などは対象外。
- Google Form の埋め込み（iframe）は採用しない。**外部リンク遷移**を MVP 経路とする（不変条件 #7、CLAUDE.md 記載）。
- 法務文面の最終法務確認は本タスク非ゴール（暫定文面のレイアウト整備のみ）。
- 国際化（i18n）対象外、日本語固定。

---

## 2. 変更対象ファイル表

| path | 区分 | 概要 |
|------|------|------|
| `apps/web/app/(public)/members/[id]/page.tsx` | M | `ProfileHero` + `MemberDetailSections` で再構成。`fetchPublicOrNotFound` で 404 を `notFound()`。 |
| `apps/web/app/(public)/register/page.tsx` | M | responderUrl リダイレクトボタン + 同意導線説明 + `FormPreviewSections`。 |
| `apps/web/app/privacy/page.tsx` | M | `LegalProse` primitive で typography 構造化。 |
| `apps/web/app/terms/page.tsx` | M | 同上。 |
| `apps/web/src/components/public/ProfileHero.tsx` | C/M | Avatar + 名前 + nickname + occupation + Zone/Status Chip + location。 |
| `apps/web/src/components/public/MemberDetailSections.tsx` | C | publicSections を section ごとに `<section>` + `<h2>` + `KVList` で展開。 |
| `apps/web/src/components/public/MemberTags.tsx` | C | tags を `Chip` 配列で表示。空時は非表示。 |
| `apps/web/src/components/public/MemberLinks.tsx` | C | url kind の field を `LinkPills` で表示。 |
| `apps/web/src/components/public/MemberActivity.tsx` | C | （schema にあれば） publicSections 内の activity 系を timeline 表示。なければ no-op。 |
| `apps/web/src/components/public/RegisterCallout.tsx` | C | responderUrl への `<a>` ボタン + 同意項目（publicConsent / rulesConsent）の説明。 |
| `apps/web/src/components/public/FormPreviewSections.tsx` | M | sectionCount / fieldCount / 各セクション概要を表示（既存）。 |
| `apps/web/src/components/legal/LegalProse.tsx` | C | `<article className="prose">` の薄い wrapper。`children` を slot 受け。 |
| `apps/web/src/components/public/MemberDetailSections.test.tsx` | C | publicSections の section ごとに `<h2>` が出る、stableKey が `data-stable-key` 属性として焼かれることを検証。 |
| `apps/web/src/components/legal/LegalProse.test.tsx` | C | `<h1><h2><p><ul>` が `prose` token を継承する。 |
| `apps/web/e2e/public-detail-register-legal.spec.ts` | C | Playwright smoke。4 ページの 200 + axe critical 0。 |

---

## 3. 各画面のコンポーネント分解とシグネチャ

### 3.1 `/(public)/members/[id]`（会員詳細） — Server Component

#### 3.1.1 Page

```tsx
// apps/web/app/(public)/members/[id]/page.tsx
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

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  let profile: PublicMemberProfile;
  try {
    profile = await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 60 },
    );
  } catch (e) {
    if (e instanceof FetchPublicNotFoundError) notFound();
    throw e;
  }

  return (
    <main data-page="member-detail" className="stack-lg">
      <a href="/members" data-role="back" className="back-link">← メンバー一覧に戻る</a>
      <ProfileHero
        memberId={profile.memberId}
        fullName={profile.summary.fullName}
        nickname={profile.summary.nickname}
        occupation={profile.summary.occupation}
        location={profile.summary.location}
        ubmZone={profile.summary.ubmZone}
        ubmMembershipType={profile.summary.ubmMembershipType}
      />
      <MemberTags tags={profile.tags} />
      <MemberDetailSections sections={profile.publicSections} />
      <MemberLinks sections={profile.publicSections} />
      <MemberActivity sections={profile.publicSections} />
    </main>
  );
}
```

#### 3.1.2 ProfileHero

```tsx
// apps/web/src/components/public/ProfileHero.tsx
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

- マークアップ: `<header data-component="profile-hero">` + Avatar(name=fullName) + `<h1>` + nickname small + occupation body + Chip 行（zone / status / location）。
- token: `--ubm-color-zone-{a..e}`, `--ubm-color-status-{member,guest,academy}`, `--ubm-radius-md`。
- a11y: `<h1>` 1 個。Avatar には `alt` または `aria-hidden + 隣接 visible 名` 戦略。

#### 3.1.3 MemberDetailSections

```tsx
// apps/web/src/components/public/MemberDetailSections.tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
export interface MemberDetailSectionsProps { sections: ReadonlyArray<Section> }
export function MemberDetailSections({ sections }: MemberDetailSectionsProps): JSX.Element;
```

- 各 section を `<section data-section={section.key}>` で wrap、`<h2>` に section.label。
- 中身は `KVList` primitive。各 row に `data-stable-key={field.stableKey}` を必ず付ける（不変条件 #1 監査用）。
- `field.kind` が `"url"` のものはここでは表示せず、`MemberLinks` に集約。
- `field.value` が配列なら `value.join(", ")`、null/empty は "—"。

#### 3.1.4 MemberTags / MemberLinks / MemberActivity

```tsx
// apps/web/src/components/public/MemberTags.tsx
export interface MemberTagsProps {
  tags: ReadonlyArray<{ code: string; label: string; category: string }>;
}
export function MemberTags({ tags }: MemberTagsProps): JSX.Element | null;
```

- `tags.length === 0` で `null` 返却（empty section を作らない）。

```tsx
// apps/web/src/components/public/MemberLinks.tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";
type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
export interface MemberLinksProps { sections: ReadonlyArray<Section> }
export function MemberLinks({ sections }: MemberLinksProps): JSX.Element | null;
```

- すべての section から `field.kind === "url"` を抽出 → `LinkPills` primitive に flatten 渡し。
- 0 件で `null` 返却。`<a target="_blank" rel="noopener noreferrer">`。

```tsx
// apps/web/src/components/public/MemberActivity.tsx
export interface MemberActivityProps { sections: ReadonlyArray<Section> }
export function MemberActivity({ sections }: MemberActivityProps): JSX.Element | null;
```

- section.key === `"activity"` のものを timeline 描画。存在しなければ `null`。

### 3.2 `/(public)/register`（入会登録） — Server Component

#### 3.2.1 Page

```tsx
// apps/web/app/(public)/register/page.tsx
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

export default async function RegisterPage() {
  let preview: FormPreviewView | null = null;
  let responderUrl = FALLBACK_RESPONDER_URL;
  let previewError: string | null = null;
  try {
    preview = await fetchPublic<FormPreviewView>("/public/form-preview", { revalidate: 600 });
    responderUrl = preview.responderUrl ?? FALLBACK_RESPONDER_URL;
  } catch {
    previewError = "フォーム情報を取得できませんでした。登録は下のリンクから進めてください。";
  }

  return (
    <main data-page="register" className="stack-lg">
      <header className="page-head">
        <p className="eyebrow">REGISTER</p>
        <h1>UBM 兵庫支部会への登録</h1>
        <p className="muted">
          登録は次の流れで進みます: Google Form 回答 → 自動同期 → ログイン → マイページ確認。
        </p>
      </header>
      <RegisterCallout responderUrl={responderUrl} />
      {previewError ? (
        <p role="alert" data-role="preview-error">{previewError}</p>
      ) : preview ? (
        <FormPreviewSections preview={preview} />
      ) : null}
      <p>
        ログイン済みの方はそのまま <a href="/login">/login</a> に進んでください。
      </p>
    </main>
  );
}
```

#### 3.2.2 RegisterCallout

```tsx
// apps/web/src/components/public/RegisterCallout.tsx
export interface RegisterCalloutProps {
  responderUrl: string;
}
export function RegisterCallout({ responderUrl }: RegisterCalloutProps): JSX.Element;
```

- マークアップ: `<section data-component="register-callout">` + 同意項目 2 点（publicConsent / rulesConsent）の説明 + 大型 CTA `<a target="_blank" rel="noopener noreferrer">`。
- 同意は **Google Form 内で回答する** ため当画面では編集不可、説明のみ。
- token: `--ubm-color-accent`, `--ubm-spacing-7`, `--ubm-radius-lg`。

### 3.3 `/privacy` と `/terms` — Server Component（静的）

#### 3.3.1 LegalProse primitive

```tsx
// apps/web/src/components/legal/LegalProse.tsx
import type { ReactNode } from "react";
export interface LegalProseProps {
  children: ReactNode;
}
export function LegalProse({ children }: LegalProseProps): JSX.Element {
  return (
    <article className="prose" data-component="legal-prose">
      {children}
    </article>
  );
}
```

- token: `prose` は task-09 / task-10 で定義済みの typography utility（`--ubm-typography-prose-{base,heading,link}`）。
- `<h1>`/`<h2>`/`<p>`/`<ul>`/`<li>`/`<a>` の最低限が typed。

#### 3.3.2 `/privacy` Page

```tsx
// apps/web/app/privacy/page.tsx
import type { Metadata } from "next";
import { LegalProse } from "@/src/components/legal/LegalProse";

export const metadata: Metadata = {
  title: "プライバシーポリシー | UBM 兵庫支部会",
  description: "UBM 兵庫支部会のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <main data-page="privacy">
      <LegalProse>
        <h1>プライバシーポリシー</h1>
        <p>UBM 兵庫支部会（以下「当会」）は…</p>
        <h2>1. 取得する情報</h2>
        <ul>
          <li>Google アカウントによる認証情報（メールアドレス、表示名、プロフィール画像）</li>
          <li>Google フォーム経由で入力された会員登録情報</li>
          <li>サイト利用時のアクセスログ（最低限のもの）</li>
        </ul>
        <h2>2. 利用目的</h2>
        <ul>
          <li>会員認証および会員ステータスの確認</li>
          <li>会員間の情報共有および連絡</li>
          <li>サービスの安定運用および不正利用の防止</li>
        </ul>
        <h2>3. 第三者提供</h2>
        <p>法令に基づく場合を除き、本人の同意なく第三者へ提供することはありません。</p>
        <h2>4. 取得した情報の管理</h2>
        <p>取得した個人情報は Cloudflare のインフラ上で適切に管理し、不正アクセス・漏洩・改ざん等の防止に努めます。</p>
        <h2>5. 開示・訂正・削除</h2>
        <p>会員本人からの求めに応じ、合理的な範囲で個人情報の開示・訂正・削除に対応します。</p>
        <h2>6. 本ポリシーの改定</h2>
        <p>本ポリシーは予告なく改定されることがあります。改定後の内容は本ページにて公開します。</p>
        <p><a href="/">トップに戻る</a></p>
      </LegalProse>
    </main>
  );
}
```

#### 3.3.3 `/terms` Page

```tsx
// apps/web/app/terms/page.tsx
import type { Metadata } from "next";
import { LegalProse } from "@/src/components/legal/LegalProse";

export const metadata: Metadata = {
  title: "利用規約 | UBM 兵庫支部会",
  description: "UBM 兵庫支部会の利用規約",
};

export default function TermsPage() {
  return (
    <main data-page="terms">
      <LegalProse>
        <h1>利用規約</h1>
        <p>本利用規約（以下「本規約」）は…</p>
        <h2>1. 本サービスの目的</h2>
        <p>会員情報の管理および会員間の情報共有を目的として提供されます。</p>
        <h2>2. 利用資格</h2>
        <p>当会が認める会員のみが利用できます。Google フォームによる会員登録および当会の利用規約への同意が前提となります。</p>
        <h2>3. 禁止事項</h2>
        <ul>
          <li>当会または第三者の権利を侵害する行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>不正アクセス、リバースエンジニアリング等の技術的迂回行為</li>
          <li>登録情報を他者と共有する行為</li>
        </ul>
        <h2>4. 退会</h2>
        <p>会員は当会に申し出ることで退会できます。退会後は本サービスを利用できなくなります。</p>
        <h2>5. 免責事項</h2>
        <p>本サービスの利用に関して当会は、合理的な範囲で運用に努めますが、利用者に生じた損害について責任を負いません。</p>
        <h2>6. 規約の改定</h2>
        <p>本規約は予告なく改定されることがあります。改定後の内容は本ページにて公開します。</p>
        <p><a href="/">トップに戻る</a></p>
      </LegalProse>
    </main>
  );
}
```

---

## 4. データフロー

### 4.1 `/(public)/members/[id]`

```
URL  ──► Server Component (app/(public)/members/[id]/page.tsx)
        │
        └─ fetchPublicOrNotFound("/public/members/{id}")
              │
              ├─ on Workers : env.API_SERVICE.fetch(...)
              └─ on local   : fetch(`${PUBLIC_API_BASE_URL}/public/members/{id}`)
              │
              ├─ apps/api/src/routes/public/member-profile.ts (Hono)
              │       └─ getPublicMemberProfileUseCase(id, { ctx({ DB }) })
              │
              └─ Zod parse via PublicMemberProfileZ.strict()
                    │
                    ├─ 404 → notFound() (Next.js)
                    ├─ 200 → ProfileHero / Sections / Tags / Links 描画
                    └─ throw → error.tsx boundary（Sentry capture）
```

### 4.2 `/(public)/register`

```
Server Component
  └─ fetchPublic("/public/form-preview")
        ├─ 200 → preview.responderUrl を CTA 先に
        └─ throw → previewError 文言で fallback、CTA は FALLBACK_RESPONDER_URL に
```

CTA クリック → 外部 `https://docs.google.com/forms/...`（target="_blank"）。
**サーバ側 redirect は採用しない**（戻る操作で UX 劣化する + クッキーが渡せない）。

### 4.3 `/privacy` / `/terms`

完全静的、API 接続なし。Next.js のフルプリレンダー対象。

### 4.4 状態マトリクス

| 画面 | loading | empty | error |
|------|---------|-------|-------|
| `/members/[id]` | `loading.tsx` の Skeleton（hero placeholder） | 該当なし（404 で notFound） | error.tsx で `ErrorState` |
| `/register` | 軽量（preview なしでも CTA 先行表示可） | preview 取得失敗 → `role="alert"` で文言、CTA は維持 | error.tsx |
| `/privacy`, `/terms` | 静的のため事実上なし | 該当なし | 静的 build 失敗時のみ |

---

## 5. テスト方針

### 5.1 vitest（unit）

| ファイル | 検証内容 |
|----------|----------|
| `apps/web/src/components/public/MemberDetailSections.test.tsx` | <ul><li>各 section に `<h2>` が出る</li><li>すべての row に `data-stable-key` が付く（不変条件 #1）</li><li>`field.kind === "url"` は section から除外される</li><li>`value` が配列は join される、null は "—"</li></ul> |
| `apps/web/src/components/public/MemberLinks.test.tsx` | <ul><li>`url` kind の field のみ抽出</li><li>0 件で `null` 返却</li><li>`target="_blank" rel="noopener noreferrer"` 必須</li></ul> |
| `apps/web/src/components/public/MemberTags.test.tsx` | tags=[] で `null` 返却 |
| `apps/web/src/components/public/RegisterCallout.test.tsx` | <ul><li>responderUrl が `<a>` href に反映</li><li>`target="_blank" rel="noopener noreferrer"`</li></ul> |
| `apps/web/src/components/legal/LegalProse.test.tsx` | <ul><li>`<article className="prose">` で wrap</li><li>子要素がそのまま描画される</li></ul> |
| `apps/web/src/components/public/FormPreviewSections.test.tsx` | preview が空 sections でも crash しない |

### 5.2 Playwright smoke（`apps/web/e2e/public-detail-register-legal.spec.ts`）

- `/members/{seedId}` 200 + `<h1>` visible + `[data-component="profile-hero"]` visible + axe critical=0
- `/members/non-existent-id` → 404 page（Next.js notFound）visible
- `/register` 200 + `[data-component="register-callout"]` visible + `<a href={responderUrl}>` が `target="_blank"` + axe critical=0
- `/privacy` 200 + `<h1>プライバシーポリシー</h1>` visible + axe critical=0
- `/terms` 200 + `<h1>利用規約</h1>` visible + axe critical=0

> seed メンバー id は `apps/api/migrations` の seed ファイルまたは `pnpm seed:public` 等の既存命令で固定 id を発行し、e2e fixture に渡す。新規 seed 命令の追加は本タスク非ゴール。

### 5.3 a11y 個別

- `LegalProse` の見出し階層 (`h1` → `h2`) が単調増加で skip しないこと
- `<a target="_blank">` は `rel="noopener noreferrer"` 必須
- 詳細ページの戻るリンクは keyboard で focusable
- ProfileHero の Avatar は decorative (`aria-hidden`) + 隣接 visible 名で名前が読み上げられる

---

## 6. ローカル実行コマンド

```bash
# 依存とリント
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 単体テスト
mise exec -- pnpm --filter web test:run -- src/components/public src/components/legal

# ローカル dev
mise exec -- pnpm --filter api dev      # Worker (Hono) on :8787
mise exec -- pnpm --filter web dev      # Next.js on :3000

# ページ確認
open http://localhost:3000/members/<seedId>
open http://localhost:3000/register
open http://localhost:3000/privacy
open http://localhost:3000/terms

# Playwright smoke
mise exec -- pnpm --filter web e2e -- public-detail-register-legal.spec.ts
```

---

## 7. DoD（受け入れ条件）

- [ ] `/members/[id]` が 200 を返し、ProfileHero / Sections / Tags / Links が visible（存在時）
- [ ] `/members/<不在 id>` が `notFound()` 経由で 404 page を返す
- [ ] `/register` が 200 を返し、CTA `<a target="_blank" rel="noopener noreferrer">` が responderUrl を指している
- [ ] form-preview 取得失敗時も CTA は `FALLBACK_RESPONDER_URL` で機能する（fallback パス確認）
- [ ] `/privacy` / `/terms` が 200 を返し、`prose` typography が反映済み
- [ ] axe-core critical violation = 0（4 ページ + 404 ページ）
- [ ] `pnpm typecheck` / `pnpm lint` / vitest / Playwright smoke が全 pass
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が **0 件**（task-18 verify-design-tokens.ts と整合）
- [ ] `apps/web` 内に `D1Database` の参照 0 件（不変条件 #5）
- [ ] 詳細ページの全 KV row に `data-stable-key` 属性が付く（不変条件 #1 監査）
- [ ] 新 endpoint 追加なし（既存 `/public/members/:memberId`, `/public/form-preview` のみ）
- [ ] PR 本文に `outputs/phase-1..3` の該当節 + 本仕様書の主要見出しが反映済み

---

## 8. 補足: 不変条件チェックリスト

| 不変条件 | 本タスクでの遵守方法 |
|----------|---------------------|
| #1 stableKey 経由でのみ field を参照 | `MemberDetailSections` で全 row に `data-stable-key={field.stableKey}`。直接プロパティ参照しない。 |
| #2 consent キーは publicConsent / rulesConsent に統一 | RegisterCallout の説明文で 2 キーを使用。それ以外の名前は使わない。 |
| #5 D1 直接アクセス禁止 | `fetchPublic` / `fetchPublicOrNotFound` 経由のみ |
| #7 MVP では Google Form 再回答が本人更新の正式経路 | RegisterCallout の文言で明示、編集 UI を register に置かない |
| #10 無料枠を意識した revalidate | member-profile=60s, form-preview=600s |
| OKLch tokens 必須 | task-08 の token 表からのみ採用、HEX 直書き禁止 |



---

## diff scope 規律（task-01 反映 / 2026-05-07）

`SCOPE.md §6 diff scope 規律 / archive rule` を遵守する。本 task 完了前に以下を必ず確認:

- `git diff --name-only main...HEAD` の出力が、本 task 仕様 §3「変更対象ファイル」 + 本 task package（`docs/30-workflows/ui-prototype-alignment-mvp-recovery/<dir>/`）配下のみで構成されていること
- 完了済み workflow dir を整理する場合は `git mv <dir> docs/30-workflows/completed-tasks/<dir>` でアーカイブ（`git rm -r` 純削除は禁止）
- sync-merge / rebase で混入した範囲外削除は `git checkout HEAD -- <path>` で復旧してから commit する
