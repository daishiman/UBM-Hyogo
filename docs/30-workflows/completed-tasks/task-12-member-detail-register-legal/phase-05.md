# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 |
| task | task-12-member-detail-register-legal |
| state | spec-fixed / implementation pending / runtime evidence pending_user_approval |

## 目的

`/(public)/members/[id]`、`/(public)/register`、`/privacy`、`/terms` の 4 画面を、設計言語と OKLch tokens に揃えて再構成するための **後続実装者がそのまま手を動かせる粒度** の実装ランブックを固定する。

## 実行タスク

- [ ] Step 1〜6 を順序厳守で実装する
- [ ] 各 Step の完成形コードを一次原典 §3 と完全一致させる
- [ ] 各 Step の検証コマンドが exit 0 になることを確認する
- [ ] runtime evidence（Playwright smoke / axe）は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`（一次原典 §3 / §5 / §6 / §7 / §8）
- `docs/00-getting-started-manual/specs/design-tokens.md`（task-08 OKLch token 正本）
- `docs/00-getting-started-manual/claude-design-prototype/`（プロトタイプ参照、`pages-public.jsx`）
- `apps/api/src/routes/public/{member-profile,form-preview}.ts`（既存 API surface・consumer 専用）
- `apps/web/src/lib/fetch/public.ts`（`fetchPublic` / `fetchPublicOrNotFound`）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-05/main.md`（実装ログ・修正点・evidence index）

## 統合テスト連携

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` を新規追加し、Phase 9 / Phase 11 で 4 ページの 200 + 主要要素 visible + axe critical=0 を実測する。

このフェーズは「後続実装者がそのまま手を動かせる」粒度で書く。

## 不変条件（実装中に常時遵守）

| 不変条件 | 適用箇所 |
| --- | --- |
| #1 stableKey 経由でのみ field を参照 | `MemberDetailSections` の全 KV row に `data-stable-key={field.stableKey}` を焼く |
| #2 consent キー統一 | `RegisterCallout` 説明文で `publicConsent` / `rulesConsent` のみ使用 |
| #5 D1 直接アクセス禁止 | `apps/web` 配下で `D1Database` import / 参照しない。`fetchPublic` / `fetchPublicOrNotFound` 経由のみ |
| #7 Google Form 再回答が本人更新の正規経路 | `register` は外部 link 遷移（`target="_blank"` + `rel="noopener noreferrer"`）。iframe 埋め込み・サーバ側 redirect 不採用 |
| OKLch tokens 必須 | 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止 |

## 実装手順（順序厳守）

### Step 1: ProfileHero / MemberDetailSections / MemberTags / MemberLinks / MemberActivity 新設

公開会員詳細用の 5 component を `apps/web/src/components/public/` に追加する。

#### 1-1. `apps/web/src/components/public/ProfileHero.tsx`

```tsx
import { Avatar, Badge } from "@/components/ui";

export interface ProfileHeroProps {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}

export function ProfileHero({
  memberId,
  fullName,
  nickname,
  occupation,
  location,
  ubmZone,
  ubmMembershipType,
}: ProfileHeroProps): JSX.Element {
  return (
    <header data-component="profile-hero" data-member-id={memberId} className="hero-root">
      <Avatar name={fullName} size="xl" aria-hidden="true" />
      <div className="hero-body">
        <h1 className="hero-title">{fullName}</h1>
        {nickname ? <p className="hero-nickname">{nickname}</p> : null}
        {occupation ? <p className="hero-occupation">{occupation}</p> : null}
        <div className="hero-chips">
          {ubmZone ? (
            <Badge tone={`zone-${ubmZone.toLowerCase()}` as never} outline>
              Zone {ubmZone}
            </Badge>
          ) : null}
          {ubmMembershipType ? <Badge tone="info">{ubmMembershipType}</Badge> : null}
          {location ? <Badge tone="neutral" outline>{location}</Badge> : null}
        </div>
      </div>
    </header>
  );
}
```

- token: `--ubm-color-zone-{a..e}`, `--ubm-color-status-{member,guest,academy}`, `--ubm-radius-md`。
- a11y: `<h1>` 1 個。Avatar は `aria-hidden="true"` で decorative、隣接の `<h1>{fullName}</h1>` で screen reader に氏名を渡す。

#### 1-2. `apps/web/src/components/public/MemberDetailSections.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];
type Field = Section["fields"][number];

export interface MemberDetailSectionsProps {
  sections: ReadonlyArray<Section>;
}

function renderValue(value: Field["value"]): string {
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function MemberDetailSections({ sections }: MemberDetailSectionsProps): JSX.Element {
  return (
    <>
      {sections.map((section) => {
        const visibleFields = section.fields.filter((f) => f.kind !== "url");
        if (visibleFields.length === 0) return null;
        return (
          <section key={section.key} data-section={section.key} className="detail-section">
            <h2 className="detail-section-title">{section.label}</h2>
            <dl className="kv-list">
              {visibleFields.map((field) => (
                <div key={field.stableKey} className="kv-row" data-stable-key={field.stableKey}>
                  <dt className="kv-label">{field.label}</dt>
                  <dd className="kv-value">{renderValue(field.value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </>
  );
}
```

- 不変条件 #1: 全 KV row に `data-stable-key={field.stableKey}` を必ず付与。
- `field.kind === "url"` は除外（`MemberLinks` に集約）。

#### 1-3. `apps/web/src/components/public/MemberTags.tsx`

```tsx
import { Badge } from "@/components/ui";

export interface MemberTagsProps {
  tags: ReadonlyArray<{ code: string; label: string; category: string }>;
}

export function MemberTags({ tags }: MemberTagsProps): JSX.Element | null {
  if (tags.length === 0) return null;
  return (
    <section data-component="member-tags" className="tags-root">
      <h2 className="tags-title">タグ</h2>
      <ul className="tags-list" role="list">
        {tags.map((t) => (
          <li key={t.code}>
            <Badge tone="neutral" outline>{t.label}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### 1-4. `apps/web/src/components/public/MemberLinks.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];

export interface MemberLinksProps {
  sections: ReadonlyArray<Section>;
}

export function MemberLinks({ sections }: MemberLinksProps): JSX.Element | null {
  const links = sections.flatMap((s) =>
    s.fields
      .filter((f) => f.kind === "url")
      .map((f) => ({ stableKey: f.stableKey, label: f.label, value: f.value })),
  );
  if (links.length === 0) return null;
  return (
    <section data-component="member-links" className="links-root">
      <h2 className="links-title">リンク</h2>
      <ul className="links-list" role="list">
        {links.map((l) => (
          <li key={l.stableKey} data-stable-key={l.stableKey}>
            <a
              href={String(l.value)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-pill"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### 1-5. `apps/web/src/components/public/MemberActivity.tsx`

```tsx
import type { z } from "zod";
import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];

export interface MemberActivityProps {
  sections: ReadonlyArray<Section>;
}

export function MemberActivity({ sections }: MemberActivityProps): JSX.Element | null {
  const activity = sections.find((s) => s.key === "activity");
  if (!activity || activity.fields.length === 0) return null;
  return (
    <section data-component="member-activity" data-section="activity" className="activity-root">
      <h2 className="activity-title">{activity.label}</h2>
      <ol className="activity-timeline">
        {activity.fields.map((f) => (
          <li key={f.stableKey} data-stable-key={f.stableKey} className="activity-item">
            <span className="activity-label">{f.label}</span>
            <span className="activity-value">
              {Array.isArray(f.value) ? f.value.join(", ") : (f.value ?? "—")}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

#### Step 1 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

#### Step 1 完了条件

| 項目 | 条件 |
| --- | --- |
| 5 ファイル新設 | `apps/web/src/components/public/{ProfileHero,MemberDetailSections,MemberTags,MemberLinks,MemberActivity}.tsx` 全て存在 |
| token 直書き 0 | `! rg -n '#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#' apps/web/src/components/public/{ProfileHero,MemberDetailSections,MemberTags,MemberLinks,MemberActivity}.tsx` |
| typecheck | exit 0 |

---

### Step 2: RegisterCallout / FormPreviewSections（apps/web/src/components/public/）

#### 2-1. `apps/web/src/components/public/RegisterCallout.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";

export interface RegisterCalloutProps {
  responderUrl: string;
}

export function RegisterCallout({ responderUrl }: RegisterCalloutProps): JSX.Element {
  return (
    <section data-component="register-callout" className="register-callout">
      <Card>
        <CardHeader>
          <CardTitle>Google フォームから登録</CardTitle>
          <CardDescription>
            登録フォーム内で次の 2 つの同意項目（<code>publicConsent</code> と <code>rulesConsent</code>）に
            チェックして送信してください。回答内容は自動同期されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="consent-list">
            <li>
              <strong>publicConsent</strong>: 一般会員ディレクトリへの公開掲載に同意
            </li>
            <li>
              <strong>rulesConsent</strong>: 利用規約への同意
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-role="register-cta"
            className="cta-button"
          >
            Google フォームを開く
          </a>
        </CardFooter>
      </Card>
    </section>
  );
}
```

- 不変条件 #2: `publicConsent` / `rulesConsent` の 2 キーのみを説明文に使用。
- 不変条件 #7: 外部 link 遷移（`target="_blank"` + `rel="noopener noreferrer"`）。iframe 埋め込みしない。
- token: `--ubm-color-accent`, `--ubm-spacing-7`, `--ubm-radius-lg`。

#### 2-2. `apps/web/src/components/public/FormPreviewSections.tsx`（M）

```tsx
import type { z } from "zod";
import { FormPreviewViewZ } from "@ubm-hyogo/shared";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export interface FormPreviewSectionsProps {
  preview: FormPreviewView;
}

export function FormPreviewSections({ preview }: FormPreviewSectionsProps): JSX.Element {
  return (
    <section data-component="form-preview" className="preview-root">
      <header className="preview-head">
        <h2 className="preview-title">フォーム概要</h2>
        <p className="preview-meta">
          全 {preview.sectionCount} セクション / {preview.questionCount} 設問
        </p>
      </header>
      {preview.sections.length === 0 ? null : (
        <ol className="preview-sections">
          {preview.sections.map((s) => (
            <li key={s.key} data-section={s.key} className="preview-section">
              <h3 className="preview-section-title">{s.label}</h3>
              <p className="preview-section-meta">{s.fieldCount} 項目</p>
              <ul className="preview-fields">
                {s.fields.map((f) => (
                  <li key={f.stableKey} data-stable-key={f.stableKey}>
                    {f.label}
                    {f.required ? <span aria-label="必須" className="required-mark"> *</span> : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
```

#### Step 2 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

#### Step 2 完了条件

| 項目 | 条件 |
| --- | --- |
| RegisterCallout 新設 | `apps/web/src/components/public/RegisterCallout.tsx` 存在 |
| consent キー | `publicConsent` / `rulesConsent` 以外の名前を使っていない |
| 外部 link 規律 | `target="_blank"` + `rel="noopener noreferrer"` セット必須 |
| FormPreviewSections 改修 | `preview.sections.length === 0` で crash しない |

---

### Step 3: LegalProse primitive 新設（apps/web/src/components/legal/）

#### 3-1. `apps/web/src/components/legal/LegalProse.tsx`

```tsx
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

- token: task-09 / task-10 で定義済みの `prose` typography utility（`--ubm-typography-prose-{base,heading,link}`）。
- `<h1>`/`<h2>`/`<p>`/`<ul>`/`<li>`/`<a>` の最低限が typed。

#### Step 3 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

#### Step 3 完了条件

| 項目 | 条件 |
| --- | --- |
| LegalProse 新設 | `apps/web/src/components/legal/LegalProse.tsx` 存在 |
| `<article className="prose">` wrap | render に `data-component="legal-prose"` 焼かれる |
| HEX 直書き | 0 件 |

---

### Step 4: 4 page.tsx 改修

#### 4-1. `apps/web/app/(public)/members/[id]/page.tsx`

一次原典 §3.1.1 を再現:

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

#### 4-2. `apps/web/app/(public)/register/page.tsx`

一次原典 §3.2.1 を再現:

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

#### 4-3. `apps/web/app/privacy/page.tsx`

一次原典 §3.3.2 を再現（`<h1>プライバシーポリシー</h1>` + `<h2>` 6 項目 + `<a href="/">トップに戻る</a>`）。

#### 4-4. `apps/web/app/terms/page.tsx`

一次原典 §3.3.3 を再現（`<h1>利用規約</h1>` + `<h2>` 6 項目 + `<a href="/">トップに戻る</a>`）。

#### Step 4 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```

#### Step 4 完了条件

| 項目 | 条件 |
| --- | --- |
| 4 page.tsx 改修 | `data-page="member-detail/register/privacy/terms"` がそれぞれ root に焼かれる |
| 不変条件 #5 | `apps/web` 配下に `D1Database` 参照 0 件 (`! rg -n 'D1Database' apps/web/src apps/web/app`) |
| 不変条件 #7 | register CTA は `target="_blank"` + `rel="noopener noreferrer"` |
| build pass | `next build` exit 0 |

---

### Step 5: vitest 単体テスト追加

一次原典 §5.1 のテストを reify する。

| ファイル | TC ID | 検証 |
| --- | --- | --- |
| `apps/web/src/components/public/MemberDetailSections.test.tsx` | TC-U-01〜04 | 各 section に `<h2>`、全 row に `data-stable-key`、`url` kind 除外、配列 join / null は "—" |
| `apps/web/src/components/public/MemberLinks.test.tsx` | TC-U-05〜07 | `url` kind のみ抽出、0 件で `null`、`target="_blank" rel="noopener noreferrer"` |
| `apps/web/src/components/public/MemberTags.test.tsx` | TC-U-08 | `tags=[]` で `null` |
| `apps/web/src/components/public/RegisterCallout.test.tsx` | TC-U-09〜10 | `responderUrl` が `<a>` href に反映、`target="_blank" rel="noopener noreferrer"` |
| `apps/web/src/components/legal/LegalProse.test.tsx` | TC-U-11〜12 | `<article className="prose" data-component="legal-prose">`、子要素そのまま render |
| `apps/web/src/components/public/FormPreviewSections.test.tsx` | TC-U-13 | `preview.sections.length === 0` で crash しない |

`@testing-library/react` の `render` を使用し、`data-stable-key` 属性は `getAllByTestId` ではなく `container.querySelectorAll('[data-stable-key]')` で count を assert。

#### Step 5 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal
```

#### Step 5 完了条件

| 項目 | 条件 |
| --- | --- |
| 6 テストファイル新設 | 全 TC pass |
| `data-stable-key` 焼き込み | MemberDetailSections テストで row 数 = stableKey 数 を assert |
| coverage | `src/components/public/`, `src/components/legal/` の Statement ≥ 80% |

---

### Step 6: Playwright e2e spec 追加

#### 6-1. `apps/web/playwright/tests/public-detail-register-legal.spec.ts`

一次原典 §5.2 を spec に reify。

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SEED_MEMBER_ID = process.env.PUBLIC_SMOKE_MEMBER_ID ?? "fixture-1";

test.describe("public detail / register / legal", () => {
  test("/members/[id] renders profile hero and sections", async ({ page }) => {
    const res = await page.goto(`/members/${SEED_MEMBER_ID}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-component="profile-hero"]')).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });

  test("/members/non-existent triggers notFound", async ({ page }) => {
    const res = await page.goto("/members/__definitely_not_exist__");
    expect(res?.status()).toBe(404);
  });

  test("/register exposes external CTA with responderUrl", async ({ page }) => {
    const res = await page.goto("/register");
    expect(res?.status()).toBe(200);
    const cta = page.locator('[data-role="register-cta"]');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);
    await expect(cta).toHaveAttribute("rel", /noreferrer/);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });

  test("/privacy renders LegalProse", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "プライバシーポリシー" })).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });

  test("/terms renders LegalProse", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "利用規約" })).toBeVisible();
    await expect(page.locator('[data-component="legal-prose"]')).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
  });
});
```

#### Step 6 検証コマンド

```bash
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium --list
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium
```

#### Step 6 完了条件

| 項目 | 条件 |
| --- | --- |
| spec 新設 | `apps/web/playwright/tests/public-detail-register-legal.spec.ts` 存在 |
| 5 テスト列挙 | `--list` で 5 test 出力 |
| axe critical | 4 ページ全てで `violations.filter(critical)` = 空 |
| skip 禁止 | `! rg -n 'test\\.describe\\.skip\|test\\.skip\\(true\|it\\.skip' apps/web/playwright/tests/public-detail-register-legal.spec.ts` |

---

## 検証コマンド（Step 横断・local PASS）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal
mise exec -- pnpm --filter @ubm-hyogo/web build
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium
```

## テスト常時実行可能性 DoD

| 項目 | 固定値 |
| --- | --- |
| 対象 unit spec | `apps/web/src/components/public/*.test.tsx` + `apps/web/src/components/legal/LegalProse.test.tsx` |
| 1 行実行コマンド (unit) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal` |
| 対象 e2e spec | `apps/web/playwright/tests/public-detail-register-legal.spec.ts` |
| 1 行実行コマンド (e2e) | `PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium` |
| browser binary 自動 install | CI step に `pnpm exec playwright install --with-deps chromium` を固定 |
| dev server | Playwright config の `webServer` で `pnpm --filter @ubm-hyogo/web dev`、または事前 `pnpm --filter @ubm-hyogo/api dev` + `pnpm --filter @ubm-hyogo/web dev` |
| seed メンバー | `PUBLIC_SMOKE_MEMBER_ID` env で固定 id を渡す（既存 `apps/api/migrations` seed の id を再利用、新規 seed 命令は本タスク非ゴール） |
| CI gate | `.github/workflows/e2e-tests.yml`（Playwright browser install / web build / `test:e2e`）と `.github/workflows/pr-build-test.yml`（typecheck / lint / build）に本 spec 呼び出しを接続 |
| un-skip | spec で `test.describe.skip` / `test.skip(true)` / `it.skip` 禁止 |
| E2E coverage | `coverage/e2e/coverage-summary.json` の lines.pct ≥ 80（task-touched modules） |

## 完了条件

- [ ] Step 1〜6 のファイル変更が全て完了している
- [ ] `mise exec -- pnpm typecheck` / `lint` / unit test / `build` / e2e が全 pass
- [ ] HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0 件
- [ ] `apps/web` 配下に `D1Database` 参照 0 件
- [ ] 詳細ページの全 KV row に `data-stable-key` 焼かれる
- [ ] register CTA が `target="_blank"` + `rel="noopener noreferrer"`
