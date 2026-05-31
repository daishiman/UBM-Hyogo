# public-header-auth-slot-e2e — workflow 概要

**workflow_id**: `public-header-auth-slot-e2e`
**親 workflow**: `docs/30-workflows/public-header-logged-in-nav-cleanup/`（Task A-F の DOM 契約を本 workflow で横断 e2e 検証）
**workflow_state**: `implemented_local_evidence_captured`
**実装区分**: 実装完了（コード変更を伴う）
**視覚証跡区分**: NON_VISUAL（e2e テスト追加、UI 変更なし）
**canonical_root**: `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e`

---

## 1. 目的

親 workflow `public-header-logged-in-nav-cleanup` の Task A-F が確立する DOM 契約（`data-auth-state`、`data-role="auth-cta|member-cta|admin-cta|public-return"`）が、公開系 5 routes + 会員 routes + 管理 routes の合計 **7 routes** で、**guest / member / admin の 3 states** すべて一貫して成立することを Playwright で網羅検証する。

Vitest の単体テストでは検証できない「実際の Auth.js session cookie 経由でレンダーされる DOM」を担保する。

## 2. スコープ

| 軸 | 値 |
|---|---|
| routes | `/`, `/(public)/members`, `/register`, `/privacy`, `/terms`, `/profile`, `/admin` |
| states | `guest`, `member`, `admin` |
| TC 総数 | 7 × 3 = 21 ケース + fail-path 追加分 |

## 3. Phase 構成

| Phase | 名前 | 出力 |
|------|------|------|
| 1 | 要件定義 | `phase-1-requirements.md` |
| 2 | 設計 | `phase-2-design.md` |
| 3 | 設計レビュー | `phase-3-design-review.md` |
| 4 | テスト計画 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | テスト追加 | `phase-6-test-additions.md` |
| 7 | カバレッジ | `phase-7-coverage.md` |
| 8 | リファクタ | `phase-8-refactor.md` |
| 9 | QA | `phase-9-qa.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` (NON_VISUAL) |
| 12 | ドキュメント同期 | `outputs/phase-12/*` (strict 7 output) |
| 13 | commit-pr-release | user-gated |

## 4. 不変条件（全 phase 共通）

1. 新規 API endpoint 追加禁止（既存 `apps/api/src/routes/` のみ利用）
2. 既存 `apps/web/playwright/fixtures/auth.ts` の `signSessionJwt` 経由で session cookie を生成
3. テストファイル命名は `*.spec.ts`（`*.test.ts` 禁止、lefthook `block-test-suffix` で reject）
4. PII 非露出（cookie 値・email を console.log / report に出力しない）
5. fail-closed: redirect 期待ケースは `page.url()` の `/login` 一致で確認
6. `data-auth-state` リテラルは `"guest" | "member" | "admin"` の 3 値のみ
7. CI matrix 追加時は既存 `playwright-smoke` job を壊さない（both-or-none preflight 適用）

## 5. 依存関係

| 種別 | 内容 |
|------|------|
| 前提タスク | 親 workflow Task A-F（DOM 契約の供給元） |
| 既存資産 | `apps/web/playwright/fixtures/auth.ts`、`apps/web/playwright.config.ts`、`apps/web/playwright/tests/auth-gate-state.spec.ts` |
| 影響 CI | `.github/workflows/playwright-smoke.yml` matrix 追加 |

## 6. CONST_007 遵守

スコープ分割は「並列実行のため」のみ。先送り禁止。本 workflow 全 phase は実装 1 サイクル内で完了するスコープに収める。Task A-F の DOM 契約は前提条件として Phase 1 dependencies に明記する。
