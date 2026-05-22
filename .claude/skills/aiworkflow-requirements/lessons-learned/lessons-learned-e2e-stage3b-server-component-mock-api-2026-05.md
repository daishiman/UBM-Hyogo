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

## 関連

- canonical workflow root: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
- 親 umbrella: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/`
- 関連 lessons: `lessons-learned-e2e-quality-uplift-stages-2026-05.md`, `lessons-learned-e2e-stage3c-branch-protection-runtime-vocabulary-2026-05.md`
- 関連 references: `quality-e2e-testing.md`, `testing-playwright-e2e.md`, `branch-protection.md`
