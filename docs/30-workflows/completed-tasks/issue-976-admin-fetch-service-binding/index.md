# issue-976-admin-fetch-service-binding

> Source issue: https://github.com/daishiman/UBM-Hyogo/issues/976 (OPEN)
> Branch (proposed): `fix/issue-976-admin-fetch-service-binding`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implemented_local_runtime_pending`
> 作成日: 2026-05-28
> taskType: `implementation`
> visualEvidence: `NON_VISUAL` (transport bugfix。authenticated route screenshot は runtime evidence として user-gated)
> implementation_mode: `bugfix-root-cause-centralization`

## 目的

staging `/admin/meetings` で観測されている `ADMIN_FETCH_404` の根本原因を解消する。

**根本原因**: `apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin` が、`apps/web/src/lib/fetch/public.ts` と異なり Cloudflare `API_SERVICE` service-binding を使わず、`${INTERNAL_API_BASE_URL}/admin/...` の HTTP fetch 経路のみで実装されている。同一 Cloudflare account の `workers.dev → workers.dev` 外向き fetch は loopback 404 を返す既知の挙動があり、admin 経路だけが構造的にこの落とし穴に該当する。

**修正方針**: `fetchAdmin` を `public.ts` と同じ「service-binding 最優先、HTTP は test/CI/dev fallback」モデルに統一する。

**スコープ確定根拠**: Issue #976 は `/admin/meetings` を対象とするが、root cause は admin server-fetch 共通の経路問題のため、修正対象は `safe-server-fetch` 経由のすべての admin route(meetings / members / requests / identity-conflicts / audit / tags-queue / schema / dashboard / member-notes / member-delete / attendance)に波及する。波及自体が回帰修復であり追加スコープではない。

## なぜ他タスクで解決していないか

直近の `*-prototype-alignment-and-404-fix` 系完了タスクはいずれも:

- API 側 contract spec で route mount を担保
- UI 側で `ADMIN_FETCH_404` narrow warn を追加
- 一部 Playwright で env-gated fixture で迂回

…と **症状緩和** に留まっており、共通の fetch 経路を service-binding へ切り替える根本対応は未実施。`feat/fix-admin-fetch-cf-1042-service-binding` ブランチは作成されたが実装コミットなし。

## 関連

- 親 issue: #976 (OPEN)
- 関連 invariant: CLAUDE.md #5 (D1 直接アクセス禁止 → apps/web は API 経由のみ)
- 関連 invariant: `apps/web` env アクセス不変条件(`apps/web/src/lib/env.ts` 経由のみ)
- 既存パターン: `apps/web/src/lib/fetch/public.ts`(service-binding 採用済)

## 不変条件

- CLAUDE.md #5: D1 直接アクセス禁止(変更なし。API 経由を維持)
- CLAUDE.md #8: `*.spec.{ts,tsx}` のみ
- CLAUDE.md #11: fail-closed auth(変更なし)
- env アクセス: `getEnv()` / `getPublicFetchEnv()` 経由のみ。`process.env.*` 直参照禁止
- 既存 API endpoint surface 変更禁止(API 側 0 変更)
- D1 schema 変更禁止

## Phase 一覧

| Phase | ファイル | 概要 |
|------|---------|------|
| 1 | `phase-1-requirements.md` | 要件 / AC / スコープ |
| 2 | `phase-2-design.md` | service-binding 採用設計 / fallback 順 |
| 3 | `phase-3-design-review.md` | 自己レビュー / リスク |
| 4 | `phase-4-test-plan.md` | spec 追加計画 |
| 5 | `phase-5-implementation.md` | 変更ファイル / 関数シグネチャ / 疑似コード |
| 6 | `phase-6-test-additions.md` | spec ケース定義 |
| 7 | `phase-7-coverage.md` | カバレッジ |
| 8 | `phase-8-refactor.md` | リファクタ範囲 |
| 9 | `phase-9-qa.md` | QA コマンド |
| 10 | `phase-10-final-review.md` | セルフレビュー |
| 11 | `phase-11-manual-test.md` | staging runtime evidence(user-gated) |
| 12 | `phase-12-documentation.md` | aiworkflow 反映 |
| 13 | `phase-13-pr.md` | PR title / body |

## 実装結果 (2026-05-28)

- `apps/web/src/lib/admin/server-fetch.ts`: `API_SERVICE.fetch()` を production/staging 優先 transport として採用。`NODE_ENV=test` / `PLAYWRIGHT_TEST=1` は既存 HTTP mock 経路を維持。
- `apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`: service-binding / fallback / header透過 / error snippet / body透過の 6 ケース追加。
- focused verification: `pnpm exec vitest run apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` → 3 files / 9 tests PASS.
