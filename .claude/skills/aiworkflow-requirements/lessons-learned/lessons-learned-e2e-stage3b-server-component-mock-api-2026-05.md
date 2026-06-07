# Lessons Learned: E2E Stage 3b — Server Component mock API and evidence vocabulary (2026-05)

> Workflow root: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
> Phase 12 出典: `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/implementation-guide.md`
> 反映日: 2026-05-11

このファイルは Stage 3b（`e2e-tests` を `e2e-tests-coverage-gate` PR hard gate に昇格させる実装）で発生した苦戦箇所と、再現可能な対処を残す。

---

## L-E2EQU3B-001: Server Component の server-side `fetch()` は `page.route()` で捕捉できない

### What

Playwright の `page.route()` は browser-context の HTTP を intercept する。Next.js App Router の Server Component が SSR フェーズで実行する server-side `fetch()` は browser を経由しないため、`page.route()` で intercept できない。`apps/web` の `/`, `/(public)/members`, `/(public)/members/[id]` などは SSR fetch で API を呼び出すため、E2E でこの経路を mock する設計が必要だった。

### Why

Stage 3b の目的は `e2e-tests-coverage-gate` を PR hard gate にすることで、CI で deterministic に PASS / FAIL する必要がある。実 API（Cloudflare Workers）依存にすると、staging 認証 / D1 状態 / Cloudflare 認可の 3 要素が CI を非決定論的にする。SSR fetch を mock しなければ CI で再現性を保てない。

### How to apply

- CI workflow で deterministic mock API `scripts/e2e-mock-api.mjs` を起動する。
- `INTERNAL_API_BASE_URL` と `PUBLIC_API_BASE_URL` を `http://127.0.0.1:8787` に向ける。Server Component の `fetch()` 経路を mock 受け口に差し替える。
- `apps/web/src/lib/fetch/public.ts` は `PUBLIC_API_BASE_URL` が明示されたとき、Cloudflare service binding より HTTP fallback を優先する。これにより local / CI E2E で mock 差し替えが成立する。
- ローカル限定エンドポイント（`127.0.0.1:8787` など）の `apps/web/src` 配下への焼き込みは禁止（task-18 regression smoke で grep gate）。env 注入のみで切り替える。

### Evidence

- `.github/workflows/e2e-tests.yml`: deterministic mock API 起動 + `INTERNAL_API_BASE_URL=http://127.0.0.1:8787` + `PUBLIC_API_BASE_URL=http://127.0.0.1:8787` 設定
- `scripts/e2e-mock-api.mjs`: CI hard gate 用 deterministic mock API
- `apps/web/src/lib/fetch/public.ts`: `PUBLIC_API_BASE_URL` 明示時の HTTP fallback 優先

---

## L-E2EQU3B-002: `artifacts.json` の status vocabulary drift と machine-validate gate

### What

`artifacts.json` の `workflow_state` / `state` フィールドに `spec` / `completed-local` などの非 canonical 値が混入し、結果として workflow 状態の誤判定が起きた。canonical な 3-state vocabulary（`spec_created` / `runtime_pending` / `completed`、または `implementation` 系の `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 等）以外の値は status 判定で扱えない。

### Why

Stage 3 family は workflow_state を `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` の 3 経路で同期する。canonical でない値が混入すると、resource map の lookup が破綻し、completed 誤判定 → premature artifact deletion / PR 早期作成のリスクが生じる。

### How to apply

- `artifacts.json` 更新時は canonical vocabulary（`spec_created` / `runtime_pending` / `completed` / `implementation` 系）以外を書かない。
- `task-specification-creator` skill の `workflow-state-vocabulary.md` を SSOT として参照する。
- Phase 12 のときに strict 7 outputs の `phase12-task-spec-compliance-check.md` で vocabulary 一致を machine-validate する gate を入れる。
- 一時的な非 canonical 値（`spec` / `completed-local` 等）が見つかった場合は同一 wave で正規化し、`task-workflow-active.md` と同期させる。

---

## L-E2EQU3B-003: completed-tasks 移動時の親アーカイブパス整合

### What

Stage 3 のサブタスク（3a / 3b / 3c）は親 umbrella `e2e-quality-uplift-stage-3` 配下に存在する。一部のサブタスクで親側 archive path が `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/` に移動した状態と、サブタスク側の `index.md` / phase ファイルが旧 path を citing する状態が同時並存し、reverse index が破綻するリスクがあった。

### Why

phase / index / artifacts.json を別 wave で更新すると、references の dangling link が発生する。`task-workflow-active.md` も移動後 path に追従しなければ resource-map と矛盾する。

### How to apply

- 親 umbrella を `completed-tasks/` 配下に移動する場合は、同一 wave で次を更新する:
  - サブタスク `index.md` / `phase-*.md` の親 path リンク
  - サブタスク `artifacts.json` の `parent_workflow` / `task_path`
  - `references/task-workflow-active.md` の対応行
  - `indexes/resource-map.md` / `indexes/quick-reference.md` の参照行
- 削除 (`git diff --diff-filter=D`) と移動 (`R*`) を実測確認し、live reference が残る場合は移動しない。

---

## L-E2EQU3B-004: runtime evidence と local evidence の混同回避 — `IMPLEMENTED_LOCAL_RUNTIME_PENDING`

### What

Phase 12 で「ローカルで実装完了」「`pnpm typecheck / lint / focused tests` PASS」と、CI 実 run / staging deploy 後の runtime evidence は別レイヤである。Stage 3b のローカル検証（fixture pass/fail/missing, shellcheck, YAML 構文）は PASS だが、CI 上での実 run（T-3b-8..16, AC-3b-1..6）は PR 作成後にしか観測できない。

### Why

Phase 12 の単独 `PASS` 表記は「ローカル PASS」「CI runtime PASS」「production runtime PASS」のどれを指すか曖昧で、誤って completed 判定すると、後続の 3c branch protection PUT が前提を満たさないまま実行されるリスクが生じる。

### How to apply

- Phase 12 では state を `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING` のように、layer を分離した複合 vocabulary で記述する。
- CI runtime 検証（実 run / artifact upload / context registration）は後続作業として明示し、3c PUT 前に `gh api repos/.../check-runs` で `e2e-tests-coverage-gate` context が registered になっていることを確認する。
- PR trigger scope は `dev` / `main` のみ（downstream branch protection context scope と一致させる）。

### Evidence

- Phase 12 system-spec-update-summary: `implemented-local / implementation / NON_VISUAL / IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- Phase 12 implementation-guide §"CI runtime 検証（後続作業）": CI 上での実 run は PR 作成後に観測

---

## L-E2EQU3B-005: coverage gate fixture-driven 検証パターン

### What

`scripts/coverage-gate-e2e.sh` を line coverage 80% gate として実装するとき、`THRESHOLD_FIXTURE` 環境変数で fixture を override できる構造にした。これにより、ローカルで pass (85.0%) / fail (79.99%) / missing (`coverage-summary.json` 不在) の 3 ケースを決定論的に再現できる。

### Why

CI 失敗時の挙動を CI 本番で再現するのはコストが高い。ローカルで fixture を切り替えて挙動を網羅検証する経路を script 設計に組み込むと、CI 設定の自己回帰テストが成立する。

### How to apply

- 閾値固定値（80）には quality-gates.md §7.5 への根拠 path コメントを必ず付与する。
- `set -euo pipefail` を script 冒頭に置く。
- `THRESHOLD_FIXTURE` のような明示的な fixture override 経路を持たせ、fixture ディレクトリ（pass / fail-79 / missing）と組み合わせて shell 単体テストする。
- shellcheck violation 0 を Phase 12 evidence として残す。

---

## L-E2EQU3B-006: 二重 mock の serving-path 切替と negative-query 規約 drift（2026-05-24 / members-page-prototype-alignment e2e gate 由来）

### What

`e2e-tests-coverage-gate` で 2 件の e2e が落ちた。うち members-prototype-alignment の EmptyState spec は「local 単体実行では PASS、CI では FAIL」という serving-path 依存の不整合だった。原因は SSR mock が **2 系統**あり、実行環境でどちらが応答するかが切り替わること:

- local 単体: `apps/web/playwright/fixtures/auth.ts` の `ensureMockApi()` が `:8787` を自前 bind して応答
- CI: `.github/workflows/e2e-tests.yml` が full suite 前に `node scripts/e2e-mock-api.mjs` を `:8787` で先起動 → auth fixture の `ensureMockApi()` は `server.once('error')` で **`EADDRINUSE` を捕捉し既存サーバを reuse** するため、CI では e2e-mock-api.mjs が応答する

spec は `/members?q=zzznotfound-${Date.now()}` という独自 prefix を使っていた。auth.ts は `q.startsWith('zzznotfound')` で空を返すが、e2e-mock-api.mjs は `q === fixtures.public.negativeQuery`（`"zzz_no_match_zzz"`、完全一致）でしか空を返さない。
→ local（auth.ts）は空 → EmptyState 表示 → PASS。CI（e2e-mock-api.mjs）はフルリスト返却 → EmptyState 出ず → timeout FAIL。

さらに副次的に、auth.ts の空系レスポンスが `topTags` を欠いており、`PublicMemberListViewZ`（`.strict()`・`topTags` 必須）の `.parse()` が throw → error boundary に落ちて EmptyState が出ない zod 不整合もあった。

### Why

negative-query（空結果トリガ語）の規約が **test / auth.ts / e2e-mock-api.mjs の 3 箇所で別々に定義**され、且つ EADDRINUSE フォールバックで「どちらの mock が応答するか」が local/CI で切り替わるため、片方の mock だけ直しても CI に効かない。`.strict()` schema は未知キーだけでなく必須キー欠落でも throw するため、空系 mock が正常系と shape ドリフトすると SSR が error boundary に落ちる。

### How to apply

- **negative-query は `packages/contracts/src/fixtures.mjs` の `fixtures.public.negativeQuery`（`"zzz_no_match_zzz"`）を単一ソースにする**。`index.spec.ts` が値を assert。test・両 mock をこの値に揃え、spec ごとの独自マジック文字列（`zzznotfound-*` 等）を作らない。既存 `public-top-and-list.spec.ts` が canonical 例。
- **mock の空系レスポンスも `.strict()` schema の必須キーを満たす**（`topTags: []` 等）。正常系と空系で同一 schema を満たすこと。
- **mock を 2 系統持つ場合、応答規約（条件分岐・レスポンス shape）を両系統で一致させる**。`auth.ts` と `e2e-mock-api.mjs` の `/public/members` ハンドラを同期。
- **EmptyState 系 spec は CI serving-path で検証する**。`node scripts/e2e-mock-api.mjs &` を先起動 → `CI=1 playwright test` で再現。local の auth.ts 単体 PASS だけを根拠にしない。
- cold-start flake（dev server 初回コンパイル遅延で member-grid / table が 10s timeout）は CI の `retries: 1` が吸収する。warm 再実行で安定 PASS を確認する。

### Evidence

- `apps/web/playwright/tests/members-prototype-alignment.spec.ts`: 負例クエリを `zzz_no_match_zzz` に統一
- `apps/web/playwright/fixtures/auth.ts`: `q === 'zzz_no_match_zzz'` 判定 + 空系 `topTags: []` 追加
- `scripts/e2e-mock-api.mjs:149`: `q === fixtures.public.negativeQuery`（既存 canonical、変更不要）
- a11y 側 fail は別件（warm theme `--ubm-color-text-muted` の WCAG AA contrast 不足 → `#736449` で解消、`apps/web/src/styles/tokens.css` + `specs/09b-design-tokens.md`）

---

## L-E2EQU3B-007: 二重 mock の body 契約 drift — endpoint 追加・field 追加・enum 値変更でも CI だけ FAIL（2026-06-07 / issue-1101 attendance analytics calc correction 由来）

### What

issue-1101 で attendance dashboard の KPI / zone 契約を変更したが、`apps/web/playwright/fixtures/auth.ts`（client-side / in-process mock）だけ更新し `scripts/e2e-mock-api.mjs`（CI deterministic server-side mock）への反映を忘れた。結果、`e2e (desktop-chromium / desktop-firefox / mobile-webkit)` と `e2e-tests-coverage-gate` の 4 check が **CI でのみ** FAIL（ローカル vitest / unit test は green）:

- `/admin/dashboard/attendance/absentees?lastN=3` が 404（e2e-mock-api.mjs に route 未定義）→ admin attendance dashboard が `ADMIN_FETCH_404` で degrade
- `getByTestId('attendance-kpi-unique')` が `期間内出席者数` / `24` / `80.0%` を含まず not found（overview body に `uniqueAttendeeCount` / `uniqueAttendanceRate` 欠落）
- zone-distribution の `100 回以上` ラベル欠落（zone enum 値が旧 `0→1` のまま、`zone_100_plus` 未追加）

L-E2EQU3B-006 は negative-query 規約 drift だったが、今回は **endpoint 追加・body field 追加・enum 値変更**という別パターンで同型の drift が再発した。

### Why

admin dashboard は Server Component が `INTERNAL_API_BASE_URL`（CI では `http://127.0.0.1:8787`）へ server-side fetch する。L-E2EQU3B-001 / 006 と同じく mock は 2 系統（auth.ts in-process / e2e-mock-api.mjs deterministic）で、SSR fetch は `page.route()` で捕捉できず deterministic 側を叩く。auth.ts に「e2e-mock-api.mjs と同一契約」コメントがあっても機械同期はないため、片方だけ更新すると drift する。negative-query に限らず、契約のあらゆる変更（route / field / enum）が drift 源になる。

### How to apply

- admin/public dashboard 系の mock body（overview / by-session / ranking / trend / zone-distribution / absentees 等）を変更する時は、必ず **2 ファイルを同一 wave で揃える**:
  1. `apps/web/playwright/fixtures/auth.ts`（client-side `page.route` / in-process mock）
  2. `scripts/e2e-mock-api.mjs`（CI deterministic server-side mock for `127.0.0.1:8787`）
- 画面が **新規 endpoint** を server-side fetch する場合、e2e-mock-api.mjs に **route handler 追加も必須**（body 関数の追加だけでは route 分岐に到達せず 404 のまま）。
- mock 契約変更後は両系統を grep 突合してから push:
  ```bash
  grep -n "uniqueAttendeeCount\|zone_100_plus\|attendance/absentees" \
    apps/web/playwright/fixtures/auth.ts scripts/e2e-mock-api.mjs
  ```
- push 前に CI serving-path を再現し、新 endpoint が 200 を返すか確認:
  ```bash
  E2E_MOCK_API_PORT=8799 node scripts/e2e-mock-api.mjs &
  node -e "fetch('http://127.0.0.1:8799/admin/dashboard/attendance/absentees?lastN=3').then(r=>r.status).then(console.log)"
  ```

### Evidence

- `scripts/e2e-mock-api.mjs`: `attendanceOverviewBody` に `uniqueAttendeeCount: 24` / `uniqueAttendanceRate: 0.8` 追加、`attendanceZoneDistributionBody` の zone を `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown` へ更新、`attendanceAbsenteesBody` 関数 + `/admin/dashboard/attendance/absentees` route 追加
- `apps/web/playwright/fixtures/auth.ts:225-311`: 同契約（issue-1101 で既更新済の正本）
- 失敗 CI: PR #1152 `e2e (desktop-chromium)` job 79937634544 — `[admin/server-fetch] 404 /admin/dashboard/attendance/absentees?lastN=3`

---

## 関連

- canonical workflow root: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 親 umbrella: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`
- 関連 lessons: `lessons-learned-e2e-quality-uplift-stages-2026-05.md`, `lessons-learned-e2e-stage3c-branch-protection-runtime-vocabulary-2026-05.md`
- 関連 references: `quality-e2e-testing.md`, `testing-playwright-e2e.md`, `branch-protection.md`
