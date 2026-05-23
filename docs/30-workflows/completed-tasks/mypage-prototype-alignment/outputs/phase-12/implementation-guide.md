# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

マイページは、自分のプロフィール帳のようなものです。今の画面は内容は読めますが、「どこを見れば公開状態が分かるか」「どこから情報を更新するか」が目立ちません。

たとえば学校の掲示板で、公開してよい紙、クラスだけに見せる紙、先生だけが見る紙が混ざっていると不安になります。この改善では、その3つの箱に何件入っているかを一目で見せます。

### 何をするか

既存の `/profile` を壊さず、見た目と導線を prototype に合わせます。情報の更新はページ内で直接書き換えるのではなく、Google Form をもう一度開いて回答する方式を保ちます。

### 今回作ったもの

この実装では、page-head、公開状態 banner、VisibilitySummary、ProfilePreview、RevalidateModal、danger-zone、MemberHeader 導線を既存 `/profile` に追加しました。Playwright fixture でスクリーンショットも取得済みです。

## Part 2: 技術者向け詳細

### TypeScript 型定義

```ts
import type { MemberProfileSection } from "@ubm-hyogo/shared";

export interface VisibilityCounts {
  readonly public: number;
  readonly member: number;
  readonly admin: number;
}

export interface ProfileSummary {
  readonly displayName: string;
  readonly subtitle: string;
  readonly chips: readonly { label: string; tone: "neutral" }[];
}

export function deriveVisibilityCounts(
  sections: readonly MemberProfileSection[],
): VisibilityCounts;

export function pickProfileSummary(
  sections: readonly MemberProfileSection[],
): ProfileSummary;
```

### APIシグネチャ

No new public API is added. The page continues to consume existing endpoints only:

```ts
fetchAuthed<MeSessionResponse>("/me");
fetchAuthed<MeProfileResponse>("/me/profile");
```

Mutation endpoints remain existing self-service requests only: `POST /me/visibility-request` and `POST /me/delete-request`. There is no `PATCH /me/profile`.

### 使用例

```tsx
const summary = pickProfileSummary(profile.sections);
const counts = deriveVisibilityCounts(profile.sections);

<ProfilePreview memberId={me.user.memberId} {...summary} />;
<VisibilitySummary sections={profile.sections} />;
<EditCta
  editResponseUrl={profileResponse.editResponseUrl}
  fallbackResponderUrl={profileResponse.fallbackResponderUrl}
  variant="inline"
/>;
```

### エラーハンドリング

Unknown `visibility` values are ignored by `deriveVisibilityCounts` so an unexpected field does not break the whole page. Missing profile summary stable keys return empty strings and an empty chips array. Missing `editResponseUrl` falls back to `fallbackResponderUrl`.

### エッジケース

`publishState="hidden"` disables the individual public profile link and explains the reason with accessible text. `ProfileFieldsProps` remains `sections` only; inline edit CTA is placed beside the fields area by `page.tsx` to avoid props drift. Runtime visual capture uses the Playwright member fixture and writes canonical screenshots under Phase 11.

### 設定項目と定数一覧

| Constant | Meaning |
| --- | --- |
| `STABLE_KEY.fullName` | display name source |
| `STABLE_KEY.occupation` | subtitle source |
| `STABLE_KEY.nickname` / `location` / `ubmMembershipType` | neutral chips source |
| `profile-page-default.png` | canonical full page screenshot |
| `revalidate-modal-open.png` | canonical modal screenshot |

### テスト構成

Focused tests cover `_lib/visibility-counts.ts`, `_lib/profile-summary.ts`, profile components, and `MemberHeader`. Quality gates are typecheck, lint, targeted Vitest, verify-design-tokens, and Playwright visual smoke after implementation.

### 視覚証跡

| Screenshot | Status | Path |
| --- | --- | --- |
| `profile-page-default.png` | present | `../phase-11/screenshots/profile-page-default.png` |
| `status-banner-public.png` | present | `../phase-11/screenshots/status-banner-public.png` |
| `visibility-summary.png` | present | `../phase-11/screenshots/visibility-summary.png` |
| `revalidate-modal-open.png` | present | `../phase-11/screenshots/revalidate-modal-open.png` |
| `member-header-nav.png` | present | `../phase-11/screenshots/member-header-nav.png` |
