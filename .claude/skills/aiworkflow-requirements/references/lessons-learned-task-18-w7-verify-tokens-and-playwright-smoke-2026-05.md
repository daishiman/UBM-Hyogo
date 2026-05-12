# Lessons Learned: task-18 W7 verify-tokens-and-playwright-smoke (2026-05)

> Workflow: `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/`
> Date: 2026-05-12
> State: `implemented-local / implementation / NON_VISUAL / runtime_pending`

## L-TASK18-W7-001: Design token SSOT は 3 層 bridge を検証しないと drift が黙過される

`docs/00-getting-started-manual/specs/09b-design-tokens.md` §9 / `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` の `@theme inline` の 3 層は、いずれかが片側更新されると build は通っても UI が token drift で破綻する。`scripts/verify-design-tokens.ts` は 3 層を同名 token で突き合わせ、欠落・乖離があれば exit 1 で落とす。

- **Why:** Tailwind v4 の `@theme inline` は globals.css 側で再宣言する設計であり、tokens.css の単独変更では globals に反映されない。spec と CSS の整合は人手だけでは保てない。
- **How to apply:** デザイントークンの追加・改名・廃止を行う PR では `pnpm verify:tokens` を必須 gate にする。MVP 期は OKLch のみ対象とし、shadow / radius / spacing は段階拡張する。

## L-TASK18-W7-002: Playwright fixture は service worker と build artifact を遮断しないと flaky になる

`apps/web/playwright/fixtures/auth.ts` で `serviceWorkers: "block"` を指定しないと、Next.js dev サーバの hot reload と Workers preview の sw が干渉し、admin route の SSR fixture cookie が時々 stripped される。さらに OpenNext Workers の bundle 互換のため、Playwright web server は `next dev --webpack` を強制する。Turbopack で起動すると `[project]/...` 仮想 module specifier が混入して `apps/web/wrangler.toml` deploy bundle 検証が壊れる。

- **Why:** Next.js 16 の Turbopack は dev 高速化を狙うが、OpenNext Workers の bundle 期待形と衝突する。Playwright web server は production build と等価な dev 出力が必要。
- **How to apply:** `apps/web/playwright.config.ts` の `webServer.command` を `next dev --webpack` に固定する。`apps/web/package.json` の `dev` も同様。Turbopack 採用判断は OpenNext との互換性確認後とし、Playwright fixture では使わない。

## L-TASK18-W7-003: Server Component fetch は env-gated SSR fixture でしか visual evidence を取れない

`/admin` 配下は Server Component で `apps/web/src/lib/admin/server-fetch.ts` を介して D1/API を fetch する。`page.route()` による browser-side intercept は SSR fetch に届かないため、Phase 11 visual baseline 取得には `PLAYWRIGHT_TASK18_ADMIN_FIXTURE=1` 等の env-gated SSR fixture branch を server-fetch helper に実装する必要がある。production では絶対に branch しないこと（`NODE_ENV !== "production"` ガード）。

- **Why:** task-17 L-TASK17-001 と同じ構造的制約。SSR 取得起点は Node ランタイム側で完結する。
- **How to apply:** 新規 admin 画面の visual baseline を取る前に、Phase 4 設計で「fetch 起点が SSR か CSR か」を分類する。SSR 主体なら server-fetch.ts に env-gated fixture branch を先に実装する。env 変数名は task ID prefix で衝突回避。

## L-TASK18-W7-004: Phase 11 evidence は `.txt` / `.json` のみ canonical。`.log` は `.gitignore` で落ちる

Phase 11 PASS 根拠ファイルとして `.log` 拡張子で evidence を出すと、repository root `.gitignore` で除外され、PR diff に乗らず、CI/レビューでも参照できない。`outputs/phase-11/*.log` の運用は無効化し、`outputs/phase-11/*.txt` / `*.json` を canonical とする。

- **Why:** repo wide `.gitignore` に `*.log` が含まれており、tracked 化には `git add -f` が必要。明示的な追跡 intent を要求するのは無駄に脆く、artifact validation も通らない。
- **How to apply:** Phase 11 evidence は最初から `.txt` / `.json` で生成する。既存 spec の `*.log` 例示は `*.txt` へ書き換える（task-specification-creator/references/phase-11-screenshot-guide.md にも反映）。

## L-TASK18-W7-005: required status check 候補は CI で 1 回 success run を出してから PUT する

`verify-design-tokens / verify-design-tokens`、`playwright-smoke / smoke (chromium)`、`playwright-smoke / visual (chromium, 4 screens)` は branch protection `required_status_checks.contexts` の追加候補だが、未登録 context を required に乗せると PR が永遠に未充足になる。

- **Why:** GitHub branch protection は registered check のみ評価する。未 run の context は green にならない。Stage 3c の lighthouse-ci / e2e-tests-coverage-gate 採用時と同じ制約。
- **How to apply:** workflow を `dev` で 1 回成功させ、`gh api repos/.../check-runs` に出現することを確認した後で、user approval を経て `gh api -X PUT` を実行する。read response の payload を normalize し、`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` を保全する。

## Cross-Reference

- Artifact inventory: `references/workflow-task-18-w7-verify-tokens-and-playwright-smoke-artifact-inventory.md`
- Workflow root: `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/`
- Related lessons: `references/lessons-learned-task-17-admin-schema-conflicts-audit-2026-05.md` (L-TASK17-001 SSR fixture)
- Changelog: `changelog/20260512-task-18-w7-verify-tokens-and-playwright-smoke.md`
