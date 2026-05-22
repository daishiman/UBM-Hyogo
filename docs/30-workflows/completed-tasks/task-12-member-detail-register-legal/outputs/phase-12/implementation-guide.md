# Implementation Guide

## Part 1: 中学生レベル

なぜ必要かというと、公開ページがばらばらだと、見る人はどこを読めばよいか分からず、あとから確認するテストも難しくなるからです。

このタスクは、公開ページを「初めて見る人にも迷わない案内板」に整えるためのものです。

学校の掲示板で例えると、会員詳細ページは「この人は誰で、何が得意で、どこから詳しい情報へ行けるか」を一枚にまとめた紹介カードです。入会登録ページは「申し込み用紙へ進む入口」です。プライバシーポリシーと利用規約は「学校の約束ごとを読みやすく並べたプリント」です。

何をするかというと、同じ目印をページに付け、申し込みは Google Form へ安全に移動し、法務ページは同じ読み物の形にそろえます。

専門用語セルフチェック:

| 用語 | 日常語の言い換え |
| --- | --- |
| API | 別の場所から情報を受け取る窓口 |
| CTA | 次に押してほしい大事なボタンやリンク |
| primitive | 何度も使う小さな部品 |
| evidence | やったことを後で確認できる記録 |
| runtime | 実際に画面を動かす時間 |

### 今回作ったもの

- Phase 1-13 の実行仕様書
- `outputs/artifacts.json` の mirror
- Phase 12 strict 7 ファイル
- aiworkflow-requirements から task-12 へ到達する索引

## Part 2: 技術者レベル

### Scope

Implementation targets:

- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/app/(public)/register/page.tsx`
- `apps/web/app/privacy/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/src/components/public/{ProfileHero,MemberDetailSections,MemberTags,MemberLinks,MemberActivity,RegisterCallout,FormPreviewSections}.tsx`
- `apps/web/src/components/legal/LegalProse.tsx`
- `apps/web/playwright/tests/public-detail-register-legal.spec.ts`

### TypeScript Interfaces

```ts
type PublicField = {
  stableKey: string;
  label: string;
  kind: "text" | "multiline" | "url" | "date" | "select" | "multi_select";
  value: string | string[] | null;
};

type PublicSection = {
  key: string;
  title: string;
  fields: PublicField[];
};

type RegisterCalloutProps = {
  responderUrl: string;
};
```

### APIシグネチャ

```ts
fetchPublicOrNotFound<PublicMemberProfile>(
  `/public/members/${memberId}`,
  { revalidate: 60 },
);

fetchPublic<FormPreviewView>(
  "/public/form-preview",
  { revalidate: 600 },
);
```
```

No new `apps/api` endpoint is introduced. `apps/web` must not import or reference `D1Database`.

### 使用例

```tsx
<RegisterCallout
  responderUrl={preview.responderUrl}
  fallbackUrl={FALLBACK_RESPONDER_URL}
  previewError={previewError}
/>
```

### エラーハンドリング

API failure handling is fail-closed for member detail and graceful fallback for register. A missing member resolves through `notFound()`. A failed form preview keeps the external Google Form CTA usable through `FALLBACK_RESPONDER_URL`.

### エッジケース

| Case | Expected behavior |
| --- | --- |
| Member API 404 | Throw `FetchPublicNotFoundError`, call `notFound()`, render Next 404 |
| Member API 500 | Throw generic error and let the route error boundary handle it |
| Empty `publicSections` | Render hero and omit empty section blocks |
| `field.value === null` or `[]` | Render fallback mark in KV rows |
| URL fields | Exclude from KV rows and aggregate in `MemberLinks` |
| `responderUrl === null` | Use `FALLBACK_RESPONDER_URL` |

### 設定項目と定数一覧

| Constant | Value |
| --- | --- |
| member profile revalidate | `60` |
| form preview revalidate | `600` |
| `FALLBACK_RESPONDER_URL` | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| canonical AC count | `13` |

### テスト構成

| Layer | Target |
| --- | --- |
| unit | `apps/web/src/components/public` and `apps/web/src/components/legal` |
| build | `@ubm-hyogo/web build` |
| e2e | `apps/web/playwright/tests/public-detail-register-legal.spec.ts` |
| static gates | HEX / D1 / iframe / consent / skip grep gates |

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal
mise exec -- pnpm --filter @ubm-hyogo/web build
PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium
```

---

## 実コード反映ログ（本実装サイクル）

仕様書ラベル `[実装区分: 実装仕様書]` に従い、本サイクルで `apps/web` 配下にコードを反映済み。

### 新規ファイル

- `apps/web/src/components/public/MemberDetailSections.tsx` — 全 KV row に `data-stable-key`（不変条件 #1）。`url` kind は除外し `MemberLinks` に集約。
- `apps/web/src/components/public/MemberTags.tsx` — `tags=[]` で `null`、Badge 経由で chip 列挙。
- `apps/web/src/components/public/MemberLinks.tsx` — `url` kind のみ抽出、`target="_blank" rel="noopener noreferrer"`、`<li data-stable-key>`。
- `apps/web/src/components/public/MemberActivity.tsx` — `section.key === "activity"` の timeline 表示。
- `apps/web/src/components/public/RegisterCallout.tsx` — `Card` 経由 + 外部 CTA `data-role="register-cta"`、`publicConsent` / `rulesConsent` のみ説明（不変条件 #2 / #7）。
- `apps/web/src/components/legal/LegalProse.tsx` — `<article className="prose" data-component="legal-prose">` の薄い wrapper。
- vitest 単体テスト 6 本（`MemberDetailSections` / `MemberLinks` / `MemberTags` / `MemberActivity` / `RegisterCallout` / `LegalProse`）。
- Playwright spec `apps/web/playwright/tests/public-detail-register-legal.spec.ts`（`testDir` の正本パスに合わせて配置）。

### 改修ファイル

- `apps/web/app/(public)/members/[id]/page.tsx` — `KVList` / `Chip` / `LinkPills` 経由から、`ProfileHero` + `MemberTags` + `MemberDetailSections` + `MemberLinks` + `MemberActivity` の縦積みに再構成。`data-page="member-detail"` 焼き直し、`activity` セクションを `MemberActivity` 専用化。
- `apps/web/app/(public)/register/page.tsx` — 直接の `<a data-role="responder-link">` を `RegisterCallout` 経由に置換（`data-role="register-cta"`）。`previewError` 時の `role="alert" data-role="preview-error"` は維持。`FALLBACK_RESPONDER_URL` は `01-api-schema.md` 固定値。
- `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx` — それぞれ `<LegalProse>` で wrap。`<h1>` 1 個 + `<h2>` 6 個 + 末尾 `<a href="/" data-role="back">トップに戻る</a>` を維持。

### ローカル品質ゲート結果（本サイクル実測）

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` → exit 0
- `mise exec -- pnpm --filter @ubm-hyogo/web lint` → exit 0
- `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/public apps/web/src/components/legal` → 12 spec / 35 ケース pass
- `mise exec -- pnpm --filter @ubm-hyogo/web build` → exit 0（`pnpm install --frozen-lockfile` で x64 optional package `@tailwindcss/oxide-darwin-x64` を復元後）
- `PLAYWRIGHT_BASE_URL=http://localhost:3001 PLAYWRIGHT_EVIDENCE_TASK=task-12-member-detail-register-legal pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts --project=desktop-chromium` → `/register`, `/privacy`, `/terms` は pass + screenshot + axe critical=0。`/members/[id]` と 404 branch は local public member fixture/API 未準備により fail し、Phase 11 は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 維持。
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 走査: `apps/web/src/components/{public,legal}/*` および 4 page.tsx で 0 件。
- `D1Database` 参照: `apps/web/src` および `apps/web/app` のプロダクションコードで 0 件（`apps/web/src/lib/__tests__/boundary.test.ts` のフィクスチャ文字列のみ）。

### Playwright full evidence は user-gated

`apps/web/playwright/tests/public-detail-register-legal.spec.ts` は一部実行済み。full evidence 取得（member detail seed / 404 branch / staging deploy）は **runtime evidence pending_user_approval** として残す。

### Spec の `e2e/` パスに関する補足

`index.md` / `phase-05.md` / 上記コマンドは `apps/web/playwright/tests/public-detail-register-legal.spec.ts` を示す。現行 `apps/web/playwright.config.ts` の `testDir` は `./playwright/tests` のため、実体もこの path に配置した。
