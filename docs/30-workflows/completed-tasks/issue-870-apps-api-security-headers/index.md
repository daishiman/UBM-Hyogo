# issue-870-apps-api-security-headers

> Source issue: [#870](https://github.com/daishiman/UBM-Hyogo/issues/870)（CLOSED のまま仕様書化）
> Predecessor one-pager: `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-004-apps-api-security-headers.md`（旧フォーマット・参照誤記あり。本仕様書が正本）
> Parent workflow: `docs/30-workflows/apps-web-security-headers-hardening/`（`apps/web` 側 hardening は完了済み）
> 実装区分: **実装仕様書**
> implementation_mode: `new`
> タスク種別: **NON_VISUAL**（API backend / UI 変更なし）
> 状態: `implemented_local_evidence_captured`（ローカル実装・focused Vitest 証跡取得済み。staging/production runtime 確認と commit/PR は user-gated）
> 作成日: 2026-05-24

## 調査サマリ（CLOSED 状態の妥当性検証）

issue #870 は CLOSED だが、開始時点では **コードベース上は未実装**であることをコード調査で確認した。今回サイクルで Issue を「最新コードに最適化」した上で `apps/api` に実装し、ローカル証跡を取得した。

| 項目 | コード調査結果（2026-05-24・`f114d1188`） | 判定 |
|---|---|---|
| `apps/api/src/middleware/security-headers.ts` | **存在しない**（`edge-rate-limit-headers.ts` のみ） | ✗ 未実装 |
| `X-Content-Type-Options: nosniff` の付与 | `grep -rn "nosniff" apps/api/src/` → **0 件** | ✗ 未実装 |
| `Strict-Transport-Security` の付与 | `grep -rn "Strict-Transport-Security" apps/api/src/` → **0 件** | ✗ 未実装 |
| `Referrer-Policy` の付与 | `grep -rn "Referrer-Policy" apps/api/src/` → **0 件** | ✗ 未実装 |
| CORS allowlist | `grep -rn "cors\|Access-Control" apps/api/src/` → **0 件** | ✗ 未実装 |
| `app.use(...)` middleware 登録 | `apps/api/src/index.ts` に **1 件も無し**（`app.notFound` / `app.onError` のみ） | ✗ 未実装 |
| 別タスクでの解決 | 直近 commit / 全 worktree を確認。security headers / CORS を `apps/api` に入れた形跡なし | ✗ 解決されていない |

**結論**: Issue は別タスクでは解決されていなかったため、本タスクで実装した。Issue は CLOSED のまま扱い、PR 文言は `Refs #870` のみを使う。

### 旧 one-pager からの「現コード最適化」差分

旧 `awshh-followup-004-apps-api-security-headers.md` は現コードと以下が乖離しているため、本仕様書で是正した。

| 旧記述 | 現コードの事実 | 是正 |
|---|---|---|
| `apps/api/src/lib/env.ts` に env schema 追加 | env 正本は **`apps/api/src/env.ts`**（`lib/env.ts` は存在しない） | `apps/api/src/env.ts` に統一 |
| package filter `@repo/api` | 実 package 名は **`@ubm-hyogo/api`** | `@ubm-hyogo/api` に統一 |
| 「認証必要 endpoint に `Cache-Control: no-store`」のみ言及 | public route（`form-preview` / `stats`）は既に `Cache-Control: public, max-age=60` を設定済み | middleware は**既存 `Cache-Control` を上書きしない**設計を不変条件化（回帰防止） |
| middleware 適用箇所が曖昧 | `apps/api/src/index.ts:184` で `const app = new Hono<{ Bindings: Env }>()` 生成。route mount は 203 行目以降 | 適用位置を「app 生成直後・route mount 前」に固定 |

## 概要

`apps/api`（Hono on Cloudflare Workers）の全 route に対し、API 用途に最適化したセキュリティヘッダと CORS allowlist を Hono middleware として一元適用する。新規 `apps/api/src/middleware/security-headers.ts` を追加し、`apps/api/src/index.ts` の app 生成直後に `app.use("*", ...)` で登録する。`apps/web` 側 hardening（CSP / Permissions-Policy 等）とは独立した surface として、JSON API 向けに最小構成（`nosniff` / HSTS / `Referrer-Policy` / 条件付き `Cache-Control: no-store` / CORS allowlist）で組む。

## 実装結果（2026-05-24）

| 項目 | 結果 |
|---|---|
| middleware | `apps/api/src/middleware/security-headers.ts` を追加。`securityHeaders()` と `corsFromEnv()` を app 全体へ適用 |
| tests | `apps/api/src/middleware/__tests__/security-headers.spec.ts` を追加し 15 tests PASS |
| env | `Env.ALLOWED_ORIGINS` と `wrangler.toml` staging / production vars を追加 |
| CORS | `hono/cors` 既定ではなく小さな deny-by-default middleware を実装。不許可 origin では CORS allow headers を出さない |
| runtime boundary | staging/production curl、deploy、commit、push、PR は user-gated |

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（inventory・命名規則・scope 固定） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（関数シグネチャ・ヘッダ値・CORS allowlist・適用位置） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（Gate判定） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（TC-01〜TC-10・RED） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（新規/修正ファイルの差分方針） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（fail path・回帰 guard） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認 |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証 |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（NON_VISUAL・curl 検証） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 承認後のみ） |

## Phase 12 strict 7

`outputs/phase-12/` に strict 7 を物理配置済み:

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

## 変更対象ファイル

| path | 種別 |
|---|---|
| `apps/api/src/middleware/security-headers.ts` | **新規**（`securityHeaders()` + `corsFromEnv()` + `parseAllowedOrigins()`） |
| `apps/api/src/middleware/__tests__/security-headers.spec.ts` | **新規**（unit: TC-01〜TC-10） |
| `apps/api/src/index.ts` | **修正**（app 生成直後に `app.use("*", securityHeaders())` と `app.use("*", corsFromEnv())` を追加） |
| `apps/api/src/env.ts` | **修正**（`Env` に `ALLOWED_ORIGINS?: string` 追加 + `parseAllowedOrigins` の参照元 doc コメント） |
| `apps/api/wrangler.toml` | **修正**（`[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` 追加） |

## スコープ外（本仕様内では新規バックログ化しない）

- CSP の API 側適用（JSON レスポンス中心のため不要）
- D1 schema 変更 / 既存 endpoint の I/O shape 変更
- `apps/web` 側のヘッダ調整（親 cycle で完了済み）
- `packages/` への共有 helper 切り出し（callsite が 2 app に閉じる現状では抽出しない。将来 packages 整理 wave で再検討。本タスクでは未タスク化もしない）

## 不変条件

1. **既存 API surface のみ**: 新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は禁止（middleware 追加のみ）。
2. **既存 `Cache-Control` を上書きしない**: `form-preview` / `stats` の `public, max-age=60`、public `/members` の `no-store` を保持する。middleware は未設定時のみ `no-store` を補完する。
3. **D1 直接アクセス禁止の継続**: 本変更は `apps/api` 内に閉じる（CLAUDE.md 不変条件 #5）。
4. **test suffix は `*.spec.ts` のみ**（CLAUDE.md 不変条件 #8。`*.test.ts` 禁止）。
5. **CORS は deny-by-default**: `ALLOWED_ORIGINS` 未設定 / 空のとき、いかなる origin も許可しない。
6. **Cloudflare Workers が付与するヘッダと重複させない**: HSTS は edge でも付くが、API レスポンス境界の二重保証として middleware でも付与する（値は `max-age=31536000; includeSubDomains` に統一）。

## 正本順位（衝突時）

1. 本ワークフローの `phase-*.md`
2. `apps/api/src/` の現行実装事実（`index.ts` / `env.ts` / `routes/public/`）
3. 旧 one-pager（`completed-tasks/unassigned-task/awshh-followup-004-...md`）— 参照誤記があるため最劣後
