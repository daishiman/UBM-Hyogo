# Implementation Guide

## Part 1 — 中学生レベル

学校の入口に受付があるとします。まだ入っていない人には「受付はこちら」と案内し、すでに入っている人には「自分の教室はこちら」「先生用の部屋はこちら」と案内する方が自然です。

今の画面では、すでに入っている人にも「受付はこちら」と出てしまいます。これを直して、見る人の状態に合わせて正しい行き先を出すようにします。

| 用語 | 日常語での言い換え |
| --- | --- |
| ヘッダ | 画面の一番上の案内板 |
| セッション | いま誰として入っているかの印 |
| リダイレクト | 別の正しい場所へ自動で案内すること |
| テスト | 予定通り案内できるか確認すること |
| 管理者 | 先生や係のように特別な場所へ行ける人 |

## Part 2 — Technical

### Core Types

```ts
export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | { readonly kind: "admin"; readonly profileHref: "/profile"; readonly adminHref: "/admin" };
```

### Implementation Order

1. Task A: add `auth-view` helpers and make `PublicHeader` async/session-aware.
2. Task D and F can run in parallel because they do not need Task A.
3. Task B/C/E follow Task A.
4. Task G runs last, after DOM contracts exist.

### Error Handling

- `getAuthView()` catches auth lookup errors and returns `{ kind: "guest" }`.
- `safeNext()` rejects protocol-relative, absolute, backslash, colon, non-string, and overlong values.
- No PII is written to DOM; only `guest|member|admin`.

### Current Repo Path Corrections

- Playwright specs belong under the current `apps/web/playwright/tests/` directory.
- Existing AdminSidebar tests include both `AdminSidebar.spec.tsx` and `AdminSidebar.component.spec.tsx`; implementation should update the smallest existing owner.
