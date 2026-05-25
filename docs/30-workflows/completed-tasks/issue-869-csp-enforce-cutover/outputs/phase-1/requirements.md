# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | TASK-AWSHH-FU-001-CSP-ENFORCE-CUTOVER |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| issue_number | #869 |
| issue_status | CLOSED（reopen 禁止・spec-from-closed-issue モード） |
| workflow_state | spec_created |
| runtime boundary | コード実装・commit・push・PR・deploy・production enforce 実切替はすべて user-gated |
| source_followup | U-AWSHH-001（apps-web-security-headers-hardening Phase 12 unassigned-task-detection） |

## タスク分類

- **タスク種別**: implementation
- **implementation_mode**: `new`（env-driven 切替機構の新規追加）
- **VISUAL / NON_VISUAL**: NON_VISUAL（Phase 11 スクリーンショット不要。unit テスト + Playwright header assertion を証跡とする）
- **実装区分**: CONST_004（env-driven 切替の目的達成にコード変更必須）

## 既存コード状況

### 未実装（本タスク対象）

| 確認項目 | 状態 | 詳細 |
|---------|------|------|
| `apps/web/middleware.ts` 61行目 `buildSecurityHeaderConfig()` | **ハードコード** | `cspMode: "report-only"` を直書き。env-driven でない |
| `apps/web/src/lib/env.ts` の `EnvSchema` | **`CSP_MODE` 未追加** | env schema に CSP_MODE フィールドが存在しない |
| `apps/web/wrangler.toml` の `[vars]`/`[env.staging.vars]`/`[env.production.vars]` | **`CSP_MODE` 未設定** | 3 環境いずれにも CSP_MODE 変数が存在しない |
| `apps/web/playwright/tests/security-headers.spec.ts` | **固定 assert** | `content-security-policy-report-only` ヘッダ名をハードコード。mode 切替に非追従 |
| `apps/web/src/lib/env.spec.ts` | **getSecurityHeaderEnv テスト未追加** | 既存ファイルの有無を実装時に確認してから追加 or 新規作成 |

### 実装済み（参照のみ・変更禁止）

| ファイル | 状態 | 提供するもの |
|---------|------|-------------|
| `apps/web/src/lib/security-headers.ts` | 完了済み | 型 `SecurityHeaderMode = "report-only" \| "enforce"`、`buildSecurityHeaders(cfg)`、`applySecurityHeaders(response, cfg)` |
| `apps/web/src/lib/security-headers.spec.ts` | 完了済み | `builds enforce CSP when requested` 単体テスト（回帰ガード） |

## 受入条件

1. `apps/web/src/lib/env.ts` の `EnvSchema` に `CSP_MODE: z.enum(["report-only","enforce"]).default("report-only")` が追加されている
2. `getSecurityHeaderEnv()` が実装されており、`{ cspMode, apiBaseUrl }` を返す（rawEnv 引数注入対応）
3. `apps/web/middleware.ts` の `buildSecurityHeaderConfig()` が `getSecurityHeaderEnv()` 経由で cspMode を取得する（ハードコード廃止）
4. `apps/web/wrangler.toml` の 3 セクションに `CSP_MODE` が設定されている（`[vars]`: report-only、`[env.staging.vars]`: enforce、`[env.production.vars]`: report-only）
5. `apps/web/playwright/tests/security-headers.spec.ts` が CSP ヘッダ名を mode から動的解決する（`process.env.CSP_MODE` 判定 + 反対ヘッダの absent assert）
6. `apps/web/src/lib/env.spec.ts`（既存 or 新規）に TC-01〜TC-04 が追加されている
7. `mise exec -- pnpm typecheck` PASS
8. `mise exec -- pnpm lint` PASS
9. `mise exec -- pnpm build` PASS
10. `mise exec -- pnpm --filter web test` PASS（env.spec.ts + security-headers.spec.ts の全ケース）
11. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` / `getSecurityHeaderEnv()` 経由のみ（`process.env.*` 直接参照禁止。env.ts 内 `readProcessEnv` と playwright テスト infra は例外）

## スコープ外

| 項目 | 理由 |
|------|------|
| production の CSP_MODE を enforce へ変更（実切替） | 違反レポート観測完了後の ops runbook 作業。`wrangler.toml` 変更 + redeploy のみでコード変更不要 |
| `report-to` / `report-uri` ディレクティブ追加 | issue #868（CSP Reporting-Endpoints）スコープ。本タスクでは追加しない |
| CSP nonce 化（`'unsafe-inline'` 排除） | issue #871 スコープ |
| `apps/api` 側のレスポンスヘッダ対応 | 別 workflow |
| CSP ディレクティブ自体の見直し（issue #870） | 別タスク |

## 命名規則確認

| 既存関数 | 命名 |
|---------|------|
| `getEnv()` | camelCase |
| `getPublicEnv()` | camelCase |
| 新規: `getSecurityHeaderEnv()` | camelCase（既存パターン踏襲） |

## 依存タスク

| タスク | 状態 | 関係 |
|-------|------|------|
| apps-web-security-headers-hardening | 完了済み | `security-headers.ts` lib API（変更禁止の前提） |
| issue-868 CSP Reporting-Endpoints | 別タスク | `report-to` ディレクティブはそちらで追加。本タスクは reporting endpoint 無しで enforce が機能する設計 |
