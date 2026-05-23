# Lessons Learned: task-15 admin dashboard and members (2026-05)

> Workflow: `docs/30-workflows/task-15-admin-dashboard-and-members/`
> Date: 2026-05-10
> State: `IMPLEMENTED_LOCAL_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / runtime_pending`

## L-TASK15-001: shared schema 不変条件は web 側 mapper で吸収する

`AdminDashboardView` shared schema には `byZone` / `byStatus` が無いが、`/admin/dashboard` UI は zone / status 分布を出したい。FB-W0-01（shared 不変）を守るため、`apps/web/src/lib/admin/admin-dashboard-ui.ts` に `toAdminDashboardUi()` mapper を導入し、API レスポンスを loose parse して optional に吸収した。shared schema 変更や新 endpoint 追加には踏み込まない。

- **Why:** shared zod を mutate すると `apps/api` の contract / shared / packages の test が一気に波及する。VISUAL タスクで API surface を動かすと task-15 の境界が崩れる。
- **How to apply:** UI 側で必要な投影は `apps/web/src/lib/<feature>/<feature>-ui.ts` に mapper として閉じ込める。shared schema を変える前に必ず web mapper で吸収できないか先に検討する。

## L-TASK15-002: VISUAL evidence は local mock API / fixture server を経由する

`/admin` / `/admin/members` は Server Component で `await fetch()` するため、Playwright `page.route()` ではブラウザ経路だけ intercept されサーバ fetch には効かない。task-15 では local Playwright fixture（`playwright/tests/task15-admin-screenshots.spec.ts`）で fixture server / mock API を立て、`unresolvedSchema = 5` を含む 9 PNG を取得した。

- **Why:** Server Component fetch はブラウザ層で intercept できない。staging 待ちでは Phase 11 が永遠に閉じない。
- **How to apply:** RSC + fetch を含む VISUAL タスクの Phase 11 では「browser route mock」を選択肢から外す。`webServer` で fixture API を立てる、または既存の API mock を Workers binding 越しに差し込む方式を Phase 9 設計時から決めておく。

## L-TASK15-003: `it.todo` a11y placeholder は同 cycle で解消する

task-15 component 5 file の a11y check を当初 `it.todo` で残したが、Phase 6 close-out で「runtime blocker でない `todo` は許容しない」運用に揃えるため、`jest-axe` を導入し 5 件すべて実テスト化（528 pass / 1 skip）。

- **Why:** `it.todo` は実装漏れを runtime blocker と区別なく永続化させる。VISUAL implementation 系では a11y は AC 直結のため Phase 6 の合格条件に直接組み込むべき。
- **How to apply:** a11y 検証を Phase 6 close-out 時点で `jest-axe` 等の実テストに変換する。`it.todo` を残す場合は明確な runtime blocker（例：staging-only fixture 不在）に紐付け、Phase 12 limitation に明示する。

## L-TASK15-004: Phase 12 strict 7 は物理ファイルとして生成する

Phase 12 strict 7 docs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を `main.md` 内のセクション集約で済ませると、artifact inventory / output parity の検証で参照先 file が存在せず PASS にできない。task-15 では 7 個を物理ファイル分離して保存した。

- **Why:** root/output artifacts parity は JSON 等価性だけでなく referenced file の物理存在まで確認する。集約形式は inventory 検証で fail する。
- **How to apply:** Phase 12 close-out ではテンプレ違反として「main.md にセクション集約」を禁止し、`phase-12/` 配下に 7 物理ファイルを作る。`compliance-check.md` で file 存在を一次証拠にする。

## L-TASK15-005: 非同期 UI race は cancelled flag と try/finally で構造的に消す

`MembersTable` の Drawer は行クリック → fetch → set state の間に行が変わると stale 反映が起きる。`useEffect` 内 cancelled flag で破棄判定し、`BulkActionBar` の bulk action は `try/finally` で busy state を必ずリセットしている（throw 時の押下不能事故を防ぐ）。

- **Why:** Server fetch + Client island の race は表面上見えにくい。staging で初めて顕在化すると影響範囲が大きい。
- **How to apply:** Server-fetch を含む drawer / dialog client island では cancelled flag を invariant にし、bulk action は `try/finally` で busy リセット、submit ボタンは `aria-busy` で UI 状態を一致させる。

---

## Post-merge CI fixes（PR #677 マージ後 2026-05-11 に確定した知見）

Phase-11/12 ドキュメントには含まれない、`dev` マージ後の CI 修正サイクル（commit `c6465df6` / `f1e5b3cd` / `566ae824` / `f4219c36` / `80831cdf`）で判明した苦戦点を 5 件追記する。

### L-TASK15-006: Tailwind v4 auto-source は monorepo + docs HTML を巻き込む

- **症状:** e2e の `next dev` で `apps/web/src/styles/globals.css` 出力に `color: var("])</script><script>self.__next_f.push([1,"--ubm-color-text-primary);` 等の壊れた CSS が混入し PostCSS が爆発。
- **原因:** Tailwind v4 の auto-content-detection が monorepo 直下 `docs/30-workflows/.../evidence/curl/*.html`（Next.js streaming chunks を含む）を class 候補スキャン対象にした。
- **修正:** `@import "tailwindcss" source(none);` で auto-detect を無効化し、必要な path（`../../app`, `../components`, `../features`, `../lib`, `../__tests__/__fixtures__`）を `@source` で明示列挙。
- **教訓:** monorepo + docs に SSR HTML を保存する構成では、Tailwind v4 は最初から `source(none)` + 明示 `@source` を既定にする。

### L-TASK15-007: e2e mock の二重実装 drift（fixture 内蔵 vs standalone）

- **症状:** `playwright/fixtures/auth.ts` 内蔵 mock（port 8787 を bind 試行）と standalone `scripts/e2e-mock-api.mjs` が別々に状態を持ち、CI では standalone が常駐するので fixture state が SSR fetch に伝わらない。
- **修正:** standalone 側に `/__test__/admin-dashboard` 制御エンドポイントを追加し、fixture から `postControl()` で同期。`setAdminDashboardUnresolvedSchema` を `Promise<void>` 返却に変更し test 側で `await` する。
- **教訓:** 「fixture-side state 変更 + SSR fetch」は機能しない。test seed は **必ず standalone mock 側の HTTP control endpoint** を経由する。一つの mock surface だけを正本とする。

### L-TASK15-008: page-object と実装 testid の drift

- **症状:** `AdminDashboardPage.dashboardCards` が legacy `[data-testid="admin-dashboard-card"]` を locate していたが、新 `KpiCard` は `data-testid="admin-kpi-card-*"` を出力していた。
- **修正:** page-object を `[data-testid^="admin-kpi-card-"]` に揃える。
- **教訓:** 新規 primitive を追加した時は page-object / E2E selector を必ず棚卸する。`data-testid` 命名は kebab + 機能 prefix（`admin-kpi-card-*`）で統一し、page-object 側は prefix-match (`^=`) を優先する。

### L-TASK15-009: dev merge 後の CSS coverage drop

- **症状:** dev merge で `MemberDrawer` / `MembersClient` と対応 test が削除され、`apps/web` coverage が 76.73% → gate (80%) 失敗。
- **修正:** 0% コンポーネント 9 件に test 23 件を追加して 82.73% へ復帰。`exactOptionalPropertyTypes: true` 環境では fixture builder で `undefined` を assign せず key 自体を omit する型安全 helper を使う。
- **教訓:** dev merge でコンポーネントごと test を吸収する場合、merge 後に必ず coverage 確認。`exactOptionalPropertyTypes` 環境の fixture builder は `undefined` 代入禁止 → key omit 型 helper を統一。

### L-TASK15-010: next-auth dynamic import × Turbopack の散発エラー

- **症状:** `apps/web/src/lib/auth.ts:375` の `await Promise.all([import("next-auth"), ...])` が Turbopack dev で `Could not parse module '[project]/.../app-router-context.js', file not found` を散発的に出す。
- **暫定回避:** production build は CLAUDE.md 不変条件通り `next build --webpack` を正本に維持（既存方針）。Turbopack dev 限定の散発エラーは retry 1 回で吸収できる。
- **教訓:** Next.js 16 Turbopack は dynamic import の vendored 解決に課題があり、auth 系は **webpack build を正本に保つ**。Turbopack を local dev に限定する境界を緩めない。
