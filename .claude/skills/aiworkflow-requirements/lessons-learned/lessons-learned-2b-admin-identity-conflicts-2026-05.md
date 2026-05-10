---
task_root: docs/30-workflows/2b-admin-identity-conflicts-spec/
synced_at: 2026-05-10
state: runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING
related_lessons:
  - lessons-learned-e2e-quality-uplift-stages-2026-05.md
  - lessons-learned-issue-194-identity-merge-2026-05.md
related_specs:
  - docs/30-workflows/2b-admin-identity-conflicts-spec/index.md
  - docs/00-getting-started-manual/specs/01-api-schema.md
  - packages/shared/src/schemas/identity-conflict.ts
follow_ups:
  - firefox / webkit / staging / CI runtime evidence の user-gated 取得
  - commit / push / PR は user-gated（runtime_pending 解消後）
---

# 2b admin identity conflicts spec の苦戦箇所

> 対象 workflow: `docs/30-workflows/2b-admin-identity-conflicts-spec/`
> 同期日: 2026-05-10
> 実装範囲:
> - `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（新規 6 test、207 行）
> - `apps/web/src/lib/admin/server-fetch.ts`（SSR fixture gate 追加）
> - `apps/web/playwright.config.ts`（`isAdminIdentityConflictsRun` 切替）
> - `packages/shared/src/schemas/identity-conflict.ts`（strict zod 正本化）
> - `packages/shared/src/schemas/identity-conflict.test.ts`（focused schema test 新規）

---

## L-2B-001: SSR fixture gate の area 別命名統一

### 状況

`/admin/identity-conflicts` の初期 list は Server Component で `apps/api` から fetch される。
Playwright の `page.route()` は browser-side intercept なので Server Component fetch を mock できず、
`apps/api` 実 endpoint へ依存させると D1 seed runbook が必要になり MVP スコープを越える。

### 判断 / 採用解

`apps/web/src/lib/admin/server-fetch.ts` に `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1` の non-production gate を追加し、
fixture 値を inline で返す。production build では gate が効かない（env 未注入）。
2a で先行採用した `PLAYWRIGHT_<AREA>_FIXTURE` 規約の 2 例目で、area 別命名（`ADMIN_IDENTITY_CONFLICTS`）で衝突回避する。

### 再発防止

- 新 area の SSR list を E2E でカバーする時は `PLAYWRIGHT_<AREA>_FIXTURE=1` env gate を踏襲
- gate は `process.env.NODE_ENV !== 'production'` で必ず保護
- `apps/web/src` への `127.0.0.1` 焼き込みは task-18 grep gate で fail させる（既存）

---

## L-2B-002: strict zod (`.strict()`) で merge response shape drift を早期検出

### 状況

phase-4 / phase-5 design 段階では merge response の `mergedMemberId` 文字列を期待していたが、
実 endpoint は `targetMemberId` 系で fix されており、design と実装の drift が implementation 直前で発覚した。
zod schema が `.passthrough()` だと unknown key を黙認し、test で気付けない。

### 判断 / 採用解

`packages/shared/src/schemas/identity-conflict.ts` を canonical 化し、
`IdentityConflictRowZ` / `MergeIdentityResponseZ` を `.strict()` で定義。
unknown key を reject させ、`identity-conflict.test.ts` で focused test (177 PASS) を配置して
shape drift を CI gate で検出する。

### 再発防止

- shared schema の admin endpoint 系は `.strict()` を default に
- design phase で shape を確定する時は実 endpoint response を必ず参照
- `mergedMemberId` 文字列の使用は禁止（不変条件 #6 に追加済み）

---

## L-2B-003: mock boundary の二層分離

### 状況

`page.route()` で全部 mock しようとすると Server Component fetch を捕捉できず、
逆に server fixture gate で全部やろうとすると mutation（POST merge / dismiss）まで env 経路に押し込まれて test 可読性が落ちる。

### 判断 / 採用解

二層分離を明示:
- **server-side**: 初期 list (`GET /api/admin/identity-conflicts`) は `PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1`
- **browser-side**: mutation (`/api/admin/identity-conflicts/*/{merge,dismiss}`) は `page.route()` mock

merge 後の遷移は `router.refresh()` のみで、`/admin/members/:id` 再 fetch を期待しない。

### 再発防止

- 同型の admin SSR + mutation route は同じ二層パターンで設計
- 初期 list を `page.route()` で mock しようとしない（Server Component には届かない）

---

## L-2B-004: auth fixture import の named export 規約

### 状況

`adminPage` / `memberPage` / `anonymousPage` を default import や個別 named import で取り込もうとして
TypeScript / Playwright の test extend が壊れる drift が発生しがち。

### 判断 / 採用解

`apps/web/playwright/fixtures/auth.ts` から `import { test, expect } from '../fixtures/auth'` を必ず使う。
`test` を Playwright 標準の `@playwright/test` から import するのは禁止（fixture の extend が外れる）。

### 再発防止

- 新 spec 追加時は既存 spec（例: `admin-identity-conflicts.spec.ts`）の import 行をコピーする
- `import { test } from '@playwright/test'` と auth fixture の混在は ESLint で検知できれば望ましい（follow-up）

---

## L-2B-005: runtime_pending 三値運用と Phase 12 strict 7 の先行完備

### 状況

chromium-only の local E2E (6 PASS) は取得済みだが、firefox / webkit / staging / CI runtime evidence は未取得。
これらは user-gated（commit / push / PR と同じ pass boundary）として扱う必要がある。

### 判断 / 採用解

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を採用し、Phase 12 strict 7 outputs は先行完備、
runtime evidence の残りはユーザー承認 gate で進める。
state 値は `runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` で
resource-map / quick-reference / topic-map / task-workflow-active / artifact inventory / changelog 全箇所に統一。

### 再発防止

- 同型 close-out では state 値を一括登録時に統一（drift 防止）
- runtime evidence pending を Phase 12 PASS の妨げにしない
- L-E2EQU-008 三値運用の 2 例目として記録（L-E2EQU-008 は 2a、L-2B-005 は 2b）
