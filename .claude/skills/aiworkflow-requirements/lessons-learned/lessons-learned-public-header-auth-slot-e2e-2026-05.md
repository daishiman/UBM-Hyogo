# Lessons Learned — public-header-auth-slot-e2e (2026-05)

`docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/` の実装サイクルで得た苦戦箇所を体系化する。将来「親 workflow の dependent task を独立 workflow に昇格させる判断」「3 状態 storageState の一括生成」「`data-auth-state` DOM 契約を型レベル + assertion 両方で固定する」「redirect 期待の regex 整合」「CI matrix 非破壊追加」「ROUTES 配列 DRY 化と TC grepability の両立」を簡潔に解決するための原則を残す。

## L-AUTHSL-001: parent workflow の dependent task は「横断検証 × TC数」で独立 workflow へ昇格させる

- **苦戦**: 親 workflow `public-header-logged-in-nav-cleanup` (Task A-F) で確立する `data-auth-state` / `data-role` DOM 契約を、Task G として e2e で検証する設計を当初取った。Task A-F の実装と Task G の検証が同一 phase output を共有すると、Phase 11 evidence ledger / artifacts.json の境界が壊れる。
- **原因**: dependent task でも「横断 7 routes × 3 states + regression 4 = 25 TC」を持つ検証は、親と同じ DoD / Gate 単位で扱うと Gate-A の承認単位が不明瞭になる。
- **対策**: NON_VISUAL × 横断検証 × 21+ TC を満たす dependent task は独立 workflow に昇格させ、`parent_workflow` リンクで親-子境界を明示する。親側は「DOM 契約 owner」、子側は「契約検証 owner」と書き分け、Phase 12 strict 7 output / Gate-A 承認を子 workflow 単独で完結させる。判定基準: (a) 親実装と独立に test 追加で価値が出るか (b) TC 表が親 phase-4 を圧迫するか (c) CI matrix 追加が必要か — 2 つ以上 yes なら昇格。

## L-AUTHSL-002: 3 状態 storageState は setup project + `dependencies` で一括生成する

- **苦戦**: guest / member / admin の 3 状態を、各 spec 内で個別 login しようとすると spec が肥大化し、login 経路の変更で全 spec を直す必要が出た。既存 `setup-authenticated-staging` は staging 専用で local 開発向きではない。
- **原因**: storageState の生成と消費を同じ spec に同居させると、test isolation と再利用性が両立しない。
- **対策**: `apps/web/playwright/tests/setup-auth.spec.ts` を独立 project として置き、`signSessionJwt` + `memberLogin` / `adminLogin` で `playwright/.auth/{guest,member,admin}.json` を生成する。消費側 spec は `test.use({ storageState: '.auth/<state>.json' })` で受け、`playwright.config.ts` の project に `dependencies: ['setup-auth']` を付けて起動順を固定する。`.auth/` は `.gitignore` で除外し、CI でも setup project から毎回生成して deterministic にする。

## L-AUTHSL-003: `data-auth-state` literal 3 値は型レベル + DOM assertion 両方で固定する

- **苦戦**: `data-auth-state` の値を文字列で書き散らすと、`guest` / `guests` / `anonymous` のような typo が CI で検出されず、prod の DOM 契約が壊れる。
- **原因**: DOM attribute literal は TypeScript の型推論を逃れやすく、spec 側も `string` で受けると検証穴ができる。
- **対策**: `apps/web/src/lib/auth-view/types.ts` で `export type AuthView = 'guest' | 'member' | 'admin'` を一点定義し、`resolveAuthView(session)` の戻り値を `AuthView` に固定する。consumer (PublicHeader 等) も `authView: AuthView` で受ける。Playwright spec 側は `type Expectation = AuthView | 'redirect'` で TC 表を型付け、`await expect(page.locator('[data-auth-state]')).toHaveAttribute('data-auth-state', expected)` で DOM assertion を打つ。型と assertion の両輪で literal を保護する。

## L-AUTHSL-004: redirect 期待は `/login(\?|$)` regex で middleware/server guard 両対応する

- **苦戦**: 未認証 user の `/admin` アクセスを期待した redirect 先が、middleware では `/login?gate=forbidden`、server guard では `/login` と分岐し、`expect(page.url()).toContain('/login?gate=forbidden')` で書くと server guard ルートで fail した。
- **原因**: redirect 経路が複数存在する状態を「具体 URL の完全一致」で assert すると、片側の経路に固有依存する。
- **対策**: assertion を `expect(page).toHaveURL(/\/login(\?|$)/)` の regex で書き、middleware・server guard 両方のルートを許容する。`?` 以降の query は経路ごとに違ってよい。Phase 4 test plan に「redirect 期待は path prefix + regex で書く」を AC として明記し、middleware と server guard の境界変更で test が壊れない設計にする。さらに `middleware.ts` 側は `non-admin /admin → /login?gate=forbidden` に一本化し、`403` 直返しを撤去して経路を 2 種類に閉じる。

## L-AUTHSL-005: CI matrix 追加は `needs:` + `if: github.event_name != 'schedule'` で既存 job を非破壊にする

- **苦戦**: `.github/workflows/playwright-smoke.yml` に `auth-slot` job を素直に追加すると、scheduled run で全 job が走り timeout で fail した。既存 `smoke` job との実行順も不定になった。
- **原因**: CI matrix 追加時に「全 trigger × 全 matrix」を default にすると、既存 job の信頼性が下がる。
- **対策**: 新 job に `needs: smoke` で起動順を固定し、`if: github.event_name != 'schedule'` で schedule trigger を除外する。timeout は `timeout-minutes: 15` で上限を切る。`both-or-none preflight`（setup-auth と auth-slot-coverage の testIgnore を既存 4 project にも追加して二重実行を防ぐ）を `playwright.config.ts` で対称に書き、project の追加が既存 visual baseline の実行に影響しないことを `playwright test --list` で確認する。

## L-AUTHSL-006: ROUTES 配列 DRY 化と TC 名 grepability を両立する

- **苦戦**: 7 routes × 3 states を素直に DRY 化すると、test 名が `should match auth-slot` のような共通文字列になり、CI fail 時に grep で TC を特定できない。
- **原因**: DRY 化と debug 容易性は構造的に競合する。TC 名から `routes[i].path` と `state` が両方読めないと git bisect の単位を失う。
- **対策**: TC 名を `\${state} viewing \${path}` の template で生成し、`test('member viewing /privacy', ...)` の形で grep 容易性を保つ。spec 内コメントに「TC 名は CI fail 時の primary lookup key — テンプレートを変更する際は doc-side phase-4 test plan の TC ID と同時に更新する」を残す。ROUTES 配列は `{ path, expect: Record<State, Expectation> }` の shape で固定し、route 追加時の編集点を 1 箇所に集約する。

## 関連リソース

- workflow root: `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/`
- artifact inventory: [[workflow-public-header-auth-slot-e2e-artifact-inventory]]
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260528-public-header-auth-slot-e2e.md`
- parent workflow: `docs/30-workflows/public-header-logged-in-nav-cleanup/`
- 関連 lessons: [[lessons-learned-admin-shell-topbar-sidebar-integration-2026-05]] (Server layout × Client boundary)、[[lessons-learned-public-header-logged-in-nav-cleanup-2026-05]] (DOM 契約 owner)
