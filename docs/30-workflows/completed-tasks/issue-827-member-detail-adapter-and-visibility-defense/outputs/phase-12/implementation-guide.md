# Implementation Guide

## Junior Explanation

会員詳細ページは、サーバーから届いたプロフィール情報をそのまま画面に出さず、表示直前に adapter で整える。adapter は「公開してよいものだけ」「詳細欄に出す種類だけ」を選び、リンクや活動履歴は別の部品に渡す。

## Technical Detail

`buildMemberDetailViewModel(profile)` is a pure adapter. It returns:

- `detailSections`: non-activity sections with fields filtered to `visibility === "public"` and display kinds `shortText`, `paragraph`, `date`, `radio`, `checkbox`, `dropdown`.
- `allSections`: every original section with fields filtered to `visibility === "public"` before `MemberLinks` and `MemberActivity` consume it.

The component contract is now simpler: `MemberDetailSections` renders the sections it receives and only skips sections whose `fields` array is already empty.

## Verification

Run:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts src/components/public/__tests__/MemberDetailSections.component.spec.tsx
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build
```
