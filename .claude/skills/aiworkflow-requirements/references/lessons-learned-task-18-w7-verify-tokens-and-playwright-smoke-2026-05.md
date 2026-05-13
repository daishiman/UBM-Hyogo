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

## L-TASK18-W7-006: `PLAYWRIGHT_BASE_URL` の env fallback は `||` で空文字も拾う

`apps/web/playwright.config.ts` と `apps/web/playwright/fixtures/auth.ts` の base URL 取得で `process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'` を使うと、CI で env が空文字で注入された場合に `new URL('')` で `TypeError: Invalid URL` / `Cookie should have a url or a domain/path pair` で全 spec が転倒する。

- **Why:** `??` は `null` / `undefined` のみ fallback。空文字は valid value 扱い。GitHub Actions の env passthrough は未設定キーを `''` として export することがある。
- **How to apply:** Playwright config / fixture の URL 取得は `process.env.X || default` で統一する。`apps/web/playwright.config.ts:52` と `apps/web/playwright/fixtures/auth.ts:399` を一律 `||` に揃え、`localBaseURL` から派生する `localPort` / cookie URL も同じ source を経由させる。

## L-TASK18-W7-007: project レベル testIgnore で smoke / visual を chromium-linux baseline project に閉じ込める

`apps/web/playwright/tests/visual/*.spec.ts` と `full-smoke.spec.ts` を全 project（desktop-chromium / desktop-firefox / mobile-webkit / smoke-chromium / visual-chromium）で実行すると、firefox / mobile-webkit には baseline PNG が無く `A snapshot doesn't exist ... writing actual` で失敗、smoke も二重実行で workers=1 のため 30 分超のタイムアウトを誘発する。

- **Why:** Playwright visual baseline は `<spec>.spec.ts-snapshots/<name>-<project>-<platform>.png` で project + platform 別に格納される設計。chromium-linux 1 系統だけ baseline 化する MVP 方針なら、他 project では実行しないのが正しい。
- **How to apply:** `apps/web/playwright.config.ts` の `desktop-chromium` / `desktop-firefox` / `mobile-webkit` project に `testIgnore: [/visual\/.*\.spec\.ts$/, /full-smoke\.spec\.ts$/]` を入れ、`smoke-chromium` / `visual-chromium` project に `testMatch` で対象を絞る。baseline 増設時は対応する `*-<project>-<platform>.png` を spec-snapshots ディレクトリに追加し、CI artifact の `*-actual.png` をリネームしてコピーするのが最短経路。

## L-TASK18-W7-008: artifacts.json は `metadata.gates` 配列を Gate-A〜Gate-D で必ず満たす

`verify-gate-metadata` CI gate（`docs/30-workflows/completed-tasks/*/artifacts.json` と root の同名ファイル両方を zod 検証）は `metadata.gates: [{gate_id, status, passed_at, evidence_path, approver, notes}, ...]` を必須にしている。同じファイルが workflow root と `outputs/` 下に同名で存在する場合は **両者を一字一句揃える** ことが期待される。

- **Why:** Gate-A=spec_review / Gate-B=validator_green / Gate-C=ci_integration / Gate-D=pr_approval の 4 段階を統一台帳化するため。`outputs/artifacts.json` だけ更新して root を放置すると CI が ERROR を投げる（ファイル単位の独立検証）。
- **How to apply:** artifacts.json 生成時に gates 配列を埋め、`cp outputs/artifacts.json ./artifacts.json` または `git diff` で両者一致を確認する。task-18 では Gate-A/B を passed（2026-05-12 daishiman 承認）、Gate-C を pending（CI integration runtime）、Gate-D を pending（branch protection PUT）として記録した。

## L-TASK18-W7-009: `phase12-task-spec-compliance-check.md` は 9 canonical headings を厳格に要求する

`verify-phase12-compliance` CI gate は `outputs/phase-12/phase12-task-spec-compliance-check.md` の以下 9 H2 headings の有無を grep で検証する：Summary verdict / Changed-files classification / `workflow_state` and phase status consistency / Phase 11 evidence file inventory / Phase 12 strict 7 file inventory / Skill/reference/system spec same-wave sync / Runtime or user-gated boundary / Archive/delete stale-reference gate / Four-condition verdict。

- **Why:** Phase 12 監査の SSOT を任意フォーマットに任せると後続タスクで形骸化する。CI で機械検証可能にするため heading は固定化されている。
- **How to apply:** Phase 12 開始時にこの 9 heading のスケルトンをコピーして埋める。`completed-tasks/<task>/outputs/phase-12/` 直下に置き、各 heading 下に PASS / NG / partial と evidence path を表で記載する。task-18 では canonical fix としてこの形式へ書き直し済み。

## L-TASK18-W7-010: completed-tasks/ 直下の follow-up spec は orphan workflow root を生むので unassigned-task/ へ即時 relocate

`docs/30-workflows/completed-tasks/<followup-spec>.md` を completed-tasks/ 直下に置くと、`verify-phase12-compliance` は親パスを「Phase 1-13 を持つ workflow root」と誤検出して strict 7 ファイル不足で fail する。

- **Why:** completed-tasks/ 直下は「完了済み workflow ディレクトリ」専用領域。スタンドアロンの .md は workflow root と判別される。
- **How to apply:** follow-up は `docs/30-workflows/unassigned-task/<task-id>.md` に置く。task-18 では `task-18-full-visual-regression-suite-001.md` を `git mv` で unassigned-task/ に移動して fail を解消した。

## L-TASK18-W7-011: accent token は L=0.52 を維持し a11y contrast 4.5:1 を確保する

`--ubm-color-accent` を `oklch(0.58 0.10 55)` に上げると `apps/web/playwright/tests/a11y.spec.ts` の axe `color-contrast` (WCAG 2.1 AA) が `/`, `/members`, `/members/m-1`, `/register`, `/login` で serious 違反を出し、`e2e-tests-coverage-gate` が落ちる。

- **Why:** stone theme の accent は白背景上の小文字・リンク色として 4.5:1 を満たす必要がある。L=0.58 では `panel: #ffffff` 上の contrast が 3.x:1 に落ちる。L=0.52 で 4.5:1 を保つ。
- **How to apply:** 3-layer bridge を `oklch(0.52 0.10 55)` で揃える（`apps/web/src/styles/tokens.css:21` / `docs/00-getting-started-manual/specs/09b-design-tokens.md` §3.2 / §3.4.1 / §JSON snippet）。`pnpm verify:tokens` で 3-layer 一致を確認した上で a11y spec を回す。

## L-TASK18-W7-012: Playwright project-level testIgnore は global testIgnore を **置換** する

`apps/web/playwright.config.ts` で global `testIgnore: fixtureGatedTestIgnore` を設定しても、project に `testIgnore: [/visual.../, /full-smoke/]` を書くと project 側が **置換** される設計のため、`admin-identity-conflicts.spec.ts` / `admin-requests.spec.ts` / `admin-member-delete.spec.ts` / `admin-schema-conflicts-audit.spec.ts` が fixture env なしで走り、`e2e-tests-coverage-gate` の全 project (desktop-chromium / desktop-firefox / mobile-webkit) で SSR fixture 未通電による失敗を起こす。

- **Why:** Playwright `Project.testIgnore` は global `testIgnore` を merge せず置き換える設計。fixture-gated admin spec を一括除外するには project 配列にも明示 spread が必要。
- **How to apply:** 各 project の testIgnore を `[/visual\/.*\.spec\.ts$/, /full-smoke\.spec\.ts$/, ...fixtureGatedTestIgnore]` のように spread で合成する。新規 admin spec を追加した際は `fixtureGatedTestIgnore` push 条件の見直しを同時にレビューする。

## Cross-Reference

- Artifact inventory: `references/workflow-task-18-w7-verify-tokens-and-playwright-smoke-artifact-inventory.md`
- Workflow root: `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/`
- Related lessons: `references/lessons-learned-task-17-admin-schema-conflicts-audit-2026-05.md` (L-TASK17-001 SSR fixture)
- Changelog: `changelog/20260512-task-18-w7-verify-tokens-and-playwright-smoke.md`
