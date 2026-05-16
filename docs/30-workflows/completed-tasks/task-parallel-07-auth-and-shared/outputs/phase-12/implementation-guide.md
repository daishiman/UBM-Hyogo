# Implementation Guide: parallel-07 auth-and-shared

## Part 1: 中学生レベルの説明

学校のホームページでログインしようとした時、画面が何も変わらないと「止まったのかな」と不安になります。このタスクは、待っている間に「今読み込み中です」と分かる薄い形を出し、エラーが起きた時には大事な見出しへ自動で目印を移します。

必要な理由は、見える人にも、読み上げ機能を使う人にも、今何が起きているかをすぐ伝えるためです。色は決まった色見本から選び、画面ごとにバラバラな色を書きません。

やることは、ログイン画面の読み込み表示を作ること、ログインと共通エラー画面の見出しへ目印を移すこと、プロフィール画面の読み込み表示をそろえることです。

| 用語 | 日常語での言い換え |
|------|--------------------|
| skeleton | 本物が出る前の薄い形 |
| focus | 次に操作する場所の目印 |
| screen reader | 画面を声で読んでくれる道具 |
| token | 決められた色見本 |
| loading | 読み込み中 |

## Part 2: 技術者向け詳細

### Target Files

| Path | Action |
|------|--------|
| `apps/web/app/login/error.tsx` | Card layout + focus management |
| `apps/web/app/login/loading.tsx` | New segment skeleton |
| `apps/web/app/error.tsx` | Add heading focus management |
| `apps/web/app/profile/loading.tsx` | Align skeleton structure |
| `apps/web/app/loading.tsx` | Verify token / aria / motion-safe |
| `apps/web/app/not-found.tsx` | Verify existing branded fallback |

### Contracts

- Component specs use `.spec.tsx`; Playwright specs use `.spec.ts`.
- CTA token utilities use current `bg-accent text-panel`; skeleton uses `bg-surface-2`; error text uses `text-danger`.
- No `apps/api/**`, D1 schema, environment variable, or Auth.js flow change is allowed.
- Visual evidence is captured in `outputs/phase-11/*.png`.

### Screenshot Evidence

| Scenario | Path |
|---|---|
| `/login` loading light | `outputs/phase-11/login-loading-light.png` |
| `/login` loading dark | `outputs/phase-11/login-loading-dark.png` |
| `/login` error light | `outputs/phase-11/login-error-light.png` |
| `/login` error dark | `outputs/phase-11/login-error-dark.png` |
| root error light | `outputs/phase-11/root-error-light.png` |
| root error dark | `outputs/phase-11/root-error-dark.png` |
| `/profile` loading light | `outputs/phase-11/profile-loading-light.png` |
| `/profile` loading dark | `outputs/phase-11/profile-loading-dark.png` |

### Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/login/__tests__/login-error.component.spec.tsx apps/web/app/__tests__/error.component.spec.tsx apps/web/app/profile/__tests__/profile-loading.component.spec.tsx
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-11 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts --project=desktop-chromium
mise exec -- pnpm verify:tokens
```
