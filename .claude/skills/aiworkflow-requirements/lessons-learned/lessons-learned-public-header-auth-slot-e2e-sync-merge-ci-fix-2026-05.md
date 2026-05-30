# Lessons Learned — public-header-auth-slot-e2e dev sync merge + CI regression fix (2026-05-30)

merge `origin/dev` → `feat/public-header-auth-slot-e2e` 後、push 後 CI で
verify-gate-metadata / coverage-gate (web) / e2e (desktop-chromium, desktop-firefox) /
e2e-tests-coverage-gate / validate の 5 job が fail し、`pnpm sync:resolve`
だけでは検出できない semantic regression を 3 件解消した。以下 L-PHAS-CI-001..003 を
追記する。

## L-PHAS-CI-001 — `outputs/artifacts.json` の gates は `metadata.gates` 配下に置く（top-level 禁止）

**Rule:** workflow `artifacts.json` の `gates: [...]` は必ず `metadata.gates: [...]` の形に入れること。
完了 workflow が `docs/30-workflows/completed-tasks/` 配下に移動された後の
`outputs/artifacts.json` でも同じ。

**Why:** `verify-gate-metadata` CI gate は `--require-gates-for-changed`
モードで PR 内で変更された `**/artifacts.json` に対し
`metadata.gates absent on changed artifacts.json` を ERROR に昇格させる。
ローカル `pnpm gate-metadata:validate` のデフォルト（require なし）では
WARN（skip）扱いになるため**手元 PASS だが CI FAIL** が成立する。

**How to apply:**
1. close-out 時 `outputs/artifacts.json` を新規作成・更新する際は、root `artifacts.json` と
   同じ `metadata.gates` の構造で書く（top-level `gates` は禁止）。
2. PR 作成前に必ず以下を実行して `ERROR: 0` を確認する:
   ```bash
   mise exec -- pnpm gate-metadata:validate --require-gates-for-changed \
     $(git diff --name-only origin/dev...HEAD -- '**/artifacts.json')
   ```
3. 既存 workflow を completed-tasks に移動するときは `outputs/artifacts.json` の
   gates 構造も併せて metadata 配下に正規化する。

## L-PHAS-CI-002 — 認可境界の middleware 実装変更（403→redirect 等）は同一 commit で e2e spec を更新する

**Rule:** `apps/web/middleware.ts` で `/admin` 配下のレスポンスを
`new NextResponse("Forbidden", { status: 403 })` から
`NextResponse.redirect(/login?gate=forbidden)` のような redirect に
変更する場合、必ず同一 commit 内で `apps/web/playwright/tests/admin-pages.spec.ts`
など `expect(res?.status()).toBe(403)` を assert している e2e spec を
`await expect(page).toHaveURL(...)` に置き換える。

**Why:** feature 単体 commit 時点では admin-pages.spec.ts が dev に未着で
気付かないが、dev sync merge で取り込まれた時点で
- middleware: redirect 化（feature 側）
- e2e spec: 403 期待（dev 側）

の semantic conflict が初めて顕在化し、`pnpm sync:resolve` の union/ours は
構文的衝突しか解消しないため発見できない。CI の e2e job のみで検出される。

**How to apply:**
1. 認可境界レスポンスを変える PR では、変更前に
   `git grep -nE '(403|isAdmin|forbidden|gate=forbidden)' apps/web/playwright/`
   で関連 e2e spec を洗い出し、同じ commit で更新する。
2. dev sync merge 後は単に `pnpm typecheck && pnpm lint` だけでなく、
   差分パスに `apps/web/middleware.ts` または `apps/web/app/(admin)/layout.tsx` が
   含まれている場合は **e2e admin-pages spec を必ず手動 grep 検査** する。
3. **redirect 連鎖の最終 URL を assert する**: middleware redirect 先（例 `/login?gate=forbidden`）
   が他の server component（例 `/login` の `getSession()` 認証済 redirect → `/profile`）で
   さらに redirect される場合、Playwright `goto` は **最終 URL でしか settle しない**。
   `toHaveURL(/\/login\?.*gate=forbidden/)` は intermediate URL の assert なので fail する。
   必ず redirect chain の終点（本 case では `/profile`）を assert すること。chain を把握するには
   `apps/web/app/login/page.tsx` 等の server component で
   `redirect(next ?? "/profile")` を grep して認証済ユーザーの fallback 先を特定する。

## L-PHAS-CI-003 — async server component layout を導入した直後の `.spec.tsx` は `vi.mock` + `await Layout({...})` 形に書き換える

**Rule:** `apps/web/app/(member)/layout.tsx` を `async` server component に変更
（`getAuthView()` を `await` で読む形）した直後、同階層の `layout.spec.tsx` は
`render(<MemberLayout>...</MemberLayout>)` のままにしてはいけない。
`vi.mock("../../src/lib/auth-view", () => ({ getAuthView: async () => ({...}) }))`
で auth-view を mock し、`render(await MemberLayout({ children }))` の形に置き換える。

**Why:** `render(<AsyncComp>)` は Promise を JSX として埋め込むため、
`container.querySelector('[data-testid="member-shell"]')` などは null を返し
`AssertionError: expected null not to be null` で fail する。
coverage-gate (web) の test:coverage は閾値前にこの fail を拾うため、shard
全体が `ELIFECYCLE Command failed with exit code 1` で停止する。

**How to apply:**
1. layout / page を async に変えるときは、同 commit で `.spec.tsx` を以下パターンに変換:
   ```tsx
   vi.mock("../../src/lib/auth-view", () => ({
     getAuthView: async () => ({ kind: "member", displayName: "Member" }),
   }))
   import MemberLayout from "./layout"
   async function renderLayout(children: ReactNode) {
     return render(await MemberLayout({ children }))
   }
   ```
2. 既存の async 移行済 sibling spec（例: `apps/web/app/(public)/layout.spec.tsx`）を
   コピー元として参照する（同 repo の reference implementation 優先）。

## Anti-patterns

1. `pnpm sync:resolve` 完了直後に typecheck/lint のみで push し、e2e/coverage の semantic
   regression を CI で初めて検出する（手元では拾えない）。
2. `outputs/artifacts.json` を root `artifacts.json` から派生させるとき、`metadata` を
   省いて `gates` を top-level に置く（ローカル `pnpm gate-metadata:validate` が
   PASS なので気付かない）。
3. middleware で 403→redirect を入れ替えるとき、e2e spec の `expect(res?.status()).toBe(403)`
   を見逃したまま PR を出す。
4. layout を async 化したとき、`.spec.tsx` の `render(<Layout>)` を残す。
5. `--require-gates-for-changed` を CI 専用と理解せず、ローカル run の WARN を「無害」と扱う。
