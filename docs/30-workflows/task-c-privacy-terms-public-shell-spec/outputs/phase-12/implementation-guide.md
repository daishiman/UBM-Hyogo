# Implementation Guide

## Part 1: 中学生レベルの説明

### 背景

`/privacy` と `/terms` は文章だけのページになっていて、上のメニューと下のフッターがありません。
これだとユーザーがトップページや会員一覧へ戻りにくく、ログイン中かどうかも画面に出ません。
Task C は、この 2 ページにも他の公開ページと同じ枠を付ける作業です。

### やること

2 つのページを `PublicHeader` と `PublicFooter` で囲みます。
本文やタイトルは変えません。
ログイン状態は Task A の `getAuthView()` が調べるので、Task C はその結果をヘッダへ渡すだけです。

### 確認方法

画面に `public-shell` があることをテストします。
ヘッダ、フッター、既存の見出しが同時に残っていることも確認します。
スクリーンショットは guest/member/admin の 3 状態を両ページで撮影済みです。

## Part 2: 技術者レベルの説明

### Scope

Edit only `apps/web/app/privacy/page.tsx`, `apps/web/app/terms/page.tsx`, and their focused page specs.
Do not move the pages into `(public)` and do not alter legal prose or metadata.
Use the existing public components and Task A auth-view helper.

### Implementation Steps

1. Import `PublicHeader`, `PublicFooter`, and `getAuthView` in each page.
2. Change the page component to `async` and call `const authView = await getAuthView()`.
3. Wrap the existing `<main>` with a root `<div data-testid="public-shell" data-route-group="public" data-theme="warm">`.
4. Insert `<header data-shell="topbar"><PublicHeader authView={authView} /></header>` before `<main>`.
5. Insert `<footer data-shell="footer"><PublicFooter /></footer>` after `<main>`.

### Verification Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/privacy/__tests__/page.spec.tsx app/terms/__tests__/page.spec.tsx
bash scripts/verify-pr-ready.sh
```

### Known Limits

This workflow is currently `implemented_local_evidence_captured`.
Visual evidence is `VISUAL_ON_EXECUTION`; captured files are present under `outputs/phase-11/evidence/`.
Commit, push, and PR creation require explicit user approval.

### Screenshot Evidence

| Route | Guest | Member | Admin |
| --- | --- | --- | --- |
| `/privacy` | `outputs/phase-11/evidence/privacy-guest.png` | `outputs/phase-11/evidence/privacy-member.png` | `outputs/phase-11/evidence/privacy-admin.png` |
| `/terms` | `outputs/phase-11/evidence/terms-guest.png` | `outputs/phase-11/evidence/terms-member.png` | `outputs/phase-11/evidence/terms-admin.png` |
