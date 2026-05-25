# issue-869-csp-enforce-cutover

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=NON_VISUAL]`（CONST_004: CSP の `report-only` → `enforce` 切替を env-driven 化する目的達成にコード変更（`middleware.ts` / `env.ts` / `wrangler.toml` / smoke）が必須のため実装仕様書として作成）

## スコープ判定（spec-from-closed-issue モード）

| 項目 | 値 |
|------|----|
| task_id | TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER |
| issue_number | 869 |
| issue_status | CLOSED |
| issue_closed_reason | GitHub 上は CLOSED 済み（2026-05-24）。ユーザー指示により reopen せず、CLOSED のまま実装仕様書を作成する |
| spec_purpose | 運用正本化（report-only → enforce 切替の env-driven 機構を確実に実装するための仕様確定） |
| spec_created | true |
| 元 follow-up ID | U-AWSHH-001（`apps-web-security-headers-hardening` Phase 12 未タスク検出由来） |

> **Issue は reopen しない。** 本仕様書は CLOSED Issue の後付け実装仕様書（github-issue-manager Part 5 spec-from-closed-issue モード）。

## 目的

`apps/web` の Workers レスポンスに導入済みの CSP を、現状ハードコードされた `report-only` モードから、**環境変数 (`CSP_MODE`) で切替可能な enforce モード**へ移行する。これにより staging で enforce を即時検証し、production は違反レポート観測後に config 変更のみで enforce へ切替できる機構を確立する。

## 現状調査結果（issue が古い可能性の検証 / 最新コード確認）

| 確認対象 | 現状 | 判定 |
|---------|------|------|
| `apps/web/src/lib/security-headers.ts` | `SecurityHeaderMode = "report-only" \| "enforce"` 型と `buildSecurityHeaders` の header 名切替ロジックは**実装済み** | enforce 対応の lib 層は完了 |
| `apps/web/src/lib/security-headers.spec.ts` | enforce モードの unit test（`builds enforce CSP when requested`）**実装済み** | lib 層テスト完了 |
| `apps/web/middleware.ts:61` | `buildSecurityHeaderConfig()` が `cspMode: "report-only"` を**ハードコード**。env-driven ではない | **未実装ギャップ** |
| `apps/web/src/lib/env.ts` | `EnvSchema` に `CSP_MODE` が**存在しない** | **未実装ギャップ** |
| `apps/web/wrangler.toml` | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `CSP_MODE` が**存在しない** | **未実装ギャップ** |
| `apps/web/playwright/tests/security-headers.spec.ts` | `content-security-policy-report-only` ヘッダ名を**固定 assert**。mode 切替に追従しない | **未実装ギャップ** |

**結論**: issue #869 は他タスクで解決されていない。lib 層（header 名切替）のみ完了済みで、**env-driven 切替機構（middleware 配線 + env schema + wrangler vars + smoke 追従）が未実装**。本 issue の実装は必要。issue 本文の記述（`SecurityHeaderConfig.cspMode` 切替 / `middleware.ts` env-driven 設定 / Playwright smoke header 名検証更新）は現行コードと整合しており、最新コードに対する最適化は「lib 層は完了済みのため作業範囲を env 配線・smoke・wrangler var に限定する」点として各 Phase に反映した。

## スコープ

| 含む | 含まない |
|------|---------|
| `apps/web/src/lib/env.ts` に `CSP_MODE` schema + `getSecurityHeaderEnv()` accessor 追加 | `apps/api` 側のヘッダ強化（issue #870 / AWSHH-FU-004） |
| `apps/web/middleware.ts` の `buildSecurityHeaderConfig()` を env-driven 化 | CSP nonce 化（issue #871 / AWSHH-FU-002） |
| `apps/web/wrangler.toml` の 3 環境への `CSP_MODE` var 追加 | Reporting-Endpoints / report-to 集約（issue #868 / AWSHH-FU-003、soft 依存・本 issue では非ブロッカー） |
| `apps/web/playwright/tests/security-headers.spec.ts` の mode 追従化 | D1 schema 変更・Google Form 仕様変更 |
| `env.ts` の `getSecurityHeaderEnv()` unit test 追加 | production の enforce 実切替（観測後の ops runbook 操作・config 変更のみ） |

## 不変条件

1. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` / 本タスクで追加する `getSecurityHeaderEnv()` 経由のみ（`process.env.*` 直接参照禁止 — CLAUDE.md task-02）
2. `apps/web` から D1 直接アクセス禁止（不変条件 #5 継続）
3. `127.0.0.1:8888` 等を `apps/web/src` に焼き込まない（task-18 grep gate）
4. 既存 `security-headers.ts` の lib API（`buildSecurityHeaders` / `applySecurityHeaders` / `SecurityHeaderMode`）は変更せず再利用する（新規 primitive を生やさない）
5. `CSP_MODE` 未設定時は `report-only` に安全側 default（zod `.default("report-only")`）

## Phase 構成

| Phase | 名称 | 成果物 |
|-------|------|--------|
| 1 | 要件定義 | `outputs/phase-1/requirements.md` |
| 2 | 設計 | `outputs/phase-2/design.md` |
| 3 | 設計レビュー | `outputs/phase-3/design-review.md` |
| 4 | テスト作成 | `outputs/phase-4/test-plan.md` |
| 5 | 実装 | `outputs/phase-5/implementation-plan.md` |
| 6 | テスト実装結果 | `outputs/phase-6/test-implementation-result.md` |
| 7 | 統合結果 | `outputs/phase-7/integration-result.md` |
| 8 | 品質ゲート | `outputs/phase-8/quality-gate.md` |
| 9 | QA | `outputs/phase-9/qa-result.md` |
| 10 | 最終レビュー | `outputs/phase-10/final-review.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md`（NON_VISUAL header 出力検証） |
| 12 | ドキュメント更新 | canonical 6 outputs |
| 13 | PR 作成 | user 明示承認後 |

## 関連タスク

- `apps-web-security-headers-hardening`（完了済み / 本 issue の親 workflow・report-only 導入元）
- issue #868 AWSHH-FU-003 Reporting-Endpoints（soft 依存・report-to は enforce の必須前提ではない）
- issue #871 AWSHH-FU-002 CSP nonce 化（独立 follow-up）
- issue #870 AWSHH-FU-004 apps/api header hardening（独立 surface）

## 実行境界

仕様書作成のみ。コード実装・commit・push・PR・staging/production deploy・production の enforce 実切替はすべて user-gated。
