# Implementation Guide

## Part 1: 中学生レベルの説明

今までの Lighthouse CI は、学校の先生が教室を見るつもりなのに、教室の入口で止まっている状態だった。`/profile` はログインした人だけが見られる画面なので、ログインしていないまま測ると、本当のプロフィール画面ではなくログイン画面への移動を測ってしまう。

このタスクでは、Lighthouse に「今日はこの生徒として入っていい」という一時的な通行証を渡す。通行証を持った Lighthouse は入口で止まらず、実際のプロフィール画面まで進んで、文字の読みやすさやボタンの使いやすさを測れる。

同時に、プロフィール画面が裏側で必要とする返事も、テスト用の小さな受付係に返してもらう。本物の会員データや秘密の情報は使わず、テスト専用の名前と状態だけを使うので、安全に確認できる。

### 専門用語セルフチェック

| 専門用語 | 日常語への言い換え |
| --- | --- |
| Lighthouse CI | 画面の見やすさを自動で採点する係 |
| cookie | ログイン済みを示す一時的な通行証 |
| JWT | 通行証に入っている、改ざんしにくい本人確認メモ |
| mock API | テスト用の小さな受付係 |
| workflow | 自動確認を順番に進める手順表 |
| artifact | 確認結果として残すレポート |

## Part 2: Technical Guide

1. `apps/web/scripts/lhci-auth-storage.ts`
   - Reads `process.env.AUTH_SECRET`.
   - Calls `signSessionJwt(secret, { memberId, email, isAdmin: false, name, ttlSeconds: 3600 })`.
   - Writes `apps/web/.lhci/storage-state.json` using an `import.meta.url`-relative default path so `pnpm --filter @ubm-hyogo/web` cwd does not drift.
2. `apps/web/lhci/lhci-auth.cjs`
   - Reads `apps/web/.lhci/storage-state.json`.
   - Sets `authjs.session-token` through Puppeteer.
   - Runs a `/profile` final URL pre-check and throws if the page resolves to `/login` or any non-2xx response.
3. `apps/web/scripts/lhci-profile-mock-api.ts`
   - Serves deterministic `/health`, `/me`, `/me/profile`, and `/me/attendance` responses on `127.0.0.1:8787`.
   - Verifies `authjs.session-token` or `__Secure-authjs.session-token` with `AUTH_SECRET`.
4. `lighthouserc.authenticated.json`
   - URL: `http://localhost:3000/profile`.
   - `puppeteerScript`: `./lhci/lhci-auth.cjs` because LHCI runs with `apps/web` as cwd.
   - Accessibility assertion: min score `0.90`.
   - Upload target: filesystem `.lighthouseci-authenticated`.
5. `.github/workflows/lighthouse.yml`
   - Runs unauthenticated LHCI first.
   - Starts Next with `AUTH_SECRET` and `INTERNAL_API_BASE_URL=http://127.0.0.1:8787`.
   - Generates auth storage state, starts the mock API, waits for `/health`, runs authenticated LHCI, and uploads artifacts from `apps/web/.lighthouseci*`.

## Verification

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm --filter @ubm-hyogo/web test -- scripts/__tests__/lhci-auth-storage.spec.ts`
- `AUTH_SECRET=test-secret-32-bytes-padding-xxx mise exec -- pnpm --filter @ubm-hyogo/web lhci:auth-storage`
- Runtime LHCI artifact collection remains pending until the user-approved CI/PR cycle.

## User-Gated Operations

GitHub Secret mutation, push, PR creation, and GitHub Actions runtime evidence collection remain user-gated.
