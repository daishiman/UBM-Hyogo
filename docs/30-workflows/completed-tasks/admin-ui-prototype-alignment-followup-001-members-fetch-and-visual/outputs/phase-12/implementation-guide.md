# Phase 12 — Implementation Guide

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## Part 1: Concept

本 followup は `/admin/members` の staging 404 と UI 乖離の 2 点を 1 PR で解消する。
スコープは admin/members 一覧 + drawer のみで、他 admin route には触らない。
共有 primitive (`Avatar` / `Chip` / `Switch` / `KVList` / `Drawer`) は既存 API を破壊せず additive のみで拡張する。

### 背景

staging で `ADMIN_FETCH_404` が `AdminSectionErrorClient` 経由で表示され、テーブル本体が描画されない。
プロトタイプ `pages-admin.jsx` L162-366 と現行 UI は列構成・drawer body 両方で大きく乖離している。

### 要約

404 root cause を切り分けて fix し、Table / Filters / Drawer / page-head をプロトタイプ準拠に置き換える。
adapter で派生 field を埋め、tokens drift 0 を保つ。

## Part 2: Technical Notes

### 実装ステップ

1. T-5.1: 404 を `safeServerFetch` baseUrl → catch-all route → require-admin → D1 binding の順で切り分け
2. T-5.2: adapter で `occupation / ubmZone / ubmMembershipType / tags / updatedAt / hue` を派生
3. T-5.3 / T-5.4 / T-5.5 / T-5.6: Table / Filters / page-head / Drawer をプロトタイプ準拠に
4. T-5.7: 不足 primitive のみ最小追加
5. T-5.8: `verify-design-tokens` drift 0 verify

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:design-tokens
mise exec -- pnpm --filter web test -- --run
bash scripts/verify-pr-ready.sh
```

### 既知制限

- staging seed に member 0 件の場合、visual baseline は seed 投入後に再 dispatch。
- pill-nav primitive を既存 `Segmented` で代替できない場合のみ最小新規 component。

## Part 3: API Surface

既存 endpoint のみ使用。
`GET /admin/members` + `GET /admin/members/:id` のレスポンス shape は破壊しない。
派生 field は adapter 層で生成し、Zod schema は `.optional()` の additive のみ。

### 実装ステップ

1. `apps/web/src/features/admin/adapters/members-view-model.ts` を新規
2. `packages/shared/src/types/viewmodel/index.ts` に additive optional field を追加

### 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run members-view-model
mise exec -- pnpm typecheck
```

## Part 4: UI Composition

プロトタイプ抽出（page-head / filter card / table 列 / drawer body / drawer foot）に従う。
primitives は OKLch tokens のみ。HEX 直書き / `bg-[#xxx]` 禁止。
admin form input は `FormField` 経由を維持。

### 実装ステップ

1. `MembersTable.tsx` を avatar / chip / switch / tags / edit 列にプロトタイプ準拠化
2. `MembersFilters.tsx` の `<select>` を pill-nav 4 種 + 件数バッジに置換
3. `MemberDrawer.tsx` body を VISIBILITY / TAGS / FORM RESPONSE / DELETED に再構成

### 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run MembersTable MembersFilters MemberDrawer
mise exec -- pnpm verify:design-tokens
```

### 既知制限

- `pill-nav` は `Segmented` 流用を第一候補、不能なら最小新規追加。

## Part 5: Data Adapter

adapter `members-view-model.ts` は純粋関数で `tagStore` を DI 受け取り、`now()` も DI 化する。
`hue` は `stringHash(memberId) % HUE_COUNT` で決定論。
`updatedAt` は `audit[].at` の最新 → fallback `lastSubmittedAt`。

### 実装ステップ

1. `toMemberListRow` / `toMemberDetail` を新規
2. unit spec で additive field の派生を assert
3. 既存 ViewModel consumer の test が継続 green であることを確認

### 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run members-view-model
```

## Part 6: 404 Fix Pipeline

4 仮説（safeServerFetch baseUrl / catch-all route / require-admin 401→404 マスク / D1 binding）を順に検証する。
仮説 (a) では `INTERNAL_API_BASE_URL` を `getEnv()` で必須化（空文字 reject）。
仮説 (b) では catch-all `[...path]` の matching / method / Authorization header 転送を unit spec で固定。

### 実装ステップ

1. `apps/web/src/lib/env.ts` に zod schema 追加（空文字 reject）
2. `apps/web/app/api/admin/[...path]/route.ts` の Authorization header / 401 passthrough を unit spec で固定
3. staging deploy で `GET /admin/members` が 200 を返すことを確認

### 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run safe-server-fetch route
curl -fsS -H "Cookie: $STAGING_SESSION" https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/admin/members
```

### 既知制限

- 仮説 (d) D1 binding 修正の場合は `bash scripts/cf.sh deploy` が必須で user-gated。

## Part 7: Tests

vitest unit U-1..U-6（Table / Filters / Drawer / adapter / safeServerFetch / route）を新規。
playwright visual baseline V-1 / V-2 を `staging-visual` project で追加。
新規 test は `*.spec.{ts,tsx}` のみ（不変条件 #8）。

### 実装ステップ

1. U-1..U-6 を `apps/web/src/.../*.spec.{ts,tsx}` で作成
2. V-1 / V-2 を `apps/web/playwright/tests/visual-staging/` で作成
3. `pnpm --filter web test -- --run` と `playwright test --list` を実行

### 検証コマンド

```bash
mise exec -- pnpm --filter web test -- --run
mise exec -- pnpm exec playwright test --project=staging-visual --list
```

## Part 8: Runtime Evidence

Phase 11 で staging deploy + CI dispatch + screenshot 取得。
evidence は `outputs/phase-11/evidence/` に物理配置。
inventory 表は canonical 3 列（Classification / Path / Status）。

### 実装ステップ

1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
2. `gh workflow run playwright-smoke.yml`
3. artifact download → snapshot dir + `outputs/phase-11/evidence/` の両配置

### 検証コマンド

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
gh workflow run playwright-smoke.yml
```

### 既知制限

- staging seed に member 0 件の場合は seed 投入後に再 dispatch。

## Part 9: Skill Sync

aiworkflow-requirements skill 配下の `quick-reference` / `resource-map` / `task-workflow-active` / `artifact-inventory` / `changelog` / `LOGS` を本 followup の追加で同期する。
task-specification-creator skill 側は本 followup のパターン（followup-001 命名 / additive adapter / 404 切り分け）が既存 reference に内包される想定で no-op を第一案とする。

### 実装ステップ

1. `.claude/skills/aiworkflow-requirements/indexes/` を `pnpm indexes:rebuild` で再生成
2. `LOGS.md` に followup-001 行を追加

### 検証コマンド

```bash
mise exec -- pnpm indexes:rebuild
mise exec -- pnpm gate-metadata:validate
```

## Part 10: Boundary

repo-local 実装と spec 同期は AI が完了させる。
staging deploy / CI dispatch / commit / push / PR 作成はすべて user-gated。
Gate-C は user 承認 + staging baseline PNG 取得後に passed へ。

### 実装ステップ

1. user 承認後に staging deploy
2. CI dispatch で baseline PNG 生成
3. commit / push / PR

### 検証コマンド

```bash
bash scripts/verify-pr-ready.sh
gh pr create --base dev
```

## Part 11: Rollback

`git revert <commit>` で本 followup 全戻し。
staging には previous bundle が残るため `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` で即時復旧。
adapter は additive のみのためロールバック後も既存 consumer は破壊されない。

### 実装ステップ

1. PR を draft 化または close
2. `bash scripts/cf.sh rollback` で staging 復旧
3. 影響範囲を Phase 11 evidence と diff で確認

### 検証コマンド

```bash
bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging
git revert <commit>
```

### 既知制限

- production deploy は本 followup スコープ外。production 影響は dev → main PR 時に別途。
