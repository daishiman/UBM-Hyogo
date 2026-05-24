# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| implementation_mode | new |
| runtime boundary | staging/production response verification, commit, push, PR は user-gated |

## タスク分類

- **タスク種別**: implementation
- **implementation_mode**: `new`
- **VISUAL / NON_VISUAL**: NON_VISUAL（Phase 11 スクリーンショット不要、`manual-test-result.md` で curl/Playwright header assertion を代替証跡とする）

## 既存コード状況

| 確認項目 | 結果 |
|---------|------|
| `apps/web/middleware.ts` | edge runtime 認証 middleware 既存（`/admin/*`, `/profile/*` matcher） |
| `apps/web/next.config.ts` | `headers()` 未定義 |
| `apps/web/src/lib/` 配下 security-headers 関連ファイル | **存在しない**（新規作成対象） |
| `apps/web/wrangler.toml` | `[vars]` のみ。custom response header 設定なし |
| 既存 CSP / Permissions-Policy / Trusted Types 出力 | **0 箇所**（実装ファイルのみ対象。test/spec 内の regression literal は除外） |
| public API env 正本 | `NEXT_PUBLIC_API_BASE_URL`（`NEXT_PUBLIC_API_ORIGIN` は存在しないため使用しない） |

## 受入条件

1. `apps/web` のすべての route response に Permissions-Policy ヘッダが出力され、`browsing-topics` を含まない（または明示的に `=()` で無効化）
2. `apps/web` のすべての route response に CSP ヘッダが出力される（初期は report-only）
3. CSP の `connect-src` は `'self'`, `https://*.cloudflare.com` 系 API endpoint, 認証 OAuth endpoint のみ許可
4. CSP に `require-trusted-types-for 'script'` を**入れない**（拡張機能と衝突するため）
5. `pnpm typecheck` / `pnpm lint` PASS
6. Playwright smoke で 3 ヘッダの presence と key 値を assert
7. task-18 regression grep gate（実装ファイル内の `127.0.0.1:8888`）が現状維持で 0 件。`*.spec.ts` 内の regression literal は除外する
8. `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（不変条件継続）

## スコープ外（未タスク化候補）

- `apps/api` 側のレスポンスヘッダ強化（別 workflow）
- CSP の enforce モード切替（本 task は report-only で完了。enforce 切替は別 task で違反レポート観測後）
- 拡張機能由来エラーの抑制（不可能・拡張は page CSP をバイパスする）

## 命名規則確認

- 既存 `apps/web/src/lib/env.ts` の関数命名: camelCase（`getEnv` / `getPublicEnv`）
- 既存 middleware helper: camelCase（`buildAdminLoginRedirect` 等）
- → 本タスクの新規関数も camelCase で統一（`buildSecurityHeaders` / `applySecurityHeaders`）

## 依存タスク

- task-02 wrangler-env-injection: 完了済み（前提）
- task-18 regression smoke: 完了済み（grep gate 動作中）
