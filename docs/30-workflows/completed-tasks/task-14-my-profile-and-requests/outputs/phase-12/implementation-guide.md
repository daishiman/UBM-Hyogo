# Implementation Guide

## Part 1: 中学生レベル

学校の掲示板に「自分の紹介をどこまで貼るか」を決める場面を考える。全部を貼る人もいれば、名前だけ貼る人、何も貼らない人もいる。さらに「貼り方を変えたい」と先生にお願いした後は、先生が確認するまで同じお願いを何度も出せない。

このタスクは、会員サイトのマイページでそれと同じことを分かりやすく見せる。画面の上から順に、今の公開状態、どの項目が公開か、申請ボタン、削除申請の確認画面を並べる。色はサイト全体で決めた名前付きの色だけを使い、ボタンを押した後はサーバーから新しい状態を取り直す。

| 用語 | 日常語での説明 |
| --- | --- |
| 公開状態 | 掲示板にどこまで貼るか |
| 申請 | 先生に「変えてください」とお願いする紙 |
| pending | 先生がまだ確認中の状態 |
| API | 画面がサーバーにお願いを渡す窓口 |
| token | 色や余白の名前帳 |
| Dialog | 確認用の小さな画面 |

## Part 2: 技術者レベル

### Contract

- `apps/api/src/routes/me/*` and `apps/web/app/api/me/*` are read-only for this task.
- UI components call `fetchAuthed("/me")`, `fetchAuthed("/me/profile")`, `fetchAuthed("/me/visibility-request")`, and `fetchAuthed("/me/delete-request")`.
- `fetchAuthed` owns same-origin `/api/me/*` proxy resolution; components must not hardcode `/api/me/*`.
- Current local Dialog components still own submit side effects. The pure-UI Dialog split remains a design target, not a completed local invariant for this cycle.
- `data-region` contract: `public-visibility-banner`, `status-summary`, `request-action-panel`, `visibility-request-dialog`, `delete-request-dialog`.

### Types

```ts
type PublishState = "public" | "member_only" | "hidden";
type VisibilityDesiredState = "hidden" | "public";
type AuthGateState = "active" | "rules_declined" | "deleted";
type RequestType = "visibility" | "delete";

interface VisibilityRequestInput {
  readonly desiredState: VisibilityDesiredState;
  readonly reason?: string;
}

interface DeleteRequestInput {
  readonly reason?: string;
  readonly confirmText: string;
}
```

### Edge Cases

| Case | Handling |
| --- | --- |
| AuthRequiredError on initial render | `redirect("/login?redirect=/profile")` |
| 404 profile response | `notFound()` |
| 409 duplicate request | `RequestErrorMessage` |
| `router.refresh()` failure after successful request | show reload guidance; do not invent optimistic pending state |
| IME composition during delete confirmation | keep submit disabled |
| non-pending old request row | API mirror only exposes pending object; absence means enabled |

### Verification

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm --filter web test -- profile`
- `mise exec -- pnpm --filter web test:e2e -- profile-smoke`
- `rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile`
- API surface diff gate in Phase 10
- D1 direct access grep gate in Phase 10
