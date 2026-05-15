# Phase 1: 要件定義

[実装区分: 実装仕様書]

> Phase: 1 / 13
> 名称: 要件定義
> implementation_mode: `implement_new`
> task classification: 実装タスク
> visual classification: NON_VISUAL

---

## 目的

`apps/web/src/lib/fetch/public.ts` の transport 選択ロジックに対し、test/CI 環境でのみ HTTP fallback 優先を許す環境ガード(`isTestOrPlaywright()`)を導入し、production / staging では service binding が必ず最優先になることを保証する。あわせて regression を検出する unit test を `apps/web/src/lib/fetch/public.spec.ts` に追加する。

## P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| 対象実装が存在するか | Yes (`apps/web/src/lib/fetch/public.ts:36-39`) | minor edit で対応 |
| 親実装(3b) merge 済か | Yes (`feat/e2e-coverage-gate` 系列が dev に merge 済) | 追加ガードとして本タスクを実施 |
| 既存 unit test の枠組み | `apps/web/src/lib/fetch/public.spec.ts` 存在(`*.spec.ts` 命名・CLAUDE.md 不変条件 #8 整合) | 追記方式で AC-R-01..R-05 を追加 |
| 既存 mock 経路 | `@opennextjs/cloudflare` の `getCloudflareContext()` mock が存在する想定 | Phase 4 で実装を読み確認 |

## スコープ

### in-scope

- `apps/web/src/lib/fetch/public.ts` に `isTestOrPlaywright()` ヘルパ追加
- `getServiceBinding()` の早期 return 条件を `isTestOrPlaywright() && PUBLIC_API_BASE_URL` に変更
- ファイル冒頭コメント(transport 選択経路の説明)更新
- `apps/web/src/lib/fetch/public.spec.ts` に AC-R-01..R-05 検証ケースを追加(+3..5 ケース)

### out-of-scope

- `apps/api` endpoint surface 変更
- `apps/web/wrangler.toml` の `[vars]` / `[env.production.vars]` 編集
- `getEnv()` / `getPublicEnv()` の zod schema 変更
- 3b workflow / CI gate(`e2e-tests-coverage-gate`)の変更
- D1 schema / Google Form schema の変更
- `wrangler.toml` への `NODE_ENV=test` / `PLAYWRIGHT_TEST` 混入を検出する grep gate 追加(`task-18` regression smoke 系列に hand-off)

## 受け入れ条件(本タスク独自 AC)

- **AC-R-01**: `process.env.NODE_ENV === 'test'` または `process.env.PLAYWRIGHT_TEST === '1'` のいずれかが真の場合のみ、`PUBLIC_API_BASE_URL` 明示時に HTTP fallback を service binding より優先する。`CI === 'true'` 単独では fallback を許可しない。それ以外(production / staging Cloudflare Workers runtime)では service binding を必ず最優先とする。
- **AC-R-02**: `apps/web/src/lib/fetch/public.spec.ts` に「production context(`NODE_ENV=production` / `CI` 未設定 / `PLAYWRIGHT_TEST` 未設定) + service binding あり + `PUBLIC_API_BASE_URL` 明示」状態で `binding.fetch` が呼ばれ `global.fetch` が呼ばれないことを assert する regression test を追加する。
- **AC-R-03**: 同 test ファイルに「CI=true だが `PLAYWRIGHT_TEST` 未設定 + service binding あり + `PUBLIC_API_BASE_URL` 明示」状態で `binding.fetch` が呼ばれ `global.fetch` が呼ばれないことを assert する。GitHub Actions build/deploy で `CI=true` が立つことへの安全策。
- **AC-R-04**: `e2e-tests-coverage-gate` job(`feat/e2e-coverage-gate` 上の)が引き続き green。Playwright webServer env に `PLAYWRIGHT_TEST=1` を明示し、HTTP fallback 経路が E2E で機能していることを再確認する。
- **AC-R-05**: `apps/web/src/lib/env.ts` の `getEnv()` 経路と整合する形で実装する。新規に読む test/Playwright 判定キー(`NODE_ENV` / `PLAYWRIGHT_TEST`)の `process.env.*` 直参照は `isTestOrPlaywright()` ヘルパに閉じ、既存 `PUBLIC_API_BASE_URL` 読み取り経路は維持する。

## 完了条件(DoD)

1. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
2. `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0
3. `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts` で AC-R-01..R-05 が green
4. `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0(OpenNext Workers build に副作用なし)
5. 逆 assertion 妥当性確認(Phase 9 にて記録)
6. PR は `--base dev` で作成し、`e2e-tests-coverage-gate` が green

## 参照

- `apps/web/src/lib/fetch/public.ts:1-115`
- `apps/web/src/lib/fetch/public.spec.ts`
- CLAUDE.md「`apps/web` env アクセス不変条件」(task-02 wrangler-env-injection)
- CLAUDE.md 不変条件 #5(D1 直接アクセス禁止)
- 既存単一仕様書: `docs/30-workflows/unassigned-task/task-e2e-stage3b-fetch-public-service-binding-priority-regression-001.md`
